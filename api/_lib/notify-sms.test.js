// Tests for the owner-SMS transport + the Fox route (DREW-55). Drew wanted Max's
// copy routed THROUGH FOX (his agent), not a direct text — so sendOwnerSMS sends
// to Drew via Watson's BB and the SAME body to Fox's BB when FOX_* is configured.
// No network: global.fetch is stubbed to record each POST. Run: node api/_lib/notify-sms.test.js

const assert = require("assert");

const {
  foxConfig,
  normalizeHandle,
  sendOwnerSMS,
} = require("./notify-sms");

let passed = 0;
function ok(label) { passed++; console.log("ok " + passed + " - " + label); }

const KEYS = [
  "WATSON_SMS_URL", "WATSON_CF_ACCESS_CLIENT_ID", "WATSON_CF_ACCESS_CLIENT_SECRET",
  "BLUEBUBBLES_PASSWORD", "OWNER_PHONE",
  "FOX_SMS_URL", "FOX_CF_ACCESS_CLIENT_ID", "FOX_CF_ACCESS_CLIENT_SECRET",
  "FOX_BLUEBUBBLES_PASSWORD", "FOX_HANDLE",
];
const saved = {};
KEYS.forEach((k) => { saved[k] = process.env[k]; });
function restore() { KEYS.forEach((k) => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }); }
function clearAll() { KEYS.forEach((k) => delete process.env[k]); }

// ---- normalizeHandle ----
(function () {
  assert.strictEqual(normalizeHandle("803-682-5691"), "+18036825691");
  assert.strictEqual(normalizeHandle("+18038738153"), "+18038738153");
  assert.strictEqual(normalizeHandle(""), "");
  ok("normalizeHandle handles bare/formatted/E.164 numbers");
})();

// ---- foxConfig: dark unless ALL five FOX_* are set ----
(function () {
  clearAll();
  assert.strictEqual(foxConfig(), null, "no FOX_* -> dark");
  process.env.FOX_SMS_URL = "https://fox-bb.example";
  process.env.FOX_CF_ACCESS_CLIENT_ID = "id";
  process.env.FOX_CF_ACCESS_CLIENT_SECRET = "secret";
  process.env.FOX_BLUEBUBBLES_PASSWORD = "pw";
  assert.strictEqual(foxConfig(), null, "missing FOX_HANDLE -> still dark");
  process.env.FOX_HANDLE = "803-682-5691";
  const cfg = foxConfig();
  assert.ok(cfg && cfg.handle === "+18036825691", "all five set -> configured, handle normalized");
  restore();
  ok("foxConfig stays dark until all five FOX_* vars are set");
})();

// ---- sendOwnerSMS: Drew via Watson + Max via Fox (same body), each independent ----
(async function () {
  clearAll();
  process.env.WATSON_SMS_URL = "https://wws-bb.example";
  process.env.WATSON_CF_ACCESS_CLIENT_ID = "wid";
  process.env.WATSON_CF_ACCESS_CLIENT_SECRET = "wsecret";
  process.env.BLUEBUBBLES_PASSWORD = "wpw";
  process.env.OWNER_PHONE = "+18038738153";

  const calls = [];
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => {
    calls.push({ url, chatGuid: JSON.parse(opts.body).chatGuid });
    return { ok: true, text: async () => "" };
  };
  try {
    // Fox unset -> only Drew via Watson.
    await sendOwnerSMS("hello", "A1");
    assert.deepStrictEqual(calls.map((c) => c.chatGuid), ["any;-;+18038738153"], "Fox dark -> Drew only");
    assert.ok(calls[0].url.startsWith("https://wws-bb.example"), "Drew send hits Watson's tunnel");

    // Configure Fox -> Drew via Watson AND the same body to Fox's tunnel.
    calls.length = 0;
    process.env.FOX_SMS_URL = "https://fox-bb.example";
    process.env.FOX_CF_ACCESS_CLIENT_ID = "fid";
    process.env.FOX_CF_ACCESS_CLIENT_SECRET = "fsecret";
    process.env.FOX_BLUEBUBBLES_PASSWORD = "fpw";
    process.env.FOX_HANDLE = "+18036825691";
    await sendOwnerSMS("hello", "A2");
    assert.strictEqual(calls.length, 2, "Drew + Fox");
    assert.ok(calls[0].url.startsWith("https://wws-bb.example"), "1st = Watson (Drew)");
    assert.ok(calls[1].url.startsWith("https://fox-bb.example"), "2nd = Fox tunnel");
    assert.strictEqual(calls[1].chatGuid, "any;-;+18036825691", "Fox targets FOX_HANDLE");
  } finally {
    global.fetch = realFetch;
    restore();
  }
  ok("sendOwnerSMS sends to Drew via Watson and the same body to Fox when configured (dark otherwise)");

  console.log("\nAll " + passed + " notify-sms assertions passed.");
})();
