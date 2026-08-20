#!/usr/bin/env node
/*
 * ops/google-ads/create-booking-conversion-action.js  (WWA-3, step 3)
 *
 * One-time (idempotent) provisioning of White Wall's reward signal on the Google
 * Ads account. NOT deployed (ops/ is in .vercelignore) — run manually from the
 * mini:
 *
 *   set -a; source ~/.config/entrpy/google-ads.env; set +a
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID=5061656241 \
 *     node ops/google-ads/create-booking-conversion-action.js
 *
 *   add --dry-run to print the plan without mutating.
 *
 * What it does:
 *   1. Creates the "Booking (value)" conversion action if it doesn't exist:
 *        type            = UPLOAD_CLICKS   (server-side offline click import)
 *        category        = PURCHASE
 *        counting_type   = ONE_PER_CLICK   (a booking counts once per click)
 *        value_settings  = always_use_default_value=false  (transaction-specific
 *                          value — we upload the real margin, not a flat 1)
 *        status          = ENABLED, primary_for_goal = true
 *   2. Demotes the legacy "Page view" (codeless) and flat "Purchase" actions to
 *      SECONDARY (primary_for_goal=false) so they never steer Smart Bidding.
 *
 * Prints the new conversion action id — set it as
 * GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID in Vercel to arm the upload.
 *
 * Idempotent: re-running finds the existing action by name and only fixes any
 * primary/secondary drift.
 */

const API = "https://googleads.googleapis.com/v22";
const DRY = process.argv.includes("--dry-run");

function cid() {
  return (process.env.GOOGLE_ADS_CUSTOMER_ID || "5061656241").replace(/-/g, "");
}
function loginCid() {
  return (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || cid()).replace(/-/g, "");
}

function requireEnv() {
  const missing = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Missing env: " + missing.join(", ") +
      "\nRun:  set -a; source ~/.config/entrpy/google-ads.env; set +a");
    process.exit(1);
  }
}

async function getToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });
  if (!res.ok) throw new Error("token grant failed: " + res.status + " " + await res.text());
  return (await res.json()).access_token;
}

function headers(token) {
  return {
    "Authorization": "Bearer " + token,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    "login-customer-id": loginCid(),
    "Content-Type": "application/json"
  };
}

async function listActions(token) {
  const res = await fetch(API + "/customers/" + cid() + "/googleAds:searchStream", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      query: "SELECT conversion_action.id, conversion_action.name, conversion_action.type, " +
        "conversion_action.category, conversion_action.status, conversion_action.counting_type, " +
        "conversion_action.primary_for_goal, conversion_action.value_settings.always_use_default_value " +
        "FROM conversion_action"
    })
  });
  if (!res.ok) throw new Error("searchStream failed: " + res.status + " " + await res.text());
  const data = await res.json();
  const rows = [];
  (Array.isArray(data) ? data : [data]).forEach((chunk) => {
    (chunk.results || []).forEach((r) => rows.push(r.conversionAction));
  });
  return rows;
}

async function mutate(token, operations) {
  if (DRY) { console.log("[dry-run] would mutate:", JSON.stringify(operations, null, 2)); return null; }
  const res = await fetch(API + "/customers/" + cid() + "/conversionActions:mutate", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ operations, partialFailure: false })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("mutate failed: " + res.status + " " + JSON.stringify(data));
  return data;
}

(async function main() {
  requireEnv();
  const token = await getToken();
  const before = await listActions(token);
  console.log("Existing conversion actions on customer " + cid() + ":");
  before.forEach((a) => console.log("  - [" + a.id + "] " + a.name + " · " + a.type + " · " +
    a.category + " · " + a.countingType + " · primary=" + !!a.primaryForGoal + " · " + a.status));

  const BOOKING_NAME = "Booking (value)";
  let booking = before.find((a) => a.name === BOOKING_NAME);

  // 1. Create the Booking (value) action if it doesn't exist.
  if (!booking) {
    console.log("\nCreating \"" + BOOKING_NAME + "\" ...");
    const created = await mutate(token, [{
      create: {
        name: BOOKING_NAME,
        type: "UPLOAD_CLICKS",
        category: "PURCHASE",
        status: "ENABLED",
        countingType: "ONE_PER_CLICK",
        primaryForGoal: true,
        valueSettings: { defaultValue: 0, alwaysUseDefaultValue: false }
      }
    }]);
    if (!DRY) {
      const rn = created.results[0].resourceName;
      const id = rn.split("/").pop();
      booking = { id, name: BOOKING_NAME, resourceName: rn, primaryForGoal: true };
      console.log("  created " + rn);
    }
  } else {
    console.log("\n\"" + BOOKING_NAME + "\" already exists [" + booking.id + "] — ensuring it is primary.");
    if (!booking.primaryForGoal) {
      await mutate(token, [{
        update: { resourceName: "customers/" + cid() + "/conversionActions/" + booking.id, primaryForGoal: true },
        updateMask: "primary_for_goal"
      }]);
    }
  }

  // 2. Demote the legacy actions (Page view, Purchase) to secondary.
  const demote = before.filter((a) =>
    (a.name === "Page view" || a.name === "Purchase") && a.primaryForGoal);
  for (const a of demote) {
    console.log("Demoting \"" + a.name + "\" [" + a.id + "] to secondary (primary_for_goal=false) ...");
    try {
      await mutate(token, [{
        update: { resourceName: "customers/" + cid() + "/conversionActions/" + a.id, primaryForGoal: false },
        updateMask: "primary_for_goal"
      }]);
    } catch (e) {
      console.error("  !! could not demote \"" + a.name + "\": " + e.message +
        "\n     (primary/secondary may be governed by conversion GOALS — set it in the UI: " +
        "Goals > Summary > this account > move to Secondary. Flag on WWA-3.)");
    }
  }

  if (booking && booking.id) {
    console.log("\n==> Set in Vercel:  GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID=" + booking.id);
  }
  console.log("Done" + (DRY ? " (dry-run — nothing changed)." : "."));
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
