// Guard tests for rescheduleAppointment (V3 item-7 write-path). These assert the
// safety guards reject BEFORE any Acuity call — the calendarID guard in particular
// is the multi-calendar-misroute defense. No network. Run: node api/_lib/acuity-reschedule.test.js
"use strict";

var assert = require("assert");
var A = require("./acuity");

(async function () {
  var dt = "2026-07-01T13:00:00-04:00";

  await assert.rejects(
    A.rescheduleAppointment(null, { datetime: dt, calendarID: 6255578 }),
    /appointmentId is required/,
    "missing appointmentId must reject"
  );
  await assert.rejects(
    A.rescheduleAppointment("123", { calendarID: 6255578 }),
    /datetime is required/,
    "missing datetime must reject"
  );
  await assert.rejects(
    A.rescheduleAppointment("123", { datetime: dt }),
    /calendarID is required/,
    "missing calendarID must reject (multi-calendar gotcha)"
  );

  console.log("acuity-reschedule.test.js: ALL TESTS PASSED (3 guard cases)");
})().catch(function (e) {
  console.error("acuity-reschedule.test.js FAILED:", e && e.message);
  process.exit(1);
});
