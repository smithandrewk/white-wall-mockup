// Offer-token verification (DREW-21). Signs payloads exactly the way the
// dashboard does (signState's JSON → base64url + hex HMAC keyed by
// BOOKING_SECRET) and drives verifyOfferToken through every verdict:
// round-trip OK, tampered payload, truncated token, revoked (no active entry),
// superseded (hash mismatch), and unavailable (malformed OFFERS source).
// EDGE_CONFIG is unset under node --test, so the OFFERS env fallback is the
// active-entry source — the same seam the staging dry-run uses.
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

process.env.BOOKING_SECRET = process.env.BOOKING_SECRET || "test-secret-for-offer-tests";
delete process.env.EDGE_CONFIG;

const { verifyOfferToken, payloadHash, offerItemKey } = require("./offers");

function signedToken(payload) {
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", process.env.BOOKING_SECRET).update(json).digest("hex");
  const encoded = Buffer.from(json).toString("base64url");
  return { token: encoded + "." + sig, encoded };
}

const PAYLOAD = {
  v: 1,
  id: "11111111-2222-3333-4444-555555555555",
  name: "October brand shoot",
  locationSlug: "powdersville",
  bookingType: "event",
  eventMode: "multi",
  participants: 20,
  override: { mode: "dollar", value: 100, note: "Friends rate" },
  ownershipAddon: null,
  applyOrder: "addon-first",
  sessions: [{ durationId: "pv-full", selectedDate: "2026-10-03", selectedTime: "2026-10-03T05:00:00-0400", addons: {}, appointmentTypeID: "89114581" }],
  flowState: { step: 3 },
  finalTotalCents: 88000,
  issuedAt: "2026-07-28T00:00:00.000Z",
};

function activate(encoded) {
  process.env.OFFERS = JSON.stringify({ [PAYLOAD.id]: { h: payloadHash(encoded), t: PAYLOAD.finalTotalCents } });
}

test("round-trip: signed + activated token verifies", async () => {
  const { token, encoded } = signedToken(PAYLOAD);
  activate(encoded);
  const out = await verifyOfferToken(token);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.payload.finalTotalCents, 88000);
  assert.strictEqual(out.payload.sessions[0].appointmentTypeID, "89114581");
});

test("tampered payload (price edited) → invalid", async () => {
  const { token, encoded } = signedToken(PAYLOAD);
  activate(encoded);
  const forged = { ...PAYLOAD, finalTotalCents: 100 };
  const forgedEncoded = Buffer.from(JSON.stringify(forged)).toString("base64url");
  const out = await verifyOfferToken(forgedEncoded + "." + token.split(".")[1]);
  assert.deepStrictEqual(out, { ok: false, reason: "invalid" });
});

test("truncated / malformed tokens → invalid", async () => {
  assert.deepStrictEqual(await verifyOfferToken(""), { ok: false, reason: "invalid" });
  assert.deepStrictEqual(await verifyOfferToken("nodothere"), { ok: false, reason: "invalid" });
  const { token } = signedToken(PAYLOAD);
  assert.deepStrictEqual(await verifyOfferToken(token.slice(0, token.length - 10)), { ok: false, reason: "invalid" });
});

test("no active entry → revoked", async () => {
  const { token } = signedToken(PAYLOAD);
  process.env.OFFERS = JSON.stringify({});
  assert.deepStrictEqual(await verifyOfferToken(token), { ok: false, reason: "revoked" });
});

test("superseded link (entry hash is for a NEWER payload) → revoked", async () => {
  const oldSigned = signedToken(PAYLOAD);
  const newSigned = signedToken({ ...PAYLOAD, finalTotalCents: 90000 });
  activate(newSigned.encoded); // the draft was re-signed; only the new link is live
  assert.deepStrictEqual(await verifyOfferToken(oldSigned.token), { ok: false, reason: "revoked" });
  process.env.OFFERS = JSON.stringify({ [PAYLOAD.id]: { h: payloadHash(newSigned.encoded), t: 90000 } });
  const out = await verifyOfferToken(newSigned.token);
  assert.strictEqual(out.ok, true);
});

test("malformed OFFERS source → unavailable (fail closed)", async () => {
  const { token } = signedToken(PAYLOAD);
  process.env.OFFERS = "not-json";
  assert.deepStrictEqual(await verifyOfferToken(token), { ok: false, reason: "unavailable" });
  delete process.env.OFFERS;
});

test("valid signature but wrong shape (no sessions) → invalid", async () => {
  const bad = { ...PAYLOAD, sessions: [] };
  const { token, encoded } = signedToken(bad);
  activate(encoded);
  assert.deepStrictEqual(await verifyOfferToken(token), { ok: false, reason: "invalid" });
});

test("offerItemKey strips non-url-safe chars", () => {
  assert.strictEqual(offerItemKey("abc-123"), "offer_abc-123");
  assert.strictEqual(offerItemKey("a/b?c"), "offer_abc");
});
