// scripts/nav-account.js — flips nav "Account" links to "My Account" when a
// customer is signed in (V3 item 7 polish). Dependency-light + fail-silent:
// reuses WWSAccount.getSession from /scripts/account.js (loaded on demand), and
// stays quiet when signed out or when accounts aren't configured.

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

  function flipLabels() {
    var links = document.querySelectorAll("[data-account-link]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.trim() === "Account") {
        links[i].textContent = "My Account";
      }
    }
  }

  loadAccountModule()
    .then(function (acct) {
      if (!acct || !acct.getSession) return;
      return acct.getSession();
    })
    .then(function (session) {
      if (session) flipLabels();
    })
    .catch(function () { /* fail silent — signed out or accounts not configured */ });
})();
