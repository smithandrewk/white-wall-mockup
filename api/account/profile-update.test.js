// Tests for api/account/profile-update.js (Drew round-4 item 6 profile edit).
//
// Covers (1) the pure validateProfileUpdate() normalization + required-Contact
// guard and (2) the handler guards end to end: method/auth gate, a validation
// failure that makes NO DB write, and a happy path whose PATCH carries the
// normalized fields and NEVER an `email` key (email is the auth identity). The
// handler's only dependency is the cached supabase module object, so we spy on
// it in place — no network, no DB.
//
// Run: node api/account/profile-update.test.js
"use strict";

var assert = require("assert");

// isConfigured() reads these — set before requiring anything that snapshots env.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.SUPABASE_ANON_KEY = "anon-key";

var handler = require("./profile-update");
var sb = require("../_lib/supabase");

// ---- 1. validateProfileUpdate pure matrix ---------------------------------
(function () {
  var v = handler.validateProfileUpdate;

  // Missing phone -> not ok.
  var missing = v({ fullName: "Drew" });
  assert.strictEqual(missing.ok, false, "missing phone must fail");
  assert.ok(/phone is required/i.test(missing.errors.join(" ")), "explains missing phone");

  // Too-few digits -> not ok.
  assert.strictEqual(v({ phone: "555-12" }).ok, false, "short phone must fail");

  // Valid input normalizes + maps to snake_case PATCH values.
  var good = v({
    fullName: "  Drew Shahoud  ",
    companyName: " White Wall ",
    companyWebsite: " whitewallstudios.co ",
    phone: " (803) 873-8153 ",
    instagram: " @whitewall "
  });
  assert.strictEqual(good.ok, true, "valid input passes");
  assert.deepStrictEqual(good.values, {
    full_name: "Drew Shahoud",
    company_name: "White Wall",
    company_website: "whitewallstudios.co",
    phone: "(803) 873-8153",
    instagram: "@whitewall"
  }, "values are trimmed + snake_cased");
  assert.ok(!("email" in good.values), "email is never in the PATCH values");

  // Empty optionals normalize to null (so a customer can clear them).
  var cleared = v({ phone: "8038738153" });
  assert.strictEqual(cleared.values.company_name, null, "empty company -> null");
  assert.strictEqual(cleared.values.full_name, null, "empty name -> null");
  assert.strictEqual(cleared.values.instagram, null, "empty instagram -> null");
})();

// ---- helpers: mock req/res -------------------------------------------------
function makeRes() {
  return {
    _status: null, _json: null,
    status: function (c) { this._status = c; return this; },
    json: function (o) { this._json = o; return this; }
  };
}

// ---- 2. non-POST -> 405 ----------------------------------------------------
(async function () {
  var res = makeRes();
  await handler({ method: "GET", headers: {}, body: {} }, res);
  assert.strictEqual(res._status, 405, "GET must 405");
})().then(function () {

  // ---- 3. not signed in -> 401, NO DB write -------------------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origUpdate = sb.serviceUpdate;
    var updateCalls = 0;
    sb.getUserFromToken = async function () { return null; };
    sb.serviceUpdate = async function () { updateCalls++; throw new Error("serviceUpdate must not run unauthenticated"); };
    var res = makeRes();
    var req = { method: "POST", headers: { authorization: "Bearer bad" }, body: { phone: "8038738153" } };
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 401, "no user must 401");
      assert.strictEqual(updateCalls, 0, "no DB write when unauthenticated");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceUpdate = origUpdate;
    }
  })();

}).then(function () {

  // ---- 4. validation failure -> 400, NO DB write --------------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origUpdate = sb.serviceUpdate;
    var updateCalls = 0;
    sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
    sb.serviceUpdate = async function () { updateCalls++; throw new Error("serviceUpdate must not run on invalid input"); };
    var res = makeRes();
    var req = { method: "POST", headers: { authorization: "Bearer ok" }, body: { fullName: "Drew" } }; // no phone
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 400, "missing required phone must 400");
      assert.strictEqual(updateCalls, 0, "no DB write on a rejected update");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceUpdate = origUpdate;
    }
  })();

}).then(function () {

  // ---- 5. happy path -> 200, PATCH carries normalized fields, NO email -----
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origUpdate = sb.serviceUpdate;
    var capturedMatch = null, capturedPatch = null;
    sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
    sb.serviceUpdate = async function (table, match, patch) {
      assert.strictEqual(table, "customers", "updates the customers table");
      capturedMatch = match; capturedPatch = patch;
      return [{ id: "user-1", email: "drew@example.com", full_name: "Drew Shahoud", phone: "8038738153", company_name: "White Wall" }];
    };
    var res = makeRes();
    var req = {
      method: "POST",
      headers: { authorization: "Bearer ok" },
      body: { fullName: "Drew Shahoud", companyName: "White Wall", phone: "8038738153", email: "evil@hacker.com" }
    };
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 200, "valid update returns 200");
      assert.deepStrictEqual(capturedMatch, { id: "eq.user-1" }, "scoped to the verified user id");
      assert.ok(!("email" in capturedPatch), "email is NEVER patched (auth identity)");
      assert.strictEqual(capturedPatch.full_name, "Drew Shahoud", "name is saved");
      assert.strictEqual(capturedPatch.company_name, "White Wall", "company is saved");
      assert.strictEqual(res._json.customer.companyName, "White Wall", "response maps company back");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceUpdate = origUpdate;
    }
  })();

}).then(function () {
  console.log("profile-update.test.js: ALL TESTS PASSED (validate matrix + 405 + 401 guard + 400 no-write + 200 happy path)");
}).catch(function (e) {
  console.error("profile-update.test.js FAILED:", e && e.message);
  process.exit(1);
});
