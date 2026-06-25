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
var sq = require("../_lib/square");

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

    // Lazy-link any prior bookings made anonymously under this email. Password
    // users get linked at /account/create, but GOOGLE sign-in skips that path —
    // so this claim-on-load is what surfaces a Google user's existing bookings.
    // Mirrors the create.js link query exactly. Non-fatal.
    var linkEmail = (customer.email || user.email || "").trim().toLowerCase();
    if (linkEmail) {
      try {
        await sb.serviceUpdate("bookings", { email: "ilike." + linkEmail, customer_id: "is.null" }, { customer_id: user.id });
      } catch (e) { /* non-fatal — bookings can link on a later load */ }
    }

    // Bookings + their sessions + each session's saved add-ons (nested via
    // PostgREST resource embedding) so the profile UI can show what's on each
    // session.
    var bookings = await sb.serviceSelect(
      "bookings",
      "customer_id=eq." + user.id +
      "&select=id,status,event_intent,total_cents,payment_mode,deposit_cents,balance_due_cents,balance_charge_at,balance_status,square_card_id,created_at," +
      "booking_sessions(id,location,appointment_type_id,starts_at,duration_min,day_index,session_price_cents," +
      "booking_session_addons(id,addon_id,quantity,unit_cents,discount_cents,meta))" +
      "&order=created_at.desc"
    );

    // Card on file: last 4 + brand from the most recent booking that saved a
    // card. Best-effort — a Square hiccup just leaves it null, never 500s.
    var cardOnFile = null;
    try {
      var withCard = (bookings || []).find(function (b) { return b.square_card_id; });
      if (withCard) {
        var card = await sq.retrieveCard(withCard.square_card_id);
        if (card && card.last_4) cardOnFile = { last4: card.last_4, brand: card.card_brand || null };
      }
    } catch (e) { /* leave null */ }

    return res.status(200).json({
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.full_name || null,
        phone: customer.phone || null,
        instagram: customer.instagram || null,
        cardOnFile: cardOnFile
      },
      bookings: bookings || []
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not load profile", detail: String(err && err.message || err) });
  }
};
