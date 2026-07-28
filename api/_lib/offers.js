// api/_lib/offers.js — locked offer links (DREW-21, Session Builder Phase 2).
//
// An offer link is /book-<loc>?offer=<base64url payload>.<hex sig>, minted by
// the wws-dashboard from a saved Session Builder draft. Trust model:
//
//   1. SIGNATURE — the payload is HMAC-SHA256-signed with BOOKING_SECRET (the
//      same signState/verifyAndDecodeState pair in _lib/acuity.js; the
//      dashboard signs with the identical secret from its own env). A tampered
//      or hand-built token fails here.
//   2. ACTIVE ENTRY — Vercel Edge Config item `offer_<draftId>` holds
//      { h: <first 16 hex of sha256(encoded payload)>, t: finalTotalCents }
//      for each currently-live link (one item per draft — no shared-map
//      read-modify-write). The dashboard upserts the item when Drew generates
//      a link and deletes it when he deletes (or re-saves) the draft.
//      Presence + hash match means THIS exact payload is the current offer for
//      that draft — deleting the draft kills the link, and regenerating
//      replaces the hash so older copies die. This is what makes Drew's
//      "delete the saved session and make a new one" actually revoke.
//   3. PRICE — create-checkout additionally recomputes the whole cart from the
//      payload and asserts it equals payload.finalTotalCents, so even a valid
//      signed link cannot charge a number today's pricing doesn't produce.
//
// Reasons returned: "invalid" (bad token/signature/shape), "revoked" (no
// active entry, or an older superseded link), "unavailable" (the entry could
// not be read — fail CLOSED: a link Drew revoked must never sneak through
// during an outage).
//
// The OFFERS env var is a fallback entry source for environments without the
// Edge Config binding (staging dry-runs, local tests): a JSON map
// { "<draftId>": { "h": "...", "t": 12345 } }. Production uses Edge Config.

const crypto = require("crypto");
const { get } = require("@vercel/edge-config");
const { verifyAndDecodeState } = require("./acuity");

// Edge Config item keys allow [A-Za-z0-9_-]; draft ids are uuids, so this is
// a straight concatenation kept in ONE place (the dashboard mirrors it).
function offerItemKey(draftId) {
  return "offer_" + String(draftId).replace(/[^A-Za-z0-9_-]/g, "");
}

// The active entry for a draft id: { h, t } when live, undefined when revoked/
// never activated, null when the source could not be read (unavailable).
async function getOfferEntry(draftId) {
  if (process.env.EDGE_CONFIG) {
    try {
      var entry = await get(offerItemKey(draftId));
      if (entry && typeof entry === "object") return entry;
      if (entry != null) {
        console.error("offers: Edge Config entry for " + draftId + " is malformed");
        return null;
      }
      // Missing item — fall through to the env fallback so a staging OFFERS
      // seed still works on an env that also has Edge Config bound.
    } catch (err) {
      console.error("offers: Edge Config read failed (" + (err && err.message) + ")");
      return null;
    }
  }
  if (process.env.OFFERS) {
    try {
      var parsed = JSON.parse(process.env.OFFERS);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed[String(draftId)];
      }
      console.error("offers: OFFERS env is not an object");
      return null;
    } catch (e) {
      console.error("offers: OFFERS env parse failed");
      return null;
    }
  }
  // No source configured: no link has ever been activated.
  return undefined;
}

function payloadHash(encoded) {
  return crypto.createHash("sha256").update(String(encoded)).digest("hex").slice(0, 16);
}

// Verify a full "<encoded>.<sig>" token. Returns { ok: true, payload } or
// { ok: false, reason: "invalid" | "revoked" | "unavailable" }. Never throws.
async function verifyOfferToken(token) {
  var t = String(token || "").trim();
  var dot = t.lastIndexOf(".");
  if (dot <= 0 || dot === t.length - 1) return { ok: false, reason: "invalid" };
  var encoded = t.slice(0, dot);
  var sig = t.slice(dot + 1);

  var payload;
  try {
    payload = verifyAndDecodeState(encoded, sig);
  } catch (e) {
    return { ok: false, reason: "invalid" };
  }
  if (!payload || payload.v !== 1 || !payload.id ||
      !Array.isArray(payload.sessions) || !payload.sessions.length ||
      typeof payload.finalTotalCents !== "number" ||
      !["powdersville", "taylors-mill"].includes(payload.locationSlug)) {
    return { ok: false, reason: "invalid" };
  }

  var entry = await getOfferEntry(payload.id);
  if (entry === null) return { ok: false, reason: "unavailable" };
  if (!entry || entry.h !== payloadHash(encoded)) {
    return { ok: false, reason: "revoked" };
  }
  return { ok: true, payload: payload };
}

// Customer-facing message per failure reason (shared by validate-offer and
// create-checkout so the two surfaces never disagree).
function offerErrorMessage(reason) {
  if (reason === "revoked") {
    return "This session link is no longer active. Contact White Wall for a fresh link.";
  }
  if (reason === "unavailable") {
    return "We can't verify this session link right now. Please try again in a few minutes.";
  }
  if (reason === "changed") {
    return "This offer's pricing has changed since the link was created. Contact White Wall for an updated link.";
  }
  return "This session link isn't valid. Ask White Wall to resend it.";
}

module.exports = {
  offerItemKey,
  getOfferEntry,
  payloadHash,
  verifyOfferToken,
  offerErrorMessage
};
