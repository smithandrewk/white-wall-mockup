// scripts/site-nav.js — single source of truth for the White Wall top-right
// hamburger menu. Included on EVERY page so the nav can never drift per-page
// again.
//
// Why this exists (Drew, 2026-07-19): "verify that the hamburger appears in the
// top right of every single page no matter what, for every page. Rn it doesn't
// pop up on a lot of the pages." Root cause was per-page nav markup drift — some
// pages had desktop links but no hamburger (invisible menu on mobile), some had a
// `md:hidden` hamburger but no desktop links (invisible menu on desktop), and two
// pages had no nav at all. This script replaces all of that with ONE always-
// visible hamburger + dropdown, rendered identically on every page and every
// breakpoint (desktop AND mobile).
//
// It also (a) hides any legacy per-page nav link rows / toggles so we never show
// two menus, and (b) preserves a page's sign-out control by folding it into the
// menu. Dependency-light + fail-silent.
//
// Update (Drew, 2026-07-20): (1) the hamburger icon is WHITE (was blue #4A90D9) —
// it lives in a dark blurred chip on every page, so white stays legible on any
// header. (2) On DESKTOP only, clicking the hamburger reveals the links as a
// Robinhood-style full-width HORIZONTAL tab strip just below the header (logo
// stays top-left, the icon becomes an X top-right) instead of the narrow vertical
// dropdown. MOBILE keeps the vertical dropdown exactly as it was.

(function () {
  "use strict";

  // Canonical menu — Powdersville ("Flagship") first everywhere (standing
  // decision). Keep in lockstep with the label swap in nav-account.js.
  var LINKS = [
    { href: "/", label: "Home" },
    { href: "/powdersville", label: "Flagship Location" },
    { href: "/taylors-mill", label: "Taylor's Mill Location" },
    { href: "/gallery", label: "Gallery" },
    { href: "/add-ons", label: "Add-Ons" },
    { href: "/floor-plans", label: "Floor Plans" },
    { href: "/sunlight-simulator", label: "Sunlight Simulator" },
    { href: "/faq", label: "FAQ" },
    { href: "/powdersville#events", label: "Events" },
    { href: "/#contact", label: "Contact" },
    { href: "/account", label: "Login/Create Account", account: true }
  ];

  var CSS = [
    "#site-nav-toggle{position:fixed;top:12px;right:14px;z-index:1000;width:44px;height:44px;",
    "display:flex;align-items:center;justify-content:center;padding:0;margin:0;border:none;cursor:pointer;",
    "border-radius:10px;background:rgba(10,10,10,0.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);",
    "box-shadow:0 1px 6px rgba(0,0,0,0.25);transition:background .2s ease;}",
    "#site-nav-toggle:hover{background:rgba(10,10,10,0.8);}",
    "#site-nav-toggle svg{width:24px;height:24px;display:block;stroke:#fff;}",
    "#site-nav-menu{position:fixed;top:64px;right:14px;z-index:1000;min-width:230px;max-width:calc(100vw - 28px);",
    "background:rgba(12,12,12,0.97);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);",
    "border:1px solid rgba(255,255,255,0.08);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.45);",
    "padding:8px 0;display:none;}",
    "#site-nav-menu.open{display:block;}",
    "#site-nav-menu a,#site-nav-menu button{display:block;width:100%;text-align:left;box-sizing:border-box;",
    "padding:11px 22px;color:rgba(255,255,255,0.82);font-size:12px;letter-spacing:0.18em;text-transform:uppercase;",
    "font-family:inherit;text-decoration:none;background:none;border:none;cursor:pointer;transition:color .15s ease,background .15s ease;}",
    "#site-nav-menu a:hover,#site-nav-menu button:hover{color:#fff;background:rgba(255,255,255,0.06);}",
    // Desktop (Robinhood-style): the open menu becomes a full-width HORIZONTAL tab
    // strip pinned just below the header, links laid left-to-right across the top.
    // The toggle (now an X) floats top-right over it; the page logo stays top-left.
    "@media (min-width:768px){",
    "#site-nav-menu.open{left:0;right:0;width:100%;max-width:none;border-radius:0;",
    "border-left:0;border-right:0;border-top:0;box-shadow:0 10px 30px rgba(0,0,0,0.35);",
    "display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;padding:12px 74px 12px 22px;}",
    "#site-nav-menu.open a,#site-nav-menu.open button{display:inline-block;width:auto;",
    "text-align:center;padding:9px 14px;letter-spacing:0.1em;}",
    "}",
    "@media print{#site-nav-toggle,#site-nav-menu{display:none !important;}}"
  ].join("");

  var HAMBURGER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/></svg>';

  // Shown in place of the hamburger while the desktop horizontal strip is open
  // (mirrors Robinhood). Desktop-only so the mobile dropdown stays pixel-identical.
  var CLOSE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 6l12 12M18 6L6 18"/></svg>';

  function isDesktop() {
    try { return !!(window.matchMedia && window.matchMedia("(min-width:768px)").matches); }
    catch (_) { return false; }
  }

  function hideLegacyNav() {
    // Keep each page's logo; hide every other bit of its first <nav> (desktop
    // link rows, old md:hidden hamburger, taglines) so we never render two menus.
    var nav = document.querySelector("nav");
    if (!nav) return false; // pages with no nav at all (theresavideoforthat, sunlight-simulator wrapper)
    var hadSignout = !!nav.querySelector("[data-signout]");
    var bar = nav.querySelector(":scope > div") || nav;
    var kids = bar.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.querySelector && el.querySelector("img")) continue; // keep the logo link
      el.style.display = "none";
    }
    // A legacy dropdown often lives as a direct child of <nav>, not of the bar.
    var legacy = nav.querySelector("#mobile-menu");
    if (legacy) legacy.style.display = "none";
    return hadSignout;
  }

  function applyAccountLabel(menu) {
    // Mirror nav-account.js so the injected link reads correctly even if
    // nav-account already ran before this element existed. Fail-silent.
    try {
      if (window.WWSAccount && window.WWSAccount.getSession) {
        window.WWSAccount.getSession()
          .then(function (session) {
            var link = menu.querySelector("[data-account-link]");
            if (link) link.textContent = session ? "My Account" : "Login/Create Account";
          })
          .catch(function () {});
      }
    } catch (_) {}
  }

  function build() {
    if (document.getElementById("site-nav-toggle")) return; // idempotent

    var hadSignout = false;
    try { hadSignout = hideLegacyNav(); } catch (_) {}

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "site-nav-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "site-nav-menu");
    btn.innerHTML = HAMBURGER_SVG;

    var menu = document.createElement("div");
    menu.id = "site-nav-menu";
    menu.setAttribute("role", "navigation");
    menu.setAttribute("aria-label", "Site menu");
    var html = "";
    for (var i = 0; i < LINKS.length; i++) {
      var l = LINKS[i];
      html += '<a href="' + l.href + '"' + (l.account ? " data-account-link" : "") + ">" + l.label + "</a>";
    }
    if (hadSignout) html += '<button type="button" data-site-signout>Sign out</button>';
    menu.innerHTML = html;

    document.body.appendChild(btn);
    document.body.appendChild(menu);

    function setIcon(open) {
      // X only on desktop (where the horizontal strip opens); mobile keeps ☰.
      btn.innerHTML = open && isDesktop() ? CLOSE_SVG : HAMBURGER_SVG;
    }
    function closeMenu() {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      setIcon(false);
    }
    function toggleMenu(e) {
      if (e) e.stopPropagation();
      var open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      setIcon(open);
    }
    btn.addEventListener("click", toggleMenu);
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") closeMenu();
    });

    var signout = menu.querySelector("[data-site-signout]");
    if (signout) {
      signout.addEventListener("click", function () {
        try {
          if (window.WWSAccount && window.WWSAccount.signOut) {
            window.WWSAccount.signOut();
            return;
          }
        } catch (_) {}
        var legacyBtn = document.querySelector("[data-signout]");
        if (legacyBtn) legacyBtn.click();
      });
    }

    applyAccountLabel(menu);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
