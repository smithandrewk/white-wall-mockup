// Environment helpers — single source of truth for "are we in staging?"
//
// Staging is a Vercel custom environment that sets STAGING=1. Production
// does not set STAGING. Preview deploys (random PR URLs) also don't set
// STAGING by default — they read other env vars from the Preview scope.
//
// When isStaging() returns true, code paths:
//   - Translate Acuity prod appointment-type IDs to staging IDs (when mapped)
//   - Override the customer email to a sink before creating Acuity appointments
//     (Acuity's confirmation email otherwise goes to whatever the form said)
//   - Stamp [STAGING] into the client name + appointment notes
//   - Route the cleaning-buffer block to a staging calendar (or skip it)
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

// Translate a prod Acuity appointment-type ID to its staging counterpart,
// if a mapping is configured. Returns the input unchanged when not staging
// or when no map is set / the ID isn't mapped.
exports.mapAppointmentTypeID = function (prodID) {
  if (process.env.STAGING !== "1") return prodID;
  if (!process.env.ACUITY_STAGING_TYPE_MAP) return prodID;
  try {
    var map = JSON.parse(process.env.ACUITY_STAGING_TYPE_MAP);
    return map[String(prodID)] || prodID;
  } catch (e) {
    return prodID;
  }
};

// Translate a prod calendar ID to its staging counterpart. Used for the
// cleaning-buffer block creation (which writes directly to a calendar
// rather than going through an appointment type).
exports.mapCalendarID = function (location, prodID) {
  if (process.env.STAGING !== "1") return prodID;
  if (location === "powdersville" && process.env.ACUITY_STAGING_CALENDAR_PV) {
    return process.env.ACUITY_STAGING_CALENDAR_PV;
  }
  if (location === "taylors-mill" && process.env.ACUITY_STAGING_CALENDAR_TM) {
    return process.env.ACUITY_STAGING_CALENDAR_TM;
  }
  return prodID;
};
