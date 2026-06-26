// POST /api/account/save-card
//
// Drew V3 item 1: a signed-in customer enters a NEW card on the /account page
// and saves it as their card on file. SAVING A CARD IS NOT A CHARGE — the
// browser tokenizes with the Web Payments SDK using intent:"STORE" (no amount),
// POSTs the single-use token here, and we hand it to Square's CreateCard. Square
// runs a $0 verification and returns the stored card's last4/brand. The PAN
// never touches our servers; we persist only square_customer_id + square_card_id.
//
// Auth: the Supabase access token (JWT) the browser sends as
// `Authorization: Bearer <jwt>`. We verify it server-side, resolve/create the
// Square customer for THIS account's email, store the card against that
// customer, then write the handle onto the customer's most-recent booking row
// (which api/account/profile.js reads to surface the card) and onto the
// customers row's square_customer_id. The persist is best-effort + isolated —
// the card is already saved in Square once CreateCard returns, so a DB hiccup
// must not turn a saved card into an error.
//
// Body: { squareToken: "<cnon_...>", cardholderName?: string }

var sb = require("../_lib/supabase");
var sq = require("../_lib/square");

// Pure validation/normalization of the request body. Exported so the guard is
// unit-testable with no Square/DB. Returns { ok, errors:[...], token, cardholderName }.
function validateSaveCard(body) {
  body = body || {};
  var errors = [];
  var token = typeof body.squareToken === "string" ? body.squareToken.trim() : "";
  var cardholderName = typeof body.cardholderName === "string" ? body.cardholderName.trim() : "";
  if (!token) {
    errors.push("A card token is required");
  }
  return {
    ok: errors.length === 0,
    errors: errors,
    token: token,
    cardholderName: cardholderName
  };
}

// Split a stored full_name into Square given/family name parts.
function splitName(full) {
  var s = (full || "").trim();
  if (!s) return { firstName: "", lastName: "" };
  var sp = s.indexOf(" ");
  if (sp <= 0) return { firstName: s, lastName: "" };
  return { firstName: s.slice(0, sp), lastName: s.slice(sp + 1).trim() };
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

  var verdict = validateSaveCard(req.body);
  if (!verdict.ok) {
    return res.status(400).json({ error: "Please fix the highlighted fields", details: verdict.errors });
  }

  try {
    // --- Resolve the account's email + any existing Square customer ---
    // Scoped to the verified user id — we only ever act on this customer's row.
    var customers = await sb.serviceSelect(
      "customers",
      "id=eq." + encodeURIComponent(user.id) + "&select=id,email,full_name,phone,square_customer_id"
    );
    var customer = customers[0] || {};
    var email = (customer.email || user.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Your account has no email on file" });
    }
    var name = splitName(customer.full_name);
    var cardholderName = verdict.cardholderName ||
      (customer.full_name || "").trim() || email;

    // --- Resolve/create the Square customer for this account ---
    // Reuse the customer already linked to the account (from a prior booking) so
    // the new card attaches to the same Square customer; otherwise find-or-create
    // by the account email.
    var squareCustomerId = customer.square_customer_id;
    if (!squareCustomerId) {
      squareCustomerId = await sq.findOrCreateCustomer({
        email: email,
        firstName: name.firstName,
        lastName: name.lastName,
        phone: customer.phone || ""
      });
    }

    // --- Store the card on file (NO charge; Square $0-verifies it) ---
    var card;
    try {
      card = await sq.createCardOnFile({
        sourceId: verdict.token,
        customerId: squareCustomerId,
        cardholderName: cardholderName
      });
    } catch (cardErr) {
      // A bad/declined/unverifiable card is the customer's to fix — 402, not 500.
      console.warn("save-card: createCardOnFile failed:", cardErr && cardErr.message);
      return res.status(402).json({
        error: "We couldn't save that card. Please check the details and try again."
      });
    }

    if (!card || !card.id) {
      return res.status(502).json({ error: "Card service did not return a saved card" });
    }

    // --- Persist the handle (best-effort + isolated) ---------------------
    // The card is ALREADY saved in Square; the writes below only make it visible
    // in the dashboard/profile. A failure here NEVER fails the save (same
    // discipline as create-checkout's post-charge persistence).
    try {
      // (a) customers.square_customer_id — keeps the account's Square identity
      //     in sync (also written at account creation).
      await sb.serviceUpdate("customers", { id: "eq." + user.id }, {
        square_customer_id: squareCustomerId
      });
    } catch (e) {
      console.error("save-card: customers update:", e && e.message);
    }
    try {
      // (b) Most-recent booking row — this is what api/account/profile.js reads
      //     to surface the card on file (it takes the newest booking carrying a
      //     square_card_id). Writing onto the newest booking overall makes the
      //     freshly-saved card the one the profile shows. Accounts are created
      //     post-payment, so virtually every account holder has a booking here.
      var recent = await sb.serviceSelect(
        "bookings",
        "customer_id=eq." + encodeURIComponent(user.id) +
        "&select=id&order=created_at.desc&limit=1"
      );
      var recentBooking = (recent || [])[0];
      if (recentBooking && recentBooking.id) {
        await sb.serviceUpdate("bookings", { id: "eq." + recentBooking.id }, {
          square_customer_id: squareCustomerId,
          square_card_id: card.id
        });
      }
    } catch (e) {
      console.error("save-card: booking card persist:", e && e.message);
    }

    return res.status(200).json({
      ok: true,
      card: {
        last4: card.last_4 || null,
        brand: card.card_brand || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not save your card", detail: String(err && err.message || err) });
  }
};

module.exports.validateSaveCard = validateSaveCard;
