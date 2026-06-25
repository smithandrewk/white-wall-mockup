// scripts/addon-menu.js — the /addon-menu landing page (V3 item 6).
//
// The customer arrives from an add-on campaign email at /addon-menu?token=<...>.
// This script:
//   1. GETs /api/addon-apply?token=... to validate the link + load the session
//      summary (no charge);
//   2. renders the curated add-on menu (display only; the SERVER is authoritative
//      on price — it re-resolves the add-on from ADDON_PRICES);
//   3. on a click, shows a confirm modal, then POSTs { token, addonId } to
//      /api/addon-apply.
//
// DARK behavior is transparent to the customer: while ADDON_CHARGE_ARMED is off,
// the POST returns { dryRun:true } and this page shows a friendly "not yet
// available" message instead of a charge confirmation. Nothing on the client can
// move money or set a price; the token is the only thing of value it carries.

(function () {
  var params = new URLSearchParams(location.search);
  var token = params.get("token") || params.get("t") || "";

  var els = {
    subtitle: document.querySelector("[data-subtitle]"),
    sessionCard: document.querySelector("[data-session-card]"),
    sessionLabel: document.querySelector("[data-session-label]"),
    sessionMeta: document.querySelector("[data-session-meta]"),
    menu: document.querySelector("[data-menu]"),
    menuList: document.querySelector("[data-menu-list]"),
    loading: document.querySelector("[data-loading]"),
    error: document.querySelector("[data-error]"),
    result: document.querySelector("[data-result]"),
    modal: document.querySelector("[data-modal]"),
    modalTitle: document.querySelector("[data-modal-title]"),
    modalBody: document.querySelector("[data-modal-body]"),
    modalError: document.querySelector("[data-modal-error]"),
    modalCancel: document.querySelector("[data-modal-cancel]"),
    modalConfirm: document.querySelector("[data-modal-confirm]")
  };

  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }
  function money(cents) { return "$" + (Number(cents || 0) / 100).toFixed(2); }

  function fail(msg) {
    hide(els.loading);
    els.error.textContent = msg;
    show(els.error);
  }

  function locationLabel(slug) {
    if (slug === "powdersville") return "Flagship Location (Powdersville)";
    if (slug === "taylors-mill") return "Taylor's Mill";
    return "White Wall Studios";
  }

  function fmtWhen(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-US", {
        timeZone: "America/New_York", weekday: "long", month: "long",
        day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"
      });
    } catch (e) { return iso; }
  }

  // Display menu. addon ids match the server ADDON_PRICES keys exactly; the cents
  // shown here are confirmed server-side before any charge.
  function menuFor(loc) {
    var lighting = loc === "powdersville"
      ? { id: "lighting-powdersville", label: "Lighting Rental", cents: 12500 }
      : { id: "lighting-taylors-mill", label: "Lighting Rental", cents: 5000 };
    var items = [
      lighting,
      { id: "backdrops-all", label: "All Backdrops", cents: 5000 },
      { id: "tv", label: '86" Rolling TV', cents: 5000 },
      { id: "pa-system", label: "PA System", cents: 4000 }
    ];
    // Rolling walls + chairs/tables are Powdersville-only in the catalog.
    if (loc === "powdersville") {
      items.splice(2, 0, { id: "walls-all", label: "All Rolling Walls", cents: 7000 });
      items.push({ id: "table", label: "8ft Folding Table", cents: 1500 });
    }
    return items;
  }

  function renderMenu(items) {
    els.menuList.innerHTML = "";
    items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "booking-panel flex items-center justify-between gap-4 p-4";
      var left = document.createElement("div");
      left.innerHTML =
        '<p class="font-medium">' + it.label + "</p>" +
        '<p class="text-black/50 text-sm">' + money(it.cents) + "</p>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-button px-5 py-2 text-sm";
      btn.textContent = "Add";
      btn.addEventListener("click", function () { openConfirm(it); });
      row.appendChild(left);
      row.appendChild(btn);
      els.menuList.appendChild(row);
    });
    show(els.menu);
  }

  // ---- confirm modal ----
  var pending = null;
  function openConfirm(item) {
    pending = item;
    els.modalTitle.textContent = "Add " + item.label + "?";
    els.modalBody.textContent =
      "We will add " + item.label + " (" + money(item.cents) +
      ") to your booking and charge the card you have on file.";
    hide(els.modalError);
    els.modal.classList.remove("hidden");
    els.modal.classList.add("flex");
  }
  function closeConfirm() {
    els.modal.classList.add("hidden");
    els.modal.classList.remove("flex");
    pending = null;
  }
  els.modalCancel.addEventListener("click", closeConfirm);
  els.modal.addEventListener("click", function (e) { if (e.target === els.modal) closeConfirm(); });

  els.modalConfirm.addEventListener("click", async function () {
    if (!pending) return;
    els.modalConfirm.disabled = true;
    var prev = els.modalConfirm.textContent;
    els.modalConfirm.textContent = "Adding…";
    hide(els.modalError);
    try {
      var res = await fetch("/api/addon-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, addonId: pending.id })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        els.modalError.textContent = data.error || data.blocked || "Could not add this item. Please try again.";
        show(els.modalError);
        return;
      }
      closeConfirm();
      showResult(data);
    } catch (err) {
      els.modalError.textContent = (err && err.message) || "Something went wrong. Please try again.";
      show(els.modalError);
    } finally {
      els.modalConfirm.disabled = false;
      els.modalConfirm.textContent = prev;
    }
  });

  function showResult(data) {
    hide(els.menu);
    var html;
    if (data.charged) {
      html =
        '<p class="font-display text-2xl">You are all set.</p>' +
        '<p class="text-black/60 mt-2">' + (data.label || "Your add-on") +
        " has been added to your booking and " + money(data.amountCents) + " was charged to your card on file.</p>";
    } else if (data.alreadyApplied) {
      html =
        '<p class="font-display text-2xl">Already added.</p>' +
        '<p class="text-black/60 mt-2">' + (data.label || "This add-on") +
        " is already on your booking. We did not charge you again.</p>";
    } else if (data.dryRun) {
      html =
        '<p class="font-display text-2xl">Thanks.</p>' +
        '<p class="text-black/60 mt-2">One-click add-ons are not quite live yet. ' +
        "We have noted your interest and will reach out to confirm.</p>";
    } else {
      html =
        '<p class="font-display text-2xl">Thanks.</p>' +
        '<p class="text-black/60 mt-2">Your request was received.</p>';
    }
    els.result.innerHTML = html +
      '<p class="mt-5"><a href="/account" class="underline hover:text-black">View my account</a></p>';
    show(els.result);
  }

  // ---- init ----
  async function init() {
    if (!token) { fail("This link is missing its booking token."); return; }
    try {
      var res = await fetch("/api/addon-apply?token=" + encodeURIComponent(token));
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.ok) {
        fail(data.error === "invalid-token"
          ? "This link is no longer valid. If you think this is a mistake, reply to your booking email."
          : (data.error || "Could not load your booking."));
        return;
      }
      var b = data.booking || {};
      els.sessionLabel.textContent = b.sessionLabel || "Your session";
      var meta = [locationLabel(b.location)];
      if (b.startsAt) meta.push(fmtWhen(b.startsAt));
      els.sessionMeta.textContent = meta.filter(Boolean).join("  •  ");
      show(els.sessionCard);
      els.subtitle.textContent = "Add gear to your upcoming session in one click.";
      hide(els.loading);
      renderMenu(menuFor(b.location));
    } catch (err) {
      fail((err && err.message) || "Could not load your booking.");
    }
  }

  init();
})();
