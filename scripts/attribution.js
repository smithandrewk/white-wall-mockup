/*
 * scripts/attribution.js — Google Ads click-id capture (WWA-3, step 1)
 *
 * THE PRIORITY PIECE. A paid click that lands before this exists can never be
 * attributed later, so this runs on EVERY page (loaded alongside the universal
 * site-nav.js) and persists the click identifiers as early as page load.
 *
 * What it captures from the landing URL:
 *   - gclid            (Google Ads click id — web)
 *   - wbraid / gbraid  (iOS / in-app / privacy-safe click ids)
 *   - utm_source/medium/campaign/term/content (campaign context, analytics only)
 *
 * Where it persists (belt AND suspenders, so one cleared store still attributes):
 *   - first-party cookie  `ww_attr`  (90-day Max-Age, SameSite=Lax)
 *   - localStorage        `ww_attr`
 *
 * Model: LAST-click-wins WITHIN the 90-day window — matches how Google itself
 * attributes an offline-imported conversion to the most recent click. A fresh
 * ad click (new gclid/wbraid/gbraid in the URL) overwrites the stored record
 * with a fresh timestamp; a normal page view with no click id keeps whatever is
 * stored until it ages out past 90 days.
 *
 * Read it later with `window.WWAttribution.get()` → the stored record or null
 * (null when nothing is stored or the record has aged past the window).
 * booking-flow.js reads this at pay time and threads it to /api/create-checkout,
 * which uploads the confirmed booking back to Google Ads server-side.
 *
 * Fleet-reusable by design: the same capture → server-side value-import pattern
 * applies to any Entrpy client whose conversion completes off-domain.
 */
(function () {
  "use strict";

  var KEY = "ww_attr";
  var WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
  var CLICK_IDS = ["gclid", "wbraid", "gbraid"];
  var UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function nowMs() {
    return new Date().getTime();
  }

  function readCookie(name) {
    try {
      var parts = ("; " + document.cookie).split("; " + name + "=");
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    } catch (e) {}
    return null;
  }

  function writeCookie(name, value) {
    try {
      var secure = location.protocol === "https:" ? "; Secure" : "";
      var maxAge = Math.floor(WINDOW_MS / 1000);
      document.cookie = name + "=" + encodeURIComponent(value) +
        "; Max-Age=" + maxAge + "; Path=/; SameSite=Lax" + secure;
    } catch (e) {}
  }

  function parseStored() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) {}
    if (!raw) raw = readCookie(KEY);
    if (!raw) return null;
    try {
      var rec = JSON.parse(raw);
      if (!rec || typeof rec !== "object" || typeof rec.ts !== "number") return null;
      if (nowMs() - rec.ts > WINDOW_MS) return null; // aged out of the window
      return rec;
    } catch (e) {
      return null;
    }
  }

  function persist(rec) {
    var json = JSON.stringify(rec);
    try { window.localStorage.setItem(KEY, json); } catch (e) {}
    writeCookie(KEY, json);
  }

  function paramsFromUrl() {
    var out = {};
    try {
      var sp = new URLSearchParams(location.search || "");
      CLICK_IDS.concat(UTMS).forEach(function (k) {
        var v = sp.get(k);
        if (v && v.length <= 512) out[k] = v;
      });
    } catch (e) {}
    return out;
  }

  // Capture on load. Runs once per page view.
  function capture() {
    var found = paramsFromUrl();
    var hasClickId = CLICK_IDS.some(function (k) { return found[k]; });
    var hasUtm = UTMS.some(function (k) { return found[k]; });
    var stored = parseStored();

    if (hasClickId) {
      // Fresh ad click → overwrite (last-click within window) with a new stamp.
      var rec = { ts: nowMs(), landing: (location.href || "").slice(0, 1024) };
      CLICK_IDS.concat(UTMS).forEach(function (k) {
        if (found[k]) rec[k] = found[k];
      });
      persist(rec);
      return rec;
    }

    if (!stored && hasUtm) {
      // No click id but campaign context present and nothing stored yet — keep
      // the utm touch for analytics (it can't be uploaded to Ads without a
      // click id, but it costs nothing to retain).
      var utmRec = { ts: nowMs(), landing: (location.href || "").slice(0, 1024) };
      UTMS.forEach(function (k) { if (found[k]) utmRec[k] = found[k]; });
      persist(utmRec);
      return utmRec;
    }

    // Nothing new — refresh the storage copy so a cookie-only or ls-only record
    // gets mirrored into both stores, but DO NOT bump the timestamp (that would
    // extend the window forever).
    if (stored) persist(stored);
    return stored;
  }

  function get() {
    return parseStored();
  }

  var api = { get: get, capture: capture, KEY: KEY, WINDOW_MS: WINDOW_MS };
  try { window.WWAttribution = api; } catch (e) {}

  // Fire immediately (script executes at parse time). URL params are stable
  // regardless of DOM readiness, so there is no reason to wait.
  try { capture(); } catch (e) {}
})();
