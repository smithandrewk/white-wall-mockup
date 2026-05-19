// GET /api/booking-public-config
//
// Returns the PUBLIC Square config the browser needs to initialize the
// Web Payments SDK (card-on-file checkout). None of these values are
// secret — the Application ID and Location ID are designed to ship to
// the client. The access token (the actual secret) never leaves the
// server and is NOT included here.
//
// Env-switched on SQUARE_ENVIRONMENT, mirroring api/_lib/square.js.

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var isProd = process.env.SQUARE_ENVIRONMENT === "production";

  var squareAppId = isProd
    ? process.env.SQUARE_APPLICATION_ID
    : (process.env.SQUARE_SANDBOX_APPLICATION_ID || process.env.SQUARE_APPLICATION_ID);

  var squareLocationId = isProd
    ? (process.env.SQUARE_PROD_LOCATION_ID || process.env.SQUARE_LOCATION_ID)
    : (process.env.SQUARE_SANDBOX_LOCATION_ID || process.env.SQUARE_LOCATION_ID);

  if (!squareAppId || !squareLocationId) {
    // Misconfigured env — fail loud so the client shows a clear error
    // instead of a cryptic SDK init failure.
    return res.status(500).json({
      error: "Square is not configured",
      detail: "Missing " + (!squareAppId ? "application ID" : "location ID") +
        " for " + (isProd ? "production" : "sandbox")
    });
  }

  // Short cache — these values are stable but we want env flips to
  // propagate within a minute without a redeploy.
  res.setHeader("Cache-Control", "public, max-age=60");

  return res.status(200).json({
    squareAppId: squareAppId,
    squareLocationId: squareLocationId,
    squareEnvironment: isProd ? "production" : "sandbox",
    squareSdkUrl: isProd
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js"
  });
};
