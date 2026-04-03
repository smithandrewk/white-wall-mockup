// Server-side PostHog client for reliable event tracking.
// Fires events that don't depend on client-side cookie consent.
//
// IMPORTANT: Call flush() before the serverless function returns,
// since Vercel freezes functions after response — unflushed events are lost.

var PostHog;
var client;

function getClient() {
  if (client) return client;
  if (!PostHog) PostHog = require("posthog-node").PostHog;
  var apiKey = process.env.POSTHOG_API_KEY || "phc_QxOulRmelGJKszTf1CZd1DObWvqGIWdAPsMPDeL7IVm";
  client = new PostHog(apiKey, { host: "https://us.i.posthog.com" });
  return client;
}

function captureServerEvent(distinctId, event, properties) {
  try {
    var ph = getClient();
    ph.capture({ distinctId: distinctId, event: event, properties: properties });
  } catch (err) {
    console.error("posthog server capture error:", err.message);
  }
}

async function flushPostHog() {
  try {
    if (client) await client.flush();
  } catch (err) {
    console.error("posthog flush error:", err.message);
  }
}

module.exports = { captureServerEvent, flushPostHog };
