// Unit test for the crew section appended to April's EXISTING cleaning-fee email
// (DREW-80 item 4b, point 1). Asserts the composed body only — no send.
//
// Run: node api/_lib/notify-cleaner-crew.test.js

const assert = require("assert");
const { buildCleanerEmailBody } = require("./notify-cleaner");

let passed = 0;
function ok(label) { console.log("  ok — " + label); passed++; }

function baseOpts(extra) {
  return Object.assign({
    locationName: "Flagship (Powdersville)",
    customerName: "Jordan Rivera",
    participants: 40,
    sessionEnd: new Date("2026-09-12T22:00:00-04:00"),
    bufferEnd: new Date("2026-09-13T00:30:00-04:00"),
    address: "WhiteWall Studios",
    appointmentId: "10233445566"
  }, extra || {});
}

// Without crew, the body reads exactly as before (no crew section).
const noCrew = buildCleanerEmailBody(baseOpts({ crew: false }));
assert.ok(!/Event Setup and Reset Crew/.test(noCrew), "no crew section when crew=false");
ok("no crew section when the booking has no crew add-on");

// With crew, the existing email gains the crew heads-up section.
const withCrew = buildCleanerEmailBody(baseOpts({ crew: true }));
assert.ok(/ALSO needed for the Event Setup and Reset Crew/.test(withCrew), "crew section present");
assert.ok(withCrew.includes("Jordan Rivera"), "still shows the customer");
assert.ok(withCrew.includes("An .ics attachment is included"), "still keeps the cleaning-window body");
assert.ok(!/placement/i.test(withCrew), "no placements (removed in DREW-80)");
ok("crew section appended to the existing cleaner email when crew add-on present");

console.log("\nnotify-cleaner-crew: all " + passed + " checks passed");
