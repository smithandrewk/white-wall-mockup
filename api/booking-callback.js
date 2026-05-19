// GET /api/booking-callback — DEPRECATED (2026-05-18)
//
// This was the redirect target for the old Square Payment Link flow:
//   Square hosted checkout -> redirect here -> verify order -> create
//   Acuity appointment.
//
// That flow is gone. Payment + card-on-file + appointment creation now
// happen inline in /api/create-checkout via the Square Web Payments SDK,
// so nothing should ever hit this endpoint anymore. We keep a stub for
// one release so any extremely stale in-flight redirect lands on a clear
// error page instead of a 404, and so we can confirm zero traffic before
// deleting the file entirely.

const { alertFailure } = require("./_lib/alert");

module.exports = async function handler(req, res) {
  // If this ever fires, something is wrong (or a very old link was used).
  // Alert so we notice, then send the user somewhere graceful.
  try {
    await alertFailure("alert", "Deprecated /api/booking-callback was hit", {
      query: req.query || {},
      referer: req.headers && req.headers.referer
    });
  } catch (e) {
    console.error("booking-callback deprecation alert failed:", e.message);
  }
  return res.redirect(302, "/booking-error?reason=callback-deprecated");
};
