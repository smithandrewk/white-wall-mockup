// api/_lib/acuity-closetime.test.js — standalone (node api/_lib/acuity-closetime.test.js).
//
// Exercises the studio CLOSE-time guard (V3 item 2): a session must not be
// schedulable to END after 22:30 ET. This is the upper bookend to the
// earliest-start floor and is enforced as a duration-SELECTION rule (start +
// the type's full duration vs the close cap), NOT per-hour billing math.
//
// Covers: ends 22:00 ok; ends 23:00 rejected; the exact-22:30 boundary; the
// full-day "5am-11pm access" exception (closes 23:00, not 22:30); unknown type;
// and DST-safety (the same ET wall-clock start gives the same verdict in summer
// EDT and winter EST).

const assert = require("assert");
const {
  STUDIO_CLOSE_MINUTES,
  closeMinutesFor,
  isEndAfterClose,
  easternMinutesFromISO
} = require("./acuity");

let passed = 0;
function ok(label, cond) {
  assert.strictEqual(cond, true, "FAILED: " + label);
  passed++;
  console.log("  ok: " + label);
}

// --- constants -------------------------------------------------------------
ok("default close is 22:30 (1350)", STUDIO_CLOSE_MINUTES === 1350);
ok("closeMinutesFor unknown -> default 1350", closeMinutesFor("00000000") === 1350);
ok("closeMinutesFor 6h PV -> default 1350", closeMinutesFor("89114539") === 1350);
ok("closeMinutesFor PV full -> 1380 (11pm)", closeMinutesFor("89114581") === 1380);
ok("closeMinutesFor TM full -> 1380 (11pm)", closeMinutesFor("28312569") === 1380);

// --- ends exactly at close (22:00 and 22:30) is OK -------------------------
// 6h PV (89114539, 360min) starting 16:00 ET -> ends 22:00. OK.
ok(
  "6h start 16:00 ends 22:00 -> allowed",
  isEndAfterClose("89114539", "2026-07-15T16:00:00-04:00") === false
);
// 4h PV (89114517, 240min) starting 18:30 ET -> ends exactly 22:30. Boundary OK.
ok(
  "4h start 18:30 ends 22:30 (boundary) -> allowed",
  isEndAfterClose("89114517", "2026-07-15T18:30:00-04:00") === false
);

// --- ends after close (23:00) is REJECTED ----------------------------------
// 6h PV starting 17:00 ET -> ends 23:00. Rejected.
ok(
  "6h start 17:00 ends 23:00 -> rejected",
  isEndAfterClose("89114539", "2026-07-15T17:00:00-04:00") === true
);
// 4h PV starting 18:31 (one minute past the boundary) -> ends 22:31. Rejected.
ok(
  "4h start 18:31 ends 22:31 -> rejected",
  isEndAfterClose("89114517", "2026-07-15T18:31:00-04:00") === true
);
// 8h Flagship (94823049, 480min) starting 15:00 -> ends 23:00. Rejected.
ok(
  "8h start 15:00 ends 23:00 -> rejected",
  isEndAfterClose("94823049", "2026-07-15T15:00:00-04:00") === true
);
// 8h Flagship starting at its 12:30 floor -> ends 20:30. Allowed.
ok(
  "8h start 12:30 ends 20:30 -> allowed",
  isEndAfterClose("94823049", "2026-07-15T12:30:00-04:00") === false
);

// --- full-day exception: closes at 23:00, not 22:30 ------------------------
// PV full (89114581, 1080min/18h) starting 5am ET -> ends 23:00. Allowed via override.
ok(
  "PV full 5am ends 23:00 -> allowed (override)",
  isEndAfterClose("89114581", "2026-07-15T05:00:00-04:00") === false
);
// PV full starting 6am -> ends 24:00 (past 11pm). Rejected even with the override.
ok(
  "PV full 6am ends 24:00 -> rejected",
  isEndAfterClose("89114581", "2026-07-15T06:00:00-04:00") === true
);

// --- unknown / missing-duration type is never a false reject ---------------
ok(
  "unknown type -> not after close (no false reject)",
  isEndAfterClose("00000000", "2026-07-15T22:00:00-04:00") === false
);

// --- DST-safety: same ET wall-clock start, same verdict in EDT and EST -----
// "7pm ET" + 4h = 11pm ET -> rejected, in both summer (-0400) and winter (-0500).
ok(
  "DST: 4h start 19:00 ET summer (EDT) ends 23:00 -> rejected",
  isEndAfterClose("89114517", "2026-07-15T19:00:00-04:00") === true
);
ok(
  "DST: 4h start 19:00 ET winter (EST) ends 23:00 -> rejected",
  isEndAfterClose("89114517", "2026-01-15T19:00:00-05:00") === true
);
// "5pm ET" + 4h = 9pm ET -> allowed, in both seasons.
ok(
  "DST: 4h start 17:00 ET summer (EDT) ends 21:00 -> allowed",
  isEndAfterClose("89114517", "2026-07-15T17:00:00-04:00") === false
);
ok(
  "DST: 4h start 17:00 ET winter (EST) ends 21:00 -> allowed",
  isEndAfterClose("89114517", "2026-01-15T17:00:00-05:00") === false
);
// The underlying wall-clock read is season-independent (both = 19*60 = 1140).
ok(
  "DST: easternMinutesFromISO reads 19:00 ET identically in both seasons",
  easternMinutesFromISO("2026-07-15T19:00:00-04:00") === 1140 &&
    easternMinutesFromISO("2026-01-15T19:00:00-05:00") === 1140
);

console.log("\nacuity-closetime.test.js: all " + passed + " assertions passed.");
