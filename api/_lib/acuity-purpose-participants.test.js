// DREW-31: participant count is mandatory (never faked to "1") and every booking
// carries a uniform "Session purpose:" note the dashboard parses. These lock the
// Acuity field + notes contract so a regression is caught before it ships.
const test = require("node:test");
const assert = require("node:assert");
const { buildAcuityFields, buildAppointmentNotes, ACUITY_FIELD_IDS } = require("./acuity");

function participantsField(intake, location) {
  const fields = buildAcuityFields(intake, location);
  const f = fields.find((x) => x.id === ACUITY_FIELD_IDS.participants);
  return f ? f.value : undefined;
}

test("buildAcuityFields writes the real count, never a faked 1", () => {
  assert.strictEqual(participantsField({ participants: "4" }, "powdersville"), "4");
  assert.strictEqual(participantsField({ participants: 12 }, "taylors-mill"), "12");
});

test("buildAcuityFields writes an honest blank when no count (no placeholder leak)", () => {
  // The old code wrote "1" here — a silently wrong headcount. It must be blank now.
  assert.strictEqual(participantsField({}, "powdersville"), "");
  assert.strictEqual(participantsField({ participants: "" }, "powdersville"), "");
});

test("Session purpose line: photo/video canonical dropdown answer", () => {
  const notes = buildAppointmentNotes({
    eventIntent: "no",
    intake: { purpose: "Headshots", participants: "2" }
  });
  assert.match(notes, /^Session purpose: Headshots$/m);
});

test("Session purpose line: photo/video Other carries the free text as 'Other: ...'", () => {
  const notes = buildAppointmentNotes({
    eventIntent: "no",
    intake: { purpose: "Other", purposeOther: "Pet photoshoot", participants: "1" }
  });
  assert.match(notes, /^Session purpose: Other: Pet photoshoot$/m);
});

test("Session purpose line: events use the open-ended event description", () => {
  const notes = buildAppointmentNotes({
    eventIntent: "yes",
    participants: "60",
    eventDescription: "Corporate retreat",
    foodDrinks: true
  });
  assert.match(notes, /^Session purpose: Corporate retreat$/m);
  // and the existing event lines still render
  assert.match(notes, /^Event guests: 60$/m);
});

test("Session purpose line is omitted when genuinely empty (no blank label)", () => {
  const notes = buildAppointmentNotes({ eventIntent: "no", intake: { participants: "3" } });
  assert.ok(!/Session purpose:/.test(notes));
});
