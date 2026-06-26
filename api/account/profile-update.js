// POST /api/account/profile-update
//
// Drew round-4 item 6: a signed-in customer edits their own profile from the
// /account page. Saves Account Info (full_name, company_name, company_website)
// and Contact Info (phone, instagram). The customer's EMAIL is the Supabase Auth
// identity and is NOT editable here — we never touch it, so a typo can't lock
// them out of their own account.
//
// Auth: the Supabase access token (JWT) the browser sends as
// `Authorization: Bearer <jwt>`. We verify it server-side, then serviceUpdate
// the customers row scoped to that verified user id (so a customer can only
// edit their own row). Required Contact fields are validated; the pure
// validateProfileUpdate() below is exported so the guard is unit-testable with
// no DB.
//
// Body: { fullName?, companyName?, companyWebsite?, phone, instagram? }

var sb = require("../_lib/supabase");

// Pure validation + normalization. Returns:
//   { ok, errors:[...], values:{ full_name, company_name, company_website, phone, instagram } }
// `values` is the exact PATCH body for the customers row — note it carries NO
// `email` key (email is the auth identity, never updated here). Empty optional
// fields normalize to null so the customer can clear them.
function validateProfileUpdate(body) {
  body = body || {};
  var errors = [];

  function str(v) { return typeof v === "string" ? v.trim() : ""; }
  var fullName = str(body.fullName);
  var companyName = str(body.companyName);
  var companyWebsite = str(body.companyWebsite);
  var phone = str(body.phone);
  var instagram = str(body.instagram);

  // Required Contact field: a reachable phone number (>= 10 digits).
  if (!phone) {
    errors.push("Phone is required");
  } else if (phone.replace(/\D/g, "").length < 10) {
    errors.push("Enter a valid phone number");
  }

  return {
    ok: errors.length === 0,
    errors: errors,
    values: {
      full_name: fullName || null,
      company_name: companyName || null,
      company_website: companyWebsite || null,
      phone: phone || null,
      instagram: instagram || null
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sb.isConfigured()) {
    return res.status(503).json({ error: "Accounts are not configured yet" });
  }

  // --- Authenticate the customer (Supabase JWT) ---
  var auth = req.headers["authorization"] || req.headers["Authorization"] || "";
  var token = auth.replace(/^Bearer\s+/i, "").trim();
  var user = await sb.getUserFromToken(token);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Not signed in" });
  }

  var verdict = validateProfileUpdate(req.body);
  if (!verdict.ok) {
    return res.status(400).json({ error: "Please fix the highlighted fields", details: verdict.errors });
  }

  try {
    // Scoped to the verified user id — a customer can only update their own row.
    // email is intentionally absent from verdict.values (auth identity).
    var rows = await sb.serviceUpdate("customers", { id: "eq." + user.id }, verdict.values);
    var c = (rows || [])[0] || {};
    return res.status(200).json({
      ok: true,
      customer: {
        id: c.id || user.id,
        email: c.email || user.email,
        fullName: c.full_name || null,
        phone: c.phone || null,
        instagram: c.instagram || null,
        companyName: c.company_name || null,
        companyWebsite: c.company_website || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not save your profile", detail: String(err && err.message || err) });
  }
};

module.exports.validateProfileUpdate = validateProfileUpdate;
