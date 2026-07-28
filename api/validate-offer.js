// POST /api/validate-offer — early server verdict on a locked offer link
// (DREW-21). The booking page renders an offer optimistically from the
// client-decoded payload, then calls this to catch a tampered, revoked, or
// superseded link BEFORE the customer fills anything in. Advisory only:
// create-checkout re-verifies the token at pay time, so skipping or spoofing
// this endpoint cannot charge anything.
//
// Body: { token: "<base64url payload>.<hex sig>" }
// 200 { ok: true } | 200 { ok: false, reason, message } — always 200 so the
// client can distinguish a real verdict from a network hiccup (non-200/throw),
// which it treats as "leave the optimistic render, the server gates at pay".

const { verifyOfferToken, offerErrorMessage } = require("./_lib/offers");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const out = await verifyOfferToken(req.body && req.body.token);
    if (!out.ok) {
      return res.status(200).json({ ok: false, reason: out.reason, message: offerErrorMessage(out.reason) });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("validate-offer error:", err);
    // Unexpected failure — report unavailable (the client keeps its optimistic
    // render; pay-time verification still gates).
    return res.status(200).json({ ok: false, reason: "unavailable", message: offerErrorMessage("unavailable") });
  }
};
