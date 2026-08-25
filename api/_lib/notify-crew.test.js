// Unit tests for the Event Setup and Reset Crew notifications (DREW-80 item 4).
// Asserts the COMPOSED email bodies only — no Resend, no network, no real send.
//
// Run: node api/_lib/notify-crew.test.js

const assert = require("assert");
const {
  hasCrewAddon,
  buildCrewOwnerEmail,
  buildCrewCleanerEmail,
  buildClientDraft
} = require("./notify-crew");

let passed = 0;
function ok(label) { console.log("  ok — " + label); passed++; }

// A representative single-session crew booking (PV 4-hour event, crew added).
function crewBookingState() {
  return {
    appointmentTypeID: "89114517", // 4 Hour Session, $350
    location: "powdersville",
    datetime: "2026-09-12T18:00:00-04:00",
    contact: { firstName: "Jordan", lastName: "Rivera", email: "jordan@example.com", phone: "864-555-0142" },
    addons: { "setup-crew": { selected: true } }
  };
}

// ---- hasCrewAddon -------------------------------------------------------
assert.strictEqual(hasCrewAddon(crewBookingState()), true);
ok("hasCrewAddon true when setup-crew selected");

assert.strictEqual(hasCrewAddon({ addons: { "setup-crew": { selected: false } } }), false);
assert.strictEqual(hasCrewAddon({ addons: {} }), false);
assert.strictEqual(hasCrewAddon({}), false);
assert.strictEqual(hasCrewAddon(null), false);
ok("hasCrewAddon false when not selected / absent / null");

// ---- Owner "Action required" email (4c) ---------------------------------
const owner = buildCrewOwnerEmail(crewBookingState(), "10233445566");
assert.strictEqual(
  owner.subject,
  "Action required: SETUP/RESET ADD-ON for Session #10233445566"
);
ok("owner subject is the Action-required line with the session id");

// FIRST line is the dashboard deep link.
const firstLine = owner.text.split("\n")[0];
assert.ok(
  firstLine.includes("https://wws.entrpy.co/bookings/10233445566"),
  "first line must be the dashboard deep link, got: " + firstLine
);
ok("owner body first line is the dashboard deep link to /bookings/<id>");

// The action fields Drew needs.
assert.ok(owner.text.includes("Jordan Rivera"), "owner shows customer name");
assert.ok(owner.text.includes("jordan@example.com"), "owner shows email");
assert.ok(owner.text.includes("864-555-0142"), "owner shows phone");
assert.ok(owner.text.includes("Amount paid:"), "owner shows amount label");
assert.ok(/Event Setup and Reset Crew/.test(owner.text), "owner lists the crew add-on");
ok("owner body carries name, email, phone, amount, add-ons");

// Amount fallback: base 4hr $350 + crew $750 = $1100.00 when no override given.
assert.ok(owner.text.includes("$1100.00"), "amount should sum session + crew (got body without $1100.00)");
ok("owner amount sums session + crew line items ($1100.00) with no override");

// Amount override (multi-day cart total) wins over the computed sum.
const ownerOverride = buildCrewOwnerEmail(crewBookingState(), "999", { amountCents: 291000, dateLabel: "Fri, Oct 3 to Sun, Oct 5" });
assert.ok(ownerOverride.text.includes("$2910.00"), "override amount should render");
assert.ok(ownerOverride.text.includes("Fri, Oct 3 to Sun, Oct 5"), "override date label should render");
ok("owner honors amountCents + dateLabel overrides (multi-day)");

// ---- April dedicated crew email (4b) ------------------------------------
const cleaner = buildCrewCleanerEmail(crewBookingState(), "10233445566");
assert.ok(cleaner.subject.startsWith("Setup + reset crew needed —"), "cleaner subject names the crew need");
assert.ok(cleaner.text.includes("Jordan Rivera"), "cleaner shows customer name");
assert.ok(/BEFORE the event/.test(cleaner.text), "cleaner mentions setup BEFORE the event");
assert.ok(/AFTER the event/.test(cleaner.text), "cleaner mentions reset AFTER the event");
assert.ok(!/placement/i.test(cleaner.text), "cleaner must NOT list placements (removed in DREW-80)");
ok("April dedicated email covers setup-before + reset-after, no placements");

// ---- Client draft (4e) — Drew's dictated copy, DREW-83 ------------------
const draft = buildClientDraft(crewBookingState(), "10233445566");
assert.strictEqual(
  draft.subject,
  "Your upcoming event at WhiteWall Studios and Events"
);
ok("client draft subject is simple + personal");

// Greeting is the customer's FIRST name only, with Drew's "Hey <name>!" shape.
assert.ok(draft.text.startsWith("Hey Jordan!"), "draft opens 'Hey Jordan!' (first name only)");
assert.ok(!/Jordan Rivera/.test(draft.text), "draft must NOT use the full name");
ok("client draft opens with the first-name greeting");

// Drew's verbatim phrases must survive exactly.
assert.ok(draft.text.includes("WhiteWall Studios and Events"), "draft uses Drew's brand wording");
assert.ok(draft.text.includes("meet me at the studio to walk through it together"), "draft keeps the walk-through offer");
assert.ok(draft.text.includes("tucked in the corner/moved into the storage building"), "draft keeps the storage-building line");
assert.ok(draft.text.includes("The best part is we'll reset everything for you after your event!"), "draft keeps the reset line");
assert.ok(draft.text.includes("we could always do a face-time call"), "draft keeps the FaceTime offer");
assert.ok(draft.text.trim().endsWith("Drew Shahoud, Owner of WhiteWall Studios and Events."), "draft is signed as the owner");
ok("client draft carries Drew's verbatim copy end to end");

// Missing first name degrades gracefully (draft is Drew-reviewed before any send).
const draftNoName = buildClientDraft({ contact: {} }, "x");
assert.ok(draftNoName.text.startsWith("Hey there!"), "no first name falls back to 'there'");
ok("client draft falls back to 'there' when first name is absent");

console.log("\nnotify-crew: all " + passed + " checks passed");
