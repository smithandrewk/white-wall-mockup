// POST /api/pay-balance
//
// V3 item-6 customer-INITIATED balance payment — the lockout failure-path UX.
// A signed-in customer pays their OWN outstanding 40% balance for a deposit
// booking, from the /account page. This is the human escape hatch for the
// manager-locked failure rule: when the 48h auto-charge declines x3 the booking
// is LOCKED OUT (balance_status='failed', appointment never cancelled) and the
// customer settles it here. It also lets a customer pre-pay a still-'scheduled'
// balance before the auto-charge ever fires.
//
// Customer is PRESENT (they clicked the button while signed in), so this is a
// normal customer-initiated payment, not the merchant-initiated off-session
// auto-charge. It reuses the same card on file saved at checkout.
//
// DARK DISCIPLINE: the whole endpoint sits behind PAY_BALANCE_ENABLED. With the
// flag off (the default) it returns 503 BEFORE touching the DB, Square, or even
// authenticating — a pure no-op. chargeCardOnFile is reached ONLY when
// PAY_BALANCE_ENABLED === "1".
//
// Double-charge safety: the Square idempotency key is the SAME stable
// balance-keyed key the auto-charger uses (balance-charge.js
// computeBalanceIdempotencyKey), so if the scheduler and the customer both try
// to settle the same balance, Square dedupes to ONE charge. Never trust the
// client: the amount and the card handle come from the authoritative booking row.
//
// Body: { bookingId: uuid }

var sb = require("./_lib/supabase");
var sq = require("./_lib/square");
var balanceCharge = require("./_lib/balance-charge");

function isEnabled() {
  return process.env.PAY_BALANCE_ENABLED === "1";
}

// PURE decision: may this signed-in customer pay this booking's balance NOW?
// No time gate (unlike the auto-charger) — a customer can settle whenever it is
// owed. Returns:
//   { payable: false, reason: <string> }
//   { payable: true,  amountCents, cardHandle: { customerId, cardId } }
// Exported for unit testing with no Square/DB.
function decidePayBalance(booking) {
  if (!booking || !booking.id) return { payable: false, reason: "no-booking" };
  if (booking.payment_mode !== "deposit") {
    return { payable: false, reason: "not-a-deposit-booking" };
  }
  if (balanceCharge.CHARGEABLE_STATUSES.indexOf(booking.balance_status) === -1) {
    return { payable: false, reason: "balance-status:" + booking.balance_status };
  }
  if (!booking.balance_due_cents || booking.balance_due_cents <= 0) {
    return { payable: false, reason: "no-balance-due" };
  }
  if (!booking.square_customer_id || !booking.square_card_id) {
    return { payable: false, reason: "missing-card-handle" };
  }
  return {
    payable: true,
    amountCents: booking.balance_due_cents,
    cardHandle: {
      customerId: booking.square_customer_id,
      cardId: booking.square_card_id
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // DARK GATE — a pure no-op until armed: no DB read, no Square call, no auth.
  if (!isEnabled()) {
    return res.status(503).json({ error: "Paying your balance online is not enabled yet" });
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

  var body = req.body || {};
  var bookingId = (body.bookingId || "").trim();
  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required" });
  }

  try {
    // --- Load the booking, then AUTHORIZE ownership ---
    var bookings = await sb.serviceSelect(
      "bookings",
      "id=eq." + encodeURIComponent(bookingId) +
      "&select=id,customer_id,payment_mode,balance_status,balance_due_cents,square_customer_id,square_card_id"
    );
    var booking = (bookings || [])[0];
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.customer_id !== user.id) {
      return res.status(403).json({ error: "That booking is not yours" });
    }

    // --- Is there a balance to settle? (authoritative; never trust the client) ---
    var decision = decidePayBalance(booking);
    if (!decision.payable) {
      return res.status(409).json({ error: "No balance is due on this booking", reason: decision.reason });
    }

    // --- Charge the card on file (customer present -> normal payment) ---
    // Shared balance-keyed idempotency key => Square dedupes against the
    // auto-charger if it ever fires for the same balance.
    var idempotencyKey = balanceCharge.computeBalanceIdempotencyKey(booking);
    var payment;
    try {
      payment = await sq.chargeCardOnFile({
        customerId: decision.cardHandle.customerId,
        cardId: decision.cardHandle.cardId,
        amountCents: decision.amountCents,
        idempotencyKey: idempotencyKey,
        note: "WWS 40% balance (customer paid) — booking " + booking.id
      });
    } catch (chargeErr) {
      // Card declined / expired — record the failed attempt (best-effort) and
      // tell the customer to update their card. The booking stays as it was.
      try {
        await sb.serviceInsert("payment_events", [{
          booking_id: booking.id,
          kind: "balance",
          amount_cents: decision.amountCents,
          status: "failed",
          detail: { source: "item6-pay-balance", error: String(chargeErr && chargeErr.message || chargeErr) }
        }]);
      } catch (e) { /* non-fatal */ }
      return res.status(402).json({ error: "Your card was declined. Please update your card and try again." });
    }

    var squarePaymentId = payment && payment.id ? payment.id : null;

    // --- Record the money movement (audit) — best-effort, charge already won ---
    try {
      await sb.serviceInsert("payment_events", [{
        booking_id: booking.id,
        kind: "balance",
        amount_cents: decision.amountCents,
        square_payment_id: squarePaymentId,
        status: "succeeded",
        detail: { source: "item6-pay-balance", customer_initiated: true }
      }]);
    } catch (e) { /* non-fatal */ }

    // --- Clear the balance: settled, nothing more owed. The auto-charger sees
    // balance_status='charged' and will never re-charge it. ---
    try {
      await sb.serviceUpdate("bookings", { id: "eq." + booking.id }, {
        balance_status: "charged",
        balance_due_cents: 0
      });
    } catch (e) { /* non-fatal — the charge + audit row are the record of truth */ }

    return res.status(200).json({
      chargedCents: decision.amountCents,
      squarePaymentId: squarePaymentId,
      balanceStatus: "charged"
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not pay the balance", detail: String(err && err.message || err) });
  }
};

module.exports.decidePayBalance = decidePayBalance;
