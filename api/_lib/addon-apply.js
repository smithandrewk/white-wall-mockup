// api/_lib/addon-apply.js — V3 item 6 tokenized "add this add-on + charge my
// card" logic (DARK by default).
//
// This is the engine behind the add-on campaign emails' one-click button. The
// recipient lands on /addon-menu?token=<access_token> and POSTs { token, addonId }
// to /api/addon-apply. This module:
//   1. validates the per-booking access_token (the ONLY thing trusted from the
//      link — every other value is rebuilt server-side from the matched row);
//   2. resolves the add-on against the authoritative ADDON_PRICES table (the
//      client never sets the price);
//   3. charges the saved card via chargeCardOnFile and stamps the add-on onto the
//      Acuity appointment notes.
//
// DARK DISCIPLINE (non-negotiable). The charge sits behind ADDON_CHARGE_ARMED,
// which DEFAULTS OFF. With it off, applyAddon is a DRY-RUN: it validates + prices
// the add-on and returns what it WOULD charge, but makes NO Square charge, NO
// Acuity write, NO DB write to live rows. Belt-and-suspenders second gate for
// this dark phase: even when ADDON_CHARGE_ARMED === "1", a real charge against
// Square PRODUCTION is REFUSED unless ADDON_CHARGE_ALLOW_PROD === "1" (also OFF by
// default) so an early arming can only ever move sandbox money on staging. The
// wave-12 money-arming lever lifts both, after the deposit-policy sign-off.
//
// IDEMPOTENCY. Before an armed charge we claim the key in the public
// .idempotency_keys ledger (scope 'addon_charge', from migration 0003), using the
// same sha256-truncated-to-45 convention as the balance/campaign jobs. A key
// already 'succeeded' short-circuits to alreadyApplied. The Square idempotency_key
// inside chargeCardOnFile is the hard backstop at the processor.
//
// INVARIANTS: client never trusted (token -> server row is the whole identity);
// every Acuity call passing appointmentTypeID also passes calendarID (multi-
// calendar gotcha); no secrets here. All Square / Acuity / DB access is injected
// (opts.deps / opts.db) so the orchestrator is unit-testable with no network.

"use strict";

var crypto = require("crypto");
var sbDB = require("./supabase");
var acuity = require("./acuity");
var env = require("./env");

var ADDON_PRICES = acuity.ADDON_PRICES;
var SESSION_PRICES = acuity.SESSION_PRICES;
var TYPE_TO_CALENDAR = acuity.TYPE_TO_CALENDAR;

// ---------------------------------------------------------------------------
// pure helpers
// ---------------------------------------------------------------------------

// Stable per-(booking, add-on) idempotency key. Matches the campaign/balance job
// convention (sha256 over a scoped string, truncated to Square's 45-char cap).
function addonChargeKey(bookingId, addonId) {
  return crypto
    .createHash("sha256")
    .update("addon|" + bookingId + "|" + addonId)
    .digest("hex")
    .slice(0, 45);
}

// Resolve an add-on id from the menu against the authoritative price table.
// Returns { ok, addonId, label, cents } or { ok:false, error }. The price is
// ALWAYS taken from ADDON_PRICES, never from the request.
function resolveAddon(addonId) {
  if (!addonId || typeof addonId !== "string") {
    return { ok: false, error: "missing-addon" };
  }
  var row = ADDON_PRICES[addonId];
  if (!row) return { ok: false, error: "unknown-addon" };
  return { ok: true, addonId: addonId, label: row.label, cents: row.cents };
}

// The notes line stamped onto the Acuity appointment when an add-on is applied.
function buildAddonNoteLine(label, cents, whenIso) {
  var amt = "$" + (Number(cents || 0) / 100).toFixed(2);
  var when = whenIso ? new Date(whenIso).toISOString().slice(0, 10) : "";
  return "Add-on added via email link: " + label + " (" + amt + ")" + (when ? " on " + when : "");
}

// Decide arming + prod-safety for a charge in this dark phase. PURE.
//   returns { armed, allowProd, isProd, prodBlocked }
function decideArming(e) {
  e = e || {};
  var armed = e.ADDON_CHARGE_ARMED === "1";
  var allowProd = e.ADDON_CHARGE_ALLOW_PROD === "1";
  var isProd = e.SQUARE_ENVIRONMENT === "production";
  return {
    armed: armed,
    allowProd: allowProd,
    isProd: isProd,
    prodBlocked: armed && isProd && !allowProd
  };
}

// Choose the calendarID for the Acuity notes write (multi-calendar gotcha). Honors
// the staging override exactly like the rest of the codebase.
function calendarIdFor(appointmentTypeId) {
  return env.stagingCalendarID() || TYPE_TO_CALENDAR[String(appointmentTypeId)] || null;
}

// ---------------------------------------------------------------------------
// IO: idempotency claim (mirrors scheduler-dispatch.claimIdempotency, scoped here)
// ---------------------------------------------------------------------------
async function claimAddonCharge(db, opts) {
  try {
    await db.serviceInsert("idempotency_keys", {
      key: opts.key,
      scope: "addon_charge",
      booking_id: opts.bookingId || null,
      status: "in_flight"
    });
    return { claimed: true, fresh: true };
  } catch (err) {
    var dup =
      err &&
      (err.status === 409 ||
        /duplicate|already exists|23505/i.test((err.message || "") + JSON.stringify(err.supabase || "")));
    if (!dup) throw err;
    var rows = await db.serviceSelect(
      "idempotency_keys",
      "key=eq." + encodeURIComponent(opts.key) + "&select=status"
    );
    var status = rows && rows[0] && rows[0].status;
    if (status === "succeeded") return { claimed: false, reason: "already-succeeded" };
    if (status === "in_flight") return { claimed: false, reason: "in-flight" };
    try {
      await db.serviceUpdate("idempotency_keys", { key: "eq." + opts.key }, { status: "in_flight" });
    } catch (e) { /* best-effort */ }
    return { claimed: true, retry: true };
  }
}

async function setLedger(db, key, status, result) {
  try {
    await db.serviceUpdate("idempotency_keys", { key: "eq." + key }, { status: status, result: result || null });
  } catch (e) { /* best-effort */ }
}

// Look up a booking by its access_token (service_role). Returns the row or null.
async function loadBookingByToken(db, token) {
  if (!token) return null;
  var rows = await db.serviceSelect(
    "bookings",
    "access_token=eq." + encodeURIComponent(token) + "&select=*"
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// The booking's first session (location / appointment type / acuity id / start).
async function loadFirstSession(db, bookingId) {
  var rows = await db.serviceSelect(
    "booking_sessions",
    "booking_id=eq." + encodeURIComponent(bookingId) +
      "&order=day_index.asc&select=id,acuity_appointment_id,location,appointment_type_id,starts_at"
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// preview (no charge) — what the landing page shows for a token.
//   returns { ok, status, booking?:{ sessionLabel, startsAt, location }, error? }
// ---------------------------------------------------------------------------
async function previewBooking(opts) {
  opts = opts || {};
  var db = opts.db || sbDB;
  var booking = await loadBookingByToken(db, opts.token);
  if (!booking) return { ok: false, status: 404, error: "invalid-token" };
  var session = await loadFirstSession(db, booking.id);
  var label = session && SESSION_PRICES[String(session.appointment_type_id)]
    ? SESSION_PRICES[String(session.appointment_type_id)].label
    : "Your session";
  return {
    ok: true,
    status: 200,
    booking: {
      sessionLabel: label,
      startsAt: session ? session.starts_at : null,
      location: session ? session.location : null,
      paymentMode: booking.payment_mode || "full",
      balanceDueCents: booking.balance_due_cents || 0
    }
  };
}

// ---------------------------------------------------------------------------
// applyAddon — the orchestrator. opts:
//   { token, addonId, db, env, now,
//     deps: { chargeCardOnFile, acuityGet, acuityPut } }
// All deps default to the live modules; tests inject fakes.
// Returns a result object with a `status` (HTTP) plus an outcome shape:
//   invalid-token / unknown-addon / no-card-on-file
//   { ok:true, dryRun:true, would:"charge", amountCents, label }     (DARK default)
//   { ok:false, status:403, blocked:"prod-charge-blocked-in-dark-phase" }
//   { ok:true, alreadyApplied:true }                                 (idempotent)
//   { ok:true, charged:true, amountCents, paymentId }
// ---------------------------------------------------------------------------
async function applyAddon(opts) {
  opts = opts || {};
  var db = opts.db || sbDB;
  var e = opts.env || process.env;
  var now = typeof opts.now === "number" ? opts.now : Date.now();
  var deps = opts.deps || {};
  var chargeCardOnFile = deps.chargeCardOnFile;
  var acuityGet = deps.acuityGet || acuity.acuityGet;
  var acuityPut = deps.acuityPut || acuity.acuityPut;

  // 1. token -> booking (the whole identity; nothing else from the link trusted).
  var booking = await loadBookingByToken(db, opts.token);
  if (!booking) return { ok: false, status: 404, error: "invalid-token" };

  // 2. resolve + price the add-on authoritatively.
  var addon = resolveAddon(opts.addonId);
  if (!addon.ok) return { ok: false, status: 400, error: addon.error };

  var key = addonChargeKey(booking.id, addon.addonId);
  var arming = decideArming(e);

  // 3. DARK default: not armed -> dry-run, no side effects.
  if (!arming.armed) {
    return {
      ok: true,
      dryRun: true,
      would: "charge",
      amountCents: addon.cents,
      label: addon.label,
      addonId: addon.addonId,
      idempotencyKey: key,
      bookingId: booking.id
    };
  }

  // 4. armed + prod, but prod not explicitly allowed in this dark phase -> refuse.
  if (arming.prodBlocked) {
    return {
      ok: false,
      status: 403,
      blocked: "prod-charge-blocked-in-dark-phase",
      amountCents: addon.cents,
      label: addon.label
    };
  }

  // 5. must have a saved card to charge.
  if (!booking.square_customer_id || !booking.square_card_id) {
    return { ok: false, status: 409, error: "no-card-on-file" };
  }
  if (typeof chargeCardOnFile !== "function") {
    chargeCardOnFile = require("./square").chargeCardOnFile;
  }

  // 6. claim the ledger before charging.
  var claim = await claimAddonCharge(db, { key: key, bookingId: booking.id });
  if (!claim.claimed) {
    if (claim.reason === "already-succeeded") {
      return { ok: true, alreadyApplied: true, amountCents: addon.cents, label: addon.label };
    }
    return { ok: false, status: 409, error: "in-progress", reason: claim.reason };
  }

  // 7. charge the saved card (merchant-initiated, customer-absent).
  var payment;
  try {
    payment = await chargeCardOnFile({
      customerId: booking.square_customer_id,
      cardId: booking.square_card_id,
      amountCents: addon.cents,
      note: "WWS add-on: " + addon.label + " (booking " + booking.id + ")"
    });
  } catch (err) {
    await setLedger(db, key, "failed", { error: (err && err.message) || String(err) });
    // best-effort failure event
    try {
      await db.serviceInsert("payment_events", {
        booking_id: booking.id, kind: "addon", amount_cents: addon.cents,
        square_payment_id: null, status: "failed",
        detail: { addon_id: addon.addonId, error: (err && err.message) || String(err) }
      });
    } catch (e2) { /* best-effort */ }
    return { ok: false, status: 502, error: "charge-failed", detail: (err && err.message) || String(err) };
  }

  await setLedger(db, key, "succeeded", { payment_id: payment && payment.id });

  // 8. stamp the add-on onto the Acuity appointment notes (best-effort — the money
  // already moved; a notes hiccup must not 500 the customer or double-charge).
  var session = await loadFirstSession(db, booking.id).catch(function () { return null; });
  var acuityNoted = false;
  if (session && session.acuity_appointment_id) {
    try {
      var calId = calendarIdFor(session.appointment_type_id);
      var appt = await acuityGet("/appointments/" + encodeURIComponent(session.acuity_appointment_id));
      var prevNotes = (appt && appt.notes) || "";
      var line = buildAddonNoteLine(addon.label, addon.cents, new Date(now).toISOString());
      var body = { notes: (prevNotes ? prevNotes + "\n" : "") + line };
      if (calId) body.calendarID = calId; // multi-calendar gotcha
      await acuityPut(
        "/appointments/" + encodeURIComponent(session.acuity_appointment_id) + "?admin=true",
        body
      );
      acuityNoted = true;
    } catch (e3) {
      console.error("addon-apply: acuity notes update failed", booking.id, e3 && e3.message);
    }
  }

  // 9. record the money movement + the saved add-on row (best-effort bookkeeping).
  try {
    await db.serviceInsert("payment_events", {
      booking_id: booking.id, kind: "addon", amount_cents: addon.cents,
      square_payment_id: (payment && payment.id) || null, status: "succeeded",
      detail: { addon_id: addon.addonId, source: "email_link", acuity_noted: acuityNoted }
    });
  } catch (e4) { /* best-effort */ }
  if (session && session.id) {
    try {
      await db.serviceInsert("booking_session_addons", {
        booking_session_id: session.id, addon_id: addon.addonId,
        quantity: 1, unit_cents: addon.cents,
        meta: { source: "email_link", square_payment_id: (payment && payment.id) || null }
      });
    } catch (e5) { /* best-effort */ }
  }

  return {
    ok: true,
    charged: true,
    amountCents: addon.cents,
    label: addon.label,
    addonId: addon.addonId,
    paymentId: (payment && payment.id) || null,
    acuityNoted: acuityNoted
  };
}

module.exports = {
  // pure
  addonChargeKey: addonChargeKey,
  resolveAddon: resolveAddon,
  buildAddonNoteLine: buildAddonNoteLine,
  decideArming: decideArming,
  calendarIdFor: calendarIdFor,
  // IO
  loadBookingByToken: loadBookingByToken,
  loadFirstSession: loadFirstSession,
  previewBooking: previewBooking,
  applyAddon: applyAddon
};
