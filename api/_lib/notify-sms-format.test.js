// DREW-30 (2026-07-30): owner-text reformat onto the labeled line-item skeleton
// Drew confirmed on the "Whitewall x Watson build" thread. These lock the exact
// shape of the three owner texts (Sections 1, 2, 3) so a future edit can't silently
// drift them. Section 4 (setup crew) is unchanged per Drew and is not re-tested here.
//
// Run: node --test api/_lib/notify-sms-format.test.js

const test = require("node:test");
const assert = require("node:assert");

const { buildSmsText, buildCompSmsText, fmtPhone, sessionTypeLabel } = require("./notify-sms");
const { buildOwnerEventSms } = require("./notify-multiday");

// A 40-person Powdersville event, 4hr session (real type 89114517), cleaning fee.
const eventState = {
  appointmentTypeID: "89114517",
  datetime: "2026-11-08T18:00:00-05:00",
  location: "powdersville",
  contact: { firstName: "Sarah", lastName: "Klein", phone: "8645550142" },
  intake: { participants: "40" },
  participants: "40",
  eventIntent: "yes",
  eventDescription: "Company anniversary party",
  addons: { backdrops: { mode: "all" }, lighting: { selected: true } },
  cleaningFee: { amount: 150 }
};

// A 3hr Taylor's Mill photo shoot (real type 28312534), no event, no cleaning fee.
const photoState = {
  appointmentTypeID: "28312534",
  datetime: "2026-11-12T10:00:00-05:00",
  location: "taylors-mill",
  contact: { firstName: "Marcus", lastName: "Lee", phone: "(864) 555-0193" },
  intake: {},
  participants: "",
  eventIntent: "no",
  eventDescription: "",
  addons: {},
  cleaningFee: null
};

test("fmtPhone formats clean US numbers and passes anything else through", () => {
  assert.strictEqual(fmtPhone("8645550142"), "(864) 555-0142");
  assert.strictEqual(fmtPhone("18645550142"), "(864) 555-0142");     // leading 1
  assert.strictEqual(fmtPhone("(864) 555-0193"), "(864) 555-0193");  // already formatted
  assert.strictEqual(fmtPhone("+1 864-555-0142"), "(864) 555-0142");
  assert.strictEqual(fmtPhone("call me"), "call me");                // not a number → as-typed
  assert.strictEqual(fmtPhone(""), "—");
  assert.strictEqual(fmtPhone(null), "—");
});

test("sessionTypeLabel is locked to Event or Photo/video", () => {
  assert.strictEqual(sessionTypeLabel({ eventIntent: "yes" }), "Event");
  assert.strictEqual(sessionTypeLabel({ eventIntent: "no" }), "Photo/video");
  assert.strictEqual(sessionTypeLabel({}), "Photo/video");
});

test("Section 1 (large/long single) renders the confirmed labeled skeleton", () => {
  const txt = buildSmsText(eventState, "24815763");
  const lines = txt.split("\n");
  assert.strictEqual(lines[0], "[WhiteWall] New booking");
  assert.strictEqual(lines[1], "Client Name: Sarah Klein");
  assert.strictEqual(lines[2], "Session Type: Event");
  assert.strictEqual(lines[3], "Client Phone: (864) 555-0142");
  assert.strictEqual(lines[4], "Location: Flagship");
  assert.ok(/^When: Nov 8, .*\(4 Hour Session\)$/.test(lines[5]), "When line: " + lines[5]);
  assert.ok(txt.includes("People: 40"));
  assert.ok(txt.includes("Use: Company anniversary party"));
  assert.ok(/\nTotal: \$[0-9]/.test(txt), "has a Total line");
  assert.ok(txt.includes("Cleaners emailed: Yes"));
  assert.ok(txt.includes("Acuity #24815763"));
});

test("Section 1 photo/video: TM label, no People/Use lines, Cleaners No", () => {
  const txt = buildSmsText(photoState, "24815770");
  assert.ok(txt.includes("Session Type: Photo/video"));
  assert.ok(txt.includes("Client Phone: (864) 555-0193"));
  assert.ok(txt.includes("Location: TM"));
  assert.ok(!txt.includes("People:"), "People omitted when count is 0/blank");
  assert.ok(!txt.includes("Use:"), "Use omitted when no description");
  assert.ok(txt.includes("Cleaners emailed: No"));
  assert.ok(txt.includes("Acuity #24815770"));
});

test("Section 2 (100% off) keeps its header, adds Add-ons/Acuity/Cleaners lines", () => {
  const txt = buildCompSmsText(eventState, "24815763");
  const lines = txt.split("\n");
  assert.strictEqual(lines[0], "[WhiteWall] 100% off code used");
  assert.strictEqual(lines[1], "Client Name: Sarah Klein");
  assert.strictEqual(lines[2], "Session Type: Event");
  assert.strictEqual(lines[3], "Client Phone: (864) 555-0142");
  assert.ok(txt.includes("Add-ons: All backdrops, Lighting"));
  assert.ok(txt.includes("Total: $0.00 (100% off)"));
  assert.ok(txt.includes("Cleaners emailed: Yes"));
  assert.ok(txt.includes("Acuity #24815763"));
});

test("Section 2 comp: appointmentId threads through to the Acuity line", () => {
  const txt = buildCompSmsText(photoState, "99999999");
  assert.ok(txt.includes("Acuity #99999999"));
  assert.ok(txt.includes("Add-ons: none"));
  assert.ok(txt.includes("Cleaners emailed: No"));
});

test("Section 3 (multi-day) gains Client Name/Session Type/Client Phone + Yes/No cleaners", () => {
  const ctx = {
    contact: { firstName: "Sarah", lastName: "Klein", phone: "8645550142" },
    days: [
      { datetime: "2026-10-03T17:00:00-04:00", appointmentId: "24815780", typeId: "89114517" },
      { datetime: "2026-10-05T17:00:00-04:00", appointmentId: "24815782", typeId: "89114517" }
    ],
    headcount: 60,
    eventDescription: "Corporate retreat",
    totalCents: 417330,
    cleaningFeeCents: 15000,
    paymentMode: "full"
  };
  const txt = buildOwnerEventSms(ctx);
  const lines = txt.split("\n");
  assert.strictEqual(lines[0], "[WhiteWall] Multi-day event booked");
  assert.strictEqual(lines[1], "Client Name: Sarah Klein");
  assert.strictEqual(lines[2], "Session Type: Multi-day event");
  assert.strictEqual(lines[3], "Client Phone: (864) 555-0142");
  assert.ok(txt.includes("People: 60"));
  assert.ok(txt.includes("Use: Corporate retreat"));
  assert.ok(txt.includes("Total: $4,173.30"));
  assert.ok(txt.includes("Cleaners emailed: Yes"));
  assert.ok(/2 appointments \(Acuity #24815780/.test(txt));
  assert.ok(!txt.includes("Cleaners emailed ✓"), "old checkmark form is gone");
});

test("Section 3 deposit booking: Paid/Balance line + cleaners No when no fee", () => {
  const ctx = {
    contact: { firstName: "Sarah", lastName: "Klein", phone: "8645550142" },
    days: [
      { datetime: "2026-10-03T17:00:00-04:00", appointmentId: "24815780", typeId: "89114517" },
      { datetime: "2026-10-05T17:00:00-04:00", appointmentId: "24815782", typeId: "89114517" }
    ],
    headcount: 60,
    eventDescription: "Corporate retreat",
    totalCents: 417330,
    chargeCents: 250398,
    balanceDueCents: 166932,
    cleaningFeeCents: 0,
    paymentMode: "deposit"
  };
  const txt = buildOwnerEventSms(ctx);
  assert.ok(txt.includes("Session Type: Multi-day event"));
  assert.ok(txt.includes("Paid: $2,503.98 (60% deposit) · Balance $1,669.32"));
  assert.ok(txt.includes("Cleaners emailed: No"));
});
