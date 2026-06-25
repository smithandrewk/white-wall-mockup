// api/_lib/addon-apply.test.js — standalone (node api/_lib/addon-apply.test.js).
// Covers the pure helpers and the applyAddon orchestrator's DARK discipline:
//   - invalid token / unknown add-on are rejected
//   - flag OFF (default) is a dry-run: NO charge, NO Acuity write, NO DB write
//   - armed + Square production (without allow-prod) is REFUSED
//   - armed + sandbox charges via the injected chargeCardOnFile, claims the
//     idempotency ledger, stamps Acuity notes, and records the events
//   - a second armed apply is idempotent (already-succeeded => no second charge)
//
// All Square / Acuity / DB access is injected — no network.

"use strict";

const assert = require("assert");
const lib = require("./addon-apply");

// ---------------------------------------------------------------------------
// pure helpers
// ---------------------------------------------------------------------------
assert.strictEqual(
  lib.addonChargeKey("bk1", "tv"),
  lib.addonChargeKey("bk1", "tv"),
  "key is deterministic"
);
assert.notStrictEqual(lib.addonChargeKey("bk1", "tv"), lib.addonChargeKey("bk1", "pa-system"));
assert.ok(lib.addonChargeKey("bk1", "tv").length <= 45, "key <= 45 chars (Square cap)");

const good = lib.resolveAddon("tv");
assert.strictEqual(good.ok, true);
assert.strictEqual(good.cents, 5000);
assert.strictEqual(good.label, "86in Rolling TV");
assert.strictEqual(lib.resolveAddon("not-a-thing").ok, false);
assert.strictEqual(lib.resolveAddon("").ok, false);
assert.strictEqual(lib.resolveAddon(null).ok, false);

assert.ok(/Add-on added via email link: PA System \(\$40\.00\)/.test(
  lib.buildAddonNoteLine("PA System", 4000, "2026-08-01T00:00:00Z")
));

// arming matrix
assert.deepStrictEqual(
  lib.decideArming({}),
  { armed: false, allowProd: false, isProd: false, prodBlocked: false }
);
let a = lib.decideArming({ ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "production" });
assert.strictEqual(a.armed, true);
assert.strictEqual(a.prodBlocked, true, "armed + prod + no allow-prod => blocked");
a = lib.decideArming({ ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "production", ADDON_CHARGE_ALLOW_PROD: "1" });
assert.strictEqual(a.prodBlocked, false, "allow-prod lifts the block");
a = lib.decideArming({ ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "sandbox" });
assert.strictEqual(a.prodBlocked, false, "sandbox is never prod-blocked");

// ---------------------------------------------------------------------------
// fake DB (PostgREST-shaped) — in-memory
// ---------------------------------------------------------------------------
function makeDb(seed) {
  const idem = new Map(); // key -> { key, status }
  const inserts = { payment_events: [], booking_session_addons: [] };
  function tokenOf(q) {
    const m = /access_token=eq\.([^&]+)/.exec(q);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function bookingIdOf(q) {
    const m = /booking_id=eq\.([^&]+)/.exec(q);
    return m ? decodeURIComponent(m[1]) : null;
  }
  return {
    _idem: idem,
    _inserts: inserts,
    serviceSelect: async function (table, q) {
      if (table === "bookings") {
        const t = tokenOf(q);
        return seed.booking && seed.booking.access_token === t ? [seed.booking] : [];
      }
      if (table === "booking_sessions") {
        const bid = bookingIdOf(q);
        return seed.session && seed.session.booking_id === bid ? [seed.session] : [];
      }
      if (table === "idempotency_keys") {
        const m = /key=eq\.([^&]+)/.exec(q);
        const k = m ? decodeURIComponent(m[1]) : null;
        return idem.has(k) ? [{ status: idem.get(k).status }] : [];
      }
      return [];
    },
    serviceInsert: async function (table, row) {
      if (table === "idempotency_keys") {
        if (idem.has(row.key)) {
          const err = new Error("duplicate key value violates unique constraint");
          err.status = 409;
          throw err;
        }
        idem.set(row.key, { key: row.key, status: row.status || "in_flight" });
        return [row];
      }
      if (inserts[table]) inserts[table].push(row);
      return [row];
    },
    serviceUpdate: async function (table, match, patch) {
      if (table === "idempotency_keys") {
        const k = String(match.key || "").replace(/^eq\./, "");
        if (idem.has(k)) idem.get(k).status = patch.status;
      }
      return [];
    }
  };
}

const SESSION = {
  id: "sess1",
  booking_id: "bk1",
  acuity_appointment_id: "appt-9",
  location: "powdersville",
  appointment_type_id: "94823049",
  starts_at: "2026-08-01T16:30:00Z"
};
function bookingWithCard() {
  return {
    id: "bk1",
    access_token: "tok-abc",
    payment_mode: "deposit",
    balance_due_cents: 30000,
    square_customer_id: "cus_1",
    square_card_id: "card_1"
  };
}

function chargeRecorder(payment) {
  const calls = [];
  return {
    calls,
    fn: async function (opts) { calls.push(opts); return payment || { id: "pay_1", status: "COMPLETED" }; }
  };
}
function acuityFakes() {
  const puts = [];
  return {
    puts,
    get: async function () { return { notes: "existing notes" }; },
    put: async function (path, body) { puts.push({ path, body }); return { id: "appt-9" }; }
  };
}

(async function () {
  // --- invalid token ---
  let db = makeDb({ booking: bookingWithCard(), session: SESSION });
  let out = await lib.applyAddon({ token: "WRONG", addonId: "tv", db: db, env: {} });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.status, 404);
  assert.strictEqual(out.error, "invalid-token");

  // --- unknown add-on ---
  out = await lib.applyAddon({ token: "tok-abc", addonId: "nope", db: db, env: {} });
  assert.strictEqual(out.status, 400);
  assert.strictEqual(out.error, "unknown-addon");

  // --- DARK default (no flag): dry-run, NO charge, NO writes ---
  let chg = chargeRecorder();
  let ac = acuityFakes();
  db = makeDb({ booking: bookingWithCard(), session: SESSION });
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "tv", db: db, env: {},
    deps: { chargeCardOnFile: chg.fn, acuityGet: ac.get, acuityPut: ac.put }
  });
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.dryRun, true);
  assert.strictEqual(out.would, "charge");
  assert.strictEqual(out.amountCents, 5000);
  assert.strictEqual(chg.calls.length, 0, "DARK: no Square charge");
  assert.strictEqual(ac.puts.length, 0, "DARK: no Acuity write");
  assert.strictEqual(db._inserts.payment_events.length, 0, "DARK: no payment_events");
  assert.strictEqual(db._idem.size, 0, "DARK: ledger untouched");

  // --- armed + Square production, no allow-prod => REFUSED ---
  chg = chargeRecorder();
  db = makeDb({ booking: bookingWithCard(), session: SESSION });
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "tv", db: db,
    env: { ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "production" },
    deps: { chargeCardOnFile: chg.fn }
  });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.status, 403);
  assert.strictEqual(out.blocked, "prod-charge-blocked-in-dark-phase");
  assert.strictEqual(chg.calls.length, 0, "prod-blocked: no charge");

  // --- armed sandbox, no card on file => 409 ---
  const noCard = bookingWithCard();
  delete noCard.square_card_id;
  db = makeDb({ booking: noCard, session: SESSION });
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "tv", db: db,
    env: { ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "sandbox" },
    deps: { chargeCardOnFile: chargeRecorder().fn }
  });
  assert.strictEqual(out.status, 409);
  assert.strictEqual(out.error, "no-card-on-file");

  // --- armed sandbox, happy path: charges, claims ledger, notes Acuity, records ---
  chg = chargeRecorder();
  ac = acuityFakes();
  db = makeDb({ booking: bookingWithCard(), session: SESSION });
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "pa-system", db: db,
    env: { ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "sandbox" },
    deps: { chargeCardOnFile: chg.fn, acuityGet: ac.get, acuityPut: ac.put },
    now: Date.parse("2026-07-15T00:00:00Z")
  });
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.charged, true);
  assert.strictEqual(out.amountCents, 4000);
  assert.strictEqual(out.paymentId, "pay_1");
  // charge got the saved card + authoritative amount
  assert.strictEqual(chg.calls.length, 1);
  assert.strictEqual(chg.calls[0].customerId, "cus_1");
  assert.strictEqual(chg.calls[0].cardId, "card_1");
  assert.strictEqual(chg.calls[0].amountCents, 4000);
  // ledger marked succeeded
  const key = lib.addonChargeKey("bk1", "pa-system");
  assert.strictEqual(db._idem.get(key).status, "succeeded");
  // Acuity note appended WITH calendarID (multi-calendar gotcha) for PV type
  assert.strictEqual(ac.puts.length, 1);
  assert.ok(/\?admin=true$/.test(ac.puts[0].path));
  assert.strictEqual(ac.puts[0].body.calendarID, 6255578, "PV calendarID passed");
  assert.ok(/existing notes\nAdd-on added via email link: PA System/.test(ac.puts[0].body.notes));
  assert.strictEqual(out.acuityNoted, true);
  // bookkeeping rows
  assert.strictEqual(db._inserts.payment_events.length, 1);
  assert.strictEqual(db._inserts.payment_events[0].kind, "addon");
  assert.strictEqual(db._inserts.payment_events[0].status, "succeeded");
  assert.strictEqual(db._inserts.booking_session_addons.length, 1);
  assert.strictEqual(db._inserts.booking_session_addons[0].addon_id, "pa-system");

  // --- idempotent: re-apply the SAME add-on => no second charge ---
  const chg2 = chargeRecorder();
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "pa-system", db: db,
    env: { ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "sandbox" },
    deps: { chargeCardOnFile: chg2.fn, acuityGet: ac.get, acuityPut: ac.put }
  });
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.alreadyApplied, true);
  assert.strictEqual(chg2.calls.length, 0, "idempotent: no second charge");

  // --- charge failure marks the ledger 'failed' + records a failed event, no throw ---
  chg = { calls: [], fn: async function () { throw new Error("CARD_DECLINED"); } };
  db = makeDb({ booking: bookingWithCard(), session: SESSION });
  out = await lib.applyAddon({
    token: "tok-abc", addonId: "tv", db: db,
    env: { ADDON_CHARGE_ARMED: "1", SQUARE_ENVIRONMENT: "sandbox" },
    deps: { chargeCardOnFile: chg.fn }
  });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.status, 502);
  assert.strictEqual(out.error, "charge-failed");
  const fkey = lib.addonChargeKey("bk1", "tv");
  assert.strictEqual(db._idem.get(fkey).status, "failed");
  assert.strictEqual(db._inserts.payment_events.length, 1);
  assert.strictEqual(db._inserts.payment_events[0].status, "failed");

  // --- previewBooking returns session summary, no charge surface ---
  db = makeDb({ booking: bookingWithCard(), session: SESSION });
  const pv = await lib.previewBooking({ token: "tok-abc", db: db });
  assert.strictEqual(pv.ok, true);
  assert.strictEqual(pv.booking.sessionLabel, "8 Hour Session");
  assert.strictEqual(pv.booking.location, "powdersville");
  const pvBad = await lib.previewBooking({ token: "nope", db: db });
  assert.strictEqual(pvBad.ok, false);
  assert.strictEqual(pvBad.status, 404);

  console.log("All addon-apply.test.js assertions passed.");
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
