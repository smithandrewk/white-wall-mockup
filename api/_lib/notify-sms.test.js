// Tests for the owner-SMS recipient fan-out (DREW-55) — Drew + Max (MAX_PHONE).
// No network: global.fetch is stubbed to record each POST. Run: node api/_lib/notify-sms.test.js

const assert = require("assert");

// notify-sms.js requires ./acuity at load; that's fine (pure maps), no network.
const {
  ownerRecipients,
  normalizeHandle,
  sendOwnerSMS,
} = require("./notify-sms");

let passed = 0;
function ok(label) { passed++; console.log("ok " + passed + " - " + label); }

// Snapshot + restore the env keys we mutate.
const KEYS = ["WATSON_SMS_URL", "WATSON_CF_ACCESS_CLIENT_ID", "WATSON_CF_ACCESS_CLIENT_SECRET",
  "BLUEBUBBLES_PASSWORD", "OWNER_PHONE", "MAX_PHONE"];
const saved = {};
KEYS.forEach((k) => { saved[k] = process.env[k]; });
function restore() { KEYS.forEach((k) => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }); }

// ---- normalizeHandle ----
(function () {
  assert.strictEqual(normalizeHandle("803-682-5691"), "+18036825691", "10-digit → +1");
  assert.strictEqual(normalizeHandle("+18038738153"), "+18038738153", "already E.164 kept");
  assert.strictEqual(normalizeHandle("1 (803) 682-5691"), "+18036825691", "11-digit leading 1 → +");
  assert.strictEqual(normalizeHandle("  "), "", "blank → empty");
  ok("normalizeHandle handles bare/formatted/E.164 numbers");
})();

// ---- ownerRecipients ----
(function () {
  process.env.OWNER_PHONE = "+18038738153";
  delete process.env.MAX_PHONE;
  assert.deepStrictEqual(ownerRecipients(), ["+18038738153"], "MAX unset → Drew only (dark)");
  process.env.MAX_PHONE = "803-682-5691";
  assert.deepStrictEqual(ownerRecipients(), ["+18038738153", "+18036825691"], "MAX set → both");
  process.env.MAX_PHONE = "+18038738153"; // same as owner
  assert.deepStrictEqual(ownerRecipients(), ["+18038738153"], "MAX == OWNER → de-duped");
  ok("ownerRecipients is Drew-only until MAX_PHONE is set, then adds Max (de-duped)");
})();

// ---- sendOwnerSMS fans out to every recipient ----
(async function () {
  process.env.WATSON_SMS_URL = "https://bb.example";
  process.env.WATSON_CF_ACCESS_CLIENT_ID = "id";
  process.env.WATSON_CF_ACCESS_CLIENT_SECRET = "secret";
  process.env.BLUEBUBBLES_PASSWORD = "pw";
  process.env.OWNER_PHONE = "+18038738153";
  process.env.MAX_PHONE = "803-682-5691";

  const sent = [];
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => {
    sent.push(JSON.parse(opts.body).chatGuid);
    return { ok: true, text: async () => "" };
  };
  try {
    await sendOwnerSMS("hello", "APPT1");
    assert.deepStrictEqual(
      sent,
      ["any;-;+18038738153", "any;-;+18036825691"],
      "same body posted to Drew AND Max"
    );
    // Dark: with MAX unset only Drew is texted.
    delete process.env.MAX_PHONE;
    sent.length = 0;
    await sendOwnerSMS("hello", "APPT2");
    assert.deepStrictEqual(sent, ["any;-;+18038738153"], "MAX unset → Drew only");
  } finally {
    global.fetch = realFetch;
    restore();
  }
  ok("sendOwnerSMS posts the same body to every recipient; dark (Drew-only) when MAX_PHONE unset");

  console.log("\nAll " + passed + " notify-sms assertions passed.");
})();
