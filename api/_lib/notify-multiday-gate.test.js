// Gating tests for the multi-day event notifier (DREW-29).
//
// Regression under test: a paid ONE-HOUR photo/short session booked through a
// Session Builder locked link (offer path) fired a "[WhiteWall] Multi-day event
// booked" owner text AND emailed the cleaner — because notifyMultidayEvent was
// called on ANY event cart (cartIsEvent) and its cleaner sub-send had no fee
// gate. The fix: each sub-notification is gated by multidaySendPlan(ctx) —
// multi-day-shaped sends require >= 2 days, the cleaner email requires a real
// cleaning fee. This proves the plan for every relevant shape.
//
// Run: node api/_lib/notify-multiday-gate.test.js

const assert = require("assert");
const { multidaySendPlan } = require("./notify-multiday");

let passed = 0;
function check(label, plan, expected) {
  assert.deepStrictEqual(
    {
      customerRecap: plan.customerRecap,
      ownerRecap: plan.ownerRecap,
      ownerSms: plan.ownerSms,
      crewSms: plan.crewSms,
      cleaner: plan.cleaner
    },
    expected,
    label
  );
  passed++;
  console.log("  ok —", label);
}

// ---- THE INCIDENT: one-hour photo/short session, 1 day, no cleaning fee ----
// Even if it was tagged "event" in the Step-1 gate, it reaches here as a single
// day with cleaningFeeCents 0. It must fire NOTHING.
check(
  "single-session, no fee (Drew's one-hour session) -> fires nothing",
  multidaySendPlan({ days: [{}], cleaningFeeCents: 0 }),
  { customerRecap: false, ownerRecap: false, ownerSms: false, crewSms: false, cleaner: false }
);

// A single-session offer that (defensively) arrives with no cleaningFeeCents key.
check(
  "single-session, cleaningFeeCents undefined -> fires nothing",
  multidaySendPlan({ days: [{}] }),
  { customerRecap: false, ownerRecap: false, ownerSms: false, crewSms: false, cleaner: false }
);

// ---- Single-DAY large event (35+ ppl): NO multi-day text, but April IS needed ----
check(
  "single-day event WITH cleaning fee -> cleaner only, no multi-day text",
  multidaySendPlan({ days: [{}], cleaningFeeCents: 15000 }),
  { customerRecap: false, ownerRecap: false, ownerSms: false, crewSms: false, cleaner: true }
);

// Crew flags on a single-day booking must NOT emit the crew SMS (crew SMS is a
// multi-day-shaped companion message).
check(
  "single-day, crew flags but 1 day -> crewSms stays false",
  multidaySendPlan({ days: [{}], cleaningFeeCents: 15000, crewAdded: true, crewPlacements: {} }),
  { customerRecap: false, ownerRecap: false, ownerSms: false, crewSms: false, cleaner: true }
);

// ---- Genuine MULTI-DAY event (>= 2 days) with a cleaning fee -> everything ----
check(
  "multi-day event with fee -> customer/owner recap + owner SMS + cleaner",
  multidaySendPlan({ days: [{}, {}], cleaningFeeCents: 15000 }),
  { customerRecap: true, ownerRecap: true, ownerSms: true, crewSms: false, cleaner: true }
);

// Multi-day event with setup crew -> also the crew SMS.
check(
  "multi-day event with crew -> adds crew SMS",
  multidaySendPlan({ days: [{}, {}], cleaningFeeCents: 15000, crewAdded: true, crewPlacements: {} }),
  { customerRecap: true, ownerRecap: true, ownerSms: true, crewSms: true, cleaner: true }
);

// Defensive: multi-day but (hypothetically) no fee -> multi-day text still fires,
// cleaner does not. (A >=2-day event always carries a fee in practice, but the
// plan keeps the two concerns independent.)
check(
  "multi-day, no fee -> multi-day text yes, cleaner no",
  multidaySendPlan({ days: [{}, {}], cleaningFeeCents: 0 }),
  { customerRecap: true, ownerRecap: true, ownerSms: true, crewSms: false, cleaner: false }
);

console.log("\nnotify-multiday-gate: all " + passed + " checks passed");
