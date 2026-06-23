// POST /api/account/create
//
// Post-payment account creation (V3 item 7, the low-friction "set a password"
// step). The customer has just completed a booking with this email, so we
// create a CONFIRMED Supabase Auth user (no email round-trip) and enrich their
// customers row with the contact info already collected during checkout.
//
// Security: passwords are handled by Supabase Auth (salted+hashed) — we never
// store or log them. The service_role key stays server-side. If the email
// already has an account, returns 409 so the client offers "log in" instead.

var sb = require("../_lib/supabase");

function isEmail(s) {
  return typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sb.isConfigured()) {
    return res.status(503).json({ error: "Accounts are not configured yet" });
  }

  var body = req.body || {};
  var email = (body.email || "").trim().toLowerCase();
  var password = body.password || "";
  var fullName = (body.fullName || "").trim() || null;
  var phone = (body.phone || "").trim() || null;
  var instagram = (body.instagram || "").trim() || null;

  if (!isEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    var user;
    try {
      user = await sb.adminCreateUser({
        email: email,
        password: password,
        userMetadata: { full_name: fullName, phone: phone, instagram: instagram }
      });
    } catch (e) {
      // Supabase returns 422 when the email already exists.
      if (e.status === 422 || (e.supabase && /already/i.test(e.supabase.msg || ""))) {
        return res.status(409).json({ error: "An account with this email already exists", code: "exists" });
      }
      throw e;
    }

    // The on_auth_user_created trigger has inserted customers(id, email).
    // Enrich it with the contact info from checkout (best-effort — account
    // creation already succeeded, so don't fail the request on this).
    try {
      await sb.serviceUpdate("customers", { id: "eq." + user.id }, {
        full_name: fullName,
        phone: phone,
        instagram: instagram
      });
    } catch (e) {
      // swallow — the row exists; profile fields can be filled later
    }

    // Link any bookings this email made before creating the account (the
    // post-payment flow: book first, set a password after). Best-effort.
    try {
      await sb.serviceUpdate("bookings", { email: "ilike." + email, customer_id: "is.null" }, { customer_id: user.id });
    } catch (e) {
      // non-fatal — bookings can be linked later
    }

    return res.status(201).json({ ok: true, userId: user.id, email: email });
  } catch (err) {
    return res.status(500).json({ error: "Could not create account", detail: String(err && err.message || err) });
  }
};
