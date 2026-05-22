// Environment helpers — single source of truth for "are we in staging?"
//
// Staging is a Vercel custom environment that sets STAGING=1. Production
// does not set STAGING. Preview deploys (random PR URLs) also don't set
// STAGING by default.
//
// Acuity routing model: the production appointment types are configured to
// allow either their prod calendar OR the STAGING calendar (Drew set up
// calendar 14110701 as a second member of each appointment type's
// calendarIDs array). So we don't translate appointment-type IDs — we just
// pass calendarID explicitly in the appointment-create POST when staging,
// which forces Acuity to route to the STAGING calendar instead of the
// location's real calendar.
//
// When isStaging():
//   - Pass calendarID = ACUITY_STAGING_CALENDAR_ID on appointment create
//     and on cleaning-buffer block create
//   - Override customer email to ACUITY_STAGING_SINK_EMAIL (Acuity's own
//     confirmation email otherwise goes to whatever the form said)
//   - Stamp [STAGING] into the client name + appointment notes
//   - If ACUITY_STAGING_CALENDAR_ID is unset, MOCK the Acuity write
//     entirely instead of falling through to a prod calendar — fail-safe
//
// Notifications (Resend, Watson SMS, Cleaner email, QBO mark-paid) are NOT
// gated here — they self-suppress when their env vars are absent, which we
// ensure by simply not adding those vars to the staging environment scope.

exports.isStaging = function () {
  return process.env.STAGING === "1";
};

exports.isProduction = function () {
  return process.env.VERCEL_ENV === "production" && process.env.STAGING !== "1";
};

exports.stagingSinkEmail = function () {
  return process.env.ACUITY_STAGING_SINK_EMAIL || "staging-bookings@invalid.local";
};

// The STAGING calendar ID, or null if not configured. When null and we're
// in staging, the booking callback mocks Acuity writes entirely rather
// than letting them fall through to prod calendars.
exports.stagingCalendarID = function () {
  if (process.env.STAGING !== "1") return null;
  return process.env.ACUITY_STAGING_CALENDAR_ID || null;
};
