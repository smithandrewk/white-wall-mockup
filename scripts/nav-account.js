// scripts/nav-account.js — sets nav account links to "My Account" when a
// customer is signed in, else "Login/Create Account" (V3 round-4 item 4). The
// static markup already reads "Login/Create Account" when signed out, so this
// only needs to flip to "My Account" on a live session — but it normalizes the
// signed-out label too, so it's correct even if it runs on stale markup.
// Dependency-light + fail-silent: reuses WWSAccount.getSession from
// /scripts/account.js (loaded on demand), and stays quiet when signed out or
// when accounts aren't configured.

(function () {
  function loadAccountModule() {
    if (window.WWSAccount) return Promise.resolve(window.WWSAccount);
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="/scripts/account.js"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(window.WWSAccount); });
        existing.addEventListener("error", reject);
        if (window.WWSAccount) resolve(window.WWSAccount);
        return;
      }
      var s = document.createElement("script");
      s.src = "/scripts/account.js";
      s.onload = function () { resolve(window.WWSAccount); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function setLabels(text) {
    var links = document.querySelectorAll("[data-account-link]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.trim() !== text) {
        links[i].textContent = text;
      }
    }
  }

  loadAccountModule()
    .then(function (acct) {
      if (!acct || !acct.getSession) return null;
      return acct.getSession();
    })
    .then(function (session) {
      setLabels(session ? "My Account" : "Login/Create Account");
    })
    .catch(function () { /* fail silent — signed out or accounts not configured */ });
})();
