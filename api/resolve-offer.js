// GET /api/resolve-offer?id=<draftId> — turn a SHORT offer link into its full
// signed token (DREW-24). The dashboard now mints /book-<loc>?offer=<draftId>
// (a uuid) instead of embedding the ~4KB base64 token in the URL, because the
// long URL was truncated by iMessage/Notes/email link-detection (Drew's "link
// doesn't work in a text"). The full "<encoded>.<sig>" token lives in the Edge
// Config entry (`offer_<draftId>.tok`); the booking page fetches it here, then
// decodes + renders exactly as it did for a long link. Security is unchanged:
// the token is still HMAC-verified by validate-offer/create-checkout, and the
// entry is the same revocation switch (delete/re-save the draft → no token).
//
// 200 { ok: true, token } | 404 { ok:false, reason:"revoked" } (no live link)
// | 503 { ok:false, reason:"unavailable" } (source unreadable — fail CLOSED).

const { resolveOfferToken, offerErrorMessage } = require("./_lib/offers");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  var id = (req.query && (req.query.id || req.query.offer)) || "";
  id = String(id).trim();
  if (!id) {
    return res.status(400).json({ ok: false, reason: "invalid", message: offerErrorMessage("invalid") });
  }
  try {
    const out = await resolveOfferToken(id);
    if (!out.ok) {
      const status = out.reason === "unavailable" ? 503 : 404;
      return res.status(status).json({ ok: false, reason: out.reason, message: offerErrorMessage(out.reason) });
    }
    return res.status(200).json({ ok: true, token: out.token });
  } catch (err) {
    console.error("resolve-offer error:", err);
    return res.status(503).json({ ok: false, reason: "unavailable", message: offerErrorMessage("unavailable") });
  }
};
