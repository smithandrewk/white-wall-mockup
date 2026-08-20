#!/usr/bin/env node
/*
 * ops/google-ads/reauth-datamanager.js  (WWA-3, step 4 prerequisite)
 *
 * Google closed the legacy Google Ads API `ConversionUploadService.
 * UploadClickConversions` to NEW integrations (our probe got
 * CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE) — offline click conversions now go
 * through the **Data Manager API** (datamanager.googleapis.com). That API needs
 * the OAuth scope `https://www.googleapis.com/auth/datamanager`, which our
 * current refresh token (adwords-only) does NOT have.
 *
 * This re-mints a refresh token carrying BOTH scopes (adwords + datamanager) so
 * the same credential drives Ads API reads AND Data Manager conversion ingest.
 *
 * ONE-TIME, needs a human's Google consent (andrew@entrpy.co). Two steps:
 *
 *   set -a; source ~/.config/entrpy/google-ads.env; set +a
 *
 *   # 1) print the consent URL — open it, approve as andrew@entrpy.co
 *   node ops/google-ads/reauth-datamanager.js url
 *
 *   # 2) Google redirects to http://localhost/?code=XXXX (the page won't load —
 *   #    that's fine). Copy the `code` value from the address bar and:
 *   node ops/google-ads/reauth-datamanager.js exchange "PASTE_CODE_HERE"
 *
 * It prints the new GOOGLE_ADS_REFRESH_TOKEN. Update it in
 * ~/.config/entrpy/google-ads.env AND in Vercel (Production), then the offline
 * upload can arm.
 *
 * redirect_uri: defaults to http://localhost (works for a "Desktop app" OAuth
 * client — loopback is always allowed). Override with GOOGLE_OAUTH_REDIRECT_URI
 * if the client is a "Web application" type (must be a URI registered on the
 * client in the Google Cloud console).
 */

const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/datamanager"
];
const REDIRECT = process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost";

function needEnv(k) {
  if (!process.env[k]) { console.error("Missing " + k + " — source ~/.config/entrpy/google-ads.env first."); process.exit(1); }
  return process.env[k];
}

function buildUrl() {
  const p = new URLSearchParams({
    client_id: needEnv("GOOGLE_ADS_CLIENT_ID"),
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",           // force a refresh_token even on re-consent
    include_granted_scopes: "true"
  });
  return "https://accounts.google.com/o/oauth2/v2/auth?" + p.toString();
}

async function exchange(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code,
      client_id: needEnv("GOOGLE_ADS_CLIENT_ID"),
      client_secret: needEnv("GOOGLE_ADS_CLIENT_SECRET"),
      redirect_uri: REDIRECT,
      grant_type: "authorization_code"
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("exchange failed: " + res.status + " " + JSON.stringify(data));
  if (!data.refresh_token) {
    throw new Error("no refresh_token in response (was prompt=consent used? scopes already granted?): " + JSON.stringify(data));
  }
  return data;
}

(async function main() {
  const cmd = process.argv[2];
  if (cmd === "url") {
    console.log("\nOpen this URL, sign in as andrew@entrpy.co, and approve:\n");
    console.log(buildUrl());
    console.log("\nThen copy the `code` param from the localhost redirect and run:");
    console.log('  node ops/google-ads/reauth-datamanager.js exchange "THE_CODE"\n');
  } else if (cmd === "exchange") {
    const code = process.argv[3];
    if (!code) { console.error('Usage: node ops/google-ads/reauth-datamanager.js exchange "CODE"'); process.exit(1); }
    const tok = await exchange(decodeURIComponent(code));
    console.log("\nGranted scopes: " + (tok.scope || "(unknown)"));
    console.log("\n==> New refresh token (put in ~/.config/entrpy/google-ads.env AND Vercel Production):\n");
    console.log("GOOGLE_ADS_REFRESH_TOKEN=" + tok.refresh_token + "\n");
  } else {
    console.error("Usage:\n  node ops/google-ads/reauth-datamanager.js url\n  node ops/google-ads/reauth-datamanager.js exchange \"CODE\"");
    process.exit(1);
  }
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
