// GET /api/account/profile
//
// Returns the signed-in customer's profile + their bookings/sessions for the
// /account page (V3 item 7). Authenticated by the Supabase access token the
// browser sends as `Authorization: Bearer <jwt>`. We verify the token server-
// side, then read with the service_role key scoped to that verified user id.
//
// Card-on-file last4 is intentionally NOT fetched here yet (needs a Square
// lookup); the field is surfaced as null until that's wired.

var sb = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sb.isConfigured()) {
    return res.status(503).json({ error: "Accounts are not configured yet" });
  }

  var auth = req.headers["authorization"] || req.headers["Authorization"] || "";
  var token = auth.replace(/^Bearer\s+/i, "").trim();
  var user = await sb.getUserFromToken(token);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Not signed in" });
  }

  try {
    var customers = await sb.serviceSelect("customers", "id=eq." + user.id + "&select=id,email,full_name,phone,instagram,square_customer_id,created_at");
    var customer = customers[0] || { id: user.id, email: user.email };

    // Bookings + their sessions (nested via PostgREST resource embedding).
    var bookings = await sb.serviceSelect(
      "bookings",
      "customer_id=eq." + user.id +
      "&select=id,status,event_intent,total_cents,payment_mode,deposit_cents,balance_due_cents,balance_charge_at,balance_status,created_at," +
      "booking_sessions(id,location,appointment_type_id,starts_at,duration_min,day_index,session_price_cents)" +
      "&order=created_at.desc"
    );

    return res.status(200).json({
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.full_name || null,
        phone: customer.phone || null,
        instagram: customer.instagram || null,
        cardOnFile: null // last4 wired when Square lookup lands
      },
      bookings: bookings || []
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not load profile", detail: String(err && err.message || err) });
  }
};
