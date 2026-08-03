(function () {
  const config = window.WWS_BOOKING_CONFIG;
  if (!config) {
    return;
  }

  const page = document.body;
  const locationSlug = page.dataset.bookingLocation;
  const locations = config.locations || [];
  const location = locations.find((item) => item.slug === locationSlug);

  if (!location) {
    return;
  }

  // ---- Builder mode (DREW-17, 2026-07-28) ----------------------------------
  // The wws-dashboard "Session Builder" tab embeds a synced copy of this exact
  // page and sets window.WWS_BUILDER_MODE before this script runs. In builder
  // mode the flow is the identical booking experience but ENDS at the add-ons
  // step (no contact / waiver / payment), and the order summary gains an
  // Ownership-discount override plus Save Session / Get Session Link controls.
  // On the customer site this flag is never set, so every BUILDER branch below
  // is dead code there — behavior is byte-identical for real customers.
  var BUILDER = !!window.WWS_BUILDER_MODE;
  var BUILDER_MAX_STEP = 3;

  // ---- Offer mode (DREW-21, Session Builder Phase 2) -----------------------
  // A dashboard-minted "session link": /book-<loc>?offer=<base64url payload>.<sig>.
  // The payload is the operator's locked build (sessions, ownership adjustments,
  // final price), HMAC-signed by the dashboard with the same BOOKING_SECRET the
  // server holds. The client decode below is DISPLAY ONLY — api/create-checkout
  // re-verifies the signature + the Edge Config active-list and recomputes every
  // cent server-side, so a tampered link can render whatever it likes but can
  // never charge a forged price. OFFER stays null on any parse problem;
  // OFFER_BROKEN distinguishes "?offer= present but unusable" (error panel)
  // from "no offer param at all" (normal flow).
  var OFFER = null;
  var OFFER_TOKEN = "";
  var OFFER_SHORTID = ""; // DREW-24: ?offer=<draftId>, token fetched from Edge Config
  var OFFER_BROKEN = false;
  // Decode a "<base64url payload>.<hex sig>" token into the offer payload, or
  // null when it isn't a well-formed, location-matching v1 offer. Shared by the
  // synchronous long-link path below and the async short-link resolve (DREW-24).
  function decodeOfferToken(token) {
    try {
      var t = String(token || "").trim();
      var dot = t.lastIndexOf(".");
      if (dot <= 0) return null;
      var b64 = t.slice(0, dot).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var p = JSON.parse(new TextDecoder("utf-8").decode(bytes));
      if (p && p.v === 1 &&
          p.locationSlug === location.slug &&
          Array.isArray(p.sessions) && p.sessions.length &&
          p.flowState && typeof p.flowState === "object" &&
          typeof p.finalTotalCents === "number") {
        return p;
      }
    } catch (e) {}
    return null;
  }
  try {
    if (!BUILDER) {
      var offerRaw = new URLSearchParams(window.location.search).get("offer");
      if (offerRaw) {
        offerRaw = offerRaw.trim();
        if (offerRaw.indexOf(".") >= 0) {
          // Long link (?offer=<encoded>.<sig>): decode inline so a FULL URL
          // pasted straight into a browser still works (backward compatible).
          OFFER_TOKEN = offerRaw;
          var offerPayload = decodeOfferToken(offerRaw);
          if (offerPayload) { OFFER = offerPayload; } else { OFFER_BROKEN = true; }
        } else {
          // Short link (?offer=<draftId>): the signed token lives in Edge
          // Config; the boot sequence fetches it from /api/resolve-offer.
          OFFER_SHORTID = offerRaw;
        }
      }
    }
  } catch (e) { OFFER = null; OFFER_SHORTID = ""; OFFER_BROKEN = true; }

  // Offer mode: every action that could change WHAT was built or WHAT it costs
  // is locked — the customer can look but not touch (Drew: "completely locked…
  // grayed out"). Navigation (go-step) and the customer's own steps (contact,
  // terms, waiver signing, payment) stay live. The matching CSS graying is
  // injected by initOfferMode(); the bindEvents guards are the functional lock,
  // so keyboard activation can't slip past pointer-events:none. Defined up here
  // because the boot sequence (initOfferMode) runs before the later var
  // assignments would execute.
  var OFFER_LOCKED_ACTIONS = {
    "gate-choose": 1, "gate-event-mode": 1, "gate-back": 1,
    "select-duration": 1, "select-date": 1, "select-time": 1, "navigate-month": 1,
    "add-another-session": 1, "review-cart": 1, "back-to-cart-edit": 1,
    "edit-cart-session": 1, "remove-cart-session": 1,
    "md-add-last": 1, "md-add-multiple": 1, "md-review": 1,
    "range-reset": 1, "range-review": 1,
    "set-event-intent": 1, "set-last-day-leave": 1,
    "adjust-quantity": 1, "set-addon-mode": 1, "set-placement": 1,
    "set-quantity-max": 1, "set-tier": 1,
    "toggle-addon": 1, "toggle-color": 1, "toggle-wall": 1,
    "apply-coupon": 1, "remove-coupon": 1, "set-payment-mode": 1
  };
  var OFFER_LOCKED_INPUTS = [
    "[data-input='participants']", "[data-input='intake-participants']",
    "[data-input='event-description']", "[data-input='high-traffic-note']",
    "[data-input='coupon-code']"
  ];
  var OFFER_LOCKED_CHECKS = [
    "[data-check='food-drinks-yes']", "[data-check='food-drinks-no']",
    "[data-action='set-placement']", "[data-action='set-last-day-leave']"
  ];

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  // Cents-precise variant: shows cents only when the amount is not a whole dollar
  // ($190, but $161.50). Used where the multi-day discount produces half-dollars so
  // the per-add-on math adds up exactly (Drew 2026-07-11).
  const currencyExact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  // Multi-day discount COPY, derived from the rate in pricing-shared rather than
  // typed into the page. Drew moved the rate $100 -> $160 within a day of shipping it,
  // and the words live in five places — so any hardcoded "$100" is a promise the
  // checkout won't honor. mdRate() is the rate ("$160"); mdSaves(n) is what an n-day
  // event saves ("$480"), for the worked examples in the intro and Good-to-Know copy.
  function mdRate() {
    return window.WWSPricing.multiDayPerDayLabel();
  }
  function mdSaves(days) {
    return currency.format(window.WWSPricing.multiDayDiscountCents(days) / 100);
  }
  // The add-on taper, in words, derived from the ladder itself — same discipline as
  // mdRate(): Drew has now moved this ladder once (15/30 -> 20/40), and copy that
  // states a percentage the pricing module doesn't actually apply is a money bug.
  function addonTaperPct(dayIndex) {
    return Math.round((1 - window.WWSPricing.dayDiscountMultiplier(dayIndex)) * 100);
  }
  function addonTaperCopy() {
    return addonTaperPct(1) + "% off on Day 2 and " + addonTaperPct(2) + "% off every day after.";
  }
  // Whole dollars show clean ($350); fractional amounts show exact cents
  // ($2,581.50). Used for the pay button + cart totals so what the customer sees
  // matches the exact amount charged when the multi-day discount lands half-dollars.
  function fmtMoney(dollars) {
    return Number.isInteger(dollars) ? currency.format(dollars) : currencyExact.format(dollars);
  }

  // Robust int parse for participant counts. Customers occasionally type
  // "35 +", "35+", "~35", "35-50", etc. Number() returns NaN for those and
  // the >=35 threshold silently falls through (missed cleaning fee + missed
  // high-traffic warnings). Extract the first integer instead.
  // Real incident: Molly Hensley booked Nov 14 2026 with "35 +" — no fee
  // applied, no warnings shown, no buffer block.
  function parseCount(v) {
    if (v == null) return 0;
    const m = String(v).match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }

  const state = {
    step: 1,
    // Step-1 "What are you booking?" gate (Drew 2026-07-10). bookingType is set
    // by the gate before the numbered flow is revealed: "" = gate not answered,
    // "photo" = photo/video session, "event" = event booking. eventMode applies
    // to events: "single" (one day, today's normal flow) or "multi" (day-by-day
    // builder on the multi-session cart). _gateChoosingEventMode is a transient
    // UI flag = the gate is showing the single/multi sub-choice. On PV only; TM
    // is photo-only so its gate auto-resolves to "photo".
    bookingType: "",
    eventMode: "",
    _gateChoosingEventMode: false,
    _dayRole: "", // multi-day event: role of the day being configured ("middle"|"last"); "first" is derived from an empty cart
    _multidayFixedTime: "", // locked start (first/middle) or start-of-access (last) time label for the confirmation line
    // Airbnb-style multi-day RANGE flow (Drew 2026-07-11): the customer picks a
    // day-one access time (durationId), then a start date + end date; the days
    // between are auto-built as full days. _eventDurationId holds the day-one
    // access-time pick; _eventStartDate/_eventEndDate are the picked range.
    _eventDurationId: "",
    _eventStartDate: "",
    _eventEndDate: "",
    _lastDayDurationId: "pv-full", // last day defaults to a full day (10:30 PM departure); early-checkout can shorten it
    durationId: location.durations[0] ? location.durations[0].id : "",
    eventIntent: "",
    participants: "",
    eventDescription: "",
    foodDrinks: null,
    highTrafficNote: "",
    acknowledgements: {
      cleanup: false,
      capacity: false,
      selfService: false
    },
    contact: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: ""
    },
    intake: {
      business: "",
      participants: "",
      instagram: "",
      leadSource: "",
      leadSourceOther: "",
      // DREW-31: mandatory "what are you using the space for" for photo/video.
      // A fixed dropdown (purpose) with an "Other" option that reveals a required
      // free-text box (purposeOther). Events/multi-day use eventDescription instead.
      purpose: "",
      purposeOther: "",
      readEmail: false
    },
    emailAcknowledgment: "",
    termsSignature: "",
    waiverSigned: false,
    cardOnFileConsent: false,
    nameOnCard: "",
    _nameOnCardEdited: false,
    squareCard: null,
    squareCardReady: false,
    tmHighTrafficAcknowledged: false,
    tmHighTrafficNote: "",
    addons: {},
    // Multi-session cart (V3 item 2). The live single-session flow operates on
    // the top-level draft fields above; `cart.sessions` accumulates committed
    // sessions for the multi-session flow, and `cart.universal` holds the
    // collected-once fields (contact/waiver/card). Empty cart === today's
    // single-session behavior. Wired up by the cart UI + N-session checkout in
    // later phases; inert until then.
    cart: { sessions: [], universal: {} },
    // V3 item 2/6: cart review-view flag + deposit/full payment mode. Deposit
    // (pay 60% now) is offered only for event bookings; defaults to full.
    _cartReviewing: false,
    paymentMode: "full",
    coupon: null,        // applied promo: { code, comp, percentOff, amountOff, discountCents } — comp:true = full-comp ($0, no card); amountOff = cents off whole order (flat-dollar code)
    couponInput: "",     // current text in the promo field (preserves on re-render)
    couponError: "",     // inline error message for a rejected code
    couponPending: false,
    couponAutoApplied: false, // guards the one-shot auto-apply of a URL ?promo= code
    promoActive: false,  // true only while a coupon campaign is live (gates the promo UI)
    selectedDate: "",
    selectedTime: "",
    availableDates: [],
    availableTimes: [],
    calendarMonth: new Date().toISOString().slice(0, 7),
    isLoadingDates: false,
    isLoadingTimes: false,
    isSubmitting: false
  };

  location.addons.forEach((addon) => {
    state.addons[addon.id] = getInitialAddonState(addon);
  });

  // --- Multi-session cart scaffolding (V3 item 2) --------------------------
  // A "session" is a snapshot of the active draft (duration/date/time/add-ons +
  // per-session intake). These helpers accumulate sessions into state.cart for
  // the multi-session flow. The single-session path never calls them, so its
  // behavior is unchanged. The cart UI (add-another-session, review) and the
  // N-session checkout wire these up in later phases.
  function snapshotActiveSession() {
    return {
      location: location.slug,
      durationId: state.durationId,
      selectedDate: state.selectedDate,
      selectedTime: state.selectedTime,
      eventIntent: state.eventIntent,
      // Multi-day event display metadata (Drew 2026-07-11 live summary): the day's
      // role (first/middle/last) + its access/leave time label, so the running
      // summary can show each day with the right wording as it's built.
      _mdRole: currentDayRole(),
      _mdTimeLabel: state._multidayFixedTime || "",
      addons: JSON.parse(JSON.stringify(state.addons || {})),
      foodDrinks: state.foodDrinks,
      perSessionIntake: {
        participants: state.intake.participants,
        business: state.intake.business,
        eventDescription: state.eventDescription
      }
    };
  }
  function commitActiveSessionToCart() {
    state.cart.sessions.push(snapshotActiveSession());
  }
  function resetActiveDraft() {
    state.durationId = location.durations[0] ? location.durations[0].id : "";
    state.selectedDate = "";
    state.selectedTime = "";
    // Preserve the Step-1 gate's booking-type choice across days/sessions: every
    // day of a gated booking is the same type (all event days, or all photo), and
    // the mid-flow type selector is hidden once gated, so re-blanking eventIntent
    // would strand a new event day with no way to mark it. Falls back to "" (the
    // pre-gate single-session behavior) when the gate wasn't used.
    state.eventIntent = state.bookingType === "event" ? "yes" : (state.bookingType === "photo" ? "no" : "");
    state.eventDescription = "";
    state.intake.participants = "";
    state.intake.business = "";
    state.addons = {};
    location.addons.forEach(function (addon) { state.addons[addon.id] = getInitialAddonState(addon); });
  }
  function loadCartSessionIntoDraft(i) {
    var s = state.cart.sessions[i];
    if (!s) return;
    state.durationId = s.durationId;
    state.selectedDate = s.selectedDate;
    state.selectedTime = s.selectedTime;
    state.eventIntent = s.eventIntent;
    state.addons = JSON.parse(JSON.stringify(s.addons || {}));
    if (s.foodDrinks !== undefined) state.foodDrinks = s.foodDrinks;
    state.intake.participants = (s.perSessionIntake && s.perSessionIntake.participants) || "";
    state.intake.business = (s.perSessionIntake && s.perSessionIntake.business) || "";
    state.eventDescription = (s.perSessionIntake && s.perSessionIntake.eventDescription) || "";
    // Mirror per-session participants into the top-level count for events (the
    // single-session validators/cleaning-fee read state.participants for events).
    if (s.eventIntent === "yes") {
      state.participants = (s.perSessionIntake && s.perSessionIntake.participants) || "";
    }
  }
  // Expose for the cart UI phases (and to mark them intentionally-used to linters).
  state._cartHelpers = { snapshotActiveSession: snapshotActiveSession, commitActiveSessionToCart: commitActiveSessionToCart, resetActiveDraft: resetActiveDraft, loadCartSessionIntoDraft: loadCartSessionIntoDraft };

  // --- V3 item 2: multi-session cart UI ------------------------------------
  // "Cart is active" === at least one session already committed. With an empty
  // cart the page behaves exactly like today's single-session flow, so the live
  // single-session path stays byte-identical until "Add another session" is used.
  function cartIsActive() {
    return state.cart.sessions.length > 0;
  }

  // A bookable slot exists when there's an active single slot OR every session in
  // a built cart has its locked start time (a range/multi-day event has no single
  // active slot — the cart carries each day's datetime). Used by the pay-time
  // validators so a range event isn't wrongly bounced back to Step 2.
  function hasBookableSlot() {
    if (state.selectedTime) return true;
    return cartIsActive() && state.cart.sessions.every(function (s) { return !!s.selectedTime; });
  }

  // Total number of sessions in this booking = committed + the active draft
  // (the draft becomes the last session at "Review cart" time). Used for labels.
  function cartSessionCount() {
    // Offer mode restores every day as a COMMITTED cart session with no active
    // draft, so the customer-facing count is exactly the committed list — the
    // normal flow's "+1" counts the session currently being configured.
    if (OFFER) return state.cart.sessions.length + (state.selectedTime ? 1 : 0);
    return state.cart.sessions.length + 1;
  }

  // Add-on subtotal (dollars) for an arbitrary add-on state object (not the
  // global one). Mirrors getAddonSubtotal but reads the passed addonState so it
  // works for committed cart sessions as well as the active draft.
  function addonSubtotalFor(addon, addonState) {
    if (!addonState) return 0;
    if (addon.type === "toggle") return addonState.selected ? addon.price : 0;
    if (addon.type === "quantity") return (addonState.quantity || 0) * addon.price;
    if (addon.type === "tier") {
      var sel = addon.options.find(function (o) { return o.id === addonState.selection; });
      return sel ? sel.price : 0;
    }
    if (addon.type === "backdrops") {
      if (addonState.mode === "all") return addon.allPrice;
      return (addonState.colors || []).length * addon.singlePrice;
    }
    if (addon.type === "walls") {
      if (addonState.mode === "all") return addon.allPrice;
      return (addonState.walls || []).length * addon.singlePrice;
    }
    return 0;
  }

  // Build the normalized pricing-shared cart shape from committed sessions plus
  // the active draft. dayIndex is assigned by chronological session order (the
  // same rule the server uses), so the discount preview matches the server's
  // authoritative recompute. Session price = the flat per-duration price (cents);
  // each add-on line is the FULL (undiscounted) cents tagged with its addon id —
  // pricing-shared applies the per-day discount internally.
  function buildPricingCart(includeActiveDraft) {
    var raw = state.cart.sessions.slice();
    // Only include the active draft once it has a real slot (a fresh draft after
    // "Add another session" has no time yet — it isn't a priced session).
    if (includeActiveDraft && state.selectedTime) raw.push(snapshotActiveSession());

    // Map each session to { sessionCents, addons:[{addonId,cents}], datetime } so
    // we can sort chronologically and assign dayIndex deterministically.
    var mapped = raw.map(function (s) {
      var dur = location.durations.find(function (d) { return d.id === s.durationId; });
      var sessionCents = Math.round((dur && dur.price ? dur.price : 0) * 100);
      var addonLines = [];
      location.addons.forEach(function (addon) {
        var amt = addonSubtotalFor(addon, (s.addons || {})[addon.id]);
        if (amt > 0) addonLines.push({ addonId: addon.id, cents: Math.round(amt * 100) });
      });
      return { sessionCents: sessionCents, addons: addonLines, datetime: s.selectedTime || "" };
    });

    // Chronological sort (sessions without a time sort last, stable).
    mapped.sort(function (a, b) {
      if (!a.datetime) return 1;
      if (!b.datetime) return -1;
      return a.datetime < b.datetime ? -1 : (a.datetime > b.datetime ? 1 : 0);
    });
    mapped.forEach(function (s, i) { s.dayIndex = i; });
    return { sessions: mapped };
  }

  // Commit the active draft and start a fresh draft for another session. The
  // universal fields (contact / waiver / terms / card) are collected once and
  // are NOT reset — only the per-session draft (duration/date/time/add-ons).
  function addAnotherSession() {
    commitActiveSessionToCart();
    resetActiveDraft();
    state._cartReviewing = false;
    // Send the customer back to pick the new session's timing.
    setStep(1);
    showToast("Session added to your cart. Pick the timing for the next session.");
  }

  // Edit a committed session: commit the current draft so it isn't lost, then
  // pull the chosen session into the active draft, drop it from the committed
  // list, and return to step 1 to re-edit. Leaves review mode.
  function editCartSession(i) {
    if (i < 0 || i >= state.cart.sessions.length) return;
    // Preserve the in-progress draft (only if it has a real slot — an empty
    // fresh draft after "Add another session" shouldn't be committed as junk).
    if (state.selectedTime) {
      commitActiveSessionToCart();
      // The chosen index shifts by +1 only if the committed draft was inserted
      // before it; we push to the end, so committed indices are unchanged.
    }
    loadCartSessionIntoDraft(i);
    state.cart.sessions.splice(i, 1);
    state._cartReviewing = false;
    setStep(1);
  }

  function removeCartSession(i) {
    if (i < 0 || i >= state.cart.sessions.length) return;
    state.cart.sessions.splice(i, 1);
    renderStepContent();
    scrollToCart();
  }

  function scrollToCart() {
    var el = document.querySelector("[data-cart-summary]");
    if (el && !el.hidden) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }

  // Human label for one cart session (committed snapshot OR the active draft).
  function describeSession(s) {
    var dur = location.durations.find(function (d) { return d.id === s.durationId; });
    var loc = locations.find(function (l) { return l.slug === s.location; }) || location;
    var when = s.selectedTime
      ? new Date(s.selectedTime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : (s.selectedDate || "Date not selected");
    return {
      durationLabel: dur ? dur.label : "Session",
      locationName: loc.name,
      when: when,
      isEvent: s.eventIntent === "yes"
    };
  }

  // Per-session add-on summary lines (id + label + amount, dollars) for an
  // arbitrary session. The id lets the cart summary apply the per-day discount
  // (pricing-shared) to each line so later days show their discounted price.
  function sessionAddonLines(s) {
    var lines = [];
    location.addons.forEach(function (addon) {
      var amt = addonSubtotalFor(addon, (s.addons || {})[addon.id]);
      if (amt > 0) lines.push({ id: addon.id, label: addon.name, amount: amt });
    });
    return lines;
  }

  // The "Add another session" / "Review cart" branch, rendered at the top of
  // step 5. Always offered (Drew wants multi-day discovery), but never blocks
  // the single-session pay flow: payment stays directly available below.
  // Multi-day event builder intro (Drew 2026-07-11): when eventMode === "multi",
  // frame Step 1 as a day-by-day builder so it does not read like the normal
  // single-session duration picker. Reflects which day they're setting up.
  function renderMultidayIntro() {
    var el = document.querySelector("[data-multiday-intro]");
    if (!el) return;
    var role = currentDayRole();
    if (state.eventMode !== "multi" || !role) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    var dayNum = state.cart.sessions.length + 1;
    var body;
    if (role === "first") {
      // Drew's first-day framing (2026-07-11): access is continuous from the start
      // time they pick on Day 1 through the end of the event.
      body =
        'You get access on <strong>Day one</strong> of your event, starting at the time you select here, ' +
        'and it goes continuously until you get to the end of your event.';
    } else if (role === "last") {
      body =
        'This is the <strong>last day</strong> of your event. Access carries through to when you leave — ' +
        'pick your leave time below. This is when you leave with everything completely reset and cleaned up.';
    } else {
      body =
        'Adding a <strong>full day</strong> to your event — access carries through continuously into the ' +
        'next day. Add-ons and pricing adjust per day, and you pay for the whole event together at the end.';
    }
    el.innerHTML =
      '<div class="booking-panel-soft p-5" style="margin-top:1.5rem">' +
        '<p class="ui-kicker" style="margin-bottom:0.5rem">Multi-day event builder</p>' +
        '<p class="ui-copy" style="color:rgba(0,0,0,0.65)">' + body + '</p>' +
        // Multi-day discount, stated up front (Drew 2026-07-13: "make that logic
        // known to them ... right on the front end. It needs to be crystal clear.")
        '<div style="margin-top:0.85rem;padding:0.7rem 0.85rem;border-radius:0.5rem;background:#f0fdf4;border:1px solid #bbf7d0">' +
          '<p class="ui-copy-strong" style="color:#166534;margin:0">You save ' + mdRate() + ' for every day of your event.</p>' +
          '<p class="ui-copy-muted" style="font-size:0.8rem;margin:0.25rem 0 0;line-height:1.45">' +
            'A 2 day event takes ' + mdSaves(2) + ' off your total, a 3 day event ' + mdSaves(3) + ', a 5 day event ' + mdSaves(5) + '. ' +
            'It applies no matter how long each day runs, and it comes off automatically as you build your event below.' +
          '</p>' +
        '</div>' +
      '</div>';
  }

  // Live multi-day event summary (Drew 2026-07-11): as each day is committed, show
  // it here with its date, access/leave time, and price, plus the running total +
  // the $150 cleaning fee (baked into every multi-day event). Replaces the
  // single-session summary block while building a multi-day event.
  function renderMultidaySummary() {
    var el = document.querySelector("[data-summary-multiday]");
    var singles = document.querySelectorAll("[data-summary-single]");
    if (!el) return;
    if (state.eventMode !== "multi") {
      el.hidden = true; el.innerHTML = "";
      singles.forEach(function (s) { s.style.display = ""; });
      return;
    }
    singles.forEach(function (s) { s.style.display = "none"; });
    el.hidden = false;

    // Days = committed sessions + the active draft (only once it has a slot).
    var days = state.cart.sessions.slice();
    if (state.selectedTime) days.push(snapshotActiveSession());
    // Display in event order: first day, then middle full days (by date), then the
    // last day — the logical event order, robust to dates picked out of sequence.
    var roleRank = { first: 0, middle: 1, last: 2 };
    days.sort(function (a, b) {
      var ra = roleRank[a._mdRole] != null ? roleRank[a._mdRole] : 1;
      var rb = roleRank[b._mdRole] != null ? roleRank[b._mdRole] : 1;
      if (ra !== rb) return ra - rb;
      var at = a.selectedTime || "", bt = b.selectedTime || "";
      return at < bt ? -1 : (at > bt ? 1 : 0);
    });

    var sessionSum = 0;
    var rows = days.map(function (s, i) {
      var dur = location.durations.find(function (d) { return d.id === s.durationId; });
      var price = dur && dur.price ? dur.price : 0;
      sessionSum += price;
      var dateLabel = "";
      if (s.selectedDate) {
        var dp = s.selectedDate.split("-");
        dateLabel = new Date(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))
          .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      }
      var role = s._mdRole || (i === 0 ? "first" : (i === days.length - 1 ? "last" : "middle"));
      var tl = s._mdTimeLabel || "";
      var timeText = role === "first" ? ("access " + tl) : (role === "last" ? ("leave " + tl) : "full day");
      var dayName = role === "first" ? "First day" : (role === "last" ? "Last day" : "Full day");
      return '<div class="summary-line"><span>' + escapeHtml(dayName) +
        (dateLabel ? ' &middot; ' + escapeHtml(dateLabel) : '') +
        ' <span class="ui-copy-muted" style="font-size:0.8rem">(' + escapeHtml(timeText) + ')</span></span>' +
        '<span>' + currency.format(price) + '</span></div>';
    }).join("");

    // Add-on total via pricing-shared (per-day discount) — matches the cart/server.
    var totals = (window.WWSPricing && window.WWSPricing.computeCartTotals)
      ? window.WWSPricing.computeCartTotals(buildPricingCart(true))
      : { addonTotal: 0, addonTotalFull: 0, addonDiscount: 0 };
    var addonCents = totals.addonTotal || 0;
    // Retail (what the add-ons cost with no multi-day taper) and the savings that
    // taper produces. Both come from the SAME pricing-shared totals the server
    // charges from, so the "you save" number can't drift from the charge.
    var addonRetailCents = totals.addonTotalFull || 0;
    var addonSavings = totals.addonDiscount || 0;
    // Cleaning fee: baked into every multi-day event (Drew) — mandatory + known
    // upfront, so show it immediately (this fn only runs for a multi-day event).
    var cleaningCents = 15000;
    var preDiscountGrand = sessionSum * 100 + addonCents + cleaningCents;
    // Multi-day event discount (Drew 2026-07-13): $160 off per consecutive day the
    // event spans, regardless of how long any given day is booked for. Same
    // pricing-shared fn the server charges from, so this live number is the real one.
    var mdDiscount = (window.WWSPricing && window.WWSPricing.multiDayDiscountCents)
      ? window.WWSPricing.multiDayDiscountCents(days.length, preDiscountGrand)
      : 0;
    var grand = preDiscountGrand - mdDiscount;
    // Builder mode: the live multi-day total is what the override applies to.
    if (BUILDER) state._builderTotalCents = grand;

    var html =
      '<div class="summary-divider my-6"></div>' +
      '<p class="text-xs tracking-[0.2em] uppercase text-black/40">Your event so far</p>' +
      '<div class="mt-4 summary-list">' +
        (rows || '<div class="summary-line summary-line-muted"><span>No days added yet</span><span></span></div>') +
      '</div>';
    if (addonCents > 0) {
      // Per-add-on, per-day breakdown (Drew 2026-07-11): each add-on is its own
      // line showing how each day's amount adds up (Day 1 full, later days tapered
      // for the discountable gear; flat add-ons counted once). Sums to addonCents.
      var nDays = days.length;
      var elig = (window.WWSPricing && window.WWSPricing.isDiscountEligible) ? window.WWSPricing.isDiscountEligible : function () { return true; };
      var dAddon = (window.WWSPricing && window.WWSPricing.discountedAddonCents) ? window.WWSPricing.discountedAddonCents : function (c) { return c; };
      // Drew 2026-07-13 (msg 19f5e1ef38252d34): the add-on line item now prices at
      // RETAIL — the Day 1 price, times the number of days — and the per-day taper is
      // still spelled out underneath it. The money the taper saves is no longer buried
      // inside each line; it is pulled out into one "Add-on savings" line below, so the
      // summary reads the way he asked for it: this is retail, this is what you save,
      // therefore this is your total.
      var addonRows = "";
      location.addons.forEach(function (addon) {
        var full = addonSubtotalFor(addon, state.addons[addon.id]);
        if (!full) return;
        var fullCents = Math.round(full * 100);
        var retailLine = fullCents, mathParts = [];
        if (elig(addon.id) && nDays > 1) {
          retailLine = fullCents * nDays;   // retail = Day 1 price every day
          for (var i = 0; i < nDays; i++) {
            mathParts.push("Day " + (i + 1) + " " + currencyExact.format(dAddon(fullCents, i, addon.id) / 100));
          }
        } else if (!elig(addon.id) && nDays > 1) {
          mathParts.push("once for the event");   // flat / one-time fee: never tapered
        }
        addonRows +=
          '<div class="summary-line summary-line-muted"><span>' + escapeHtml(addon.name) + '</span><span>' + currencyExact.format(retailLine / 100) + '</span></div>' +
          (mathParts.length ? '<div class="ui-copy-muted" style="font-size:0.72rem;margin:-0.2rem 0 0.4rem;line-height:1.4">You pay ' + escapeHtml(mathParts.join("  +  ")) + '</div>' : '');
      });
      html += '<div class="summary-list" style="margin-top:0.5rem">' +
        '<p class="text-xs tracking-[0.2em] uppercase text-black/40" style="margin-bottom:0.35rem">Add-ons</p>' +
        addonRows +
        '<div class="summary-line"><span class="ui-copy-strong">Add-ons at retail</span><span class="ui-copy-strong">' + currencyExact.format(addonRetailCents / 100) + '</span></div>' +
      '</div>';
    }
    if (cleaningCents > 0) {
      html += '<div class="summary-list"><div class="summary-line summary-line-muted"><span>Cleaning fee (baked into every event)</span><span>' + currency.format(cleaningCents / 100) + '</span></div></div>';
    }
    // Drew 2026-07-13: show the whole arc — this is retail, this is what you save,
    // therefore this is your total. Retail subtotal prices the add-ons with NO taper;
    // the taper then comes back as its own "Add-on savings" line beneath the multi-day
    // discount. The two savings lines and the retail subtotal are just a re-grouping of
    // the same arithmetic — the charged total below is unchanged.
    var retailSubtotal = sessionSum * 100 + addonRetailCents + cleaningCents;
    var totalSavings = addonSavings + mdDiscount;
    html += '<div class="summary-divider my-6"></div>' +
      '<div class="summary-line"><span>Subtotal at retail</span><span>' + currencyExact.format(retailSubtotal / 100) + '</span></div>';
    if (mdDiscount > 0) {
      html += '<div class="summary-list">' +
        '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Multi-day discount · ' + days.length + ' days × ' + mdRate() + '</span><span class="ui-copy-strong">−' + currency.format(mdDiscount / 100) + '</span></div>' +
        '<div class="ui-copy-muted" style="font-size:0.72rem;margin-top:-0.2rem;line-height:1.4">You save ' + mdRate() + ' for every day your event runs. Add another day and you save another ' + mdRate() + '.</div>' +
      '</div>';
    }
    if (addonSavings > 0) {
      html += '<div class="summary-list">' +
        '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Add-on savings</span><span class="ui-copy-strong">−' + currencyExact.format(addonSavings / 100) + '</span></div>' +
        '<div class="ui-copy-muted" style="font-size:0.72rem;margin-top:-0.2rem;line-height:1.4">Your gear is full price on Day 1, then ' + addonTaperCopy() + '</div>' +
      '</div>';
    }
    if (totalSavings > 0) {
      html += '<div class="summary-list">' +
        '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Total savings</span><span class="ui-copy-strong">−' + currencyExact.format(totalSavings / 100) + '</span></div>' +
      '</div>';
    }
    // Offer mode (DREW-21): the aside is the multi-day event's live summary, so
    // the link's ownership lines + locked total must show here too, not just in
    // the checkout panels. Same drift gate as the checkout renders.
    if (offerActive()) {
      var offerAdjAside = offerAdjustments(grand);
      offerDriftCheck(offerAdjAside.finalCents);
      html += '<div class="summary-divider my-6"></div>' +
        '<div class="summary-list">' + offerLinesHtml(offerAdjAside) + '</div>' +
        '<div class="summary-divider my-6"></div>' +
        '<div class="summary-line summary-total"><span>Your price</span><strong>' + currencyExact.format(offerAdjAside.finalCents / 100) + '</strong></div>';
    } else {
      html += '<div class="summary-divider my-6"></div>' +
        '<div class="summary-line summary-total"><span>Estimated total</span><strong>' + currencyExact.format(grand / 100) + '</strong></div>';
    }
    el.innerHTML = html;
  }

  function renderCartBranch() {
    var container = document.querySelector("[data-cart-branch]");
    if (!container) return;

    // Only meaningful once a slot is picked (otherwise there's no session yet),
    // and hide it entirely while in the review view (the review owns the CTA).
    if (!state.selectedTime || state._cartReviewing) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }
    container.hidden = false;

    // "day" language for events (Drew's multi-day event builder); "session" for
    // photo/video multi-session carts.
    var isEvt = state.eventMode === "multi" || state.eventIntent === "yes";
    var unit = isEvt ? "day" : "session";
    var count = cartSessionCount();
    var countLine = cartIsActive()
      ? '<p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.6)">You have <strong>' + count + ' ' + unit + 's</strong> in this ' + (isEvt ? 'event' : 'cart') + ' (this one plus ' + state.cart.sessions.length + ' already added). Add more ' + unit + 's, or review and pay for everything together in one payment.</p>'
      : '<p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.6)">' + (isEvt ? 'Your event runs across multiple days? Add another day and pay for the whole event together.' : 'Booking more than one day? Add another session to this cart and pay for everything together.') + ' Multi-day add-on discounts apply automatically.</p>';

    var reviewBtn = cartIsActive()
      ? '<button type="button" class="booking-button booking-button-primary" data-action="review-cart">Review ' + (isEvt ? 'event' : 'cart') + ' &amp; pay</button>'
      : '';

    container.innerHTML =
      '<div class="booking-panel-soft p-5">' +
        '<p class="ui-kicker" style="margin-bottom:0.75rem">' + (isEvt ? 'Multi-day event' : 'Multi-day booking') + '</p>' +
        countLine +
        '<div style="display:flex;flex-wrap:wrap;gap:0.75rem">' +
          '<button type="button" class="booking-button booking-button-secondary" data-action="add-another-session">+ Add another ' + unit + '</button>' +
          reviewBtn +
        '</div>' +
      '</div>';
  }

  // The cart-summary review: every session (date/time/location/duration + its
  // add-ons) with per-session subtotals and the cart total, using
  // window.WWSPricing for the day-discount math (parity with the server). Only
  // shown in review mode (after "Review cart" with >1 session).
  function renderCartSummary() {
    var container = document.querySelector("[data-cart-summary]");
    if (!container) return;

    if (!state._cartReviewing || !cartIsActive()) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }
    container.hidden = false;

    // The review lists committed sessions PLUS the active draft as the final
    // (still-editable) row, so going back to edit never double-commits. Build
    // the priced cart over both, chronologically ordered with dayIndex set —
    // matches the server's authoritative recompute exactly.
    var priced = buildPricingCart(true);
    var totals = (window.WWSPricing && window.WWSPricing.computeCartTotals)
      ? window.WWSPricing.computeCartTotals(priced)
      : null;

    // Build display rows over committed sessions + the active draft. We display
    // in chronological order to match the day-index/discount the totals use, so
    // sort the source rows the same way buildPricingCart does.
    var rows = state.cart.sessions.map(function (cs, i) { return { src: cs, committedIndex: i, isDraft: false }; });
    // The active draft is a row only once it has a real slot (otherwise it's a
    // not-yet-configured next session — don't show a $0 phantom row).
    if (state.selectedTime) rows.push({ src: snapshotActiveSession(), committedIndex: -1, isDraft: true });
    rows.sort(function (a, b) {
      var at = a.src.selectedTime || "", bt = b.src.selectedTime || "";
      if (!at) return 1;
      if (!bt) return -1;
      return at < bt ? -1 : (at > bt ? 1 : 0);
    });

    var cards = rows.map(function (row, idx) {
      var src = row.src;
      var d = describeSession(src);
      var addonLines = sessionAddonLines(src);
      var dur = location.durations.find(function (dd) { return dd.id === src.durationId; });
      var sessionPrice = dur && dur.price ? dur.price : 0;

      // Each add-on line shows its per-day-discounted price (idx === the
      // chronological dayIndex the totals use, so this matches the cart total
      // and the server recompute). When a later day discounts a line, strike
      // through the original so the saving is visible (Drew's upsell ask).
      var addonHtml = addonLines.map(function (a) {
        var fullCents = Math.round(a.amount * 100);
        var discCents = (window.WWSPricing && window.WWSPricing.discountedAddonCents)
          ? window.WWSPricing.discountedAddonCents(fullCents, idx, a.id)
          : fullCents;
        var priceHtml = discCents < fullCents
          ? '<span><s class="summary-strike">' + currency.format(fullCents / 100) + '</s> ' + currency.format(discCents / 100) + '</span>'
          : '<span>' + currency.format(discCents / 100) + '</span>';
        return '<div class="summary-line summary-line-muted"><span>' + escapeHtml(a.label) + '</span>' + priceHtml + '</div>';
      }).join("");

      var multiplier = (window.WWSPricing && window.WWSPricing.dayDiscountMultiplier)
        ? window.WWSPricing.dayDiscountMultiplier(idx) : 1;
      var dayBadge = idx === 0
        ? '<span class="summary-pill" style="border:1px solid rgba(0,0,0,0.12);color:rgba(0,0,0,0.5)">Day 1</span>'
        : '<span class="summary-pill" style="border:1px solid rgba(0,0,0,0.12);color:rgba(0,0,0,0.5)">Day ' + (idx + 1) + ' · add-ons ' + Math.round(multiplier * 100) + '%</span>';

      var actions;
      if (row.isDraft) {
        actions = '<button type="button" class="booking-button booking-button-secondary" data-action="back-to-cart-edit" style="padding:0.4rem 0.8rem;font-size:0.8rem">Edit this session</button>';
      } else {
        actions =
          '<button type="button" class="booking-button booking-button-secondary" data-action="edit-cart-session" data-index="' + row.committedIndex + '" style="padding:0.4rem 0.8rem;font-size:0.8rem">Edit</button>' +
          '<button type="button" class="booking-button booking-button-secondary" data-action="remove-cart-session" data-index="' + row.committedIndex + '" style="padding:0.4rem 0.8rem;font-size:0.8rem">Remove</button>';
      }

      return '<div class="booking-panel-soft p-5" style="margin-top:1rem">' +
        '<div class="ui-row-start" style="margin-bottom:0.5rem">' +
          '<div>' +
            '<p class="ui-copy-strong">' + escapeHtml(d.durationLabel) + (d.isEvent ? ' · Event' : '') + (row.isDraft ? ' <span class="ui-copy-muted" style="font-size:0.8rem">(current)</span>' : '') + '</p>' +
            '<p class="ui-copy-muted" style="font-size:0.85rem">' + escapeHtml(d.locationName) + ' · ' + escapeHtml(d.when) + '</p>' +
          '</div>' +
          dayBadge +
        '</div>' +
        '<div class="summary-list">' +
          '<div class="summary-line"><span>Session</span><span>' + currency.format(sessionPrice) + '</span></div>' +
          addonHtml +
        '</div>' +
        '<div style="display:flex;gap:0.75rem;margin-top:0.75rem">' + actions + '</div>' +
      '</div>';
    }).join("");

    var totalsHtml = "";
    if (totals) {
      // Drew 2026-07-13: this line is named "Add-on savings" and sits BELOW the
      // multi-day discount (see totalsHtml), so the two savings read as one block.
      var discountLine = totals.addonDiscount > 0
        ? '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Add-on savings</span><span class="ui-copy-strong">−' + currencyExact.format(totals.addonDiscount / 100) + '</span></div>'
        : '';
      // Cleaning fee — MIRROR the server (create-checkout.js): $150 once when the
      // cart is a multi-day event (an event with 2+ sessions) OR any session has
      // 35+ attendees. Without this the on-site total ($X) would understate the
      // Square charge ($X + $150) and the deposit would be computed too low.
      var cartIsEventForFee = state.cart.sessions.some(function (s) { return s.eventIntent === "yes"; }) || state.eventIntent === "yes";
      var feeSessionCount = priced.sessions.length;
      var feeMaxAtt = parseCount(state.participants);
      state.cart.sessions.forEach(function (s) {
        var c = parseCount(s.perSessionIntake && s.perSessionIntake.participants);
        if (c > feeMaxAtt) feeMaxAtt = c;
      });
      var cleaningCents = ((cartIsEventForFee && feeSessionCount >= 2) || feeMaxAtt >= 35) ? 15000 : 0;
      var cleaningLine = cleaningCents > 0
        ? '<div class="summary-line summary-line-muted"><span>Cleaning fee' + (cartIsEventForFee && feeSessionCount >= 2 ? ' (multi-day event)' : '') + '</span><span>' + currency.format(cleaningCents / 100) + '</span></div>'
        : '';
      // Multi-day event discount (Drew 2026-07-13): $160 off per consecutive day
      // the event spans. Computed by the SAME pricing-shared fn the server uses,
      // so the number shown here is byte-for-byte the number that gets charged.
      var preDiscountTotal = totals.total + cleaningCents;
      var multiDayDiscount = cartIsEventForFee
        ? window.WWSPricing.multiDayDiscountCents(feeSessionCount, preDiscountTotal)
        : 0;
      var multiDayLine = multiDayDiscount > 0
        ? '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Multi-day discount (' + feeSessionCount + ' days × ' + mdRate() + ')</span><span class="ui-copy-strong">−' + currencyExact.format(multiDayDiscount / 100) + '</span></div>'
        : '';
      var feeInclusiveTotal = preDiscountTotal - multiDayDiscount;
      // Builder mode: a reviewed photo/multi-session cart total feeds the
      // override panel (multi-day events use the aside summary's number).
      if (BUILDER && state.eventMode !== "multi") state._builderTotalCents = feeInclusiveTotal;
      // Offer mode (DREW-21): the link's ownership adjustments apply on top of
      // the fee-inclusive cart total, and the charge locks to the signed number.
      var offerAdjCart = null;
      var offerLinesCart = '';
      var chargeCents = feeInclusiveTotal;
      if (offerActive()) {
        offerAdjCart = offerAdjustments(feeInclusiveTotal);
        offerLinesCart = offerLinesHtml(offerAdjCart);
        offerDriftCheck(offerAdjCart.finalCents);
        chargeCents = offerAdjCart.finalCents;
      }
      // Retail = sessions + add-ons with NO taper + cleaning. Savings = the taper +
      // the multi-day discount. retail - savings === feeInclusiveTotal by construction
      // (addonTotalFull - addonDiscount === addonTotal), so this is a re-grouping of
      // the existing arithmetic and does NOT move the charge.
      var retailSubtotal = totals.sessionTotal + totals.addonTotalFull + cleaningCents;
      var cartSavings = totals.addonDiscount + multiDayDiscount;
      var savingsSummary = cartSavings > 0
        ? '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Total savings</span><span class="ui-copy-strong">−' + currencyExact.format(cartSavings / 100) + '</span></div>'
        : '';
      totalsHtml =
        '<div class="booking-panel-soft p-5" style="margin-top:1rem">' +
          '<p class="ui-kicker" style="margin-bottom:1rem">Cart total</p>' +
          '<div class="summary-list">' +
            '<div class="summary-line"><span>Sessions</span><span>' + currency.format(totals.sessionTotal / 100) + '</span></div>' +
            '<div class="summary-line summary-line-muted"><span>Add-ons at retail</span><span>' + currencyExact.format(totals.addonTotalFull / 100) + '</span></div>' +
            cleaningLine +
            '<div class="summary-line"><span>Subtotal at retail</span><span>' + currencyExact.format(retailSubtotal / 100) + '</span></div>' +
            multiDayLine +
            discountLine +
            savingsSummary +
            offerLinesCart +
            '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
            '<div class="summary-line summary-total"><span><strong>Total</strong></span><span><strong>' + fmtMoney(chargeCents / 100) + '</strong></span></div>' +
          '</div>' +
          renderCartDepositRow(feeInclusiveTotal) +
        '</div>';
      // Stash so updatePayButton can label the cart pay button (fee-inclusive;
      // offer mode charges the signed adjusted total, always in full).
      state._grandTotal = (!OFFER && state.paymentMode === "deposit" && window.WWSPricing.depositSplit)
        ? window.WWSPricing.depositSplit(feeInclusiveTotal).depositCents / 100
        : chargeCents / 100;
    }

    container.innerHTML =
      '<div class="ui-row-start" style="margin-bottom:0.5rem">' +
        '<p class="ui-kicker">Your cart · ' + cartSessionCount() + ' sessions</p>' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="back-to-cart-edit" style="padding:0.4rem 0.8rem;font-size:0.8rem">+ Add / edit sessions</button>' +
      '</div>' +
      cards +
      totalsHtml;

    // The cart total just (re)set state._grandTotal — relabel the pay button.
    updatePayButton();
  }

  // Map one session snapshot (committed or active-draft) to the server cart
  // session payload shape: { appointmentTypeID, datetime, location, addons,
  // eventIntent, intake, participants, eventDescription, foodDrinks }.
  function snapshotToSessionPayload(s) {
    var pi = s.perSessionIntake || {};
    return {
      appointmentTypeID: appointmentTypeIdFor(s.durationId, s.location),
      datetime: s.selectedTime,
      location: s.location,
      addons: s.addons || {},
      eventIntent: s.eventIntent === "yes" ? "yes" : "no",
      intake: { business: pi.business || "", participants: pi.participants || "", purpose: pi.purpose || "", purposeOther: pi.purposeOther || "" },
      participants: pi.participants || "",
      eventDescription: pi.eventDescription || "",
      foodDrinks: s.foodDrinks != null ? s.foodDrinks : (state.foodDrinks != null ? state.foodDrinks : false)
    };
  }

  // Assemble the { sessions, universal, paymentMode } cart payload for
  // create-checkout. Sessions come from the committed cart; when the cart is
  // empty (single-session deposit) the active draft is the one session.
  function buildCartCheckoutBody(squareToken) {
    // Committed sessions PLUS the active draft (the draft is never committed
    // until pay, so it must be appended here). For the single-session deposit
    // path the committed list is empty and the draft is the only session.
    var snapshots = state.cart.sessions.slice();
    // Append the active draft only when it has a real slot (a fresh, un-slotted
    // draft after "Add another session" is not a bookable session).
    if (state.selectedTime) snapshots.push(snapshotActiveSession());
    var sessions = snapshots.map(snapshotToSessionPayload);
    return {
      sessions: sessions,
      // The signed offer token (DREW-21). When present the server rebuilds the
      // session list and the price from the TOKEN (never from the rows above),
      // verifies the signature + active-list, and charges the signed total.
      offerToken: OFFER ? OFFER_TOKEN : undefined,
      paymentMode: (OFFER || state.paymentMode !== "deposit") ? "full" : "deposit",
      universal: {
        contact: state.contact,
        intake: state.intake,
        // DREW-25: in offer mode the session rows above are discarded server-
        // side, so the customer's own Step-3 answers travel here for the Acuity
        // notes (participants for the record, food/drinks, and their event
        // description when Drew left it open). These never move the price — the
        // server prices the locked offer and pins the cleaning fee to Drew's
        // count.
        offerCustomer: OFFER ? {
          participants: state.participants || "",
          eventDescription: state.eventDescription || "",
          foodDrinks: state.foodDrinks
        } : undefined,
        waiverSigned: state.waiverSigned,
        termsSignature: state.termsSignature,
        emailAcknowledgment: state.emailAcknowledgment,
        cardholderName: (state.nameOnCard || "").trim(),
        // Carries a full-comp code (e.g. WWSHUNDRED) so the cart endpoint can
        // re-validate it and take the payment-free path. Non-comp codes are a
        // no-op on the cart path (cart pricing has no per-session discount).
        // Never on an offer — the price is the offer.
        couponCode: (!OFFER && state.coupon) ? state.coupon.code : "",
        squareToken: squareToken,
        clientIdempotencyKey: state.bookingAttemptId,
        consent: {
          cardOnFile: true,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      }
    };
  }

  // V3 item-6 (60/40 deposit + 40% auto-charge) is DARK on PRODUCTION until the
  // auto-charge scheduler is armed (Andrew's money gate). The deposit UI promises
  // the 40% balance is auto-charged 48h before the session, so it must not appear
  // to real customers until that promise can actually be kept. Until then the
  // deposit toggle renders on STAGING only; prod is full-payment. The server
  // enforces the same rule (create-checkout forces paymentMode to full off-staging
  // unless WWS_ITEM6_DEPOSIT_ARMED is set), so there is no way to reach the
  // uncollectable-balance state on prod. Remove this gate when item-6 is armed.
  function depositUiEnabled() {
    try { return window.location.hostname.indexOf("staging.") === 0; } catch (e) { return false; }
  }

  // Deposit option (V3 item 6) — pay 60% now — shown only when the cart contains
  // an event booking (deposit is event-only, enforced server-side too).
  function renderCartDepositRow(totalCents) {
    // Offer mode: always full payment — no deposit option on a locked offer.
    if (OFFER) {
      if (state.paymentMode === "deposit") state.paymentMode = "full";
      return "";
    }
    var cartHasEvent = state.cart.sessions.some(function (s) { return s.eventIntent === "yes"; })
      || state.eventIntent === "yes"; // include the active draft
    if (!depositUiEnabled() || !cartHasEvent || !window.WWSPricing || !window.WWSPricing.depositSplit) {
      if (state.paymentMode === "deposit") state.paymentMode = "full"; // can't deposit a non-event cart (or deposit UI is dark on prod)
      return "";
    }
    // totalCents is the fee-inclusive cart total, so the 60/40 split matches the
    // server (which computes the deposit on session + add-ons + cleaning fee).
    var split = window.WWSPricing.depositSplit(totalCents);
    return '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
      '<p class="ui-copy-strong" style="margin-bottom:0.5rem">Payment option</p>' +
      '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
        '<label class="helper-item"><input type="radio" name="cart-payment-mode" data-action="set-payment-mode" data-mode="full"' + (state.paymentMode !== "deposit" ? " checked" : "") + '><span>Pay in full now — ' + fmtMoney(totalCents / 100) + '</span></label>' +
        '<label class="helper-item"><input type="radio" name="cart-payment-mode" data-action="set-payment-mode" data-mode="deposit"' + (state.paymentMode === "deposit" ? " checked" : "") + '><span>Pay 60% deposit now — ' + fmtMoney(split.depositCents / 100) + ' (Balance ' + fmtMoney(split.balanceDueCents / 100) + ' will be auto-charged to the card on file 48 hours before session start)</span></label>' +
      '</div>';
  }

  // Pre-fill the promo field from the URL. Campaign emails link to
  // /book-powdersville?promo=<CODE> (param `promo`, with `coupon`/`code` as
  // aliases). Trim + uppercase (codes are uppercase) and stash into couponInput
  // so the field renders pre-filled; auto-apply happens after a slot is picked
  // (see the "select-time" handler). No-op when no param is present. Uses
  // window.location because `location` is the booking-config object here.
  try {
    var promoParams = new URLSearchParams(window.location.search);
    var promoFromUrl = promoParams.get("promo") || promoParams.get("coupon") || promoParams.get("code");
    if (promoFromUrl) {
      state.couponInput = promoFromUrl.trim().toUpperCase();
    }
  } catch (e) { /* URLSearchParams unsupported — silently skip pre-fill */ }

  // Promo campaign gate — only show the promo-code field when a campaign is
  // live for this location (server computes promoActive from the COUPONS env).
  // Safe default: stays hidden if the request fails or no campaign is active.
  fetch("/api/booking-public-config?location=" + encodeURIComponent(location.slug))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (cfg && cfg.promoActive) {
        state.promoActive = true;
        if (document.querySelector("[data-checkout-summary]")) renderCheckoutPanel();
      }
    })
    .catch(function () {});

  // PostHog funnel tracking helper — safe to call even if consent was declined
  function trackEvent(name, props) {
    if (typeof posthog !== "undefined" && posthog.capture) {
      posthog.capture(name, props);
    }
  }

  // ---- Builder mode: override panel + Save Session (DREW-17) ---------------
  // Everything below only runs when window.WWS_BUILDER_MODE is set (the
  // wws-dashboard Session Builder embed). The panel renders into
  // [data-builder-panel] — a container the dashboard wrapper injects into the
  // aside — so on the customer site (no container, no flag) this is inert.
  // Ownership add-on and discount applied in the operator-chosen order
  // (DREW-19). Percent values are taken of the RUNNING total at the point
  // they apply, so swapping the order genuinely changes the math:
  //   add-on first:  final = (base + addon(base)) − discount(base + addon)
  //   discount first: final = (base − discount(base)) + addon(base − discount)
  // The math itself lives in pricing-shared.ownershipAdjustments — the ONE
  // implementation this panel, the dashboard's server recompute, and the
  // offer-link charge path (create-checkout) all share (DREW-21).
  function builderAdjustedTotals() {
    var base = state._builderTotalCents || 0;
    var addonFirst = state._builderOrder !== "discount-first";
    var adj = window.WWSPricing.ownershipAdjustments(
      base,
      state._builderAddon ? { mode: state._builderAddon.mode, value: parseFloat(state._builderAddon.value) } : null,
      state._builderOverride ? { mode: state._builderOverride.mode, value: parseFloat(state._builderOverride.value) } : null,
      addonFirst ? "addon-first" : "discount-first"
    );
    return {
      baseCents: base,
      addonFirst: addonFirst,
      addonCents: adj.addonCents,
      discountCents: adj.discountCents,
      finalCents: adj.finalCents
    };
  }

  // ---- Offer mode helpers (DREW-21) ----------------------------------------
  // Offer rendering + the drift gate only make sense AFTER initOfferMode has
  // restored the link's flow state — the boot sequence renders once with
  // default state before the deferred restore runs, and comparing the signed
  // total against defaults would false-alarm the drift gate.
  function offerActive() {
    return !!OFFER && !!state._offerReady;
  }

  // The ownership adjustments carried by the signed link, computed on the LIVE
  // client base so any drift between today's pricing and the signed final total
  // is caught (offerDriftCheck) before the customer reaches payment.
  function offerAdjustments(baseCents) {
    return window.WWSPricing.ownershipAdjustments(
      baseCents,
      OFFER.ownershipAddon || null,
      OFFER.override || null,
      OFFER.applyOrder === "discount-first" ? "discount-first" : "addon-first"
    );
  }

  // Ownership summary lines + customer-visible notes for the offer summary —
  // same visual language the builder panel uses, in apply order.
  function offerLinesHtml(adj) {
    var addonNote = OFFER.ownershipAddon && OFFER.ownershipAddon.note ? String(OFFER.ownershipAddon.note) : "";
    var discountNote = OFFER.override && OFFER.override.note ? String(OFFER.override.note) : "";
    var addonLine = adj.addonCents > 0
      ? '<div class="summary-line" style="color:#1e40af"><span class="ui-copy-strong">Ownership add-on</span><span class="ui-copy-strong">+' + currencyExact.format(adj.addonCents / 100) + '</span></div>' +
        (addonNote ? '<p class="ui-copy-muted" style="font-size:0.78rem;font-style:italic;margin:0.1rem 0 0">' + escapeHtml(addonNote) + '</p>' : '')
      : '';
    var discountLine = adj.discountCents > 0
      ? '<div class="summary-line" style="color:#166534"><span class="ui-copy-strong">Ownership discount</span><span class="ui-copy-strong">−' + currencyExact.format(adj.discountCents / 100) + '</span></div>' +
        (discountNote ? '<p class="ui-copy-muted" style="font-size:0.78rem;font-style:italic;margin:0.1rem 0 0">' + escapeHtml(discountNote) + '</p>' : '')
      : '';
    return OFFER.applyOrder === "discount-first" ? discountLine + addonLine : addonLine + discountLine;
  }

  // Fail-loud drift gate: the locked total the link promises must equal what
  // today's pricing computes for the same build. A mismatch means prices moved
  // since Drew signed the link (or the build was tampered with) — never show or
  // charge a number that no longer adds up; the server enforces the same check.
  function offerDriftCheck(computedFinalCents) {
    if (!offerActive()) return true;
    if (computedFinalCents === OFFER.finalTotalCents) return true;
    showOfferErrorPanel("changed");
    return false;
  }

  // The sessions being built, as plain per-day rows for the saved config. The
  // dashboard recomputes the total server-side from these (never trusts ours).
  function builderSessions() {
    var raw = state.cart.sessions.slice();
    if (state.selectedTime) raw.push(snapshotActiveSession());
    if (!raw.length) raw.push(snapshotActiveSession()); // duration-only build
    return raw.map(function (s) {
      return {
        durationId: s.durationId || "",
        selectedDate: s.selectedDate || "",
        selectedTime: s.selectedTime || "",
        mdRole: s._mdRole || "",
        mdTimeLabel: s._mdTimeLabel || "",
        addons: JSON.parse(JSON.stringify(s.addons || {}))
      };
    });
  }

  // Max attendee count across the build — drives the cleaning fee server-side,
  // mirroring the fee logic in renderCartSummary/getCleaningFee.
  function builderParticipants() {
    var max = Math.max(parseCount(state.participants), parseCount(state.intake.participants));
    state.cart.sessions.forEach(function (s) {
      var c = parseCount(s.perSessionIntake && s.perSessionIntake.participants);
      if (c > max) max = c;
    });
    return max;
  }

  // Raw flow-state snapshot (whitelisted fields only) so a saved session can be
  // loaded straight back into this exact flow later.
  function builderSnapshotFlowState() {
    return JSON.parse(JSON.stringify({
      step: state.step,
      bookingType: state.bookingType,
      eventMode: state.eventMode,
      _dayRole: state._dayRole,
      _multidayFixedTime: state._multidayFixedTime,
      _eventDurationId: state._eventDurationId,
      _eventStartDate: state._eventStartDate,
      _eventEndDate: state._eventEndDate,
      _lastDayDurationId: state._lastDayDurationId,
      durationId: state.durationId,
      eventIntent: state.eventIntent,
      participants: state.participants,
      eventDescription: state.eventDescription,
      foodDrinks: state.foodDrinks,
      highTrafficNote: state.highTrafficNote,
      addons: state.addons,
      cart: { sessions: state.cart.sessions },
      _cartReviewing: state._cartReviewing,
      selectedDate: state.selectedDate,
      selectedTime: state.selectedTime,
      intake: { participants: state.intake.participants, business: state.intake.business }
    }));
  }

  function builderAdjustmentPayload(adj, defaultMode) {
    if (!adj) return null;
    var v = parseFloat(adj.value);
    if (!isFinite(v) || v <= 0) return null;
    var out = {
      mode: adj.mode === "percent" || adj.mode === "dollar" ? adj.mode : defaultMode,
      value: v
    };
    var note = (adj.note || "").trim().slice(0, 300);
    if (note) out.note = note;
    return out;
  }

  function builderSavePayload() {
    var override = builderAdjustmentPayload(state._builderOverride, "percent");
    var ownershipAddon = builderAdjustmentPayload(state._builderAddon, "dollar");
    return {
      name: (state._builderName || "").trim(),
      notes: (state._builderNotes || "").trim() || null,
      config: {
        kind: "flow-v2",
        locationSlug: location.slug,
        bookingType: state.eventIntent === "yes" || state.bookingType === "event" ? "event" : "single",
        eventMode: state.eventMode || "",
        participants: builderParticipants(),
        override: override,
        ownershipAddon: ownershipAddon,
        applyOrder: state._builderOrder === "discount-first" ? "discount-first" : "addon-first",
        sessions: builderSessions(),
        flowState: builderSnapshotFlowState()
      }
    };
  }

  function builderSaveDraft() {
    var payload = builderSavePayload();
    if (!payload.name) {
      state._builderStatus = "Give this session a name before saving.";
      state._builderStatusError = true;
      renderBuilderPanel();
      return;
    }
    state._builderSaving = true;
    state._builderStatus = "";
    state._builderStatusError = false;
    renderBuilderPanel();
    var isUpdate = !!state._builderDraftId;
    var url = isUpdate ? "/api/session-drafts/" + state._builderDraftId : "/api/session-drafts";
    fetch(url, {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        state._builderSaving = false;
        if (res.ok && res.body && res.body.ok) {
          if (res.body.draft && res.body.draft.id) state._builderDraftId = res.body.draft.id;
          state._builderStatus = isUpdate ? "Session updated." : "Session saved.";
          state._builderStatusError = false;
          // A config re-save revokes any prior link server-side — drop the
          // stale URL so the operator regenerates from the new saved version.
          state._builderLinkUrl = "";
          state._builderLinkCopied = false;
          try { window.parent.postMessage({ type: "wws-builder-saved" }, "*"); } catch (e) {}
        } else {
          state._builderStatus = (res.body && res.body.error) ? "Save failed: " + res.body.error : "Save failed. Try again.";
          state._builderStatusError = true;
        }
        renderBuilderPanel();
      })
      .catch(function () {
        state._builderSaving = false;
        state._builderStatus = "Save failed. Check the connection and try again.";
        state._builderStatusError = true;
        renderBuilderPanel();
      });
  }

  function renderBuilderPanel() {
    var el = document.querySelector("[data-builder-panel]");
    if (!el) return;
    if (!state._builderOverride) state._builderOverride = { mode: "percent", value: "", note: "" };
    if (!state._builderAddon) state._builderAddon = { mode: "dollar", value: "", note: "" };
    if (!state._builderOrder) state._builderOrder = "addon-first";
    var ov = state._builderOverride;
    var ad = state._builderAddon;
    var t = builderAdjustedTotals();

    var startNew = state._builderDraftId
      ? '<button type="button" class="booking-back-link" data-builder-new style="margin-top:0.75rem">Start a new saved session instead of updating this one</button>'
      : "";

    // The two adjustment sections AND their summary lines render in APPLY
    // order, so the swap button visibly re-orders the very logic it swaps.
    var discountSection =
      '<p class="text-xs tracking-[0.2em] uppercase text-black/40" style="margin-top:1.1rem">Ownership discount</p>' +
      '<div style="display:flex;gap:0.5rem;margin-top:0.85rem">' +
        '<button type="button" class="booking-button ' + (ov.mode === "percent" ? "booking-button-primary" : "booking-button-secondary") + '" data-builder-mode="percent" style="padding:0.45rem 0.9rem;font-size:0.8rem">% off</button>' +
        '<button type="button" class="booking-button ' + (ov.mode === "dollar" ? "booking-button-primary" : "booking-button-secondary") + '" data-builder-mode="dollar" style="padding:0.45rem 0.9rem;font-size:0.8rem">$ off</button>' +
        '<input type="number" class="booking-input" data-builder-value inputmode="decimal" min="0" step="any" placeholder="' + (ov.mode === "percent" ? "e.g. 20" : "e.g. 150") + '" value="' + escapeAttribute(String(ov.value || "")) + '" style="flex:1;min-width:0">' +
      '</div>' +
      '<input type="text" class="booking-input" data-builder-ov-note maxlength="300" placeholder="Optional note the customer sees, e.g. why this discount" value="' + escapeAttribute(ov.note || "") + '" style="margin-top:0.5rem;font-size:0.85rem">';

    var addonSection =
      '<p class="text-xs tracking-[0.2em] uppercase text-black/40" style="margin-top:1.1rem">Ownership add-on</p>' +
      '<div style="display:flex;gap:0.5rem;margin-top:0.85rem">' +
        '<button type="button" class="booking-button ' + (ad.mode === "percent" ? "booking-button-primary" : "booking-button-secondary") + '" data-builder-addon-mode="percent" style="padding:0.45rem 0.9rem;font-size:0.8rem">% added</button>' +
        '<button type="button" class="booking-button ' + (ad.mode === "dollar" ? "booking-button-primary" : "booking-button-secondary") + '" data-builder-addon-mode="dollar" style="padding:0.45rem 0.9rem;font-size:0.8rem">$ added</button>' +
        '<input type="number" class="booking-input" data-builder-addon-value inputmode="decimal" min="0" step="any" placeholder="' + (ad.mode === "percent" ? "e.g. 10" : "e.g. 1000") + '" value="' + escapeAttribute(String(ad.value || "")) + '" style="flex:1;min-width:0">' +
      '</div>' +
      '<input type="text" class="booking-input" data-builder-addon-note maxlength="300" placeholder="Optional note the customer sees, e.g. what this covers" value="' + escapeAttribute(ad.note || "") + '" style="margin-top:0.5rem;font-size:0.85rem">';

    var swapButton =
      '<button type="button" class="booking-back-link" data-builder-swap style="margin-top:1rem;display:block">&#8645; Swap order &mdash; ' +
        (t.addonFirst ? "add-on applies first, then the discount" : "discount applies first, then the add-on") +
      '</button>';

    var adNoteText = (ad.note || "").trim();
    var ovNoteText = (ov.note || "").trim();
    var addonLine =
      '<div class="summary-line" style="color:#1e40af' + (t.addonCents > 0 ? "" : ";display:none") + '" data-builder-ad-line><span class="ui-copy-strong">Ownership add-on</span><span class="ui-copy-strong" data-builder-ad>+' + currencyExact.format(t.addonCents / 100) + '</span></div>' +
      '<p class="ui-copy-muted" data-builder-ad-note-line style="font-size:0.78rem;font-style:italic;margin:0.1rem 0 0' + (t.addonCents > 0 && adNoteText ? "" : ";display:none") + '">' + escapeHtml(adNoteText) + '</p>';
    var discountLine =
      '<div class="summary-line" style="color:#166534' + (t.discountCents > 0 ? "" : ";display:none") + '" data-builder-ov-line><span class="ui-copy-strong">Ownership discount</span><span class="ui-copy-strong" data-builder-ov>−' + currencyExact.format(t.discountCents / 100) + '</span></div>' +
      '<p class="ui-copy-muted" data-builder-ov-note-line style="font-size:0.78rem;font-style:italic;margin:0.1rem 0 0' + (t.discountCents > 0 && ovNoteText ? "" : ";display:none") + '">' + escapeHtml(ovNoteText) + '</p>';

    el.innerHTML =
      '<div class="summary-divider my-6"></div>' +
      (t.addonFirst ? addonSection + swapButton + discountSection : discountSection + swapButton + addonSection) +
      '<div class="summary-list" style="margin-top:1rem">' +
        '<div class="summary-line"><span>Customer total</span><span data-builder-base>' + fmtMoney(t.baseCents / 100) + '</span></div>' +
        (t.addonFirst ? addonLine + discountLine : discountLine + addonLine) +
        '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
        '<div class="summary-line summary-total"><span><strong>Final total</strong></span><strong data-builder-final>' + fmtMoney(t.finalCents / 100) + '</strong></div>' +
      '</div>' +
      '<div class="summary-divider my-6"></div>' +
      '<label class="ui-field-label" style="font-size:0.8rem">Session name</label>' +
      '<input type="text" class="booking-input" data-builder-name maxlength="120" placeholder="e.g. October 3–5 brand shoot" value="' + escapeAttribute(state._builderName || "") + '" style="margin-top:0.35rem">' +
      '<label class="ui-field-label" style="font-size:0.8rem;display:block;margin-top:0.75rem">Notes (only you see these)</label>' +
      '<textarea class="booking-input" data-builder-notes rows="2" maxlength="2000" placeholder="Anything worth remembering about this build" style="margin-top:0.35rem;resize:vertical">' + escapeHtml(state._builderNotes || "") + '</textarea>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1rem">' +
        '<button type="button" class="booking-button booking-button-primary" data-builder-save' + (state._builderSaving ? " disabled" : "") + '>' + (state._builderSaving ? "Saving…" : (state._builderDraftId ? "Update Session" : "Save Session")) + '</button>' +
        '<button type="button" class="booking-button booking-button-secondary" data-builder-link' + (state._builderLinkPending ? " disabled" : "") + '>' + (state._builderLinkPending ? "Generating…" : "Get Session Link") + '</button>' +
      '</div>' +
      (state._builderLinkUrl
        ? '<div style="margin-top:0.85rem">' +
            '<div style="display:flex;gap:0.5rem">' +
              '<input type="text" class="booking-input" data-builder-link-url readonly value="' + escapeAttribute(state._builderLinkUrl) + '" style="flex:1;min-width:0;font-size:0.78rem">' +
              '<button type="button" class="booking-button booking-button-secondary" data-builder-link-copy style="white-space:nowrap;padding:0.45rem 0.9rem;font-size:0.8rem">' + (state._builderLinkCopied ? "Copied ✓" : "Copy") + '</button>' +
            '</div>' +
            '<p class="ui-copy-muted" style="font-size:0.75rem;margin-top:0.4rem">Anyone with this link can book this exact session at this exact price. It sells the SAVED version of this session. Generating a new link replaces the old one; deleting the session kills the link.</p>' +
          '</div>'
        : "") +
      startNew +
      (state._builderStatus
        ? '<p class="ui-copy-muted" role="status" style="margin-top:0.6rem;font-size:0.8rem' + (state._builderStatusError ? ";color:#b3261e" : ";color:#166534") + '">' + escapeHtml(state._builderStatus) + '</p>'
        : "");

    // Targeted listeners (builder-only; the global data-action bus stays untouched).
    // Value/note inputs update the summary numbers IN PLACE so typing never
    // loses focus to a re-render; mode/swap buttons re-render the whole panel.
    function updateBuilderNumbers() {
      var n = builderAdjustedTotals();
      var noteA = (state._builderAddon.note || "").trim();
      var noteO = (state._builderOverride.note || "").trim();
      var adLine = el.querySelector("[data-builder-ad-line]");
      var adEl = el.querySelector("[data-builder-ad]");
      var adNote = el.querySelector("[data-builder-ad-note-line]");
      var ovLine = el.querySelector("[data-builder-ov-line]");
      var ovEl = el.querySelector("[data-builder-ov]");
      var ovNote = el.querySelector("[data-builder-ov-note-line]");
      var fin = el.querySelector("[data-builder-final]");
      if (adLine) adLine.style.display = n.addonCents > 0 ? "" : "none";
      if (adEl) adEl.textContent = "+" + currencyExact.format(n.addonCents / 100);
      if (adNote) {
        adNote.textContent = noteA;
        adNote.style.display = n.addonCents > 0 && noteA ? "" : "none";
      }
      if (ovLine) ovLine.style.display = n.discountCents > 0 ? "" : "none";
      if (ovEl) ovEl.textContent = "−" + currencyExact.format(n.discountCents / 100);
      if (ovNote) {
        ovNote.textContent = noteO;
        ovNote.style.display = n.discountCents > 0 && noteO ? "" : "none";
      }
      if (fin) fin.textContent = fmtMoney(n.finalCents / 100);
    }
    el.querySelectorAll("[data-builder-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state._builderOverride.mode = btn.dataset.builderMode === "dollar" ? "dollar" : "percent";
        renderBuilderPanel();
      });
    });
    el.querySelectorAll("[data-builder-addon-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state._builderAddon.mode = btn.dataset.builderAddonMode === "percent" ? "percent" : "dollar";
        renderBuilderPanel();
      });
    });
    var swapBtn = el.querySelector("[data-builder-swap]");
    if (swapBtn) swapBtn.addEventListener("click", function () {
      state._builderOrder = state._builderOrder === "discount-first" ? "addon-first" : "discount-first";
      renderBuilderPanel();
    });
    var valueInput = el.querySelector("[data-builder-value]");
    if (valueInput) {
      valueInput.addEventListener("input", function () {
        state._builderOverride.value = valueInput.value;
        updateBuilderNumbers();
      });
    }
    var addonValueInput = el.querySelector("[data-builder-addon-value]");
    if (addonValueInput) {
      addonValueInput.addEventListener("input", function () {
        state._builderAddon.value = addonValueInput.value;
        updateBuilderNumbers();
      });
    }
    var ovNoteInput = el.querySelector("[data-builder-ov-note]");
    if (ovNoteInput) {
      ovNoteInput.addEventListener("input", function () {
        state._builderOverride.note = ovNoteInput.value;
        updateBuilderNumbers();
      });
    }
    var addonNoteInput = el.querySelector("[data-builder-addon-note]");
    if (addonNoteInput) {
      addonNoteInput.addEventListener("input", function () {
        state._builderAddon.note = addonNoteInput.value;
        updateBuilderNumbers();
      });
    }
    var nameInput = el.querySelector("[data-builder-name]");
    if (nameInput) nameInput.addEventListener("input", function () { state._builderName = nameInput.value; });
    var notesInput = el.querySelector("[data-builder-notes]");
    if (notesInput) notesInput.addEventListener("input", function () { state._builderNotes = notesInput.value; });
    var saveBtn = el.querySelector("[data-builder-save]");
    if (saveBtn) saveBtn.addEventListener("click", builderSaveDraft);
    var linkBtn = el.querySelector("[data-builder-link]");
    if (linkBtn) linkBtn.addEventListener("click", builderGetLink);
    var linkCopyBtn = el.querySelector("[data-builder-link-copy]");
    if (linkCopyBtn) linkCopyBtn.addEventListener("click", function () {
      var urlInput = el.querySelector("[data-builder-link-url]");
      var url = urlInput ? urlInput.value : state._builderLinkUrl;
      function done() { state._builderLinkCopied = true; renderBuilderPanel(); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () {
          if (urlInput) { urlInput.select(); document.execCommand("copy"); done(); }
        });
      } else if (urlInput) {
        urlInput.select();
        document.execCommand("copy");
        done();
      }
    });
    var newBtn = el.querySelector("[data-builder-new]");
    if (newBtn) newBtn.addEventListener("click", function () {
      state._builderDraftId = null;
      state._builderStatus = "";
      state._builderLinkUrl = "";
      state._builderLinkCopied = false;
      renderBuilderPanel();
    });
  }

  // Get Session Link (DREW-21, Phase 2): asks the dashboard to sign the SAVED
  // draft into a locked customer link. The dashboard recomputes the price
  // server-side, signs the payload, and activates the link in the booking
  // site's Edge Config allow-list — so the URL that comes back is live the
  // moment it appears here.
  function builderGetLink() {
    if (!state._builderDraftId) {
      state._builderStatus = "Save the session first — the link is generated from the saved version.";
      state._builderStatusError = true;
      renderBuilderPanel();
      return;
    }
    state._builderLinkPending = true;
    state._builderLinkCopied = false;
    state._builderStatus = "";
    state._builderStatusError = false;
    renderBuilderPanel();
    fetch("/api/session-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: state._builderDraftId })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        state._builderLinkPending = false;
        if (res.ok && res.body && res.body.ok && res.body.url) {
          state._builderLinkUrl = res.body.url;
        } else {
          state._builderStatus = (res.body && res.body.error) ? "Link failed: " + res.body.error : "Link failed. Try again.";
          state._builderStatusError = true;
        }
        renderBuilderPanel();
      })
      .catch(function () {
        state._builderLinkPending = false;
        state._builderStatus = "Link failed. Check the connection and try again.";
        state._builderStatusError = true;
        renderBuilderPanel();
      });
  }

  // Rehydrate a saved flow-state snapshot (builderSnapshotFlowState shape) into
  // the live flow. Shared by the builder's Load (below) and offer mode (DREW-21),
  // so a link restores the customer into EXACTLY the build Drew saved.
  function applyFlowState(fs) {
    if (!fs || typeof fs !== "object") return;
    [
      "bookingType", "eventMode", "_dayRole", "_multidayFixedTime",
      "_eventDurationId", "_eventStartDate", "_eventEndDate",
      "_lastDayDurationId", "durationId", "eventIntent", "participants",
      "eventDescription", "foodDrinks", "highTrafficNote",
      "_cartReviewing", "selectedDate", "selectedTime"
    ].forEach(function (k) { if (fs[k] !== undefined) state[k] = fs[k]; });
    state.addons = {};
    location.addons.forEach(function (a) {
      state.addons[a.id] = (fs.addons && fs.addons[a.id])
        ? JSON.parse(JSON.stringify(fs.addons[a.id]))
        : getInitialAddonState(a);
    });
    state.cart.sessions = fs.cart && Array.isArray(fs.cart.sessions)
      ? JSON.parse(JSON.stringify(fs.cart.sessions))
      : [];
    if (fs.intake && typeof fs.intake === "object") {
      state.intake.participants = fs.intake.participants || "";
      state.intake.business = fs.intake.business || "";
    }
    state._gateChoosingEventMode = false;
    state.availableDates = [];
    state.availableTimes = [];
  }

  // Load a saved session back into the live flow. Called by the dashboard
  // wrapper (builder-mode.js) when the operator hits Load on a saved draft.
  if (BUILDER) {
    window.WWSBuilderAPI = {
      restore: function (fs, meta) {
        if (!fs || typeof fs !== "object") return;
        applyFlowState(fs);
        if (meta && typeof meta === "object") {
          state._builderDraftId = meta.id || null;
          state._builderName = meta.name || "";
          state._builderNotes = meta.notes || "";
          state._builderOverride = meta.override
            ? { mode: meta.override.mode === "dollar" ? "dollar" : "percent", value: String(meta.override.value || ""), note: meta.override.note ? String(meta.override.note) : "" }
            : { mode: "percent", value: "", note: "" };
          state._builderAddon = meta.ownershipAddon
            ? { mode: meta.ownershipAddon.mode === "percent" ? "percent" : "dollar", value: String(meta.ownershipAddon.value || ""), note: meta.ownershipAddon.note ? String(meta.ownershipAddon.note) : "" }
            : { mode: "dollar", value: "", note: "" };
          state._builderOrder = meta.applyOrder === "discount-first" ? "discount-first" : "addon-first";
          state._builderStatus = "";
          state._builderLinkUrl = "";
          state._builderLinkCopied = false;
        }
        showGateOrFlow();
        setStep(clamp(Number(fs.step) || BUILDER_MAX_STEP, 1, BUILDER_MAX_STEP));
      }
    };
  }

  // ---- Offer mode boot pieces (DREW-21) ------------------------------------
  // Visual lock: gray + inert every control the offer freezes. The functional
  // lock is the action/input/change guards above — this CSS is the "grayed out"
  // Drew asked for, and survives every re-render because it keys off a body
  // class instead of per-element attributes.
  function injectOfferStyles() {
    // Idempotent: the short-link path (DREW-24) may inject these for the loading
    // or stop overlay before initOfferMode runs, and again inside initOfferMode.
    if (document.querySelector("style[data-offer-styles]")) return;
    var sels = Object.keys(OFFER_LOCKED_ACTIONS).map(function (a) {
      return 'body.wws-offer-mode [data-action="' + a + '"]';
    }).concat(OFFER_LOCKED_INPUTS.map(function (s) {
      return "body.wws-offer-mode " + s;
    })).concat(OFFER_LOCKED_CHECKS.map(function (s) {
      return "body.wws-offer-mode " + s;
    }));
    var css = sels.join(",\n") + " { pointer-events: none; opacity: 0.55; cursor: default; }" +
      "\nbody.wws-offer-mode .offer-banner { background:#0f172a; color:#f8fafc; border-radius:0.75rem; padding:1rem 1.25rem; margin:0 0 1.25rem; }" +
      "\nbody.wws-offer-mode .offer-banner p { margin:0; }" +
      "\n.offer-error-overlay { position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,0.55); display:flex; align-items:center; justify-content:center; padding:1.5rem; }" +
      "\n.offer-error-card { background:#fff; border-radius:1rem; max-width:28rem; width:100%; padding:2rem; text-align:center; box-shadow:0 25px 60px rgba(0,0,0,0.25); }";
    var tag = document.createElement("style");
    tag.setAttribute("data-offer-styles", "1");
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  // Full-screen stop card. Used when the link is unusable (bad copy/paste,
  // revoked by Drew, or pricing drifted since it was signed). An overlay — not
  // an inline swap — so no later re-render can accidentally resurrect the flow.
  function showOfferErrorPanel(reason) {
    if (document.querySelector(".offer-error-overlay")) return;
    injectOfferStyles(); // idempotent — ensures overlay CSS exists on the short-link path too
    var copy;
    if (reason === "revoked") {
      copy = "This session link is no longer active. White Wall may have updated your offer — reach out to the person who sent it and they will send you a fresh link.";
    } else if (reason === "changed") {
      copy = "This offer's pricing has changed since the link was created, so we can't honor it as-is. Contact White Wall and they will send you an updated link.";
    } else if (reason === "unavailable") {
      copy = "We can't verify this session link right now. Please try again in a few minutes.";
    } else {
      copy = "This session link isn't valid. It may have been cut short when it was copied or forwarded. Ask White Wall to resend it.";
    }
    var overlay = document.createElement("div");
    overlay.className = "offer-error-overlay";
    overlay.innerHTML =
      '<div class="offer-error-card">' +
        '<p class="ui-kicker" style="margin-bottom:0.75rem">Custom session link</p>' +
        '<p class="ui-copy-strong" style="margin-bottom:0.75rem">' + escapeHtml(copy) + '</p>' +
        '<p class="ui-copy-muted" style="font-size:0.85rem">You can also book normally at whitewallstudios.co.</p>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function renderOfferBanner() {
    var anchor = document.querySelector("[data-progress]");
    if (!anchor || document.querySelector(".offer-banner")) return;
    var who = OFFER.name ? " — " + escapeHtml(String(OFFER.name)) : "";
    anchor.insertAdjacentHTML("beforebegin",
      '<div class="offer-banner">' +
        '<p class="ui-copy-strong" style="color:#f8fafc">A custom session prepared for you by White Wall Studios' + who + '</p>' +
        '<p style="font-size:0.85rem;opacity:0.85;margin-top:0.35rem">Everything below is already set up for you — the dates, times, add-ons, and your custom price are locked. Just add your details, sign, and pay. Want a change? Reply to the person who sent you this link.</p>' +
      '</div>');
  }

  // DREW-24: a short link (?offer=<draftId>) has to fetch its token before the
  // locked flow can render. Cover the un-prefilled flow with a light overlay for
  // that ~50-100ms so the customer never sees the normal booking page flash.
  // Self-contained inline styles — injectOfferStyles() has not run yet here.
  function showOfferLoadingPanel() {
    if (document.querySelector(".offer-loading-overlay")) return;
    var overlay = document.createElement("div");
    overlay.className = "offer-loading-overlay";
    overlay.setAttribute("style", "position:fixed;inset:0;z-index:9999;background:#f8f7f4;display:flex;align-items:center;justify-content:center;padding:1.5rem;");
    overlay.innerHTML =
      '<div style="text-align:center;max-width:24rem">' +
        '<p class="ui-kicker" style="margin-bottom:0.75rem">Custom session link</p>' +
        '<p class="ui-copy-strong">Loading your session…</p>' +
      '</div>';
    document.body.appendChild(overlay);
  }
  function removeOfferLoadingPanel() {
    var el = document.querySelector(".offer-loading-overlay");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function initOfferMode() {
    document.body.classList.add("wws-offer-mode");
    // DREW-25/26: the customer FILLS the Step-3 fields Drew did NOT prefill, so
    // only lock participants / event description when Drew locked them in the
    // builder (OFFER.lock* flags). Food/drinks and the required acknowledgements
    // are always the customer's to answer, so they are never locked here.
    // Pricing + scheduling stay fully locked (OFFER_LOCKED_ACTIONS unchanged).
    // Reassign BEFORE injectOfferStyles(), which reads these two lists.
    OFFER_LOCKED_INPUTS = ["[data-input='high-traffic-note']", "[data-input='coupon-code']"];
    if (OFFER.lockParticipants) {
      OFFER_LOCKED_INPUTS.push("[data-input='participants']", "[data-input='intake-participants']");
    }
    if (OFFER.lockEventDescription) {
      OFFER_LOCKED_INPUTS.push("[data-input='event-description']");
    }
    OFFER_LOCKED_CHECKS = ["[data-action='set-placement']", "[data-action='set-last-day-leave']"];
    injectOfferStyles();
    // Offers never mix with promos or deposits — the price IS the offer.
    state.coupon = null;
    state.couponInput = "";
    state.promoActive = false;
    state.paymentMode = "full";
    applyFlowState(OFFER.flowState);
    state._offerReady = true;
    // Keyboard belt-and-suspenders: readonly-by-interception, so a Tab-focused
    // locked input can't even change its visible text.
    document.addEventListener("beforeinput", function (e) {
      var t = e.target;
      if (t && t.matches && OFFER_LOCKED_INPUTS.some(function (s) { return t.matches(s); })) {
        e.preventDefault();
      }
    }, true);
    showGateOrFlow();
    // DREW-25 (reopened 2026-07-29): land the customer on the first step they
    // actually fill — Step 3 (Session details) — for EVERY offer type. Timing,
    // dates, times, add-ons, and price are all locked (OFFER_LOCKED_ACTIONS) and
    // already shown in the summary, so there is nothing for the customer to do on
    // Step 1 (Timing) or Step 2 (Schedule) — for events OR photo/video. The
    // original ship only skipped events to Step 3 and stranded photo/video offers
    // on the Step-2 date picker (Drew: "still trapping us at step two and not step
    // three ... it doesn't let you continue to Session details"). The locked
    // selectedDate/selectedTime rides the offer (dashboard refuses to mint a link
    // without one), so hasBookableSlot() is already satisfied and Step 3 renders
    // straight through to Waiver + Pay.
    setStep(3);
    renderOfferBanner();
    // Server verdict: signature + the dashboard's active-offer list. The render
    // above is optimistic; a bad verdict drops the stop card over it. A network
    // hiccup leaves the optimistic render — create-checkout re-verifies at pay,
    // so nothing can be charged off an unverified link either way.
    fetch("/api/validate-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: OFFER_TOKEN })
    })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        if (!j) return; // malformed response — treat as network hiccup
        if (!j.ok) showOfferErrorPanel(j.reason || "invalid");
      })
      .catch(function () {});
  }

  bindStaticContent();
  renderLocationSwitcher();
  renderProgress();
  renderStepContent();
  bindEvents();
  if (OFFER) {
    // Locked pre-filled flow — skips the gate entirely. Deferred one tick:
    // this boot block sits mid-file, and initOfferMode → setStep touches
    // consts (STEP_NAMES, …) whose assignments only execute after the rest of
    // the script evaluates. The original boot never called setStep
    // synchronously, so those late definitions were fine until offer mode.
    setTimeout(initOfferMode, 0);
  } else if (OFFER_SHORTID) {
    // DREW-24 short link: fetch the signed token from Edge Config, then run
    // offer mode exactly as a long link would. The loading overlay (shown now,
    // synchronously) covers the un-prefilled flow until the token resolves.
    // initOfferMode runs inside the async .then, well after the whole script
    // has evaluated, so no setTimeout is needed for the const-ordering reason.
    showOfferLoadingPanel();
    fetch("/api/resolve-offer?id=" + encodeURIComponent(OFFER_SHORTID))
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) { return { status: r.status, body: j }; });
      })
      .then(function (res) {
        var body = res.body;
        if (body && body.ok && body.token) {
          var p = decodeOfferToken(body.token);
          if (p) {
            OFFER = p;
            OFFER_TOKEN = body.token;
            removeOfferLoadingPanel();
            initOfferMode();
            return;
          }
          removeOfferLoadingPanel();
          showOfferErrorPanel("invalid");
          return;
        }
        removeOfferLoadingPanel();
        showOfferErrorPanel((body && body.reason) || (res.status === 404 ? "revoked" : "unavailable"));
      })
      .catch(function () {
        removeOfferLoadingPanel();
        showOfferErrorPanel("unavailable");
      });
  } else {
    showGateOrFlow(); // Step-1 gate: show "What are you booking?" until a type is chosen (PV); TM auto-resolves.
    if (OFFER_BROKEN) showOfferErrorPanel("invalid");
  }
  // Seed the initial history entry (replaceState) for the gate position, so the
  // first setStep() PUSHES a new entry rather than overwriting this one — that is
  // what makes browser Back from Step 1 return to the gate instead of leaving.
  pushFlowHistory();
  prefillFromAccount();

  trackEvent("booking_started", {
    location: location.slug,
    referrer: document.referrer
  });

  // Drew round-4 item 5: when a signed-in customer starts a NEW booking,
  // pre-fill their contact + intake fields from their account so they don't
  // retype what we already have. window.WWSAccount is provided by
  // /scripts/account.js (loaded on the booking page); for anonymous visitors the
  // helper returns null without loading the auth SDK. Only fills BLANK fields, so
  // anything the customer has already typed this session is never clobbered.
  // The inputs are static HTML driven by input events, so we mirror each value
  // into both `state` and the live input element.
  function prefillFromAccount() {
    if (!window.WWSAccount || typeof window.WWSAccount.getBookingPrefill !== "function") return;
    window.WWSAccount.getBookingPrefill().then(function (p) {
      if (!p) return;
      function fill(target, key, value, selector) {
        if (!value || target[key]) return; // don't overwrite what the customer typed
        target[key] = value;
        var el = document.querySelector(selector);
        if (el && !el.value) el.value = value;
      }
      fill(state.contact, "firstName", p.firstName, "[data-input='contact-first-name']");
      fill(state.contact, "lastName", p.lastName, "[data-input='contact-last-name']");
      fill(state.contact, "email", p.email, "[data-input='contact-email']");
      fill(state.contact, "phone", p.phone, "[data-input='contact-phone']");
      fill(state.intake, "business", p.business, "[data-input='intake-business']");
      fill(state.intake, "instagram", p.instagram, "[data-input='intake-instagram']");
      // Re-render so gates (terms/pay button) reflect the now-filled contact info.
      renderStepContent();
    }).catch(function () { /* never block booking on a profile hiccup */ });
  }

  window.addEventListener("resize", function() {
    var progress = document.querySelector("[data-progress]");
    if (progress) alignProgressTrack(progress, BUILDER ? BUILDER_MAX_STEP : 5);
  });

  function bindStaticContent() {
    setText("[data-location-name]", location.name);
    setText("[data-location-eyebrow]", location.eyebrow);
    setText("[data-location-description]", location.description);
    setText("[data-location-address]", location.address);

    renderLocationPolicies();
  }

  // "Good to know" sidebar list. For a MULTI-DAY event the attendee-based cleaning
  // clause is replaced by the multi-day one (Drew 2026-07-11: "It doesn't matter
  // the total number of attendees anymore"). Re-rendered from renderStepContent so
  // it updates the moment the customer chooses Multi-day event.
  function renderLocationPolicies() {
    const policyList = document.querySelector("[data-location-policies]");
    if (!policyList) return;
    var items = location.policies.map(function (item) {
      if (state.eventMode === "multi" && /35 or more attendees/i.test(item)) {
        return "Because this is a multi-day event, there is a mandatory $150 cleaning fee automatically added to the booking.";
      }
      return item;
    });
    // Multi-day discount (Drew 2026-07-13) — surfaced in Good to Know as well, so
    // the rule is visible from the moment they choose a multi-day event.
    if (state.eventMode === "multi") {
      items = items.concat([
        "Multi-day discount: you save " + mdRate() + " for every day your event runs, taken off your total automatically. A 3 day event saves " + mdSaves(3) + "."
      ]);
    }
    policyList.innerHTML = items
      .map(function (item) {
        return '<li class="helper-item">' +
          '<span class="helper-dot" style="background:' + location.accent + '"></span>' +
          '<span>' + item + '</span>' +
        '</li>';
      })
      .join("");
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) {
        return;
      }

      const action = actionTarget.dataset.action;

      if (OFFER && OFFER_LOCKED_ACTIONS[action]) {
        event.preventDefault();
        return;
      }

      // Step-1 "What are you booking?" gate (Drew 2026-07-10).
      if (action === "gate-choose") {
        if (actionTarget.dataset.type === "photo") {
          state.bookingType = "photo";
          state.eventIntent = "no";
          enterFlow();
        } else if (actionTarget.dataset.type === "event") {
          state._gateChoosingEventMode = true;
          renderGate();
        }
        return;
      }
      if (action === "gate-event-mode") {
        state.bookingType = "event";
        state.eventMode = actionTarget.dataset.mode === "multi" ? "multi" : "single";
        state.eventIntent = "yes";
        state._gateChoosingEventMode = false;
        enterFlow();
        return;
      }
      if (action === "gate-back") {
        state._gateChoosingEventMode = false;
        renderGate();
        return;
      }

      if (action === "select-duration") {
        state.durationId = actionTarget.dataset.durationId;
        // Multi-day RANGE flow: the pick is the DAY-ONE access time. Store it,
        // rebuild the event if a range is already chosen, and go to the range
        // calendar. Availability for this type loads on entering Step 2 (setStep).
        if (state.eventMode === "multi") {
          state._eventDurationId = state.durationId;
          state.availableDates = [];
          state.availableTimes = [];
          state.selectedDate = "";
          state.selectedTime = ""; // range flow never uses the single-slot fields
          if (state._eventStartDate && state._eventEndDate) buildEventRangeCart();
          setStep(2);
          return;
        }
        if (!currentDurationSupportsEvents()) {
          resetEventState();
          // Builder mode: the gate already answered photo vs event, and step 3
          // (add-ons) keys off eventIntent — re-derive it so a 1-hour pick
          // doesn't blank the add-on list.
          if (BUILDER && state.bookingType) {
            state.eventIntent = state.bookingType === "event" ? "yes" : "no";
          }
        }
        // Reset calendar state since availability changes per duration
        state.availableDates = [];
        state.availableTimes = [];
        state.selectedDate = "";
        state.selectedTime = "";
        var selDuration = getSelectedDuration();
        trackEvent("duration_selected", {
          location: location.slug,
          duration_id: state.durationId,
          duration_hours: selDuration ? selDuration.hours : null,
          price: selDuration ? selDuration.price : null
        });
        setStep(2);
        return;
      }

      if (action === "go-step") {
        if (actionTarget.disabled) return;
        const step = Number(actionTarget.dataset.step);
        const maxStep = getMaxAccessibleStep();
        if (step > maxStep) return; // can't skip ahead past incomplete steps
        setStep(step);
        return;
      }

      if (action === "toggle-addon") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        state.addons[addon.id].selected = !state.addons[addon.id].selected;
        renderStepContent();
        return;
      }

      if (action === "adjust-quantity") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        const delta = Number(actionTarget.dataset.delta);
        const nextQuantity = state.addons[addon.id].quantity + delta;
        state.addons[addon.id].quantity = clamp(nextQuantity, 0, addon.max);
        renderStepContent();
        return;
      }

      if (action === "set-quantity-max") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) return;
        state.addons[addon.id].quantity = state.addons[addon.id].quantity === addon.max ? 0 : addon.max;
        renderStepContent();
        return;
      }

      if (action === "set-tier") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        const tierId = actionTarget.dataset.tierId;
        state.addons[addon.id].selection = state.addons[addon.id].selection === tierId ? "" : tierId;
        renderStepContent();
        return;
      }

      if (action === "set-addon-mode") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        const mode = actionTarget.dataset.mode;
        state.addons[addon.id].mode = state.addons[addon.id].mode === mode ? "none" : mode;
        if (mode === "all") {
          if (addon.type === "backdrops") {
            state.addons[addon.id].colors = [];
          }
          if (addon.type === "walls") {
            state.addons[addon.id].walls = [];
          }
        }
        renderStepContent();
        return;
      }

      if (action === "toggle-color") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        const colorId = actionTarget.dataset.colorId;
        const addonState = state.addons[addon.id];
        addonState.mode = "single";
        addonState.colors = toggleArrayValue(addonState.colors, colorId);
        if (!addonState.colors.length) {
          addonState.mode = "none";
        }
        renderStepContent();
        return;
      }

      if (action === "toggle-wall") {
        const addon = getAddonById(actionTarget.dataset.addonId);
        if (!addon) {
          return;
        }
        const wallId = actionTarget.dataset.wallId;
        const addonState = state.addons[addon.id];
        addonState.mode = "single";
        addonState.walls = toggleArrayValue(addonState.walls, wallId);
        if (!addonState.walls.length) {
          addonState.mode = "none";
        }
        renderStepContent();
        return;
      }

      if (action === "select-date") {
        var date = actionTarget.dataset.date;
        // Multi-day RANGE flow: first click sets the START, second sets the END
        // (must be >= start) and auto-builds the event; an earlier second click
        // restarts the range from there; a third click starts a fresh range.
        if (state.eventMode === "multi") {
          if (!state._eventStartDate || state._eventEndDate) {
            state._eventStartDate = date;
            state._eventEndDate = "";
            state.cart.sessions = [];
          } else if (date < state._eventStartDate) {
            state._eventStartDate = date;
          } else {
            state._eventEndDate = date;
            buildEventRangeCart();
          }
          trackEvent("date_selected", { location: location.slug, date: date, event_range: "multi" });
          renderStepContent();
          return;
        }
        state.selectedDate = date;
        state.selectedTime = "";
        // Multi-day event day: the start time is fixed by the day role + option,
        // so we skip the time-slot picker and lock the slot, then show the
        // confirmation + next-step buttons.
        if (currentDayRole()) {
          lockMultidaySlot();
          trackEvent("date_selected", { location: location.slug, date: date });
          renderStepContent();
          return;
        }
        var aptId = getAppointmentTypeID();
        if (aptId) fetchAvailableTimes(aptId, date);
        trackEvent("date_selected", { location: location.slug, date: date });
        // Show Powdersville upsell on TM after first date selection
        if (locationSlug === "taylors-mill" && !state._pvUpsellShown) {
          state._pvUpsellShown = true;
          showPowdersvilleUpsell();
        }
        return;
      }

      if (action === "select-time") {
        state.selectedTime = actionTarget.dataset.time;
        trackEvent("time_selected", { location: location.slug, date: state.selectedDate, time: state.selectedTime });
        renderScheduleStep();
        // Auto-apply a URL-prefilled promo code exactly once, now that a slot
        // exists (applyCoupon needs selectedTime). The guard flag stops it from
        // re-firing if the customer picks another time or edits the code.
        // applyCoupon() handles its own success/error UI, so feedback matches
        // a manual Apply. No-op if nothing was prefilled or a code is applied.
        if (!state.couponAutoApplied && !state.coupon && !state.couponPending && (state.couponInput || "").trim()) {
          state.couponAutoApplied = true;
          applyCoupon();
        }
        return;
      }

      if (action === "navigate-month") {
        var delta = Number(actionTarget.dataset.delta);
        var currentMonth = new Date().toISOString().slice(0, 7);
        if (delta < 0 && state.calendarMonth <= currentMonth) return;
        var mParts = state.calendarMonth.split("-");
        var mDate = new Date(Number(mParts[0]), Number(mParts[1]) - 1 + delta, 1);
        state.calendarMonth = mDate.toISOString().slice(0, 7);
        var aptId2 = getAppointmentTypeID();
        if (aptId2) fetchAvailableDates(aptId2, state.calendarMonth);
        return;
      }

      if (action === "pay-and-book") {
        handlePayAndBook();
        return;
      }

      // Free-comp booking — same handler, takes the no-card branch internally.
      if (action === "comp-book") {
        handlePayAndBook();
        return;
      }

      // --- V3 item 2: multi-session cart actions ---------------------------
      if (action === "add-another-session") {
        addAnotherSession();
        return;
      }

      if (action === "review-cart") {
        // Show the review. The active draft is NOT committed here — the review
        // lists committed sessions PLUS the active draft as the final row, so
        // there's no double-commit when the user goes back to edit.
        state._cartReviewing = true;
        renderStepContent();
        scrollToCart();
        return;
      }

      // --- Multi-day event day-builder branch buttons (Drew 2026-07-11) --------
      if (action === "md-add-multiple") {
        // Commit the current day, then set up a MIDDLE full day ($980, 5 AM–10:30 PM).
        commitActiveSessionToCart();
        resetActiveDraft();
        state._dayRole = "middle";
        state.durationId = "pv-full";
        state.selectedDate = "";
        state.selectedTime = "";
        state._multidayFixedTime = "";
        state._cartReviewing = false;
        setStep(2); // middle days have no length choice — go straight to the date
        showToast("Day added. Pick the date for the next full day.");
        return;
      }
      if (action === "md-add-last") {
        // Commit the current day, then set up the LAST day (leave-time picker).
        commitActiveSessionToCart();
        resetActiveDraft();
        state._dayRole = "last";
        state.durationId = "";
        state.selectedDate = "";
        state.selectedTime = "";
        state._multidayFixedTime = "";
        state._cartReviewing = false;
        setStep(1); // last day: pick the leave time first
        showToast("Now set up your last day.");
        return;
      }
      // Multi-day RANGE flow (Drew 2026-07-11): dates are picked as a start→end
      // range; the cart is already auto-built by buildEventRangeCart, so review
      // goes STRAIGHT to details (no active-draft commit — there is no draft).
      if (action === "range-reset") {
        state._eventStartDate = "";
        state._eventEndDate = "";
        state.cart.sessions = [];
        renderStepContent();
        return;
      }
      // Back to the "What are you booking?" gate (Drew 2026-07-13). Clears the
      // booking type AND any half-built event so the customer can switch
      // Multi-day <-> Single-day, or Event <-> Photo/Video, without reloading.
      if (action === "gate-restart") {
        clearEventBuild();
        state.bookingType = "";
        state.eventMode = "";
        state.eventIntent = "";
        state._gateChoosingEventMode = false;
        state.step = 1;
        showGateOrFlow();
        pushFlowHistory();
        return;
      }
      if (action === "range-review") {
        if (!cartIsActive()) return; // both dates must be picked (cart built)
        // Treat the built event as a cart in review: the checkout panel, cart
        // summary, and pay button all key off (_cartReviewing && cartIsActive())
        // since a range event has no single active slot (selectedTime stays "").
        state._cartReviewing = true;
        setStep(3); // Details (collect attendees once) → Waiver → Pay
        showToast("Your event days are set. Now your details and payment.");
        return;
      }

      if (action === "md-review") {
        // Commit the last day, then send the customer through details → waiver →
        // pay to collect the UNIVERSAL fields ONCE for the whole event (contact,
        // attendees, waiver e-sign, card). The per-day builder only did Steps 1–2,
        // so without this the flow dead-ends at review with a disabled pay button.
        commitActiveSessionToCart();
        resetActiveDraft();
        state._dayRole = "";
        state._cartReviewing = false;
        setStep(3); // Details (collect attendees once) → Waiver → Pay
        showToast("Your event days are set. Now your details and payment.");
        return;
      }

      if (action === "edit-cart-session") {
        editCartSession(Number(actionTarget.dataset.index));
        return;
      }

      if (action === "remove-cart-session") {
        removeCartSession(Number(actionTarget.dataset.index));
        return;
      }

      if (action === "back-to-cart-edit") {
        // Leave the review view and return to editing the active draft.
        state._cartReviewing = false;
        renderStepContent();
        return;
      }

      if (action === "set-payment-mode") {
        state.paymentMode = actionTarget.dataset.mode === "deposit" ? "deposit" : "full";
        renderCheckoutPanel();
        renderCartSummary();
        return;
      }

      if (action === "apply-coupon") {
        applyCoupon();
        return;
      }

      if (action === "remove-coupon") {
        state.coupon = null;
        state.couponError = "";
        state.couponInput = "";
        renderCheckoutPanel();
        return;
      }

      if (action === "sign-waiver") {
        state.waiverSigned = true;
        trackEvent("waiver_signed", { location: location.slug });
        renderWaiver();
        updateWaiverGate();
        return;
      }

      if (action === "set-event-intent") {
        var intentValue = actionTarget.dataset.value;
        var selDur = getSelectedDuration();
        if (intentValue === "yes" && selDur && selDur.hours === 1) {
          // Shake animation + toast for 1hr event attempt
          actionTarget.classList.add("shake");
          setTimeout(function () { actionTarget.classList.remove("shake"); }, 600);
          showToast("Event bookings are only for 2+ hour sessions. Select a longer duration of time.");
          state.eventIntent = "";
          renderStepContent();
          return;
        }
        state.eventIntent = intentValue;
        if (state.eventIntent === "yes") {
          // Sync intake participants with top-level count (intake field is hidden for events)
          if (state.participants) {
            state.intake.participants = state.participants;
          }
        } else {
          state.eventDescription = "";
          state.foodDrinks = null;
          state.acknowledgements.cleanup = false;
          state.acknowledgements.capacity = false;
          state.acknowledgements.selfService = false;
          // Deselect events-only add-ons (e.g. Event Setup and Reset Crew) so a non-event
          // booking can't carry a selection that the server would reject.
          location.addons.forEach(function (a) {
            if (a.eventsOnly && state.addons[a.id]) {
              state.addons[a.id].selected = false;
              if (state.addons[a.id].placements) state.addons[a.id].placements = {};
            }
          });
        }
        renderStepContent();
      }
    });

    // Block non-digit keystrokes/pastes on participant fields. type="number"
    // alone doesn't actually prevent non-numeric input across all browsers
    // (Safari is especially loose). Cancelling beforeinput stops the
    // character from ever entering the input value — no strip-after-the-fact.
    // Real incident: Molly Hensley booked Nov 14 2026 with "35 +".
    document.addEventListener("beforeinput", (event) => {
      const t = event.target;
      if (!t || !t.matches) return;
      if (
        t.matches("[data-input='participants']") ||
        t.matches("[data-input='intake-participants']")
      ) {
        // event.data is the text being inserted (null for deletions/etc).
        // Reject if it contains anything but digits.
        if (event.data != null && /\D/.test(event.data)) {
          event.preventDefault();
        }
      }
    });

    document.addEventListener("input", (event) => {
      const target = event.target;

      // Offer mode: locked inputs are readonly in the DOM (initOfferMode), but
      // guard here too so nothing (autofill, extensions, keyboard edge cases)
      // can mutate the locked build's state.
      if (OFFER && target.matches && OFFER_LOCKED_INPUTS.some(function (sel) { return target.matches(sel); })) {
        return;
      }

      if (target.matches("[data-input='participants']")) {
        state.participants = target.value;
        // Keep intake participants in sync when event intent is active (intake field hidden)
        if (state.eventIntent === "yes") {
          state.intake.participants = target.value;
        }
        // Update warnings/notices without full re-render to preserve input focus
        updateParticipantNotices();
        // Surgically update event form without rebuilding the input (preserves focus)
        updateEventForm();
        // Always update order summary + sidebar so cleaning fee shows live
        renderCheckoutPanel();
        renderSummary();
        return;
      }

      if (target.matches("[data-input='event-description']")) {
        state.eventDescription = target.value;
        return;
      }

      if (target.matches("[data-input='high-traffic-note']")) {
        state.highTrafficNote = target.value;
        return;
      }

      if (target.matches("[data-input='contact-first-name']")) {
        state.contact.firstName = target.value;
        renderStepContent();
        return;
      }

      if (target.matches("[data-input='contact-last-name']")) {
        state.contact.lastName = target.value;
        renderStepContent();
        return;
      }

      if (target.matches("[data-input='contact-email']")) {
        state.contact.email = target.value;
        renderStepContent();
        return;
      }

      if (target.matches("[data-input='contact-phone']")) {
        state.contact.phone = target.value;
        renderStepContent();
        return;
      }

      if (target.matches("[data-input='contact-notes']")) {
        state.contact.notes = target.value;
      }

      if (target.matches("[data-input='intake-business']")) {
        state.intake.business = target.value;
      }

      if (target.matches("[data-input='intake-participants']")) {
        state.intake.participants = target.value;
        // TM: hard cap at 50 people
        if (location.slug === "taylors-mill") {
          var tmCount = parseCount(target.value);
          if (tmCount > 50) {
            showCapacityModal("Taylor\u2019s Mill has a maximum capacity of 50 people, including vendors and contractors. Please reduce your count or consider our Flagship Location for larger groups.");
            target.value = "50";
            state.intake.participants = "50";
            return;
          }
          if (tmCount > 35 && !state.tmHighTrafficAcknowledged) {
            showTmHighTrafficModal();
          }
        }
        // PV: cross-validate intake participants with top-level attendee count for events
        if (location.slug === "powdersville" && state.eventIntent === "yes" && state.participants) {
          var topCount = parseCount(state.participants);
          var intakeCount = parseCount(target.value);
          if (intakeCount && topCount && intakeCount !== topCount) {
            showToast("Your attendee count (" + topCount + ") doesn\u2019t match the participant count you just entered (" + intakeCount + "). Please make sure these match.");
          }
        }
        // PV photo/video: cleaning fee popup for 50+
        if (location.slug === "powdersville" && state.eventIntent !== "yes") {
          var pvCount = parseCount(target.value);
          if (pvCount >= 50) {
            showCleaningFeePopup();
          }
        }
        // Update order summary so cleaning fee shows live
        renderCheckoutPanel();
        renderSummary();
      }

      if (target.matches("[data-input='intake-instagram']")) {
        state.intake.instagram = target.value;
        renderStepContent();
      }

      if (target.matches("[data-input='intake-lead-source-other']")) {
        // Free text (required, 3-char min) when lead source is "Other". Use the
        // lightweight gate update, not a re-render, so the caret isn't disturbed.
        state.intake.leadSourceOther = target.value;
        updateTermsGate();
      }

      if (target.matches("[data-input='intake-purpose-other']")) {
        // DREW-31: free text (required, 3-char min) when session purpose is "Other".
        state.intake.purposeOther = target.value;
        updateTermsGate();
      }

      if (target.matches("[data-input='email-acknowledgment']")) {
        state.emailAcknowledgment = target.value;
        renderStepContent();
      }

      if (target.matches("[data-input='terms-signature']")) {
        state.termsSignature = target.value;
        updateTermsGate();
      }

      if (target.matches("[data-input='name-on-card']")) {
        state.nameOnCard = target.value;
        state._nameOnCardEdited = true;
        // Do NOT re-render — that would destroy the Square iframe + cursor.
      }

      if (target.matches("[data-input='coupon-code']")) {
        // Mirror name-on-card: store the value, do NOT re-render (that would
        // blow away the input + cursor). Clearing a stale error is a targeted
        // DOM update, not a render.
        state.couponInput = target.value;
        if (state.couponError) {
          state.couponError = "";
          var errEl = document.querySelector("[data-coupon-error]");
          if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }
        }
      }
    });

    // Enter inside the promo field applies the code (instead of submitting the
    // page / doing nothing). Targeted listener — no re-render on keydown.
    document.addEventListener("keydown", function (event) {
      var t = event.target;
      if (t && t.matches && t.matches("[data-input='coupon-code']") && event.key === "Enter") {
        event.preventDefault();
        applyCoupon();
      }
    });

    document.addEventListener("change", (event) => {
      const target = event.target;

      if (OFFER && target.matches && OFFER_LOCKED_CHECKS.some(function (sel) { return target.matches(sel); })) {
        // Revert the visual toggle to the locked build's state.
        if (target.type === "checkbox" || target.type === "radio") {
          if (target.matches("[data-check='food-drinks-yes']")) target.checked = state.foodDrinks === true;
          if (target.matches("[data-check='food-drinks-no']")) target.checked = state.foodDrinks === false;
        }
        return;
      }

      if (target.matches("[data-action='set-placement']")) {
        var pAddon = state.addons[target.dataset.addonId];
        if (pAddon) {
          if (!pAddon.placements) pAddon.placements = {};
          pAddon.placements[target.dataset.placementId] = target.value;
        }
        return;
      }

      // Multi-day RANGE flow: last-day early-checkout departure. Default pv-full
      // (10:30 PM). Picking a shorter leave time rebuilds the event's last day.
      if (target.matches("[data-action='set-last-day-leave']")) {
        state._lastDayDurationId = target.value || "pv-full";
        buildEventRangeCart();
        renderStepContent();
        return;
      }

      if (target.matches("[data-check='cleanup']")) {
        state.acknowledgements.cleanup = target.checked;
        return;
      }

      if (target.matches("[data-check='capacity']")) {
        state.acknowledgements.capacity = target.checked;
        return;
      }

      if (target.matches("[data-check='self-service']")) {
        state.acknowledgements.selfService = target.checked;
      }

      if (target.matches("[data-check='food-drinks-yes']")) {
        state.foodDrinks = target.checked ? true : null;
        var noBox = document.querySelector("[data-check='food-drinks-no']");
        if (noBox && target.checked) noBox.checked = false;
        return;
      }

      if (target.matches("[data-check='food-drinks-no']")) {
        state.foodDrinks = target.checked ? false : null;
        var yesBox = document.querySelector("[data-check='food-drinks-yes']");
        if (yesBox && target.checked) yesBox.checked = false;
        return;
      }

      if (target.matches("[data-check='read-email']")) {
        state.intake.readEmail = target.checked;
        updateTermsGate();
      }

      if (target.matches("[data-input='intake-lead-source']")) {
        state.intake.leadSource = target.value;
        // "Other" reveals a required free-text box; anything else hides + clears it.
        var isOther = target.value === "Other";
        var otherWraps = document.querySelectorAll("[data-lead-other-wrap]");
        for (var w = 0; w < otherWraps.length; w++) {
          otherWraps[w].classList.toggle("hidden", !isOther);
        }
        if (!isOther) {
          state.intake.leadSourceOther = "";
          var otherInputs = document.querySelectorAll("[data-input='intake-lead-source-other']");
          for (var oi = 0; oi < otherInputs.length; oi++) otherInputs[oi].value = "";
        } else {
          var firstOther = document.querySelector("[data-input='intake-lead-source-other']");
          if (firstOther) firstOther.focus();
        }
        updateTermsGate();
      }

      if (target.matches("[data-input='intake-purpose']")) {
        // DREW-31: mandatory session-purpose dropdown for photo/video. "Other"
        // reveals a required free-text box; anything else hides + clears it.
        state.intake.purpose = target.value;
        var purposeIsOther = target.value === "Other";
        var purposeWraps = document.querySelectorAll("[data-purpose-other-wrap]");
        for (var pw = 0; pw < purposeWraps.length; pw++) {
          purposeWraps[pw].classList.toggle("hidden", !purposeIsOther);
        }
        if (!purposeIsOther) {
          state.intake.purposeOther = "";
          var purposeOtherInputs = document.querySelectorAll("[data-input='intake-purpose-other']");
          for (var poi = 0; poi < purposeOtherInputs.length; poi++) purposeOtherInputs[poi].value = "";
        } else {
          var firstPurposeOther = document.querySelector("[data-input='intake-purpose-other']");
          if (firstPurposeOther) firstPurposeOther.focus();
        }
        updateTermsGate();
      }

      // V3 item 6: deposit/full radios (also handled in the click dispatcher;
      // change fires for keyboard selection). Re-render the cart total + button.
      if (target.matches("[data-action='set-payment-mode']")) {
        state.paymentMode = target.dataset.mode === "deposit" ? "deposit" : "full";
        renderCheckoutPanel();
        renderCartSummary();
        return;
      }

      if (target.matches("[data-input='card-on-file-consent']")) {
        state.cardOnFileConsent = target.checked;
        var cofHint = document.querySelector("[data-hint='card-on-file-consent']");
        if (cofHint) cofHint.textContent = "";
        updatePayButton();
        return;
      }

      // terms signature handled via input event on [data-input='terms-signature']
    });
  }

  // Range event: add-ons are picked once in Step 4 and mirrored onto the event's
  // days. Discount-eligible gear (chairs, tables, walls, PA, TV, backdrops) stays
  // up every day and tapers per the multi-day discount, so it goes on EVERY day.
  // Flat add-ons that are once-per-event (Event Setup and Reset Crew, lighting)
  // go on DAY 1 ONLY so they are charged once, not once per day.
  function syncRangeAddons() {
    if (state.eventMode !== "multi" || !state.cart.sessions.length) return;
    var eligible = (window.WWSPricing && window.WWSPricing.isDiscountEligible)
      ? window.WWSPricing.isDiscountEligible
      : function () { return true; };
    var src = state.addons || {};
    state.cart.sessions.forEach(function (s, idx) {
      var out = {};
      Object.keys(src).forEach(function (id) {
        // Day 1 carries every add-on; later days carry only the per-day gear.
        if (idx === 0 || eligible(id)) out[id] = JSON.parse(JSON.stringify(src[id]));
      });
      s.addons = out;
    });
  }

  function renderStepContent() {
    syncRangeAddons();
    renderLocationPolicies();
    renderProgress();
    renderMultidayIntro();
    renderDurations();
    renderEventStep();
    renderAddons();
    renderScheduleStep();
    renderCheckoutPanel();
    renderWaiver();
    renderSummary();
    renderMultidaySummary();
    renderCartBranch();
    renderCartSummary();
    if (BUILDER) renderBuilderPanel();
    renderStepVisibility();
    updateTermsGate();
    updateWaiverGate();
  }

  // Step-1 "What are you booking?" gate (Drew 2026-07-10). Rendered into
  // [data-booking-gate]; two stages on PV: (A) Photo/Video vs Event, then for
  // Event (B) Single-day vs Multi-day. TM is photo-only so it never gates.
  function renderGate() {
    var gate = document.querySelector("[data-booking-gate]");
    if (!gate) return;
    if (location.slug !== "powdersville" || state.bookingType) { gate.innerHTML = ""; return; }

    if (state._gateChoosingEventMode) {
      gate.innerHTML =
        '<div class="booking-panel p-6 md:p-8">' +
          '<p class="text-xs tracking-[0.25em] uppercase text-black/40">Step 1</p>' +
          '<h2 class="font-display text-4xl mt-3">Single-day or multi-day event?</h2>' +
          '<div class="choice-grid is-two-up mt-8">' +
            '<button type="button" class="booking-choice" data-action="gate-event-mode" data-mode="single">' +
              '<h3 class="ui-display-sm">Single-day event</h3>' +
              '<p class="ui-copy" style="margin-top:1rem">If your event will be started and completed on the same day for a set duration, select this option.</p>' +
            '</button>' +
            '<button type="button" class="booking-choice" data-action="gate-event-mode" data-mode="multi">' +
              '<h3 class="ui-display-sm">Multi-day event</h3>' +
              '<p class="ui-copy" style="margin-top:1rem">If your event is going to go overnight into the next day, select this option.</p>' +
            '</button>' +
          '</div>' +
          '<div class="mt-8"><button type="button" class="booking-button booking-button-secondary" data-action="gate-back">Back</button></div>' +
        '</div>';
      return;
    }

    gate.innerHTML =
      '<div class="booking-panel p-6 md:p-8">' +
        '<p class="text-xs tracking-[0.25em] uppercase text-black/40">Step 1</p>' +
        '<h2 class="font-display text-4xl mt-3">What are you booking?</h2>' +
        '<div class="choice-grid is-two-up mt-8">' +
          '<button type="button" class="booking-choice" data-action="gate-choose" data-type="photo">' +
            '<h3 class="ui-display-sm">Photo / video session</h3>' +
            '<p class="ui-copy" style="margin-top:1rem">Standard photo, video, or production session.</p>' +
            '<p class="ui-copy" style="margin-top:0.75rem;color:rgba(0,0,0,0.55);font-size:0.85rem">If you will be booking a multi-day photo/video session, please select Event.</p>' +
          '</button>' +
          '<button type="button" class="booking-choice" data-action="gate-choose" data-type="event">' +
            '<h3 class="ui-display-sm">Event</h3>' +
            '<p class="ui-copy" style="margin-top:1rem">Parties, receptions, workshops, and gatherings, on a single day or across multiple days.</p>' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  // Toggle between the gate and the numbered flow based on state.bookingType.
  // TM (photo-only) auto-resolves to "photo" so it never sees the gate.
  function showGateOrFlow() {
    if (location.slug !== "powdersville" && !state.bookingType) {
      state.bookingType = "photo";
      state.eventIntent = "no";
    }
    var gated = !state.bookingType;
    var gate = document.querySelector("[data-booking-gate]");
    if (gate) gate.style.display = gated ? "" : "none";
    document.querySelectorAll("[data-flow-region]").forEach(function (el) {
      el.style.display = gated ? "none" : "";
    });
    // "Change booking type" is only meaningful where the gate actually exists
    // (Powdersville). Taylor's Mill auto-resolves to photo and never gates.
    var restart = document.querySelector("[data-gate-restart]");
    if (restart) {
      restart.hidden = gated || location.slug !== "powdersville";
    }
    if (gated) renderGate();
  }

  // Commit a gate choice and reveal the numbered flow at step 1.
  function enterFlow() {
    showGateOrFlow();
    trackEvent("booking_type_chosen", {
      location: location.slug, bookingType: state.bookingType, eventMode: state.eventMode
    });
    setStep(1);
  }

  function renderLocationSwitcher() {
    const switcher = document.querySelector("[data-location-switcher]");
    if (!switcher) {
      return;
    }

    switcher.classList.add("location-switcher");

    switcher.innerHTML = locations
      .map((item) => {
        const isActive = item.slug === location.slug;
        const stateClass = isActive ? "is-active" : "";
        const themeClass = item.slug === "powdersville" ? "is-powdersville" : "is-taylors-mill";
        // Builder mode: the synced copies live side by side in the same
        // directory (powdersville.html / taylors-mill.html on the dashboard).
        const href = BUILDER ? item.slug + ".html" : "/book-" + item.slug;
        return `
          <a href="${href}" class="location-chip ${themeClass} ${stateClass}">
            <span style="display:inline-flex;width:0.55rem;height:0.55rem;border-radius:999px;background:${item.accent}"></span>
            <span>${item.name}</span>
          </a>
        `;
      })
      .join("");
  }

  function renderProgress() {
    const progress = document.querySelector("[data-progress]");
    if (!progress) {
      return;
    }

    const steps = BUILDER
      ? [
          { index: 1, label: "Timing" },
          { index: 2, label: "Schedule" },
          { index: 3, label: "Add-ons" }
        ]
      : [
          { index: 1, label: "Timing" },
          { index: 2, label: "Schedule" },
          { index: 3, label: "Details" },
          { index: 4, label: "Waiver" },
          { index: 5, label: "Review" }
        ];

    const maxStep = getMaxAccessibleStep();
    progress.innerHTML = `
      <div class="progress-bar-track">
        <div class="progress-bar-fill"></div>
      </div>
      <div class="progress-bar-steps">
        ${steps.map((step) => {
          const isActive = step.index === state.step;
          const isComplete = step.index < state.step;
          const isLocked = step.index > maxStep;
          return `
            <button class="progress-dot ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""} ${isLocked ? "is-locked" : ""}" type="button" data-action="go-step" data-step="${step.index}" ${isActive ? 'aria-current="step"' : ""} ${isLocked ? `aria-disabled="true" aria-label="Step ${step.index}, ${step.label} — complete earlier steps first"` : ""}>
              <span class="progress-dot-num">${step.index}</span>
              <span class="progress-dot-label">${step.label}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    // Position track line to connect dot centers exactly
    alignProgressTrack(progress, steps.length);
  }

  function alignProgressTrack(progress, stepCount) {
    var track = progress.querySelector(".progress-bar-track");
    var fill = progress.querySelector(".progress-bar-fill");
    var dots = progress.querySelectorAll(".progress-dot-num");
    if (!track || !fill || dots.length < 2) return;

    var containerRect = progress.getBoundingClientRect();
    var firstDot = dots[0].getBoundingClientRect();
    var lastDot = dots[dots.length - 1].getBoundingClientRect();

    var left = (firstDot.left + firstDot.width / 2) - containerRect.left;
    var right = containerRect.right - (lastDot.left + lastDot.width / 2);

    track.style.left = left + "px";
    track.style.right = right + "px";

    var trackWidth = containerRect.width - left - right;
    var fillPct = ((state.step - 1) / (stepCount - 1)) * 100;
    fill.style.width = fillPct + "%";
  }

  // Multi-day event FIRST-DAY start-time options (Drew 2026-07-11). The first day
  // of a multi-day event ends at 10:30 PM; the customer picks how early they come
  // in (which sets the duration + price). These start times map 1:1 to the
  // existing PV durations by price, so selecting one is still a normal duration
  // selection under the hood ($130=1hr … $980=full). Includes their setup time.
  var FIRST_DAY_START_LABEL = {
    "pv-1": "9:00 PM", "pv-2": "8:00 PM", "pv-3": "7:00 PM", "pv-4": "6:00 PM",
    "pv-6": "4:00 PM", "pv-8": "2:00 PM", "pv-full": "5:00 AM"
  };
  // 24h start time per first-day option (for locking the slot; access ends 10:30 PM).
  var FIRST_DAY_START_24 = {
    "pv-1": "21:00", "pv-2": "20:00", "pv-3": "19:00", "pv-4": "18:00",
    "pv-6": "16:00", "pv-8": "14:00", "pv-full": "05:00"
  };
  // LAST day (Drew 2026-07-11): access starts 5 AM, pick a LEAVE time = first-day
  // prices mirrored. Leave time = 5 AM + the duration the price implies.
  var LAST_DAY_LEAVE_LABEL = {
    "pv-1": "6:30 AM", "pv-2": "7:30 AM", "pv-3": "8:30 AM", "pv-4": "9:30 AM",
    "pv-6": "11:30 AM", "pv-8": "1:30 PM", "pv-full": "10:30 PM"
  };
  var LAST_DAY_LEAVE_24 = {
    "pv-1": "06:30", "pv-2": "07:30", "pv-3": "08:30", "pv-4": "09:30",
    "pv-6": "11:30", "pv-8": "13:30", "pv-full": "22:30"
  };
  var LAST_DAY_START_24 = "05:00";

  // Which day of a multi-day event is being configured: "first" (cart empty),
  // else state._dayRole ("middle" | "last") set when a day is added.
  // Tear down a half-built event so the flow can be restarted cleanly (used by
  // the back-to-gate action). Keeps contact/waiver info — only the event build.
  function clearEventBuild() {
    state._eventStartDate = "";
    state._eventEndDate = "";
    state.cart.sessions = [];
    state._dayRole = "";
    state._cartReviewing = false;
    state.durationId = "";
    state._eventDurationId = "";
    state.selectedDate = "";
    state.selectedTime = "";
    state.availableDates = [];
    state.availableTimes = [];
  }

  function currentDayRole() {
    if (state.eventMode !== "multi") return null;
    if (!cartIsActive()) return "first";
    // _dayRole is set explicitly when a day is added; "" (e.g. after review)
    // means we are no longer configuring a day → not a day-builder screen.
    return state._dayRole || null;
  }
  // True while configuring the FIRST day of a multi-day event (cart still empty).
  function isMultidayFirstDay() {
    return currentDayRole() === "first";
  }

  function renderDurations() {
    const container = document.querySelector("[data-duration-options]");
    if (!container) {
      return;
    }

    // Multi-day event (Airbnb-style RANGE flow, Drew 2026-07-11): Step 1 is the
    // DAY-ONE access-time picker. Middle days ($980 full) and the last day are
    // auto-built from the date range in Step 2 — no per-day duration choice.
    if (state.eventMode === "multi") {
      container.innerHTML = location.durations
        .filter(function (d) { return FIRST_DAY_START_LABEL[d.id]; })
        .map(function (duration) {
          var isActive = duration.id === state._eventDurationId;
          var lbl = FIRST_DAY_START_LABEL[duration.id];
          var priceTag = duration.price ? currency.format(duration.price) : "";
          return '<button type="button" class="booking-choice duration-pill ' + (isActive ? "is-active" : "") + '" data-action="select-duration" data-duration-id="' + duration.id + '" aria-pressed="' + isActive + '">' +
            '<span class="duration-pill-label">' + lbl + ' &mdash; Day 1 Access Time' + (priceTag ? ' <span style="color:rgba(0,0,0,0.6);font-weight:400">' + priceTag + '</span>' : '') + '</span>' +
          '</button>';
        }).join("");
      return;
    }

    // Multi-day event: render a day-role-specific picker instead of raw durations.
    var mdRole = currentDayRole();
    if (mdRole === "middle") {
      // Middle days are always a full day, $980 (Drew). No choice to make.
      var full = location.durations.find(function (d) { return d.id === "pv-full"; });
      container.innerHTML =
        '<div class="booking-choice duration-pill is-active" style="cursor:default">' +
          '<span class="duration-pill-label">Full day' + (full ? ' <span style="color:rgba(0,0,0,0.6);font-weight:400">' + currency.format(full.price) + '</span>' : '') + '</span>' +
        '</div>';
      return;
    }
    if (mdRole === "first" || mdRole === "last") {
      var isLast = mdRole === "last";
      var labelMap = isLast ? LAST_DAY_LEAVE_LABEL : FIRST_DAY_START_LABEL;
      var suffix = isLast ? ' &mdash; Leave Time' : ' &mdash; Day 1 Access Time';
      container.innerHTML = location.durations
        .filter(function (d) { return labelMap[d.id]; })
        .map(function (duration) {
          var isActive = duration.id === state.durationId;
          var lbl = labelMap[duration.id];
          var priceTag = duration.price ? currency.format(duration.price) : "";
          return '<button type="button" class="booking-choice duration-pill ' + (isActive ? "is-active" : "") + '" data-action="select-duration" data-duration-id="' + duration.id + '" aria-pressed="' + isActive + '">' +
            '<span class="duration-pill-label">' + lbl + suffix + (priceTag ? ' <span style="color:rgba(0,0,0,0.6);font-weight:400">' + priceTag + '</span>' : '') + '</span>' +
          '</button>';
        }).join("");
      return;
    }

    container.innerHTML = location.durations
      .map((duration) => {
        const isActive = duration.id === state.durationId;
        const eventEligible = location.slug === "powdersville" && duration.hours >= 2;
        const isOneHr = location.slug === "powdersville" && duration.hours === 1;
        const priceTag = duration.price ? currency.format(duration.price) : "";
        return `
          <button type="button" class="booking-choice duration-pill ${isActive ? "is-active" : ""}" data-action="select-duration" data-duration-id="${duration.id}" aria-pressed="${isActive}">
            <span class="duration-pill-main">
              <span class="duration-pill-label">${duration.label}${priceTag ? ' <span style="color:rgba(0,0,0,0.6);font-weight:400">' + priceTag + '</span>' : ''}</span>
              ${duration.subtext ? '<span class="duration-pill-subtext">' + escapeHtml(duration.subtext) + '</span>' : ""}
            </span>
            ${eventEligible ? '<span class="duration-pill-badge">Event eligible</span>' : ""}
            ${isOneHr ? '<span class="duration-pill-badge is-muted">Not event eligible</span>' : ""}
          </button>
        `;
      })
      .join("");
  }

  // --- Schedule & Pay (Step 5) ---

  function getAppointmentTypeID() {
    const selectedDuration = getSelectedDuration();
    if (!selectedDuration) return null;
    return appointmentTypeIdFor(selectedDuration.id, location.slug);
  }

  // appointmentTypeID for an arbitrary duration + location slug (used by the
  // cart path to resolve committed sessions, which store durationId/location).
  function appointmentTypeIdFor(durationId, locationSlug) {
    const slug = locationSlug === "taylors-mill" ? "taylors-mill" : "powdersville";
    const acuityLocations = config.integrations.acuity.locations || {};
    const locConfig = acuityLocations[slug] || {};
    const durConfig = (locConfig.durations || {})[durationId] || {};
    return durConfig.appointmentTypeId || null;
  }

  async function fetchAvailableDates(appointmentTypeID, month) {
    state.isLoadingDates = true;
    state.availableDates = [];
    state.availableTimes = [];
    state.selectedDate = "";
    state.selectedTime = "";
    renderScheduleStep();
    try {
      const res = await fetch(`/api/availability-dates?appointmentTypeID=${appointmentTypeID}&month=${month}`);
      if (!res.ok) throw new Error("Failed to load dates");
      const data = await res.json();
      state.availableDates = data.dates || [];
    } catch (err) {
      console.error(err);
      state.availableDates = [];
    }
    state.isLoadingDates = false;
    renderScheduleStep();
  }

  async function fetchAvailableTimes(appointmentTypeID, date) {
    state.isLoadingTimes = true;
    state.availableTimes = [];
    state.selectedTime = "";
    renderScheduleStep();

    // PV full day: only valid start is 5 AM Eastern — skip Acuity time fetch
    var selectedDuration = getSelectedDuration();
    if (selectedDuration && selectedDuration.id === "pv-full") {
      // Compute Eastern offset (EDT -0400 or EST -0500) for the selected date
      var probe = new Date(date + "T12:00:00");
      var eastern = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" }).format(probe);
      var offsetMatch = eastern.match(/GMT([+-]\d+)/);
      var offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : -5;
      var offsetStr = (offsetHours <= 0 ? "-" : "+") + String(Math.abs(offsetHours)).padStart(2, "0") + "00";
      state.availableTimes = [date + "T05:00:00" + offsetStr];
      state.isLoadingTimes = false;
      renderScheduleStep();
      return;
    }

    try {
      const res = await fetch(`/api/availability-times?appointmentTypeID=${appointmentTypeID}&date=${date}`);
      if (!res.ok) throw new Error("Failed to load times");
      const data = await res.json();
      var times = (data.times || []).map(function (t) { return t.time; });
      // Earliest-start floor (e.g. 8h Flagship is 12:30pm ET). Drop any slot
      // before the duration's floor so the UI never offers a too-early start.
      // The server (availability-times + verify + create-checkout) enforces the
      // same floor authoritatively; this is just so the customer never sees it.
      var floorMin = selectedDuration && selectedDuration.earliestStartMinutes;
      if (floorMin != null) {
        times = times.filter(function (t) { return easternMinutesFromTime(t) >= floorMin; });
      }
      state.availableTimes = times;
    } catch (err) {
      console.error(err);
      state.availableTimes = [];
    }
    state.isLoadingTimes = false;
    renderScheduleStep();
  }

  // Eastern (America/New_York) local minutes-since-midnight for an ISO time
  // string. Mirrors easternMinutesFromISO in api/_lib/acuity.js.
  function easternMinutesFromTime(iso) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(new Date(iso));
    var h = 0, m = 0;
    parts.forEach(function (p) {
      if (p.type === "hour") h = parseInt(p.value, 10);
      if (p.type === "minute") m = parseInt(p.value, 10);
    });
    if (h === 24) h = 0;
    return h * 60 + m;
  }

  function renderScheduleStep() {
    var container = document.querySelector("[data-schedule-step]");
    if (!container) return;

    // Multi-day RANGE flow (Drew 2026-07-11): one calendar for the whole event —
    // pick the start date then the end date; the days auto-build. Bypasses the
    // per-day builder entirely.
    if (state.eventMode === "multi") {
      var rTitle = document.querySelector("[data-step2-title]");
      var rSub = document.querySelector("[data-step2-sub]");
      if (rTitle && rSub) {
        rTitle.textContent = "Choose Your Event Dates";
        rSub.textContent = "Pick the day your event starts, then the day it ends. Access begins at your Day 1 time and runs continuously through the last day.";
      }
      // The range flow advances via "Review your event", not the static Continue —
      // but keep the BACK button so the customer can return to Step 1 and change
      // the Day-1 access time. Hiding this whole nav is what stranded Drew
      // (2026-07-13): he picked 4 PM, wanted a full day, and had no way back.
      var rNav = document.querySelector("[data-step2-nav]");
      if (rNav) {
        rNav.style.display = "";
        var rCont = rNav.querySelector("[data-action='go-step'][data-step='3']");
        if (rCont) rCont.style.display = "none";
        var rBack = rNav.querySelector("[data-action='go-step'][data-step='1']");
        if (rBack) {
          rBack.style.display = "";
          rBack.textContent = "\u2190 Back \u00b7 change Day 1 access time";
        }
      }
      if (!getAppointmentTypeID()) {
        container.innerHTML = '<div class="note-card"><p class="ui-copy-strong">Choose your Day 1 access time first to see available dates.</p></div>';
        return;
      }
      container.innerHTML = renderCalendar() + renderRangeControls();
      return;
    }

    var mdRole = currentDayRole();

    // Step-2 heading — Drew's multi-day copy per day role; restored otherwise.
    var title = document.querySelector("[data-step2-title]");
    var sub = document.querySelector("[data-step2-sub]");
    if (title && sub) {
      if (mdRole === "first") {
        title.textContent = "Choose the First Day Of Your Event";
        sub.textContent = "Pick the day your event begins. Your access time is already set from the last step.";
      } else if (mdRole === "last") {
        title.textContent = "Choose the Last Day Of Your Event";
        sub.textContent = "Pick the final day. Access starts at 5:00 AM and you leave at the time you selected.";
      } else if (mdRole === "middle") {
        title.textContent = "Add a Full Day To Your Event";
        sub.textContent = "Pick the date for this full day. Your access carries through continuously into the next day.";
      } else {
        title.innerHTML = "Pick a date &amp; time";
        sub.textContent = "Select an available date and time for your session.";
      }
    }

    // Multi-day days advance via the confirmation / review buttons, not the static
    // "Continue to session details" nav — so hide THAT button. But the BACK button
    // must stay: hiding the whole nav (as this did) left a multi-day customer with
    // no way back to Step 1 to change the Day-1 access time, and the browser back
    // button dumped them on the home page (Drew, 2026-07-13 — he picked 4 PM, then
    // wanted a full day, and was stuck).
    var nav = document.querySelector("[data-step2-nav]");
    if (nav) {
      nav.style.display = "";
      var contBtn = nav.querySelector("[data-action='go-step'][data-step='3']");
      if (contBtn) contBtn.style.display = mdRole ? "none" : "";
      var backBtn = nav.querySelector("[data-action='go-step'][data-step='1']");
      if (backBtn) {
        backBtn.style.display = "";
        backBtn.textContent = mdRole
          ? "\u2190 Back \u00b7 change Day 1 access time"
          : "Back";
      }
    }

    var appointmentTypeID = getAppointmentTypeID();
    if (!appointmentTypeID) {
      container.innerHTML = '<div class="note-card"><p class="ui-copy-strong">Select a duration first to see availability.</p></div>';
      return;
    }

    // Multi-day: date only (start time is locked from the day picker), then a
    // confirmation line + the day-role-appropriate next-step buttons (Drew).
    if (mdRole) {
      container.innerHTML = renderCalendar() + renderMultidayConfirm(mdRole);
      return;
    }

    container.innerHTML =
      renderCalendar() +
      renderTimeSlots();
  }

  // Multi-day: the "Confirming: …" line + the next-step buttons, shown once a
  // date is picked (Drew 2026-07-11).
  function renderMultidayConfirm(role) {
    if (!state.selectedDate) return '';
    var dp = state.selectedDate.split("-");
    var human = new Date(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    var t = state._multidayFixedTime || "";
    var line, buttons;
    if (role === "first") {
      line = 'Confirming: your event session starts on <strong>' + escapeHtml(human) +
        '</strong>, and you have initial access to the venue starting at <strong>' + escapeHtml(t) + '</strong>.';
      buttons =
        '<button type="button" class="booking-button booking-button-secondary" data-action="md-add-multiple">Choose multiple more days</button>' +
        '<button type="button" class="booking-button booking-button-primary" data-action="md-add-last">Choose the last day</button>';
    } else if (role === "middle") {
      line = 'Confirming: a full day on <strong>' + escapeHtml(human) + '</strong>, going into the next day continuously.';
      buttons =
        '<button type="button" class="booking-button booking-button-secondary" data-action="md-add-multiple">Choose more additional days</button>' +
        '<button type="button" class="booking-button booking-button-primary" data-action="md-add-last">Move forward to the last day</button>';
    } else { // last
      line = 'Confirming: your last day is <strong>' + escapeHtml(human) +
        '</strong> — access starts at 5:00 AM and you leave at <strong>' + escapeHtml(t) +
        '</strong>, with everything completely reset and cleaned up.';
      buttons =
        '<button type="button" class="booking-button booking-button-primary" data-action="md-review">Review your event</button>';
    }
    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.75)">' + line + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.75rem">' + buttons + '</div>' +
    '</div>';
  }

  // America/New_York UTC offset ("-04:00" EDT / "-05:00" EST) for a YYYY-MM-DD
  // date. Acuity requires ISO 8601 WITH the ET offset (see api/_lib/acuity.js) —
  // a naive datetime would be read as UTC on the server and misbook the time.
  function etOffsetForDate(dateStr) {
    var noonUTC = new Date(dateStr + "T12:00:00Z");
    var etD = new Date(noonUTC.toLocaleString("en-US", { timeZone: "America/New_York", hour12: false }));
    var utcD = new Date(noonUTC.toLocaleString("en-US", { timeZone: "UTC", hour12: false }));
    var offMin = Math.round((etD - utcD) / 60000);
    var sign = offMin < 0 ? "-" : "+";
    var abs = Math.abs(offMin);
    return sign + String(Math.floor(abs / 60)).padStart(2, "0") + ":" + String(abs % 60).padStart(2, "0");
  }

  // Lock the booking slot for a multi-day day: start time is fixed by the day
  // role + picked option (not a free time-slot pick). Sets selectedTime (booking
  // start datetime, ISO 8601 + ET offset) + the label shown in the confirmation.
  function lockMultidaySlot() {
    var role = currentDayRole();
    if (!role || !state.selectedDate) return;
    var start24, label;
    if (role === "first") {
      start24 = FIRST_DAY_START_24[state.durationId] || "12:00";
      label = FIRST_DAY_START_LABEL[state.durationId] || "";
    } else if (role === "middle") {
      start24 = "05:00"; label = "5:00 AM";
    } else { // last: access starts 5 AM, they leave at the picked time
      start24 = LAST_DAY_START_24;
      label = LAST_DAY_LEAVE_LABEL[state.durationId] || "";
    }
    state.selectedTime = state.selectedDate + "T" + start24 + ":00" + etOffsetForDate(state.selectedDate);
    state._multidayFixedTime = label;
  }

  // --- Airbnb-style multi-day RANGE flow (Drew 2026-07-11) ------------------
  // Inclusive list of "YYYY-MM-DD" from start to end.
  function datesInRange(startYmd, endYmd) {
    var out = [];
    if (!startYmd || !endYmd) return out;
    var d = new Date(startYmd + "T12:00:00Z");
    var e = new Date(endYmd + "T12:00:00Z");
    while (d <= e) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  }
  function makeRangeSession(ymd, durationId, start24, timeLabel, role, prevAddons) {
    return {
      location: location.slug,
      durationId: durationId,
      selectedDate: ymd,
      selectedTime: ymd + "T" + start24 + ":00" + etOffsetForDate(ymd),
      eventIntent: "yes",
      addons: prevAddons ? JSON.parse(JSON.stringify(prevAddons)) : {},
      foodDrinks: null,
      perSessionIntake: { participants: "", business: "", eventDescription: "" },
      _mdRole: role,
      _mdTimeLabel: timeLabel
    };
  }
  // Auto-build the whole event from the day-one access time + the picked date
  // range: day 1 = access time, middle days = full ($980), last day = full by
  // default (10:30 PM departure) unless early-checkout shortened it. Preserves any
  // per-day add-ons already chosen (matched by date) on a rebuild.
  function buildEventRangeCart() {
    if (!state._eventStartDate || !state._eventEndDate || !state._eventDurationId) return;
    var prevByDate = {};
    state.cart.sessions.forEach(function (s) { prevByDate[s.selectedDate] = s.addons; });
    var dates = datesInRange(state._eventStartDate, state._eventEndDate);
    var sessions = dates.map(function (ymd, i) {
      if (i === 0) {
        return makeRangeSession(ymd, state._eventDurationId,
          FIRST_DAY_START_24[state._eventDurationId] || "12:00",
          FIRST_DAY_START_LABEL[state._eventDurationId] || "", "first", prevByDate[ymd]);
      }
      if (i === dates.length - 1) {
        var lastId = state._lastDayDurationId || "pv-full";
        var leaveLabel = lastId === "pv-full" ? "10:30 PM" : (LAST_DAY_LEAVE_LABEL[lastId] || "10:30 PM");
        return makeRangeSession(ymd, lastId, LAST_DAY_START_24, leaveLabel, "last", prevByDate[ymd]);
      }
      return makeRangeSession(ymd, "pv-full", "05:00", "5:00 AM", "middle", prevByDate[ymd]);
    });
    state.cart.sessions = sessions;
  }

  // The panel below the range calendar: prompts through start→end selection, then
  // the day breakdown + last-day early-checkout + the "review & pay" CTA (Drew).
  function renderRangeControls() {
    function human(ymd) {
      if (!ymd) return "";
      var p = ymd.split("-");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
        .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    var s = state._eventStartDate, e = state._eventEndDate;
    if (!s) {
      return '<div class="booking-panel-soft p-5 mt-5"><p class="ui-copy" style="color:rgba(0,0,0,0.75)">Tap the day your event <strong>starts</strong>. Then tap the day it <strong>ends</strong> to set the full range.</p></div>';
    }
    if (!e) {
      return '<div class="booking-panel-soft p-5 mt-5">' +
        '<p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.75)">Event starts <strong>' + escapeHtml(human(s)) + '</strong>. Now tap the day your event <strong>ends</strong> (a later date on the calendar).</p>' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="range-reset">Start over</button>' +
      '</div>';
    }
    // Both endpoints picked — the event is auto-built. Show the breakdown.
    var days = datesInRange(s, e);
    var n = days.length;
    var accessLabel = FIRST_DAY_START_LABEL[state._eventDurationId] || "";
    var lastId = state._lastDayDurationId || "pv-full";
    var leaveLabel = lastId === "pv-full" ? "10:30 PM" : (LAST_DAY_LEAVE_LABEL[lastId] || "10:30 PM");

    var lines;
    if (n === 1) {
      lines = '<li><strong>' + escapeHtml(human(s)) + '</strong> — access from <strong>' + escapeHtml(accessLabel) + '</strong> to 10:30 PM</li>';
    } else {
      lines = '<li>Day 1 (<strong>' + escapeHtml(human(s)) + '</strong>) — access from <strong>' + escapeHtml(accessLabel) + '</strong> through the evening</li>';
      if (n > 2) lines += '<li>' + (n - 2) + ' full day' + (n - 2 === 1 ? '' : 's') + ' in between — continuous 24-hour access</li>';
      lines += '<li>Last day (<strong>' + escapeHtml(human(e)) + '</strong>) — access all day, leave by <strong>' + escapeHtml(leaveLabel) + '</strong> with studio fully reset</li>';
    }

    var earlyCheckout = "";
    if (n >= 2) {
      var leaveOpts = ["pv-full", "pv-8", "pv-6", "pv-4", "pv-3", "pv-2", "pv-1"].map(function (id) {
        var dur = location.durations.find(function (x) { return x.id === id; });
        var price = dur && dur.price ? currency.format(dur.price) : "";
        var lbl = id === "pv-full" ? "Stay all day — leave 10:30 PM" : "Early checkout — leave " + LAST_DAY_LEAVE_LABEL[id];
        return '<option value="' + id + '"' + (id === lastId ? " selected" : "") + '>' + lbl + (price ? " (" + price + ")" : "") + '</option>';
      }).join("");
      earlyCheckout =
        '<label class="ui-copy-strong" style="display:block;margin-bottom:0.35rem">Last day departure</label>' +
        '<select class="booking-input" data-action="set-last-day-leave" style="margin-bottom:1rem;width:100%">' + leaveOpts + '</select>';
    }

    var cleaningNote = n >= 2
      ? '<p class="ui-copy-muted" style="margin-bottom:1rem;font-size:0.85rem">Because this is a multi-day event, there is a mandatory $150 cleaning fee automatically added to the booking.</p>'
      : '';

    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-kicker" style="margin-bottom:0.75rem">Your event &mdash; ' + n + ' day' + (n === 1 ? '' : 's') + '</p>' +
      '<ul class="ui-copy" style="margin:0 0 1rem 1.1rem;color:rgba(0,0,0,0.75);list-style:disc">' + lines + '</ul>' +
      earlyCheckout +
      cleaningNote +
      '<div style="display:flex;flex-wrap:wrap;gap:0.75rem">' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="range-reset">Change dates</button>' +
        '<button type="button" class="booking-button booking-button-primary" data-action="range-review">Review your event &amp; add details</button>' +
      '</div>' +
    '</div>';
  }

  function renderCalendar() {
    var parts = state.calendarMonth.split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var monthName = new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date().toISOString().slice(0, 10);

    var dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
      .map(function (d) { return '<span class="calendar-day-header">' + d + '</span>'; })
      .join("");

    // RANGE mode (multi-day event): highlight the picked start→end span. Endpoints
    // read as selected; in-between days get a lighter in-range highlight even when
    // they have no standalone Acuity slot (the event is one continuous hold).
    var rangeMode = state.eventMode === "multi";
    var rStart = state._eventStartDate, rEnd = state._eventEndDate;

    var cells = "";
    for (var i = 0; i < firstDay; i++) {
      cells += '<span class="calendar-day is-empty"></span>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = state.calendarMonth + "-" + String(d).padStart(2, "0");
      var isAvailable = state.availableDates.indexOf(dateStr) !== -1;
      var isPast = dateStr < today;
      var isEndpoint = rangeMode && (dateStr === rStart || (rEnd && dateStr === rEnd));
      var inRange = rangeMode && rStart && rEnd && dateStr > rStart && dateStr < rEnd;
      var isSelected = rangeMode ? isEndpoint : (dateStr === state.selectedDate);
      var cls = "calendar-day";
      if (isSelected) cls += " is-selected";
      else if (inRange) cls += " is-in-range";
      else if (isAvailable && !isPast) cls += " is-available";
      else cls += " is-unavailable";
      if (dateStr === today) cls += " is-today";

      if (isAvailable && !isPast) {
        var dayLabel = new Date(year, month, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        cells += '<button type="button" class="' + cls + '" data-action="select-date" data-date="' + dateStr + '" aria-pressed="' + (isSelected ? "true" : "false") + '" aria-label="' + escapeAttribute(dayLabel) + '">' + d + '</button>';
      } else {
        cells += '<span class="' + cls + '">' + d + '</span>';
      }
    }

    var atCurrentMonth = state.calendarMonth <= new Date().toISOString().slice(0, 7);

    var spinner = state.isLoadingDates ? '<div class="booking-spinner"></div>' : '';
    var noAvail = !state.isLoadingDates && state.availableDates.length === 0
      ? '<p class="ui-copy-muted" style="margin-top:1rem;text-align:center">No availability this month</p>'
      : '';

    return '<div class="booking-panel-soft p-5">' +
      '<div class="calendar-nav">' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="navigate-month" data-delta="-1" style="padding:0.5rem 0.8rem"' + (atCurrentMonth ? " disabled" : "") + '>&larr;</button>' +
        '<span class="ui-copy-strong">' + monthName + '</span>' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="navigate-month" data-delta="1" style="padding:0.5rem 0.8rem">&rarr;</button>' +
      '</div>' +
      spinner +
      '<div class="booking-calendar">' + dayHeaders + cells + '</div>' +
      noAvail +
    '</div>';
  }

  function renderTimeSlots() {
    if (!state.selectedDate) return '';

    if (state.isLoadingTimes) {
      return '<div class="booking-panel-soft p-5 mt-5"><div class="booking-spinner"></div></div>';
    }

    if (state.availableTimes.length === 0) {
      return '<div class="booking-panel-soft p-5 mt-5"><p class="ui-copy-muted" style="text-align:center">No time slots available for this date</p></div>';
    }

    var dp = state.selectedDate.split("-");
    var humanDate = new Date(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    var pills = state.availableTimes.map(function (t) {
      var d = new Date(t);
      var label = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      var isSelected = t === state.selectedTime;
      var cls = "time-slot" + (isSelected ? " is-selected" : "");
      return '<button type="button" class="' + cls + '" data-action="select-time" data-time="' + escapeAttribute(t) + '" aria-pressed="' + (isSelected ? "true" : "false") + '" aria-label="' + escapeAttribute(humanDate + " at " + label) + '">' + label + '</button>';
    }).join("");

    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-kicker" id="timeslot-label" style="margin-bottom:1rem">Available times for ' + escapeHtml(humanDate) + '</p>' +
      '<div class="time-slot-grid" role="group" aria-labelledby="timeslot-label">' + pills + '</div>' +
    '</div>';
  }

  function getCleaningFee() {
    var count = parseCount(state.participants);
    // Also check intake participants for photo/video sessions
    var intakeCount = parseCount(state.intake.participants);
    var effectiveCount = Math.max(count, intakeCount);
    if (effectiveCount >= 35) {
      return { label: "Cleaning fee", amount: 150, note: "" };
    }
    return null;
  }

  function renderOrderSummary() {
    if (!state.selectedTime) return '';

    var selectedDuration = getSelectedDuration();
    var sessionPrice = selectedDuration ? (selectedDuration.price || 0) : 0;
    var addonTotal = 0;
    var addonLines = [];

    location.addons.forEach(function (addon) {
      var summary = getAddonSummary(addon);
      if (summary) {
        addonLines.push(summary);
        addonTotal += summary.amount;
      }
    });

    var cleaningFee = getCleaningFee();
    var cleaningFeeAmount = cleaningFee ? cleaningFee.amount : 0;

    // Promo discount applies to the RAW SESSION price only. The amount shown
    // here is a preview; the server re-validates and re-computes at pay time.
    // If the session price changed since the code was applied (duration swap),
    // re-derive the discount from the live session price so the preview stays
    // honest. The displayed dollars come from percentOff (whole-cent floor).
    // A full-comp code (comp:true) wipes the ENTIRE booking (session + add-ons +
    // fees) to $0 — not just a session percentage. The server re-validates and
    // recomputes the $0 at pay time; this is the matching preview.
    var isComp = !!(state.coupon && state.coupon.comp);
    var subtotal = sessionPrice + addonTotal + cleaningFeeAmount;
    var couponDiscount = 0;
    if (isComp) {
      couponDiscount = subtotal;
    } else if (state.coupon && state.coupon.amountOff > 0) {
      // Flat-dollar code (e.g. SHARON200): cents off the WHOLE order, clamped to
      // the live subtotal for the preview. The server recomputes + floors to >= 1c.
      couponDiscount = Math.min(state.coupon.amountOff / 100, subtotal);
    } else if (state.coupon && state.coupon.percentOff > 0 && sessionPrice > 0) {
      couponDiscount = Math.floor(sessionPrice * state.coupon.percentOff) / 100;
    }
    var grandTotal = subtotal - couponDiscount;
    if (grandTotal < 0) grandTotal = 0;

    // Offer mode (DREW-21): apply the link's ownership adjustments to the live
    // base and lock the total to the signed number. Coupons/deposit never mix
    // with an offer (the price IS the offer).
    var offerAdjSingle = null;
    var offerLinesSingle = '';
    if (offerActive()) {
      offerAdjSingle = offerAdjustments(Math.round(grandTotal * 100));
      offerLinesSingle = offerLinesHtml(offerAdjSingle);
      offerDriftCheck(offerAdjSingle.finalCents);
      grandTotal = offerAdjSingle.finalCents / 100;
    }
    var timeLabel = new Date(state.selectedTime).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });

    var addonHtml = addonLines.length
      ? addonLines.map(function (item) {
          return '<div class="summary-line summary-line-muted"><span>' + item.label + '</span><span>' + currency.format(item.amount) + '</span></div>';
        }).join("")
      : '';

    var cleaningFeeHtml = '';
    if (cleaningFee) {
      cleaningFeeHtml = '<div class="summary-line summary-line-muted"><span>' + cleaningFee.label + '</span><span>' + currency.format(cleaningFee.amount) + '</span></div>';
      if (cleaningFee.note) {
        cleaningFeeHtml += '<div style="margin-top:0.25rem"><span style="font-size:0.75rem;color:rgba(0,0,0,0.6);font-style:italic">' + cleaningFee.note + '</span></div>';
      }
    }

    // Discount line — comp shows the full-booking comp; otherwise the session %.
    var couponLineHtml = '';
    if (isComp) {
      couponLineHtml =
        '<div class="summary-line summary-line-muted"><span>Promo · ' + escapeHtml(state.coupon.code) +
        ' (free booking)</span><span>−' + currency.format(couponDiscount) + '</span></div>';
    } else if (state.coupon && state.coupon.amountOff > 0 && couponDiscount > 0) {
      couponLineHtml =
        '<div class="summary-line summary-line-muted"><span>Promo · ' + escapeHtml(state.coupon.code) +
        ' (' + currency.format(state.coupon.amountOff / 100) + ' off)</span><span>−' + currency.format(couponDiscount) + '</span></div>';
    } else if (state.coupon && couponDiscount > 0) {
      couponLineHtml =
        '<div class="summary-line summary-line-muted"><span>Promo · ' + escapeHtml(state.coupon.code) +
        ' (' + state.coupon.percentOff + '% off session)</span><span>−' + currency.format(couponDiscount) + '</span></div>';
    }

    // V3 item 6: deposit option (pay 60% now) for EVENT bookings only. Offered
    // in review mode is the cart's job; here it's the single-session event path.
    // When deposit is selected the charge becomes 60% of the total (the rest is
    // captured 48h before via the saved card, server-side). depositSplit lives
    // in pricing-shared so the displayed amount matches the server recompute.
    // Deposit UI is dark on prod until item-6 is armed (see depositUiEnabled).
    var isSingleEvent = state.eventIntent === "yes" && !cartIsActive() && !isComp && !OFFER && depositUiEnabled();
    var depositHtml = '';
    var chargeTotal = grandTotal;
    if (isSingleEvent && window.WWSPricing && window.WWSPricing.depositSplit) {
      var split = window.WWSPricing.depositSplit(Math.round(grandTotal * 100));
      if (state.paymentMode === "deposit") {
        chargeTotal = split.depositCents / 100;
      }
      depositHtml =
        '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
        '<p class="ui-copy-strong" style="margin-bottom:0.5rem">Payment option</p>' +
        '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
          '<label class="helper-item"><input type="radio" name="single-payment-mode" data-action="set-payment-mode" data-mode="full"' + (state.paymentMode !== "deposit" ? " checked" : "") + '><span>Pay in full now — ' + fmtMoney(grandTotal) + '</span></label>' +
          '<label class="helper-item"><input type="radio" name="single-payment-mode" data-action="set-payment-mode" data-mode="deposit"' + (state.paymentMode === "deposit" ? " checked" : "") + '><span>Pay 60% deposit now — ' + fmtMoney(split.depositCents / 100) + ' (Balance ' + fmtMoney(split.balanceDueCents / 100) + ' will be auto-charged to the card on file 48 hours before session start)</span></label>' +
        '</div>';
    } else if (state.paymentMode === "deposit") {
      // Non-event single session can't deposit — fall back to full.
      state.paymentMode = "full";
    }

    // Stash the live charge amount so updatePayButton() can label the button.
    // (deposit charges 60%; full charges the grand total — both in dollars.)
    state._grandTotal = chargeTotal;

    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-kicker" style="margin-bottom:1rem">Order summary</p>' +
      '<div class="summary-list">' +
        '<div class="summary-line"><span>' + escapeHtml(selectedDuration.label) + ' session</span><span>' + currency.format(sessionPrice) + '</span></div>' +
        addonHtml +
        cleaningFeeHtml +
        couponLineHtml +
        offerLinesSingle +
        '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
        '<div class="summary-line summary-total"><span><strong>Total</strong></span><span><strong>' + fmtMoney(grandTotal) + '</strong></span></div>' +
      '</div>' +
      depositHtml +
      renderCouponRow() +
      '<p class="ui-copy-muted payment-note" style="margin-top:1rem">' + escapeHtml(timeLabel) + ' at ' + escapeHtml(location.name) + '</p>' +
    '</div>';
  }

  // Promo-code input + Apply button (or the applied state + Remove). Lives
  // inside the order summary so it re-renders with the total. The handlers do
  // targeted DOM work (no full re-render from keystrokes — see input handler).
  function renderCouponRow() {
    // Offer mode: the price IS the offer — no promo field, ever.
    if (OFFER) return '';
    // Gate: only render the promo field during an active campaign (or if a code
    // is already applied this session). Hidden entirely otherwise.
    if (!state.promoActive && !state.coupon) return '';
    if (state.coupon) {
      return '<div class="coupon-row" style="margin-top:1rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem">' +
        '<span class="ui-copy-strong" style="font-size:0.85rem">Promo code <strong>' + escapeHtml(state.coupon.code) + '</strong> applied</span>' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="remove-coupon" style="padding:0.4rem 0.8rem;font-size:0.8rem">Remove</button>' +
      '</div>';
    }

    var errHtml = state.couponError
      ? '<p class="ui-copy-muted" data-coupon-error role="status" aria-live="polite" style="margin-top:0.4rem;font-size:0.8rem;color:#b3261e">' + escapeHtml(state.couponError) + '</p>'
      : '<p class="ui-copy-muted" data-coupon-error role="status" aria-live="polite" style="margin-top:0.4rem;font-size:0.8rem;display:none"></p>';

    return '<div class="coupon-row" style="margin-top:1rem">' +
      '<label class="ui-field-label" for="coupon-code" style="font-size:0.8rem">Promo code</label>' +
      '<div style="display:flex;gap:0.5rem;margin-top:0.35rem">' +
        '<input type="text" id="coupon-code" class="booking-input" data-input="coupon-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Enter code" value="' + escapeAttribute(state.couponInput || "") + '" style="flex:1;text-transform:uppercase"' + (state.couponPending ? ' disabled' : '') + '>' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="apply-coupon" data-coupon-apply' + (state.couponPending ? ' disabled' : '') + ' style="white-space:nowrap">' + (state.couponPending ? 'Checking…' : 'Apply') + '</button>' +
      '</div>' +
      errHtml +
    '</div>';
  }

  function renderCheckoutPanel() {
    var container = document.querySelector("[data-checkout-summary]");
    if (!container) return;

    var paySection = document.querySelector("[data-payment-section]");
    var compSection = document.querySelector("[data-comp-section]");

    // Payable when there's an active slot OR we're reviewing a built cart/event
    // (a multi-day range event has no single active slot — the cart IS the order).
    var payableCart = state._cartReviewing && cartIsActive();
    if (!state.selectedTime && !payableCart) {
      container.innerHTML = '<div class="note-card"><p class="ui-copy-strong">Select a date and time in Step 2 to see your order summary.</p></div>';
      if (paySection) paySection.hidden = true;
      if (compSection) compSection.hidden = true;
      return;
    }

    // Full-comp booking ($0): swap the card form for the payment-free "Book now"
    // panel. The free path POSTs without a Square token; the server re-validates
    // the comp coupon and re-gates the $0. Every other booking keeps the card form.
    var isComp = !!(state.coupon && state.coupon.comp);

    // In cart review mode the cart-summary owns the totals + deposit option, so
    // suppress the single-draft order summary (it would duplicate/confuse). The
    // payment section stays visible — one pay button charges the whole cart.
    if (state._cartReviewing && cartIsActive()) {
      container.innerHTML = '';
    } else {
      container.innerHTML = renderOrderSummary();
    }
    if (paySection) paySection.hidden = isComp;
    if (compSection) compSection.hidden = !isComp;

    // Prefill "Name on card" from the Step-3 booker until the user edits it,
    // so the saved card-on-file label matches whoever's card is used (which
    // may differ from the booker — business card, spouse, planner, etc.).
    var nameInput = document.querySelector("[data-input='name-on-card']");
    if (nameInput && !state._nameOnCardEdited) {
      var bookerName = ((state.contact.firstName || "") + " " + (state.contact.lastName || "")).trim();
      nameInput.value = bookerName;
      state.nameOnCard = bookerName;
    }

    // Comp bookings need no card. Don't mount Square; if the user later removes
    // the comp code, the next render re-shows paySection and mounts it (idempotent).
    if (!isComp) initSquareCard();
    updatePayButton();
    updateCompButton();
  }

  // Free-comp "Book now" button — mirrors updatePayButton for the payment-free
  // path. Enabled once a session/slot exists and no submit is in flight.
  function updateCompButton() {
    var btn = document.querySelector("[data-comp-btn]");
    if (!btn) return;
    var hasSession = !!state.selectedTime || (state._cartReviewing && cartIsActive());
    btn.disabled = state.isSubmitting || !hasSession;
    btn.textContent = state.isSubmitting ? "Processing…" : "Book now";
  }

  function setCompStatus(msg, isError) {
    var el = document.querySelector("[data-comp-status]");
    if (!el) return;
    el.textContent = msg || "";
    el.style.display = msg ? "" : "none";
    el.classList.toggle("card-status-error", !!(msg && isError));
  }

  // --- Square Web Payments SDK (card-on-file) ---------------------------

  var squareSdkPromise = null;

  // Fetch public config + inject the SDK script. Resolves with the config.
  function loadSquareSdk() {
    if (squareSdkPromise) return squareSdkPromise;
    squareSdkPromise = fetch("/api/booking-public-config")
      .then(function (r) {
        if (!r.ok) throw new Error("config " + r.status);
        return r.json();
      })
      .then(function (cfg) {
        if (window.Square) return cfg;
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = cfg.squareSdkUrl;
          s.onload = function () { resolve(cfg); };
          s.onerror = function () { reject(new Error("Square SDK failed to load")); };
          document.head.appendChild(s);
        });
      });
    return squareSdkPromise;
  }

  // Initialize the card field once, when step 5 is reached. Idempotent —
  // the iframe lives in [data-payment-section], which is never re-rendered.
  function initSquareCard() {
    if (state.squareCard || state._cardInitInFlight) return;
    var target = document.querySelector("#card-container");
    if (!target) return;
    // offsetParent is null when any ancestor is display:none. Square's
    // attach() needs a visible container — skip now, retry when step 5
    // is actually shown (setStep / renderCheckoutPanel call us again).
    if (target.offsetParent === null) return;
    state._cardInitInFlight = true;

    loadSquareSdk()
      .then(function (cfg) {
        var payments = window.Square.payments(cfg.squareAppId, cfg.squareLocationId);
        return payments.card().then(function (card) {
          return card.attach("#card-container").then(function () {
            state.squareCard = card;
            state.squareCardReady = true;
            state._cardInitInFlight = false;
            setCardStatus("");
            updatePayButton();
          });
        });
      })
      .catch(function (err) {
        state._cardInitInFlight = false;
        state.squareCardReady = false;
        console.error("Square card init failed:", err);
        setCardStatus("Card field couldn't load. Refresh the page, or email us to book.", true);
        updatePayButton();
      });
  }

  function setCardStatus(msg, isError) {
    var el = document.querySelector("[data-card-status]");
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? "" : "none";
    // Render failures in danger red (readable); normal/loading messages stay
    // the muted payment-note grey. Class toggle only — no logic change.
    el.classList.toggle("card-status-error", !!(msg && isError));
  }

  // Single source of truth for the Pay & Book button's label + enabled
  // state. Called whenever anything that gates payment changes.
  function updatePayButton() {
    var btn = document.querySelector("[data-pay-btn]");
    if (!btn) return;
    var total = state._grandTotal;
    // A session exists to pay for when there's an active slot OR (cart mode) at
    // least one committed session. The cart can be paid with the current draft
    // un-slotted (the committed sessions are bookable on their own).
    var hasSession = !!state.selectedTime || (state._cartReviewing && cartIsActive());
    var ready = state.squareCardReady && state.cardOnFileConsent &&
      !state.isSubmitting && hasSession;
    btn.disabled = !ready;
    var depositMode = state.paymentMode === "deposit";
    if (state.isSubmitting) {
      btn.textContent = "Processing…";
    } else if (typeof total === "number") {
      btn.textContent = (depositMode ? "Pay deposit & Book — " : "Pay & Book — ") + fmtMoney(total);
    } else {
      btn.textContent = "Pay & Book";
    }
  }

  // Validate the typed promo code against the server (read-only preview). On
  // success store state.coupon and re-render the summary (shows discount line +
  // new total). On failure show an inline error. The server is authoritative —
  // this only previews; create-checkout re-validates at pay time.
  async function applyCoupon() {
    if (state.couponPending) return;
    var raw = (state.couponInput || "").trim();
    if (!raw) {
      setCouponError("Enter a promo code.");
      return;
    }
    var appointmentTypeID = getAppointmentTypeID();

    state.couponPending = true;
    state.couponError = "";
    renderCheckoutPanel();

    try {
      var res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: raw,
          location: location.slug,
          appointmentTypeID: appointmentTypeID
        })
      });
      var data = await res.json();
      state.couponPending = false;

      if (res.ok && data && data.valid) {
        // comp:true is a FULL-COMP code (e.g. WWSHUNDRED) — the whole booking is
        // $0 and the final step skips the card form (see renderCheckoutPanel /
        // handlePayAndBook). The server re-validates + re-gates the $0 at pay time.
        state.coupon = {
          code: data.code,
          comp: data.comp === true,
          percentOff: data.percentOff || 0,
          amountOff: data.amountOff || 0,
          discountCents: data.discountCents || 0
        };
        state.couponInput = "";
        state.couponError = "";
        trackEvent("coupon_applied", { location: location.slug, code: data.code, percent_off: data.percentOff || 0, comp: data.comp === true });
        renderCheckoutPanel();
      } else {
        state.coupon = null;
        setCouponError((data && data.reason) || "That promo code isn’t valid.");
        trackEvent("coupon_rejected", { location: location.slug, code: raw });
      }
    } catch (err) {
      state.couponPending = false;
      state.coupon = null;
      setCouponError("Couldn’t check that code. Please try again.");
    }
  }

  function setCouponError(msg) {
    state.couponError = msg;
    // Re-render the summary so the (now error) state is reflected, and so the
    // Apply button / input are re-enabled after a pending check.
    renderCheckoutPanel();
  }

  async function handlePayAndBook() {
    if (state.isSubmitting) return;

    // Full-comp ($0) booking takes the payment-free branch: no card gates, no
    // tokenize, POST with NO Square token. The server re-validates the comp
    // coupon and re-gates the $0 — the client signal alone never skips payment.
    var isComp = !!(state.coupon && state.coupon.comp);

    // Client-side validation safety net — prevents checkout if steps were skipped
    var errors = getValidationErrors();
    if (errors.length > 0) {
      trackEvent("checkout_validation_failed", { location: location.slug, error: errors[0] });
      alert(errors[0]); // Show first error
      // Navigate to the earliest incomplete step
      if (!state.durationId) { setStep(1); return; }
      if (!hasBookableSlot()) { setStep(2); return; }
      if (!state.contact.firstName || !state.contact.email || !isTermsAccepted()) { setStep(3); return; }
      if (!state.waiverSigned) { setStep(4); return; }
      return;
    }

    // Card-on-file gates — skipped for a comp booking (there is no card).
    if (!isComp) {
      if (!state.squareCardReady) {
        setCardStatus("The secure card field is still loading. One moment…");
        return;
      }
      if (!state.cardOnFileConsent) {
        var cofHint = document.querySelector("[data-hint='card-on-file-consent']");
        if (cofHint) cofHint.textContent = "Please authorize the card-on-file policy to continue.";
        return;
      }
    }

    var payDuration = getSelectedDuration();
    var activeAddons = 0;
    location.addons.forEach(function(a) {
      var s = state.addons[a.id];
      if (s && (s.selected || s.quantity > 0)) activeAddons++;
    });
    trackEvent("pay_and_book_clicked", {
      location: location.slug,
      duration_id: state.durationId,
      duration_hours: payDuration ? payDuration.hours : null,
      total: payDuration ? payDuration.price : null,
      addon_count: activeAddons
    });

    // Stable per-booking idempotency seed — survives tokenize retries so a
    // resubmit after a lost response never double-charges.
    if (!state.bookingAttemptId) {
      state.bookingAttemptId = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
    }

    state.isSubmitting = true;
    updatePayButton();
    updateCompButton();
    setCardStatus("");
    setCompStatus("");

    var appointmentTypeID = getAppointmentTypeID();

    // V3 item 2/6: this booking routes through the cart endpoint when more than
    // one session is in play OR a deposit was chosen. The cart endpoint verifies
    // every session's availability server-side, so the single-slot client
    // pre-verify below is skipped for the cart path (and would be wrong when the
    // active draft has no slot in review mode).
    // Offer mode always routes through the cart endpoint — it owns the
    // offer-token verification and per-session availability checks, and a
    // single-session offer is just a one-session cart.
    var willUseCart = !!OFFER || cartIsActive() || (state.paymentMode === "deposit");

    try {
      // Verify the (single-session) slot is still available. Cart path defers to
      // the server's per-session verification.
      if (!willUseCart) {
        var verifyRes = await fetch("/api/verify-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentTypeID: appointmentTypeID,
            datetime: state.selectedTime
          })
        });
        var verifyData = await verifyRes.json();
        if (!verifyData.available) {
          alert("Sorry, that time slot is no longer available. Please select a different time.");
          state.selectedTime = "";
          state.isSubmitting = false;
          updatePayButton();
          updateCompButton();
          fetchAvailableTimes(appointmentTypeID, state.selectedDate);
          return;
        }
      }

      // Tokenize: CHARGE_AND_STORE = charge now + save card on file.
      // Any SCA/3DS challenge the issuer requires happens inside tokenize().
      // A comp booking has no card — skip tokenize entirely and POST no token.
      var squareToken = null;
      if (!isComp) {
        var tok;
        try {
          tok = await state.squareCard.tokenize({
            intent: "CHARGE_AND_STORE",
            customerInitiated: true,
            sellerKeyedIn: false,
            amount: (typeof state._grandTotal === "number" ? state._grandTotal : 0).toFixed(2),
            currencyCode: "USD",
            billingContact: {
              // Single free-text name field — pass the cardholder name verbatim
              // as givenName (no split: "WHITEWALL VENTURES LLC" / middle names
              // would mangle). Falls back to the booker name when blank.
              givenName: (state.nameOnCard || "").trim() ||
                ((state.contact.firstName || "") + " " + (state.contact.lastName || "")).trim(),
              familyName: "",
              email: state.contact.email || "",
              countryCode: "US"
            }
          });
        } catch (tokErr) {
          throw new Error("We couldn't read your card. Please re-enter it and try again.");
        }
        if (!tok || tok.status !== "OK" || !tok.token) {
          var tdetail = tok && tok.errors && tok.errors[0] && tok.errors[0].detail;
          state.isSubmitting = false;
          updatePayButton();
          setCardStatus(tdetail || "Your card could not be verified. Please check the details and try again.", true);
          trackEvent("checkout_error", { location: location.slug, error_message: "tokenize:" + (tok && tok.status) });
          return;
        }
        squareToken = tok.token;
      }

      // V3 item 2/6: route to the multi-session cart payload when this booking
      // is a cart (more than one session committed) OR when a single-session
      // EVENT chose the 60% deposit (the cart endpoint owns deposit mode). The
      // single-session FULL-pay payload below is byte-identical to before.
      var useCartPayload = willUseCart;
      var checkoutBody;
      if (useCartPayload) {
        // squareToken is null for a comp cart — the server re-validates the comp
        // coupon (carried in universal.couponCode) and takes the payment-free path.
        checkoutBody = buildCartCheckoutBody(squareToken);
      } else {
        checkoutBody = {
          appointmentTypeID: appointmentTypeID,
          datetime: state.selectedTime,
          location: location.slug,
          contact: state.contact,
          intake: state.intake,
          addons: state.addons,
          eventIntent: state.eventIntent,
          participants: state.participants || state.intake.participants || "",
          eventDescription: state.eventDescription,
          foodDrinks: state.foodDrinks,
          highTrafficNote: state.highTrafficNote,
          tmHighTrafficNote: state.tmHighTrafficNote,
          emailAcknowledgment: state.emailAcknowledgment,
          termsSignature: state.termsSignature,
          waiverSigned: state.waiverSigned,
          cleaningFee: getCleaningFee(),
          cardholderName: (state.nameOnCard || "").trim(),
          couponCode: state.coupon ? state.coupon.code : "",
          squareToken: squareToken,
          clientIdempotencyKey: state.bookingAttemptId,
          consent: {
            cardOnFile: true,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        };
      }

      var checkoutRes = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody)
      });
      var checkoutData = await checkoutRes.json();

      // Buffer conflict — cleaning fee booking but next session is too close
      if (checkoutData.error === "buffer-conflict") {
        state.isSubmitting = false;
        updatePayButton();
        updateCompButton();
        showBufferConflictModal(checkoutData.message, checkoutData.options || []);
        return;
      }

      if (!checkoutRes.ok || !checkoutData.success || !checkoutData.redirect) {
        throw new Error(checkoutData.error || "Booking could not be completed.");
      }

      trackEvent("booking_completed", { location: location.slug });
      // Stash the booker email so the confirmation page can prefill the
      // "create an account" prompt. Best-effort; never blocks the redirect.
      try { sessionStorage.setItem("wws_booking_email", state.contact.email || ""); } catch (e) {}
      // Stash the charged total so the confirmation page can fire the Google Ads
      // booking conversion with a real value (ENT-98). Best-effort; never blocks.
      try { sessionStorage.setItem("wws_booking_total", String(typeof state._grandTotal === "number" ? state._grandTotal : "")); } catch (e) {}
      window.location.href = checkoutData.redirect;
    } catch (err) {
      console.error("Checkout error:", err);
      trackEvent("checkout_error", { location: location.slug, error_message: err.message });
      state.isSubmitting = false;
      updatePayButton();
      updateCompButton();
      // Route the message to whichever panel the user is looking at.
      if (isComp) {
        setCompStatus(err.message || "Something went wrong. Please try again.", true);
      } else {
        setCardStatus(err.message || "Something went wrong. Please try again.", true);
      }
    }
  }

  function renderEventStep() {
    const container = document.querySelector("[data-event-step]");
    if (!container) {
      return;
    }

    var detailsSection = document.querySelector("[data-step3-details]");

    if (location.slug !== "powdersville") {
      // TM is photo/video only — auto-set intent and show form
      state.eventIntent = "no";
      container.innerHTML = `
        <div class="note-card">
          <p class="ui-copy-strong">This location is only approved for photo and video shoots, no events/parties allowed.</p>
        </div>
      `;
      if (detailsSection) detailsSection.style.display = BUILDER ? "none" : "";
      return;
    }

    // PV: show/hide form based on whether user has chosen photo/video or event.
    // Builder mode never shows the contact/terms block — the flow ends at add-ons.
    if (detailsSection) {
      detailsSection.style.display = state.eventIntent && !BUILDER ? "" : "none";
    }

    const selectedDuration = getSelectedDuration();
    const isOneHour = selectedDuration && selectedDuration.hours === 1;

    const warning =
      state.eventIntent === "no" && /^\d+$/.test(state.participants.trim())
        ? `
          <div class="warning-card" style="margin-top:1rem">
            Looks like you have attendees — did you mean to select "Event booking" above? If this is a photo/video session, leave this blank.
          </div>
        `
        : "";

    const capacityNotice =
      /^\d+$/.test(state.participants.trim()) && parseCount(state.participants) >= 35
        ? `
          <div class="warning-card" style="margin-top:1rem">
            For events with 35+ attendees, a $150 cleaning fee is automatically included.
          </div>
        `
        : "";

    const participantLabel = state.eventIntent === "yes"
      ? ("How many people will be attending your event?" + (BUILDER ? " (optional)" : ""))
      : 'Event? How many people will you have? <strong>If this is a photo/video session, leave this blank.</strong>';

    container.innerHTML = `
      ${!state.bookingType ? `
      <p class="ui-copy" style="margin-bottom:1.5rem;color:rgba(0,0,0,0.55)">Events are allowed for 2-hour sessions and longer.</p>
      <div class="choice-grid is-two-up">
        <button type="button" class="booking-choice ${state.eventIntent === "no" ? "is-active" : ""}" data-action="set-event-intent" data-value="no" aria-pressed="${state.eventIntent === "no"}">
          <p class="ui-kicker">Use this for</p>
          <h3 class="ui-display-sm" style="margin-top:0.75rem">Photo / video session</h3>
          <p class="ui-copy" style="margin-top:1rem">Standard photo, video, or production session.</p>
        </button>
        <button type="button" class="booking-choice ${state.eventIntent === "yes" ? "is-active" : ""}" data-action="set-event-intent" data-value="yes" aria-pressed="${state.eventIntent === "yes"}">
          <p class="ui-kicker">Use this for</p>
          <h3 class="ui-display-sm" style="margin-top:0.75rem">Event booking</h3>
          <p class="ui-copy" style="margin-top:1rem">Parties, receptions, workshops, and gatherings.</p>
          ${isOneHour ? '<p class="ui-copy" style="margin-top:0.5rem;color:rgba(0,0,0,0.6);font-size:0.8rem">(Not eligible for events)</p>' : ""}
        </button>
      </div>
      ` : ""}

      ${state.eventIntent === "yes" ? `
      <div style="margin-top:1.5rem">
        <label class="ui-field-label" for="participants">${participantLabel}</label>
        <input class="booking-input" id="participants" data-input="participants" type="number" inputmode="numeric" min="1" value="${escapeHtml(state.participants)}" placeholder="Expected number of attendees">
      </div>

      <div data-participant-notices>
        ${warning}
        ${capacityNotice}
        ${getHighTrafficHtml()}
      </div>

      <div data-event-form>
        ${getEventFormHtml()}
      </div>
      ` : ""}
    `;

    // Hide intake participants field for PV events (already captured at top of step)
    var intakeRow = document.querySelector("[data-intake-participants-row]");
    if (intakeRow) {
      intakeRow.style.display = state.eventIntent === "yes" ? "none" : "";
    }
    // DREW-31: the photo/video purpose dropdown only applies to non-events.
    // Events/multi-day answer the open-ended event description instead.
    var purposeRow = document.querySelector("[data-intake-purpose-row]");
    if (purposeRow) {
      purposeRow.style.display = state.eventIntent === "yes" ? "none" : "";
    }
  }

  function getEventFormHtml() {
    // Safety: capture textarea value before DOM is rebuilt (fixes validation bug)
    var existingTextarea = document.getElementById('event-description');
    if (existingTextarea) {
      state.eventDescription = existingTextarea.value;
    }
    var count = parseCount(state.participants);

    // 150+ people: block booking entirely
    if (count > 150) {
      return `
        <div class="warning-card" style="margin-top:1.5rem;border-color:#dc2626;background:#fef2f2">
          <p class="ui-copy-strong" style="margin-bottom:0.75rem">Unable to book online</p>
          <p class="ui-copy">The event cannot host more than 150 people total, including vendors and contractors. If you have a specific request, please <a href="mailto:info@whitewallstudios.co" style="text-decoration:underline">email us directly</a>.</p>
        </div>
      `;
    }

    // Determine textarea label and style based on participant count
    var textareaLabel = "Tell us about the event";
    var textareaPrompt = "";
    var borderClass = "";

    if (count >= 35) {
      borderClass = "event-textarea-warning";
      textareaLabel = "Tell Us About Your Event";
      textareaPrompt = "Please include as much detail as possible so we can fully understand your event. Be sure to book enough time for setup, your event, and returning the studio to its original, clean condition. Our calendar is often booked back-to-back, and it\u2019s common for another booking to be scheduled immediately after yours\u2014so please plan your timing accordingly. Our team may reach out for additional details about your event, but your booking is approved and confirmed by default. For events with 35+ attendees, a $150 cleaning fee is automatically applied.";
    } else {
      textareaLabel = "Tell Us About Your Event";
      textareaPrompt = "Please include as much detail as possible so we can fully understand your event. Be sure to book enough time for setup, your event, and returning the studio to its original, clean condition. Our calendar is often booked back-to-back, and it\u2019s common for another booking to be scheduled immediately after yours\u2014so please plan your timing accordingly.";
    }

    return `
      <div class="choice-grid" style="margin-top:1.5rem">
        <div>
          <label class="ui-field-label" for="event-description">${textareaLabel}${BUILDER ? " (optional)" : ""}</label>
          ${textareaPrompt ? '<p class="ui-copy" style="margin-bottom:0.75rem;color:rgba(0,0,0,0.55);font-size:0.85rem">' + textareaPrompt + '</p>' : ''}
          <textarea class="booking-textarea ${borderClass}" id="event-description" data-input="event-description" placeholder="What are you hosting?">${escapeHtml(state.eventDescription)}</textarea>
        </div>
        ${!BUILDER ? `
        <fieldset class="booking-panel-soft panel-pad" style="border:0;margin:0">
          <legend class="ui-kicker" style="margin-bottom:1rem;padding:0">Will there be food or drinks at your event?</legend>
          <div style="display:flex;gap:1rem">
            <label class="helper-item">
              <input type="radio" name="food-drinks" data-check="food-drinks-yes" ${state.foodDrinks === true ? "checked" : ""}>
              <span>Yes</span>
            </label>
            <label class="helper-item">
              <input type="radio" name="food-drinks" data-check="food-drinks-no" ${state.foodDrinks === false ? "checked" : ""}>
              <span>No</span>
            </label>
          </div>
        </fieldset>
        <div class="booking-panel-soft panel-pad">
          <p class="ui-kicker">Required acknowledgements</p>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="cleanup" ${state.acknowledgements.cleanup ? "checked" : ""}>
            <span>Please leave the studio exactly how you found it.</span>
          </label>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="capacity" ${state.acknowledgements.capacity ? "checked" : ""}>
            <span>I understand that bookings with 35+ guests include a $150 cleaning fee. (Unless you select the Event Setup and Reset Crew add-on)</span>
          </label>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="self-service" ${state.acknowledgements.selfService ? "checked" : ""}>
            <span>I understand this is a fully self-service event space with no team on site. (Unless you select the Event Setup and Reset Crew add-on)</span>
          </label>
        </div>
        ` : ""}
      </div>
    `;
  }

  function getHighTrafficHtml() {
    // Only show high-traffic note for non-event bookings with 35+ participants
    if (state.eventIntent === "yes") return "";
    var count = parseCount(state.participants);
    if (!count || count < 35) return "";
    return `
      <div class="booking-panel-soft p-5 mt-4">
        <p class="ui-copy-strong" style="margin-bottom:0.75rem">Tell us more about your shoot</p>
        <p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.55)">A $150 cleaning fee is included with your booking.</p>
        <textarea class="booking-textarea" data-input="high-traffic-note" placeholder="Describe your shoot or event…">${escapeHtml(state.highTrafficNote)}</textarea>
      </div>
    `;
  }

  function updateEventForm() {
    var container = document.querySelector("[data-event-form]");
    if (!container) return;
    if (state.eventIntent === "yes") {
      container.innerHTML = getEventFormHtml();
    } else {
      container.innerHTML = "";
    }
    // Update step navigation (Next button enable/disable)
    renderStepVisibility();
    updateTermsGate();
  }

  function updateParticipantNotices() {
    var container = document.querySelector("[data-participant-notices]");
    if (!container) return;

    var count = parseCount(state.participants);
    var warning =
      state.eventIntent === "no" && /^\d+$/.test(state.participants.trim())
        ? '<div class="warning-card" style="margin-top:1rem">Looks like you have attendees — did you mean to select "Event booking" above? If this is a photo/video session, leave this blank.</div>'
        : "";
    // The 35+ cleaning-fee disclaimer is only relevant on the SINGLE-day path,
    // where headcount triggers it. A multi-day event always has the $150 fee baked
    // in regardless of attendees, so the disclaimer is redundant there (Drew 2026-07-11).
    var capacityNotice =
      state.eventMode !== "multi" && /^\d+$/.test(state.participants.trim()) && count >= 35
        ? '<div class="warning-card" style="margin-top:1rem">For events with 35+ attendees, a $150 cleaning fee is automatically included.</div>'
        : "";

    container.innerHTML = warning + capacityNotice + getHighTrafficHtml();
  }

  function renderAddons() {
    // V3 item 2: add-ons moved EARLY (Drew) — render into the step-3 container
    // when it exists and hide the legacy step-5 list so the customer picks
    // add-ons right after the photo/event intent choice. Falls back to the
    // step-5 list if the early container isn't present (defensive — older HTML).
    var earlyContainer = document.querySelector("[data-addon-list-early]");
    var legacyContainer = document.querySelector("[data-addon-list]");
    var container = earlyContainer || legacyContainer;
    if (!container) {
      return;
    }
    if (earlyContainer) {
      // Show the early list only once an intent is chosen (the add-on set
      // depends on event vs photo for PV's events-only add-ons), then hide the
      // legacy step-5 list to avoid a duplicate render.
      earlyContainer.hidden = !state.eventIntent && !(BUILDER && state.bookingType);
      earlyContainer.classList.add("choice-grid", "is-two-up");
      if (legacyContainer && legacyContainer !== earlyContainer) {
        legacyContainer.hidden = true;
        legacyContainer.innerHTML = "";
      }
    }

    var scrollPositions = {};
    container.querySelectorAll(".backdrop-carousel").forEach(function (el) {
      var addonId = el.closest("[data-addon-card-id]");
      if (addonId) {
        scrollPositions[addonId.dataset.addonCardId] = el.scrollLeft;
      }
    });

    // Events-only add-ons (e.g. Event Setup and Reset Crew) render only when the booking
    // is an event. eventIntent is PV-only ("yes"/"no"); TM is always non-event.
    var visibleAddons = location.addons.filter(function (addon) {
      return !addon.eventsOnly || state.eventIntent === "yes";
    });

    // Display order (Drew 2026-07-11): chairs, tables, TV, PA, walls, backdrops,
    // lighting, then the Event Setup and Reset Crew last. Ids not listed keep their
    // config order after these. Order is display-only (logic keys off addon.id).
    var ADDON_ORDER = ["chairs", "tables", "tv", "pa-system", "rolling-walls", "backdrops", "lighting", "setup-crew"];
    visibleAddons.sort(function (a, b) {
      var ia = ADDON_ORDER.indexOf(a.id); if (ia === -1) ia = ADDON_ORDER.length;
      var ib = ADDON_ORDER.indexOf(b.id); if (ib === -1) ib = ADDON_ORDER.length;
      return ia - ib;
    });

    container.innerHTML = visibleAddons.map(renderAddonCard).join("");

    container.querySelectorAll(".backdrop-carousel").forEach(function (el) {
      var addonId = el.closest("[data-addon-card-id]");
      if (addonId && scrollPositions[addonId.dataset.addonCardId]) {
        el.scrollLeft = scrollPositions[addonId.dataset.addonCardId];
      }
    });
  }

  // Placement dropdowns for an add-on that requires them (Event Setup and Reset
  // Crew): shown once selected. Extracted so both the standard toggle control and
  // the featured card can render them. Returns "" when not applicable.
  function renderPlacementRows(addon, addonState) {
    if (!addon.requiresPlacements || !addonState.selected || !Array.isArray(addon.placementItems)) return "";
    var placements = addonState.placements || {};
    var rows = addon.placementItems.map(function (item) {
      var chosen = placements[item.id] || "";
      var opts = ['<option value="" disabled ' + (chosen ? "" : "selected") + '>Select...</option>']
        .concat(item.options.map(function (opt) {
          return '<option value="' + escapeHtml(opt) + '"' + (chosen === opt ? " selected" : "") + ">" + escapeHtml(opt) + "</option>";
        }))
        .join("");
      return `
        <label class="ui-field" style="display:block;margin-top:0.75rem">
          <span class="ui-copy-strong">${escapeHtml(item.label)}</span>
          <select class="booking-input" data-action="set-placement" data-addon-id="${addon.id}" data-placement-id="${item.id}" style="margin-top:0.35rem">
            ${opts}
          </select>
        </label>`;
    }).join("");
    return `
      <div class="addon-placements" style="margin-top:1rem">
        <p class="ui-copy-strong">Tell our crew where each item should go:</p>
        ${rows}
      </div>
    `;
  }

  // Featured add-on card (Event Setup and Reset Crew, Drew 2026-07-11): one large
  // square, stacked on the HORIZONTAL axis — header (title, subtitle, optional +
  // price pills) on top, then a full-width photo, then the full-width description,
  // ending in a large plain pill button (no photo inside it). Placement dropdowns
  // appear under the button once added.
  function renderFeaturedAddonCard(addon, addonState) {
    const tagline = addon.tagline
      ? '<p class="addon-card-tagline">' + escapeHtml(addon.tagline) + '</p>'
      : '';
    const added = addonState.selected;
    return `
      <article class="addon-card addon-card-featured" data-addon-card-id="${addon.id}">
        <div class="addon-card-content addon-featured-head">
          <div>
            <h3 class="ui-display-sm">${addon.name}</h3>
            ${tagline}
          </div>
          <div class="addon-featured-pills">
            <span class="summary-pill" style="border:1px solid rgba(0,0,0,0.12);color:rgba(0,0,0,0.5)">Optional</span>
            <span class="summary-pill" style="border:1px solid rgba(0,0,0,0.12);color:rgba(0,0,0,0.5)">${currency.format(addon.price)}</span>
          </div>
        </div>
        <img class="addon-featured-photo" src="${addon.image}" alt="${escapeHtml(addon.name)}">
        <div class="addon-card-content">
          <p class="ui-copy">${formatAddonDescription(addon)}</p>
          <button type="button" class="booking-button ${added ? "booking-button-secondary" : "booking-button-primary"} addon-featured-btn" data-action="toggle-addon" data-addon-id="${addon.id}">
            ${added ? "Added to your booking &#10003; — tap to remove" : "Add the Setup/Reset Crew to your booking"}
          </button>
          ${renderPlacementRows(addon, addonState)}
        </div>
      </article>
    `;
  }

  function renderAddonCard(addon) {
    const addonState = state.addons[addon.id];

    // Featured add-on gets a bespoke full-width, vertically-stacked layout.
    if (addon.featured) return renderFeaturedAddonCard(addon, addonState);

    const priceLine = getAddonPriceLine(addon);
    const controls = renderAddonControls(addon, addonState);

    return `
      <article class="addon-card" data-addon-card-id="${addon.id}">
        <img src="${addon.image}" alt="${escapeHtml(addon.name)}">
        <div class="addon-card-content">
          <div class="ui-row-start">
            <div>
              <p class="ui-kicker">${priceLine}</p>
              <h3 class="ui-display-sm" style="margin-top:0.5rem">${addon.name}</h3>
            </div>
            <span class="summary-pill" style="border:1px solid rgba(0,0,0,0.12);color:rgba(0,0,0,0.5)">
              ${formatAddonSubtotal(addon)}
            </span>
          </div>
          <p class="ui-copy" style="margin-top:1rem">${formatAddonDescription(addon)}</p>
          <div style="margin-top:1.25rem">
            ${controls}
          </div>
        </div>
      </article>
    `;
  }

  function renderAddonControls(addon, addonState) {
    if (addon.type === "toggle") {
      var toggleImg = addon.buttonImage || addon.image;
      var toggleHtml = `
        <div class="backdrop-carousel">
          <button type="button" class="backdrop-card ${addonState.selected ? "is-selected" : ""}" data-action="toggle-addon" data-addon-id="${addon.id}">
            ${toggleImg ? `<img src="${toggleImg}" alt="${escapeHtml(addon.name)}">` : ""}
            <div class="backdrop-card-body">
              <span class="backdrop-card-label">${addonState.selected ? "Added" : "Add to Booking"}</span>
              <span class="backdrop-card-price">${currency.format(addon.price)}</span>
            </div>
            <span class="backdrop-check ${addonState.selected ? "is-visible" : ""}">&#10003;</span>
          </button>
        </div>
      `;
      // Placement dropdowns (e.g. Event Setup and Reset Crew): when selected, the
      // customer must say where each studio item should go. Required before pay.
      toggleHtml += renderPlacementRows(addon, addonState);
      return toggleHtml;
    }

    if (addon.type === "quantity") {
      var allLabel = addon.max ? "All " + addon.max + " " + (addon.unitLabel || "items") : "";
      return `
        <div class="ui-row">
          <div class="ui-row-center">
            <button type="button" class="booking-button booking-button-secondary" data-action="adjust-quantity" data-addon-id="${addon.id}" data-delta="-1">-</button>
            <span class="ui-count">${addonState.quantity}</span>
            <button type="button" class="booking-button booking-button-secondary" data-action="adjust-quantity" data-addon-id="${addon.id}" data-delta="1">+</button>
          </div>
          <p class="ui-copy-muted">Max ${addon.max}</p>
        </div>
        ${addon.max ? '<button type="button" class="booking-button ' + (addonState.quantity === addon.max ? 'booking-button-primary' : 'booking-button-secondary') + '" data-action="set-quantity-max" data-addon-id="' + addon.id + '" style="margin-top:0.75rem">' + (addonState.quantity === addon.max ? 'All ' + addon.max + ' added' : allLabel) + '</button>' : ''}
      `;
    }

    if (addon.type === "tier") {
      var hasImages = addon.options.some(function(o) { return o.image; });
      if (hasImages) {
        return `
          <div class="backdrop-carousel">
            ${addon.options
              .map(
                (option) => `
                  <button type="button" class="backdrop-card ${addonState.selection === option.id ? "is-selected" : ""}" data-action="set-tier" data-addon-id="${addon.id}" data-tier-id="${option.id}">
                    <img src="${option.image}" alt="${escapeHtml(option.label)}">
                    <div class="backdrop-card-body">
                      <span class="backdrop-card-label">${option.label}</span>
                      <span class="backdrop-card-price">${currency.format(option.price)}</span>
                    </div>
                    <span class="backdrop-check ${addonState.selection === option.id ? "is-visible" : ""}">&#10003;</span>
                  </button>
                `
              )
              .join("")}
          </div>
        `;
      }
      return `
        <div class="addon-chip-row">
          ${addon.options
            .map(
              (option) => `
                <button type="button" class="addon-chip ${addonState.selection === option.id ? "is-active" : ""}" data-action="set-tier" data-addon-id="${addon.id}" data-tier-id="${option.id}">
                  ${option.label} ${currency.format(option.price)}
                </button>
              `
            )
            .join("")}
        </div>
      `;
    }

    if (addon.type === "backdrops") {
      return `
        <div class="backdrop-carousel">
          <button type="button" class="backdrop-card ${addonState.mode === "all" ? "is-selected" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="all">
            <img src="${addon.allImage || addon.image}" alt="All backdrops">
            <div class="backdrop-card-body">
              <span class="backdrop-card-label">All Backdrops</span>
              <span class="backdrop-card-price">${currency.format(addon.allPrice)}</span>
            </div>
            <span class="backdrop-check ${addonState.mode === "all" ? "is-visible" : ""}">&#10003;</span>
          </button>
          ${addon.colors
            .map(
              (color) => `
                <button type="button" class="backdrop-card ${addonState.colors.includes(color.id) ? "is-selected" : ""}" data-action="toggle-color" data-addon-id="${addon.id}" data-color-id="${color.id}">
                  <img src="${color.image || addon.image}" alt="${escapeHtml(color.label)}">
                  <div class="backdrop-card-body">
                    <span class="backdrop-card-label">${color.label}</span>
                    <span class="backdrop-card-price">${currency.format(addon.singlePrice)}</span>
                  </div>
                  <span class="backdrop-check ${addonState.colors.includes(color.id) ? "is-visible" : ""}">&#10003;</span>
                </button>
              `
            )
            .join("")}
        </div>
      `;
    }

    if (addon.type === "walls") {
      return `
        <div class="backdrop-carousel">
          <button type="button" class="backdrop-card ${addonState.mode === "all" ? "is-selected" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="all">
            <img src="${addon.allImage || addon.image}" alt="All walls">
            <div class="backdrop-card-body">
              <span class="backdrop-card-label">All Walls</span>
              <span class="backdrop-card-price">${currency.format(addon.allPrice)}</span>
            </div>
            <span class="backdrop-check ${addonState.mode === "all" ? "is-visible" : ""}">&#10003;</span>
          </button>
          ${addon.walls
            .map(
              (wall) => `
                <button type="button" class="backdrop-card ${addonState.walls.includes(wall.id) ? "is-selected" : ""}" data-action="toggle-wall" data-addon-id="${addon.id}" data-wall-id="${wall.id}">
                  <img src="${wall.image || addon.image}" alt="${escapeHtml(wall.label)}">
                  <div class="backdrop-card-body">
                    <span class="backdrop-card-label">${wall.label}</span>
                    <span class="backdrop-card-price">${currency.format(addon.singlePrice)}</span>
                  </div>
                  <span class="backdrop-check ${addonState.walls.includes(wall.id) ? "is-visible" : ""}">&#10003;</span>
                </button>
              `
            )
            .join("")}
        </div>
      `;
    }

    return "";
  }

  // renderIntegrations removed — replaced by renderScheduleStep above

  function renderSummary() {
    const durationName = document.querySelector("[data-summary-duration]");
    const eventLine = document.querySelector("[data-summary-event]");
    const addons = document.querySelector("[data-summary-addons]");
    const total = document.querySelector("[data-summary-total]");
    const sessionPriceEl = document.querySelector("[data-summary-session-price]");

    if (!durationName || !eventLine || !addons || !total) {
      return;
    }

    const selectedDuration = getSelectedDuration();
    durationName.textContent = selectedDuration ? selectedDuration.label : "Not selected";

    if (sessionPriceEl) {
      sessionPriceEl.textContent = selectedDuration && selectedDuration.price
        ? currency.format(selectedDuration.price)
        : "—";
    }

    if (location.slug === "powdersville" && currentDurationSupportsEvents()) {
      let text = state.eventIntent === "yes" ? "Event" : "Session";
      if (state.participants) {
        text += " \u00b7 " + state.participants + " guests";
      }
      eventLine.textContent = text;
    } else if (location.slug === "taylors-mill") {
      eventLine.textContent = "Session only";
    } else {
      eventLine.textContent = "Session";
    }

    const summaryItems = location.addons
      .map((addon) => getAddonSummary(addon))
      .filter(Boolean);

    var cleaningFee = getCleaningFee();
    var cleaningFeeHtml = '';
    if (cleaningFee) {
      cleaningFeeHtml = `<div class="summary-line summary-line-muted"><span>${cleaningFee.label}</span><span>${currency.format(cleaningFee.amount)}</span></div>`;
      if (cleaningFee.note) {
        cleaningFeeHtml += `<div style="margin-top:0.25rem"><span style="font-size:0.75rem;color:rgba(0,0,0,0.6);font-style:italic">${cleaningFee.note}</span></div>`;
      }
    }

    var addonAndFeeHtml = summaryItems.length || cleaningFee
      ? summaryItems
          .map(
            (item) => `
              <div class="summary-line summary-line-muted">
                <span>${item.label}</span>
                <span>${currency.format(item.amount)}</span>
              </div>
            `
          )
          .join("") + cleaningFeeHtml
      : '<p class="ui-empty">No add-ons selected yet.</p>';

    const addonTotal = summaryItems.reduce((sum, item) => sum + item.amount, 0);
    const cleaningFeeAmount = cleaningFee ? cleaningFee.amount : 0;
    const sessionPrice = selectedDuration && selectedDuration.price ? selectedDuration.price : 0;
    const grandTotal = sessionPrice + addonTotal + cleaningFeeAmount;
    // Offer mode (DREW-21): the aside shows the link's ownership lines and the
    // locked price for single-session offers too (multi-day uses its own aside).
    if (offerActive() && state.eventMode !== "multi") {
      var asideAdj = offerAdjustments(Math.round(grandTotal * 100));
      offerDriftCheck(asideAdj.finalCents);
      addonAndFeeHtml += offerLinesHtml(asideAdj);
      total.textContent = fmtMoney(asideAdj.finalCents / 100);
    } else {
      total.textContent = fmtMoney(grandTotal);
    }
    addons.innerHTML = addonAndFeeHtml;
    // Builder mode: the aside's single-session total feeds the override panel.
    // (The multi-day summary overwrites this when eventMode === "multi".)
    if (BUILDER && state.eventMode !== "multi") {
      state._builderTotalCents = Math.round(grandTotal * 100);
    }
  }

  function renderStepVisibility() {
    document.querySelectorAll("[data-step-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === state.step);
    });
  }

  var STEP_NAMES = { 1: "Duration", 2: "Schedule", 3: "Details", 4: "Waiver", 5: "Review & Pay" };

  // ---- Browser back/forward inside the booking flow (Drew 2026-07-13) --------
  // The flow is a single page app. With no history entries the browser Back button
  // left the booking page entirely — Drew was mid multi-day event and got dumped on
  // the home page. We now push one history entry per flow position (the gate, or
  // step N) and restore it on popstate, so Back walks BACK THROUGH THE FLOW. The
  // first entry is a replaceState, so Back from the gate still leaves the page
  // normally, which is what a customer expects there.
  var historyReady = false;

  function flowHistoryState() {
    return {
      wws: true,
      gated: !state.bookingType,
      step: state.step,
      bookingType: state.bookingType,
      eventMode: state.eventMode
    };
  }

  function pushFlowHistory() {
    try {
      var st = flowHistoryState();
      if (!historyReady) {
        window.history.replaceState(st, "");
        historyReady = true;
        return;
      }
      var cur = window.history.state;
      if (cur && cur.wws && cur.gated === st.gated && cur.step === st.step) return;
      window.history.pushState(st, "");
    } catch (e) {
      // History API unavailable — the explicit Back buttons still work.
    }
  }

  window.addEventListener("popstate", function (ev) {
    var st = ev.state;
    if (!st || !st.wws) return; // not one of ours — let the browser navigate away
    if (st.gated) {
      clearEventBuild();
      state.bookingType = "";
      state.eventMode = "";
      state.eventIntent = "";
      state._gateChoosingEventMode = false;
      state.step = 1;
      showGateOrFlow();
      return;
    }
    state.bookingType = st.bookingType || state.bookingType;
    state.eventMode = st.eventMode || state.eventMode;
    state.step = clamp(st.step || 1, 1, BUILDER ? BUILDER_MAX_STEP : 5);
    showGateOrFlow();
    renderStepContent();
  });

  function setStep(step) {
    state.step = clamp(step, 1, BUILDER ? BUILDER_MAX_STEP : 5);
    trackEvent("step_viewed", { location: location.slug, step: state.step, step_name: STEP_NAMES[state.step] });
    pushFlowHistory();
    renderStepContent();

    // Load availability when entering step 2 (Schedule)
    if (state.step === 2) {
      var aptId = getAppointmentTypeID();
      if (aptId && state.availableDates.length === 0 && !state.isLoadingDates) {
        fetchAvailableDates(aptId, state.calendarMonth);
      }
    }

    // Attach the Square card field only once step 5's panel is visible —
    // attaching into a display:none container yields a broken iframe.
    if (state.step === 5) {
      setTimeout(function () { initSquareCard(); updatePayButton(); }, 60);
    }

    // Scroll active step panel into view
    var activePanel = document.querySelector('[data-step-panel="' + state.step + '"]');
    if (activePanel) {
      setTimeout(function() {
        activePanel.scrollIntoView({ behavior: "smooth", block: "start" });
        var h = activePanel.querySelector("h2");
        if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      }, 50);
    }
  }

  function renderWaiver() {
    var container = document.querySelector("[data-waiver-content]");
    if (!container) return;

    var fullName = (state.contact.firstName + " " + state.contact.lastName).trim();
    var displayName = fullName || "Your Name";
    var today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    var signatureBlock = state.waiverSigned
      ? `
        <div class="waiver-signed">
          <p class="text-xs tracking-[0.2em] uppercase text-black/45 mb-3">Signed</p>
          <p class="waiver-signature">${escapeHtml(fullName || "—")}</p>
          <div class="waiver-signature-line"></div>
          <p class="text-xs text-black/45 mt-2">${escapeHtml(displayName)} &mdash; ${today}</p>
        </div>
      `
      : `
        <div class="waiver-unsigned">
          <p class="text-sm text-black/55 mb-4">By clicking below, you acknowledge that you have read and agree to the terms of this waiver, and your name will serve as your electronic signature.</p>
          <button type="button" class="booking-button booking-button-primary" data-action="sign-waiver">
            Sign as ${escapeHtml(displayName)}
          </button>
        </div>
      `;

    container.innerHTML = `
      <div class="booking-panel-soft p-5">
        <p class="text-xs tracking-[0.2em] uppercase text-black/45 mb-3">Your details</p>
        <div class="summary-list">
          <div class="summary-line"><span>Name</span><span>${escapeHtml(displayName)}</span></div>
          <div class="summary-line"><span>Email</span><span>${escapeHtml(state.contact.email || "—")}</span></div>
          ${state.contact.phone ? `<div class="summary-line"><span>Phone</span><span>${escapeHtml(state.contact.phone)}</span></div>` : ""}
          ${state.intake.business ? `<div class="summary-line"><span>Business</span><span>${escapeHtml(state.intake.business)}</span></div>` : ""}
          ${state.intake.participants ? `<div class="summary-line"><span>Participants</span><span>${escapeHtml(state.intake.participants)}</span></div>` : ""}
        </div>
      </div>

      <div class="booking-panel-soft p-5 mt-6">
        <p class="text-xs tracking-[0.2em] uppercase text-black/60 mb-2">Liability waiver &amp; use agreement</p>
        <p class="text-xs text-black/50 mb-4">Scroll to read the full waiver before signing.</p>
        <div class="waiver-scroll text-sm text-black/60 leading-relaxed space-y-3 overflow-y-auto pr-2" style="scrollbar-width:thin">
          <p><strong>WhiteWall Studios Liability Waiver &amp; Use Agreement</strong></p>
          <p>I, <strong>${escapeHtml(fullName || "the individual")}</strong>, booking this session (&ldquo;Renter&rdquo;), acknowledge and agree to the following in connection with my use of the WhiteWall Studios, LLC facility located in <strong>${location.slug === "powdersville" ? "Powdersville, South Carolina" : "Taylors, South Carolina"}</strong> (&ldquo;the Studio&rdquo;).</p>
          <p>By signing this agreement, I confirm that I am entering into this agreement <strong>on behalf of myself and every person I allow into the Studio during my booking</strong>, including but not limited to clients, guests, models, assistants, photographers, videographers, and other invitees (collectively referred to as &ldquo;My Party&rdquo;). I accept full responsibility for the conduct, safety, and actions of My Party.</p>

          ${location.slug === "taylors-mill" ? '<p><strong>This location is only approved for photo and video shoots, no events/parties allowed.</strong></p>' : ""}

          <p><strong>1. Assumption of Risk.</strong> The Studio is a <strong>self-service facility</strong>, and no WhiteWall Studios staff will be present during my booking. I voluntarily assume all risks associated with the use of the Studio by myself and My Party, including but not limited to risks involving lighting equipment, props, furniture, electrical equipment, trip or fall hazards, and the physical condition of the space.</p>

          <p><strong>2. Release of Liability.</strong> On behalf of myself and My Party, I hereby <strong>release and waive any claims against WhiteWall Studios, LLC</strong>, including its owners, officers, employees, contractors, and agents, for any injury, death, property damage, loss, or other incident that may occur during the use of the Studio, except in cases of <strong>gross negligence or willful misconduct</strong>.</p>

          <p><strong>3. Indemnification.</strong> I agree to <strong>indemnify, defend, and hold harmless WhiteWall Studios, LLC</strong> from any claims, lawsuits, damages, liabilities, or legal costs arising from:</p>
          <ul style="margin-left:1.5rem;list-style:disc">
            <li>My use of the Studio</li>
            <li>The actions or negligence of My Party</li>
            <li>Injury to anyone within My Party</li>
            <li>Damage to the Studio or building</li>
            <li>Any violation of Studio policies</li>
          </ul>
          <p>This obligation survives the conclusion of the booking.</p>

          <p><strong>4. Responsibility for Guests.</strong> I accept full legal and financial responsibility for <strong>all individuals I allow into the Studio</strong> and acknowledge that WhiteWall Studios has no obligation to supervise guests during my booking.</p>

          <p><strong>5. Booking Time, Early Entry, Late Exit, and Automatic Charges.</strong> I understand that my booking time is strict. I may not enter the Studio before my scheduled start time, and I must be fully cleaned up, reset, packed up, and completely out of the Studio by my scheduled end time.</p>
          <p>If I enter the Studio early or leave late, even by one minute, I authorize WhiteWall Studios, LLC to <strong>automatically charge the card/payment method used for booking $130 per 15-minute increment</strong>. I understand this charge may be made without additional approval because I am agreeing to this policy as part of this waiver and booking agreement.</p>

          <p><strong>6. Cleaning, Trash, and Studio Reset Responsibility.</strong> I agree to leave the Studio completely clean, reset, and ready for the next guest. This includes returning all furniture, benches, mirrors, plants, clothing racks/hangers, props, backdrops, lighting, add-ons, and equipment to their original locations.</p>
          <p>I agree to remove all trash from the Studio and bathroom trash cans and take it to the blue dumpster behind the building, even if there is only one item in the trash bag. I agree to replace all trash bags with fresh bags from the white storage closet or from the bottom of the trash can.</p>
          <p>If the Studio is not fully cleaned, reset, re-bagged, and ready for the next guest when I leave, I authorize WhiteWall Studios, LLC to automatically charge the card/payment method used for booking a <strong>minimum $200 cleaning/reset fee</strong>. I understand additional charges may apply if WhiteWall Studios has to send someone to clean, reset, remove trash, repair damage, or prepare the Studio for the next booking.</p>

          <p><strong>7. Damage, Missing Items, and Unauthorized Add-On Use.</strong> I accept full financial responsibility for any damage caused by myself or My Party to the Studio, bathroom, building, furniture, props, plants, backdrops, lighting, equipment, add-ons, fixtures, or other property belonging to WhiteWall Studios.</p>
          <p>I authorize WhiteWall Studios, LLC to <strong>charge the card/payment method used for booking</strong> for repair costs, replacement costs, labor, missing items, unauthorized add-on use, or any other fees caused by violation of Studio policies.</p>

          <p><strong>8. Studio Rules &amp; Condition.</strong> I agree to:</p>
          <ul style="margin-left:1.5rem;list-style:disc">
            <li>Return all furniture, props, and equipment to their original positions</li>
            <li>Leave the Studio in the condition it was found</li>
            <li>Fully clean up all food, drinks, spills, crumbs, packaging, hair, confetti, glitter, dirt, backdrop debris, or other messes before leaving</li>
            <li>Lower the shades, turn off the lights, remove all trash, and make sure the Studio is ready for the next guest</li>
          </ul>
          <p>The following are strictly prohibited:</p>
          <ul style="margin-left:1.5rem;list-style:disc">
            <li>Smoking or vaping</li>
            <li>Open flames or candles</li>
            <li>Firearms or weapons</li>
            <li>Illegal drugs or illegal activity</li>
          </ul>
          <p>Haze machines are only permitted with bookings of <strong>four (4) hours or longer</strong>.</p>

          <p><strong>9. Personal Property.</strong> WhiteWall Studios, LLC is <strong>not responsible for lost, stolen, or damaged personal property</strong> brought into the Studio. There is no lost and found. Any items left behind may be discarded after the booking ends.</p>

          <p><strong>10. Security Cameras.</strong> I acknowledge that <strong>security cameras operate within and around the Studio</strong> for safety, property protection, and policy enforcement.</p>

          <p><strong>11. Booking Compliance &amp; Cancellation.</strong> Cancellations made <strong>within 48 hours of the booking</strong> will result in the full session charge. WhiteWall Studios reserves the right to <strong>terminate a booking immediately without refund</strong> if Studio rules are violated.</p>

          <p><strong>12. Governing Law &amp; Electronic Signature.</strong> This agreement shall be governed by the laws of the <strong>State of South Carolina</strong>.</p>
          <p>I acknowledge that my <strong>electronic signature has the same legal force as a handwritten signature</strong>, and by signing I confirm that I have read, understood, and agreed to all terms of this agreement.</p>
        </div>
      </div>

      <div class="booking-panel-soft p-5 mt-6">
        ${signatureBlock}
      </div>
    `;
  }

  function updateWaiverGate() {
    var btn = document.querySelector("[data-requires-waiver]");
    if (!btn) return;
    btn.disabled = !state.waiverSigned;
    var hint = document.querySelector("[data-gate-hint='waiver']");
    if (hint) {
      hint.textContent = state.waiverSigned ? "" : "Sign the waiver above to continue.";
    }
  }

  function isTermsAccepted() {
    var expected = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
    return Boolean(expected && state.termsSignature.trim().toLowerCase() === expected);
  }

  function updateTermsGate() {
    var btn = document.querySelector("[data-requires-terms]");
    if (!btn) return;
    var complete = isStepComplete(3);
    btn.disabled = !complete;
    var hint = document.querySelector("[data-gate-hint='terms']");
    if (hint) {
      hint.textContent = complete ? "" : (getValidationErrors()[0] || "Complete the highlighted fields to continue.");
    }
    updateSignatureHints();
  }

  function updateSignatureHints() {
    var expectedName = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
    var fields = [
      { key: "email-acknowledgment", value: state.emailAcknowledgment },
      { key: "terms-signature", value: state.termsSignature }
    ];
    fields.forEach(function (field) {
      var hint = document.querySelector("[data-hint='" + field.key + "']");
      if (!hint) return;
      var typed = field.value.trim().toLowerCase();
      if (!typed) {
        hint.textContent = "";
        hint.className = "signature-hint";
      } else if (!expectedName) {
        hint.textContent = "Please enter your first and last name above first.";
        hint.className = "signature-hint hint-mismatch";
      } else if (typed === expectedName) {
        hint.textContent = "Name matches.";
        hint.className = "signature-hint hint-match";
      } else {
        hint.textContent = "Name doesn\u2019t match. Please type your full name exactly as entered above: " +
          state.contact.firstName + (state.contact.lastName ? " " + state.contact.lastName : "");
        hint.className = "signature-hint hint-mismatch";
      }
    });
  }

  function showTmHighTrafficModal() {
    // Remove existing modal if any
    var existing = document.querySelector(".booking-modal-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.className = "booking-modal-overlay";
    overlay.innerHTML = `
      <div class="booking-modal">
        <h3 class="ui-display-sm" style="margin-bottom:1rem">Heads Up</h3>
        <p class="ui-copy" style="margin-bottom:1.25rem">Our Taylor\u2019s Mill location is significantly smaller than our Flagship Location studio and is not well suited for larger shoots or high-traffic sessions. You may proceed with your booking as normal. However, if your session involves a larger group, a team member may contact you to add a cleaning fee after your session.</p>
        <div style="margin-bottom:1rem">
          <label class="ui-field-label" for="tm-high-traffic-note">Tell us about your session</label>
          <textarea class="booking-textarea" id="tm-high-traffic-note" placeholder="Briefly describe your shoot and provide details\u2026" style="margin-top:0.5rem"></textarea>
        </div>
        <label class="helper-item" style="margin-bottom:1.25rem">
          <input type="checkbox" id="tm-high-traffic-ack">
          <span>I understand and would like to proceed.</span>
        </label>
        <button type="button" class="booking-button booking-button-primary" id="tm-modal-confirm" disabled>Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);

    var ackCheckbox = document.getElementById("tm-high-traffic-ack");
    var confirmBtn = document.getElementById("tm-modal-confirm");
    var noteField = document.getElementById("tm-high-traffic-note");

    ackCheckbox.addEventListener("change", function() {
      confirmBtn.disabled = !ackCheckbox.checked;
    });

    confirmBtn.addEventListener("click", function() {
      state.tmHighTrafficAcknowledged = true;
      state.tmHighTrafficNote = noteField.value;
      overlay.remove();
    });
  }

  function showBufferConflictModal(message, options) {
    var existing = document.querySelector(".booking-modal-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.className = "booking-modal-overlay";

    var modal = document.createElement("div");
    modal.className = "booking-modal";

    var title = document.createElement("h3");
    title.className = "ui-display-sm";
    title.style.marginBottom = "1rem";
    title.textContent = "Cleaning Buffer Needed";
    modal.appendChild(title);

    var msg = document.createElement("p");
    msg.className = "ui-copy";
    msg.style.marginBottom = "1.25rem";
    msg.textContent = message;
    modal.appendChild(msg);

    var btnWrap = document.createElement("div");
    btnWrap.style.display = "flex";
    btnWrap.style.flexDirection = "column";
    btnWrap.style.gap = "0.75rem";

    for (var i = 0; i < options.length; i++) {
      (function(opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "booking-button booking-button-primary";
        btn.textContent = "Move to " + opt.label;
        btn.addEventListener("click", function() {
          overlay.remove();
          state.selectedTime = opt.time;
          renderScheduleStep();
          renderCheckoutPanel();
          renderSummary();
        });
        btnWrap.appendChild(btn);
      })(options[i]);
    }

    var pickBtn = document.createElement("button");
    pickBtn.type = "button";
    pickBtn.className = "booking-button booking-button-secondary";
    pickBtn.textContent = "Pick a different time";
    pickBtn.addEventListener("click", function() {
      overlay.remove();
      state.selectedTime = "";
      setStep(2);
    });
    btnWrap.appendChild(pickBtn);

    modal.appendChild(btnWrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function showCapacityModal(message) {
    var existing = document.querySelector(".booking-modal-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.className = "booking-modal-overlay";
    overlay.innerHTML = `
      <div class="booking-modal">
        <h3 class="ui-display-sm" style="margin-bottom:1rem">Capacity Limit</h3>
        <p class="ui-copy" style="margin-bottom:1.25rem">${message}</p>
        <button type="button" class="booking-button booking-button-primary" id="capacity-modal-ok">Got it</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("capacity-modal-ok").addEventListener("click", function() {
      overlay.remove();
    });
  }

  function showCleaningFeePopup() {
    var existing = document.querySelector(".booking-modal-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.className = "booking-modal-overlay";
    overlay.innerHTML = `
      <div class="booking-modal">
        <h3 class="ui-display-sm" style="margin-bottom:1rem">Cleaning Fee Notice</h3>
        <p class="ui-copy" style="margin-bottom:1.25rem">For bookings with 50 or more people, a <strong>$150 cleaning fee</strong> will be automatically applied to your order. This helps ensure the studio is reset and ready for the next booking.</p>
        <button type="button" class="booking-button booking-button-primary" id="cleaning-fee-ok">I understand</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("cleaning-fee-ok").addEventListener("click", function() {
      overlay.remove();
    });
  }

  function showPowdersvilleUpsell() {
    var existing = document.querySelector(".booking-modal-overlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.className = "booking-modal-overlay";
    overlay.innerHTML = `
      <div class="booking-modal" style="text-align:center">
        <div style="font-size:2.5rem;margin-bottom:0.75rem">✨</div>
        <h3 class="ui-display-sm" style="margin-bottom:0.75rem">Have You Seen Our Flagship Location?</h3>
        <p class="ui-copy" style="margin-bottom:1.25rem;line-height:1.7">
          Our <strong>Flagship Location</strong> is our premier studio — bigger, brighter, and loaded with more backdrops, lighting options, and equipment. It's closer to downtown Greenville with easy access and plenty of parking.
        </p>
        <div style="background:var(--wws-soft);border-radius:0.5rem;padding:1rem 1.25rem;margin-bottom:1.5rem">
          <p style="font-size:0.95rem;font-weight:600;margin-bottom:0.25rem">Get 10% Off at Flagship</p>
          <p style="font-size:0.85rem;color:var(--wws-text-muted);margin-bottom:0.5rem">Use code at checkout</p>
          <span style="display:inline-block;background:#000;color:#FCD518;font-weight:700;letter-spacing:0.15em;padding:0.4rem 1.25rem;border-radius:0.25rem;font-size:1.1rem">WW10</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.625rem">
          <a href="/book-powdersville" class="booking-button booking-button-primary" style="text-decoration:none;text-align:center">Book Flagship Instead</a>
          <button type="button" class="booking-button" id="pv-upsell-dismiss" style="background:transparent;border:1px solid var(--wws-border)">Continue with Taylor's Mill</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("pv-upsell-dismiss").addEventListener("click", function() {
      overlay.remove();
    });
  }

  function resetEventState() {
    state.eventIntent = "";
    state.participants = "";
    state.eventDescription = "";
    state.acknowledgements.cleanup = false;
    state.acknowledgements.capacity = false;
    state.acknowledgements.selfService = false;
  }

  function getAddonById(addonId) {
    return location.addons.find((item) => item.id === addonId);
  }

  function getSelectedDuration() {
    return location.durations.find((item) => item.id === state.durationId);
  }

  function currentDurationSupportsEvents() {
    const selectedDuration = getSelectedDuration();
    return Boolean(selectedDuration && selectedDuration.supportsEvents);
  }

  // Step completion validation — determines how far the user can navigate.
  // Step 1 (Timing): requires duration selected
  // Step 2 (Schedule): requires date + time selected
  // Step 3 (Details): requires contact info + terms accepted
  // Step 4 (Waiver): requires waiver signed
  // Step 5 (Add-ons & Pay): add-ons are optional, Pay & Book button here
  // Matches the server-side check in api/create-checkout.js so a malformed
  // email (e.g. a website domain typed into the field) is caught inline before
  // submit, instead of only failing at Square's createCustomer call.
  function isValidEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function isStepComplete(step) {
    if (step === 1) return Boolean(state.durationId);
    if (step === 2) return Boolean((state.selectedDate && state.selectedTime) || hasBookableSlot());
    if (step === 3) {
      if (!state.eventIntent) return false;
      var leadSourceComplete = Boolean(state.intake.leadSource) && (state.intake.leadSource !== "Other" || (state.intake.leadSourceOther || "").trim().length >= 3);
      var baseComplete = Boolean(state.contact.firstName && isValidEmail(state.contact.email) && leadSourceComplete && isTermsAccepted() && state.intake.readEmail);
      // Email acknowledgment signature must match first+last name
      var expectedName = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
      if (!expectedName || state.emailAcknowledgment.trim().toLowerCase() !== expectedName) return false;
      var count = parseCount(state.participants);
      // DREW-31: the participant count is now mandatory on EVERY path. It was
      // silently optional for photo/video, which let bookings (e.g. Evan Silver)
      // through with no real headcount that the form then faked to "1".
      var participantCount = state.eventIntent === "yes" ? count : parseCount(state.intake.participants);
      if (!BUILDER && participantCount < 1) return false;
      // DREW-31: "what are you using the space for" is mandatory on every path.
      // Photo/video answers a fixed dropdown ("Other" needs its 3+ char text);
      // events/multi-day answer the open-ended event description.
      var purposeComplete;
      if (state.eventIntent === "yes") {
        purposeComplete = Boolean(state.eventDescription.trim());
      } else {
        purposeComplete = Boolean(state.intake.purpose) && (state.intake.purpose !== "Other" || (state.intake.purposeOther || "").trim().length >= 3);
      }
      if (!BUILDER && !purposeComplete) return false;
      // Block PV events with 150+ people
      if (location.slug === "powdersville" && state.eventIntent === "yes" && count > 150) return false;
      // For PV events with 35+ people, require event description
      if (location.slug === "powdersville" && state.eventIntent === "yes" && count >= 35 && !state.eventDescription.trim()) return false;
      // For non-events with 35+ participants, require high-traffic note
      if (state.eventIntent !== "yes" && count >= 35 && !state.highTrafficNote.trim()) return false;
      // TM: hard cap at 50, and if intake participants > 35, require acknowledgment
      var tmCount = parseCount(state.intake.participants);
      if (location.slug === "taylors-mill" && tmCount > 50) return false;
      if (location.slug === "taylors-mill" && tmCount > 35 && !state.tmHighTrafficAcknowledged) return false;
      return baseComplete;
    }
    if (step === 4) return Boolean(state.waiverSigned);
    if (step === 5) return true; // add-ons are always optional
    return false;
  }

  function getMaxAccessibleStep() {
    if (!isStepComplete(1)) return 1;
    if (!isStepComplete(2)) return 2;
    // Builder mode: the flow ends at Add-ons — contact/terms never gate it.
    if (BUILDER) return BUILDER_MAX_STEP;
    if (!isStepComplete(3)) return 3;
    if (!isStepComplete(4)) return 4;
    return 5;
  }

  function getValidationErrors() {
    var errors = [];
    if (!state.durationId) errors.push("Please select a duration.");
    if (!hasBookableSlot()) errors.push("Please select a date and time.");
    if (!state.eventIntent) errors.push("Please select photo/video session or event booking.");
    if (!state.contact.firstName) errors.push("Please enter your first name.");
    if (!state.contact.email) errors.push("Please enter your email address.");
    else if (!isValidEmail(state.contact.email)) errors.push("Please enter a valid email address.");
    if (!state.intake.leadSource) errors.push("Please tell us how you heard about us.");
    else if (state.intake.leadSource === "Other" && (state.intake.leadSourceOther || "").trim().length < 3) errors.push("Please tell us exactly how you heard about us (at least 3 characters).");
    if (!state.intake.readEmail) errors.push("Please confirm you will read the confirmation email and watch the linked videos.");
    // DREW-31: participant count + session purpose are required on every path.
    var vCount = parseCount(state.participants);
    var vParticipantCount = state.eventIntent === "yes" ? vCount : parseCount(state.intake.participants);
    if (!BUILDER && vParticipantCount < 1) errors.push("Please tell us the total number of participants.");
    if (!BUILDER) {
      if (state.eventIntent === "yes") {
        if (!state.eventDescription.trim()) errors.push("Please tell us what you are using the space for.");
      } else if (!state.intake.purpose) {
        errors.push("Please tell us what you are using the space for.");
      } else if (state.intake.purpose === "Other" && (state.intake.purposeOther || "").trim().length < 3) {
        errors.push("Please tell us what you are using the space for (at least 3 characters).");
      }
    }
    var expectedName = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
    if (!expectedName || state.emailAcknowledgment.trim().toLowerCase() !== expectedName) errors.push("Please sign the email acknowledgment with your full name.");
    if (!isTermsAccepted()) errors.push("Please sign the terms & conditions with your full name.");
    if (!state.waiverSigned) errors.push("Please sign the liability waiver.");
    var count = parseCount(state.participants);
    if (state.eventIntent !== "yes" && count >= 35 && !state.highTrafficNote.trim()) errors.push("Please describe your shoot (required for 35+ participants).");
    if (location.slug === "powdersville" && state.eventIntent === "yes" && count > 150) errors.push("The event cannot host more than 150 people total, including vendors and contractors.");
    if (location.slug === "powdersville" && state.eventIntent === "yes" && count >= 35 && !state.eventDescription.trim()) errors.push("Please tell us about your event (required for 35+ participants).");
    var tmCount = parseCount(state.intake.participants);
    if (location.slug === "taylors-mill" && tmCount > 50) errors.push("Taylor\u2019s Mill has a maximum capacity of 50 people.");
    if (location.slug === "taylors-mill" && tmCount > 35 && !state.tmHighTrafficAcknowledged) errors.push("Please acknowledge the high-traffic notice for 35+ participants.");
    // Event Setup and Reset Crew: every placement must be chosen before pay.
    location.addons.forEach(function (addon) {
      if (!addon.requiresPlacements || !Array.isArray(addon.placementItems)) return;
      var s = state.addons[addon.id];
      if (!s || !s.selected) return;
      var placements = s.placements || {};
      var missing = addon.placementItems.some(function (item) { return !placements[item.id]; });
      if (missing) errors.push("Please tell our crew where each item should go for the " + addon.name + ".");
    });
    return errors;
  }

  // buildAcuityUrl and getAcuityState removed — replaced by API-based scheduling

  function getInitialAddonState(addon) {
    if (addon.type === "toggle") {
      return addon.requiresPlacements ? { selected: false, placements: {} } : { selected: false };
    }
    if (addon.type === "quantity") {
      return { quantity: 0 };
    }
    if (addon.type === "tier") {
      return { selection: "" };
    }
    if (addon.type === "backdrops") {
      return { mode: "none", colors: [] };
    }
    if (addon.type === "walls") {
      return { mode: "none", walls: [] };
    }
    return {};
  }

  function getAddonSubtotal(addon) {
    const addonState = state.addons[addon.id];

    if (addon.type === "toggle") {
      return addonState.selected ? addon.price : 0;
    }
    if (addon.type === "quantity") {
      return addonState.quantity * addon.price;
    }
    if (addon.type === "tier") {
      const selected = addon.options.find((option) => option.id === addonState.selection);
      return selected ? selected.price : 0;
    }
    if (addon.type === "backdrops") {
      if (addonState.mode === "all") {
        return addon.allPrice;
      }
      return addonState.colors.length * addon.singlePrice;
    }
    if (addon.type === "walls") {
      if (addonState.mode === "all") {
        return addon.allPrice;
      }
      return addonState.walls.length * addon.singlePrice;
    }
    return 0;
  }

  function formatAddonSubtotal(addon) {
    const subtotal = getAddonSubtotal(addon);
    return subtotal ? currency.format(subtotal) : "Optional";
  }

  // Add-on card description. Most add-ons are a single short line (kept verbatim
  // as before). A multi-paragraph description (e.g. Event Setup and Reset Crew) is escaped
  // and its blank-line-separated paragraphs become <br><br> so it stays readable.
  function formatAddonDescription(addon) {
    var text = addon.description || addon.note || "";
    if (text.indexOf("\n") === -1) return text;
    return escapeHtml(text).replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
  }

  function getAddonSummary(addon) {
    const addonState = state.addons[addon.id];
    const amount = getAddonSubtotal(addon);
    if (!amount) {
      return null;
    }

    if (addon.type === "toggle") {
      return { label: addon.name, amount };
    }

    if (addon.type === "quantity") {
      return {
        label: `${addon.name} x${addonState.quantity}`,
        amount
      };
    }

    if (addon.type === "tier") {
      const option = addon.options.find((item) => item.id === addonState.selection);
      return option ? { label: option.label, amount } : null;
    }

    if (addon.type === "backdrops") {
      return {
        label:
          addonState.mode === "all"
            ? "All backdrops"
            : `Backdrop colors (${addonState.colors.length})`,
        amount
      };
    }

    if (addon.type === "walls") {
      return {
        label:
          addonState.mode === "all"
            ? "All rolling walls"
            : `Rolling walls (${addonState.walls.length})`,
        amount
      };
    }

    return null;
  }

  function getAddonPriceLine(addon) {
    if (addon.type === "toggle") {
      return currency.format(addon.price);
    }
    if (addon.type === "quantity") {
      return `${currency.format(addon.price)} each`;
    }
    if (addon.type === "tier") {
      return "Tiered pricing";
    }
    if (addon.type === "backdrops") {
      return `${currency.format(addon.allPrice)} all or ${currency.format(addon.singlePrice)} each`;
    }
    if (addon.type === "walls") {
      return `${currency.format(addon.allPrice)} all or ${currency.format(addon.singlePrice)} each`;
    }
    return "Optional";
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function toggleArrayValue(list, value) {
    return list.includes(value) ? list.filter((item) => item !== value) : list.concat(value);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showToast(message) {
    var existing = document.querySelector(".toast-popup");
    if (existing) existing.remove();
    var toast = document.createElement("div");
    toast.className = "toast-popup";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add("is-visible"); }, 10);
    setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () { toast.remove(); }, 300);
    }, 5000);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  // Cart abandonment tracking — fires when user leaves mid-booking (step 3+)
  window.addEventListener("beforeunload", function () {
    if (state.step >= 3 && !state.isSubmitting) {
      trackEvent("booking_abandoned", {
        location: location.slug,
        last_step: state.step,
        duration_id: state.durationId,
        had_time_selected: !!state.selectedTime
      });
    }
  });
})();
