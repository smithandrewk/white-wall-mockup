#!/usr/bin/env node
/*
 * ops/google-ads/validate-upload.js  (WWA-3, step 4 smoke test)
 *
 * Dry-run (validateOnly) a Data Manager offline conversion against the "Booking
 * (value)" action, to prove the whole server-side path — datamanager scope,
 * endpoint, body shape, conversion action — is accepted BEFORE a real booking
 * depends on it. Writes NOTHING to the account.
 *
 *   set -a; source ~/.config/entrpy/google-ads.env; set +a
 *   GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID=7727263911 \
 *     node ops/google-ads/validate-upload.js
 *
 * Needs a refresh token carrying the datamanager scope (ops/google-ads/
 * reauth-datamanager.js). A 403 / PERMISSION_DENIED here means the token is
 * still adwords-only — re-mint it first.
 */

const G = require("../../api/_lib/google-ads");

(async function () {
  if (!G.isConfigured()) {
    console.error("Not configured. Need GOOGLE_ADS_CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN + " +
      "GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID.\n" +
      "Run:  set -a; source ~/.config/entrpy/google-ads.env; set +a");
    process.exit(1);
  }
  console.log("Destination:", JSON.stringify(G.bookingDestination()));
  const res = await G.reportBooking({
    attribution: { gclid: "Cj0KCQ_wwa3_validate_probe_dummy_gclid" },
    totalCents: 75000,          // $750 booking
    cleaningFeeCents: 15000,    // with the $150 pass-through
    orderId: "wwa3-validate-probe",
    validateOnly: true
  });
  console.log("\nreportBooking(validateOnly) result:\n", JSON.stringify(res, null, 2));
  if (res.uploaded) {
    console.log("\nPASS — payload accepted by Data Manager (dry-run). Margin uploaded would be $" +
      (res.valueCents / 100).toFixed(2) + " on a $750 booking.");
  } else {
    console.log("\nNOT uploaded — see result above (error / skipped reason).");
    process.exit(2);
  }
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
