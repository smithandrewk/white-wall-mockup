// Staging banner + noindex injector.
//
// Runs on every page. When the current hostname starts with "staging.",
// it (a) adds a robots noindex/nofollow meta tag so search engines stay
// out, and (b) injects a fixed yellow bar at the top of the viewport so
// visitors can never confuse staging with the live site.
//
// No-op on every other hostname (whitewallstudios.co, vercel.app preview
// URLs, localhost), so it's safe to include on every page unconditionally.

(function () {
  if (!/^staging\./.test(location.hostname)) return;

  document.documentElement.dataset.staging = "1";

  var meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = "noindex,nofollow";
  (document.head || document.documentElement).appendChild(meta);

  function mountBanner() {
    if (document.getElementById("wws-staging-banner")) return;
    var bar = document.createElement("div");
    bar.id = "wws-staging-banner";
    bar.textContent = "STAGING — NOT THE LIVE SITE";
    bar.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "right:0",
      "background:#f59e0b",
      "color:#000",
      "padding:6px 12px",
      "text-align:center",
      "font:600 13px/1.2 system-ui,-apple-system,sans-serif",
      "z-index:2147483647",
      "letter-spacing:0.05em",
      "box-shadow:0 1px 3px rgba(0,0,0,0.2)",
      "pointer-events:none"
    ].join(";");
    document.body.appendChild(bar);
    var pad = document.createElement("style");
    pad.textContent = "html[data-staging='1'] body{padding-top:32px!important}";
    document.head.appendChild(pad);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountBanner);
  } else {
    mountBanner();
  }
})();
