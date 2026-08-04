// POST /api/validate-coupon
// Body: { code, location, appointmentTypeID }
//
// Read-only promo-code preview. Validates a customer-typed code server-side
// (the only source of truth) and returns a preview of the discount that would
// apply to the RAW SESSION line item. No side effects, no Acuity/Square calls.
//
// The authoritative discount is recomputed in create-checkout.js at pay time —
// this endpoint exists only so the UI can show the customer a live total
// before they commit. A forged response here cannot change what they're
// charged.

const { validateCoupon, sessionDiscountCents } = require("./_lib/coupons");
const { SESSION_PRICES, isValidAppointmentTypeID } = require("./_lib/acuity");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, location, appointmentTypeID, email, phone } = req.body || {};

  if (!code || !String(code).trim()) {
    return res.status(400).json({ error: "Missing promo code" });
  }
  if (location && !["powdersville", "taylors-mill"].includes(location)) {
    return res.status(400).json({ error: "Invalid location" });
  }

  try {
    // `email` + `phone` (the booking contact, if entered yet) let a restricted
    // code ("Who?") preview as reserved-for-a-specific-customer, and a boycotted
    // contact preview as invalid, instead of previewing valid then getting
    // rejected at pay time. Unbound codes ignore both.
    const result = await validateCoupon(code, { location: location, email: email, phone: phone });

    if (!result.valid) {
      // 200 with valid:false — an invalid code is a normal outcome, not an
      // HTTP error (mirrors verify-availability returning { available:false }).
      return res.status(200).json({ valid: false, reason: result.reason });
    }

    // Full-comp code (e.g. WWSHUNDRED): the ENTIRE booking is comped to $0, so
    // there is no per-line percentage to preview. Surface comp:true so the UI
    // can zero the whole total and skip the card step. The authoritative $0 is
    // still recomputed (and re-gated on the validated comp coupon) at pay time.
    if (result.comp === true) {
      return res.status(200).json({
        valid: true,
        code: result.code,
        comp: true,
        label: result.label
      });
    }

    // Flat-dollar code (e.g. SHARON200): amountOff is CENTS off the WHOLE ORDER.
    // The endpoint only knows the session price (not the customer's add-ons), so
    // it returns the nominal amountOff and lets the client clamp it to the live
    // order total in the summary. The authoritative discount + >= 1c floor is
    // recomputed in create-checkout.js at pay time.
    if (result.amountOff > 0) {
      return res.status(200).json({
        valid: true,
        code: result.code,
        amountOff: result.amountOff,
        label: result.label,
        discountCents: result.amountOff
      });
    }

    // Preview discount off the session price, if we can resolve it.
    let discountCents = 0;
    let sessionCents = 0;
    if (appointmentTypeID && isValidAppointmentTypeID(appointmentTypeID)) {
      const session = SESSION_PRICES[String(appointmentTypeID)];
      if (session) {
        sessionCents = session.cents;
        discountCents = sessionDiscountCents(session.cents, result.percentOff);
      }
    }

    return res.status(200).json({
      valid: true,
      code: result.code,
      percentOff: result.percentOff,
      label: result.label,
      sessionCents: sessionCents,
      discountCents: discountCents
    });
  } catch (err) {
    console.error("validate-coupon error:", err.message);
    return res.status(500).json({ error: "Unable to validate promo code" });
  }
};
