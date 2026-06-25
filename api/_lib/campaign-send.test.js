// api/_lib/campaign-send.test.js — standalone (node api/_lib/campaign-send.test.js).
// Asserts the DARK gate (CAMPAIGN_SEND_ENABLED / REMINDERS_ENABLED) and the
// suppression rule. A recording sendImpl proves NO transport call happens unless
// the gate is on AND the recipient is not suppressed.

"use strict";

const assert = require("assert");
const cs = require("./campaign-send");

function recorder() {
  const calls = [];
  const impl = async function (payload) { calls.push(payload); return { sent: true }; };
  return { calls, impl };
}

const base = {
  to: "dana@example.com",
  subject: "Add to your session",
  html: "<p>hi</p>",
  text: "hi"
};

(async function () {
  // --- gate OFF (default): no send, skipped:disabled ---
  let r = recorder();
  let out = await cs.sendCampaignEmail(Object.assign({}, base, { env: {}, sendImpl: r.impl }));
  assert.strictEqual(out.skipped, true);
  assert.strictEqual(out.sent, false);
  assert.strictEqual(out.reason, "campaign-send-disabled");
  assert.strictEqual(r.calls.length, 0, "NO transport call when flag off");

  // --- gate ON: sends ---
  r = recorder();
  out = await cs.sendCampaignEmail(Object.assign({}, base, { env: { CAMPAIGN_SEND_ENABLED: "1" }, sendImpl: r.impl }));
  assert.strictEqual(out.sent, true);
  assert.strictEqual(r.calls.length, 1, "transport called once when armed");
  assert.strictEqual(r.calls[0].to, "dana@example.com");

  // --- suppression beats the gate: even armed, suppressed never sends ---
  r = recorder();
  out = await cs.sendCampaignEmail(Object.assign({}, base, {
    env: { CAMPAIGN_SEND_ENABLED: "1" }, suppressed: true, sendImpl: r.impl
  }));
  assert.strictEqual(out.skipped, true);
  assert.strictEqual(out.reason, "suppressed");
  assert.strictEqual(r.calls.length, 0, "suppressed recipient is never emailed");

  // --- no recipient: armed but no `to` => skipped ---
  r = recorder();
  out = await cs.sendCampaignEmail({ env: { CAMPAIGN_SEND_ENABLED: "1" }, subject: "x", html: "y", sendImpl: r.impl });
  assert.strictEqual(out.skipped, true);
  assert.strictEqual(out.reason, "no-recipient");
  assert.strictEqual(r.calls.length, 0);

  // --- reminder uses its OWN flag (REMINDERS_ENABLED), independent of campaign ---
  r = recorder();
  out = await cs.sendReminderEmail(Object.assign({}, base, { env: { CAMPAIGN_SEND_ENABLED: "1" }, sendImpl: r.impl }));
  assert.strictEqual(out.skipped, true, "campaign flag does not arm reminders");
  assert.strictEqual(out.reason, "reminders-disabled");
  assert.strictEqual(r.calls.length, 0);

  r = recorder();
  out = await cs.sendReminderEmail(Object.assign({}, base, { env: { REMINDERS_ENABLED: "1" }, sendImpl: r.impl }));
  assert.strictEqual(out.sent, true);
  assert.strictEqual(r.calls.length, 1);

  // --- transport no-op (e.g. missing API key) reports skipped, not sent ---
  r = recorder();
  const noopImpl = async function () { return { sent: false, reason: "no-resend-key" }; };
  out = await cs.sendCampaignEmail(Object.assign({}, base, { env: { CAMPAIGN_SEND_ENABLED: "1" }, sendImpl: noopImpl }));
  assert.strictEqual(out.skipped, true);
  assert.strictEqual(out.reason, "no-resend-key");

  // --- evaluateSuppression (pure) ---
  assert.strictEqual(cs.evaluateSuppression(null), false);
  assert.strictEqual(cs.evaluateSuppression({ status: "enrolled" }), false);
  assert.strictEqual(cs.evaluateSuppression({ status: "unsubscribed" }), true);
  assert.strictEqual(cs.evaluateSuppression({ status: "cancelled" }), true);
  assert.strictEqual(cs.evaluateSuppression({ status: "enrolled", unsubscribed_at: "2026-07-01T00:00:00Z" }), true);

  // --- isBookingSuppressed reads the enrollment row via injected db ---
  const fakeDb = {
    serviceSelect: async function (table, q) {
      assert.strictEqual(table, "campaign_enrollments");
      assert.ok(q.indexOf("booking_id=eq.bk1") !== -1);
      return [{ status: "unsubscribed", unsubscribed_at: null }];
    }
  };
  assert.strictEqual(await cs.isBookingSuppressed(fakeDb, "bk1"), true);

  // read error => fail-open (not suppressed; the flag gate is the real guard)
  const throwDb = { serviceSelect: async function () { throw new Error("boom"); } };
  assert.strictEqual(await cs.isBookingSuppressed(throwDb, "bk1"), false);
  assert.strictEqual(await cs.isBookingSuppressed(fakeDb, null), false);

  console.log("All campaign-send.test.js assertions passed.");
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
