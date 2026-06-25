// /api/addon-apply — tokenized "add this add-on + charge my card" endpoint
// (V3 item 6). The thin HTTP wrapper over api/_lib/addon-apply.js.
//
//   GET  /api/addon-apply?token=<access_token>
//        -> a no-charge preview the /addon-menu landing page renders
//           (session label, start, location, payment mode). Validates the token;
//           returns nothing chargeable.
//   POST /api/addon-apply   { token, addonId }
//        -> validates the token, prices the add-on from ADDON_PRICES, and (only
//           when ADDON_CHARGE_ARMED === "1", and never against Square production
//           unless ADDON_CHARGE_ALLOW_PROD === "1") charges the saved card and
//           stamps the add-on onto the Acuity appointment notes.
//
// DARK by default: with ADDON_CHARGE_ARMED unset/!= "1" the POST is a dry-run
// that reports what it WOULD charge and moves no money. The client is never
// trusted: the access_token is the only identity, and the price always comes from
// the server-side ADDON_PRICES table.

var sb = require("./_lib/supabase");
var sq = require("./_lib/square");
var acuity = require("./_lib/acuity");
var lib = require("./_lib/addon-apply");

module.exports = async function handler(req, res) {
  if (!sb.isConfigured()) {
    return res.status(503).json({ error: "Add-on menu is not configured yet" });
  }

  // ---- GET: preview (no charge) ----
  if (req.method === "GET") {
    var token = (req.query && (req.query.token || req.query.t)) || "";
    if (!token) return res.status(400).json({ error: "Missing token" });
    try {
      var pv = await lib.previewBooking({ token: token, db: sb });
      if (!pv.ok) return res.status(pv.status || 400).json({ error: pv.error || "Invalid link" });
      return res.status(200).json({ ok: true, booking: pv.booking });
    } catch (err) {
      return res.status(500).json({ error: "Could not load booking", detail: String(err && err.message || err) });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ---- POST: apply + (dark) charge ----
  var body = req.body || {};
  var bToken = (body.token || "").trim();
  var addonId = (body.addonId || body.addon_id || "").trim();
  if (!bToken) return res.status(400).json({ error: "Missing token" });
  if (!addonId) return res.status(400).json({ error: "Missing addonId" });

  try {
    var result = await lib.applyAddon({
      token: bToken,
      addonId: addonId,
      db: sb,
      env: process.env,
      deps: {
        chargeCardOnFile: sq.chargeCardOnFile,
        acuityGet: acuity.acuityGet,
        acuityPut: acuity.acuityPut
      }
    });

    if (!result.ok) {
      return res.status(result.status || 400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("addon-apply error:", err && err.message);
    return res.status(500).json({ error: "Could not apply add-on", detail: String(err && err.message || err) });
  }
};
