// GET /api/qbo-callback
//
// OAuth2 callback from Intuit. Exchanges the authorization code for
// access + refresh tokens. Displays them on screen for manual storage
// in Vercel env vars.
//
// This is a ONE-TIME setup endpoint. After tokens are stored, this
// endpoint is no longer needed (but left in place for re-authorization
// if the refresh token ever expires).

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, realmId, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Missing QBO credentials" });
  }

  const inboundHost = req.headers["x-forwarded-host"] || req.headers.host || "white-wall-mockup.vercel.app";
  const baseUrl = "https://" + inboundHost;
  const redirectUri = baseUrl + "/api/qbo-callback";

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
      },
      body: "grant_type=authorization_code" +
        "&code=" + encodeURIComponent(code) +
        "&redirect_uri=" + encodeURIComponent(redirectUri)
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return res.status(400).json({ error: tokens.error, description: tokens.error_description });
    }

    // Display tokens for manual storage
    // DO NOT log these in production — this is a one-time setup page
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(`
      <html>
      <head><title>QuickBooks Connected</title></head>
      <body style="font-family:monospace;max-width:600px;margin:40px auto;padding:20px">
        <h1>QuickBooks Connected!</h1>
        <p>Realm ID: <strong>${realmId || "not provided"}</strong></p>
        <p>Store these in Vercel env vars, then close this page:</p>
        <hr>
        <p><strong>QBO_ACCESS_TOKEN:</strong></p>
        <textarea rows="3" cols="60" readonly onclick="this.select()">${tokens.access_token}</textarea>
        <p><strong>QBO_REFRESH_TOKEN:</strong></p>
        <textarea rows="3" cols="60" readonly onclick="this.select()">${tokens.refresh_token}</textarea>
        <p><strong>QBO_REALM_ID:</strong></p>
        <textarea rows="1" cols="60" readonly onclick="this.select()">${realmId || ""}</textarea>
        <hr>
        <p>Access token expires in ${tokens.expires_in} seconds (1 hour).</p>
        <p>Refresh token lasts up to 100 days. The booking callback auto-refreshes it.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("qbo-callback error:", err.message);
    return res.status(500).json({ error: "Token exchange failed" });
  }
};
