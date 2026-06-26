// Tests for api/account/save-card.js (Drew V3 item 1 — add/update card on file).
//
// Covers (1) the pure validateSaveCard() guard and (2) the handler guards end
// to end with NO live Square: method/auth gate, a missing-token 400 that never
// touches Square, and a happy path that resolves the Square customer, stores the
// card via the token (NOT a charge), persists the handle, and returns last4/
// brand. The handler's only deps are the cached supabase + square module
// objects, so we spy on them in place — no network, no DB, no Square.
//
// Run: node api/account/save-card.test.js
"use strict";

var assert = require("assert");

// isConfigured() reads these — set before requiring anything that snapshots env.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.SUPABASE_ANON_KEY = "anon-key";

var handler = require("./save-card");
var sb = require("../_lib/supabase");
var sq = require("../_lib/square");

// ---- 1. validateSaveCard pure matrix --------------------------------------
(function () {
  var v = handler.validateSaveCard;

  assert.strictEqual(v({}).ok, false, "missing token must fail");
  assert.strictEqual(v({ squareToken: "   " }).ok, false, "blank token must fail");
  assert.ok(/token is required/i.test(v({}).errors.join(" ")), "explains missing token");

  var good = v({ squareToken: "  cnon_abc  ", cardholderName: "  Drew Shahoud  " });
  assert.strictEqual(good.ok, true, "valid token passes");
  assert.strictEqual(good.token, "cnon_abc", "token is trimmed");
  assert.strictEqual(good.cardholderName, "Drew Shahoud", "cardholder name is trimmed");
  assert.strictEqual(v({ squareToken: "cnon_abc" }).cardholderName, "", "absent name -> empty string");
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

  // ---- 3. not signed in -> 401, NO Square call --------------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origCreateCard = sq.createCardOnFile;
    var origFind = sq.findOrCreateCustomer;
    var sqCalls = 0;
    sb.getUserFromToken = async function () { return null; };
    sq.createCardOnFile = async function () { sqCalls++; throw new Error("Square must not run unauthenticated"); };
    sq.findOrCreateCustomer = async function () { sqCalls++; throw new Error("Square must not run unauthenticated"); };
    var res = makeRes();
    var req = { method: "POST", headers: { authorization: "Bearer bad" }, body: { squareToken: "cnon_x" } };
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 401, "no user must 401");
      assert.strictEqual(sqCalls, 0, "no Square call when unauthenticated");
    } finally {
      sb.getUserFromToken = origGetUser;
      sq.createCardOnFile = origCreateCard;
      sq.findOrCreateCustomer = origFind;
    }
  })();

}).then(function () {

  // ---- 4. missing token -> 400, NO Square call --------------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origCreateCard = sq.createCardOnFile;
    var sqCalls = 0;
    sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
    sq.createCardOnFile = async function () { sqCalls++; throw new Error("Square must not run without a token"); };
    var res = makeRes();
    var req = { method: "POST", headers: { authorization: "Bearer ok" }, body: {} };
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 400, "missing token must 400");
      assert.strictEqual(sqCalls, 0, "no Square call on a rejected save");
    } finally {
      sb.getUserFromToken = origGetUser;
      sq.createCardOnFile = origCreateCard;
    }
  })();

}).then(function () {

  // ---- 5. happy path -> 200: token stored (NOT charged), handle persisted --
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origSelect = sb.serviceSelect;
    var origUpdate = sb.serviceUpdate;
    var origFind = sq.findOrCreateCustomer;
    var origCreateCard = sq.createCardOnFile;
    var origPayment = sq.createPayment;

    var capturedCardOpts = null;
    var customerPatch = null, bookingPatch = null, bookingMatch = null;
    var paymentCalls = 0;

    sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
    sb.serviceSelect = async function (table, query) {
      if (table === "customers") {
        return [{ id: "user-1", email: "Drew@Example.com", full_name: "Drew Shahoud", phone: "8038738153", square_customer_id: null }];
      }
      if (table === "bookings") {
        return [{ id: "booking-9" }];
      }
      return [];
    };
    sb.serviceUpdate = async function (table, match, patch) {
      if (table === "customers") { customerPatch = patch; }
      if (table === "bookings") { bookingMatch = match; bookingPatch = patch; }
      return [{}];
    };
    sq.findOrCreateCustomer = async function (opts) {
      assert.strictEqual(opts.email, "drew@example.com", "find-or-create uses the lowercased account email");
      return "sq-cust-1";
    };
    sq.createPayment = async function () { paymentCalls++; throw new Error("save-card must NOT charge the card"); };
    sq.createCardOnFile = async function (opts) {
      capturedCardOpts = opts;
      return { id: "card-abc", last_4: "1111", card_brand: "VISA" };
    };

    var res = makeRes();
    var req = { method: "POST", headers: { authorization: "Bearer ok" }, body: { squareToken: "cnon_tok" } };
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 200, "valid save returns 200");
      assert.strictEqual(paymentCalls, 0, "saving a card is NEVER a charge");
      // Card stored from the TOKEN (sourceId), not a paymentId.
      assert.strictEqual(capturedCardOpts.sourceId, "cnon_tok", "stores the card from the SDK token");
      assert.strictEqual(capturedCardOpts.customerId, "sq-cust-1", "attaches to the resolved Square customer");
      assert.ok(!capturedCardOpts.paymentId, "no paymentId on the no-charge path");
      // Persisted handle onto the most-recent booking + customers row.
      assert.deepStrictEqual(bookingMatch, { id: "eq.booking-9" }, "writes onto the most-recent booking");
      assert.strictEqual(bookingPatch.square_card_id, "card-abc", "booking gets the new card id");
      assert.strictEqual(bookingPatch.square_customer_id, "sq-cust-1", "booking gets the customer id");
      assert.strictEqual(customerPatch.square_customer_id, "sq-cust-1", "customers row keeps the Square identity");
      // Returns the display fields the UI needs.
      assert.strictEqual(res._json.card.last4, "1111", "returns last4");
      assert.strictEqual(res._json.card.brand, "VISA", "returns brand");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceSelect = origSelect;
      sb.serviceUpdate = origUpdate;
      sq.findOrCreateCustomer = origFind;
      sq.createCardOnFile = origCreateCard;
      sq.createPayment = origPayment;
    }
  })();

}).then(function () {

  // ---- 6. reuse existing Square customer (no find-or-create) --------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origSelect = sb.serviceSelect;
    var origUpdate = sb.serviceUpdate;
    var origFind = sq.findOrCreateCustomer;
    var origCreateCard = sq.createCardOnFile;
    var findCalls = 0;

    sb.getUserFromToken = async function () { return { id: "user-2", email: "max@example.com" }; };
    sb.serviceSelect = async function (table) {
      if (table === "customers") return [{ id: "user-2", email: "max@example.com", full_name: "Max", square_customer_id: "sq-existing" }];
      return [];
    };
    sb.serviceUpdate = async function () { return [{}]; };
    sq.findOrCreateCustomer = async function () { findCalls++; return "sq-new"; };
    sq.createCardOnFile = async function (opts) {
      assert.strictEqual(opts.customerId, "sq-existing", "reuses the account's existing Square customer");
      return { id: "card-2", last_4: "4242", card_brand: "MASTERCARD" };
    };

    var res = makeRes();
    await handler({ method: "POST", headers: { authorization: "Bearer ok" }, body: { squareToken: "cnon_2" } }, res);
    try {
      assert.strictEqual(res._status, 200, "save returns 200");
      assert.strictEqual(findCalls, 0, "does not create a duplicate Square customer when one exists");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceSelect = origSelect;
      sb.serviceUpdate = origUpdate;
      sq.findOrCreateCustomer = origFind;
      sq.createCardOnFile = origCreateCard;
    }
  })();

}).then(function () {

  // ---- 7. card store fails -> 402, no throw -------------------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origSelect = sb.serviceSelect;
    var origCreateCard = sq.createCardOnFile;

    sb.getUserFromToken = async function () { return { id: "user-3", email: "a@b.com" }; };
    sb.serviceSelect = async function () { return [{ id: "user-3", email: "a@b.com", square_customer_id: "sq-3" }]; };
    sq.createCardOnFile = async function () { throw new Error("Square createCard 400: card declined"); };

    var res = makeRes();
    await handler({ method: "POST", headers: { authorization: "Bearer ok" }, body: { squareToken: "cnon_bad" } }, res);
    try {
      assert.strictEqual(res._status, 402, "a failed card store is a 402 the customer can fix");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceSelect = origSelect;
      sq.createCardOnFile = origCreateCard;
    }
  })();

}).then(function () {
  console.log("save-card.test.js: ALL TESTS PASSED (validate matrix + 405 + 401 guard + 400 no-Square + 200 store-not-charge + reuse-customer + 402 card-fail)");
}).catch(function (e) {
  console.error("save-card.test.js FAILED:", e && e.message);
  process.exit(1);
});
