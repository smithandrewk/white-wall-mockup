// GET /api/qbo-auth
//
// Redirects to Intuit's OAuth2 authorization page.
// Drew visits this URL once to authorize our app to access his QuickBooks.
// After consent, Intuit redirects to /api/qbo-callback with an auth code.

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.QBO_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Missing QBO_CLIENT_ID" });
  }

  const inboundHost = req.headers["x-forwarded-host"] || req.headers.host || "white-wall-mockup.vercel.app";
  const baseUrl = "https://" + inboundHost;
  const redirectUri = baseUrl + "/api/qbo-callback";

  const authUrl = "https://appcenter.intuit.com/connect/oauth2" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&response_type=code" +
    "&scope=com.intuit.quickbooks.accounting" +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&state=wws-qbo-auth";

  return res.redirect(302, authUrl);
};
