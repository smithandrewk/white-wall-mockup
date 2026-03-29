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

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const state = {
    step: 1,
    durationId: location.durations[0] ? location.durations[0].id : "",
    eventIntent: "no",
    participants: "",
    eventDescription: "",
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
      readEmail: false
    },
    emailAcknowledgment: "",
    termsSignature: "",
    waiverSigned: false,
    tmHighTrafficAcknowledged: false,
    tmHighTrafficNote: "",
    addons: {},
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

  bindStaticContent();
  renderLocationSwitcher();
  renderProgress();
  renderStepContent();
  bindEvents();

  function bindStaticContent() {
    setText("[data-location-name]", location.name);
    setText("[data-location-eyebrow]", location.eyebrow);
    setText("[data-location-description]", location.description);
    setText("[data-location-address]", location.address);

    const policyList = document.querySelector("[data-location-policies]");
    if (policyList) {
      policyList.innerHTML = location.policies
        .map(
          (item) => `
            <li class="helper-item">
              <span class="helper-dot" style="background:${location.accent}"></span>
              <span>${item}</span>
            </li>
          `
        )
        .join("");
    }
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) {
        return;
      }

      const action = actionTarget.dataset.action;

      if (action === "select-duration") {
        state.durationId = actionTarget.dataset.durationId;
        if (!currentDurationSupportsEvents()) {
          resetEventState();
        }
        // Reset calendar state since availability changes per duration
        state.availableDates = [];
        state.availableTimes = [];
        state.selectedDate = "";
        state.selectedTime = "";
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
        state.selectedDate = date;
        state.selectedTime = "";
        var aptId = getAppointmentTypeID();
        if (aptId) fetchAvailableTimes(aptId, date);
        // Show Powdersville upsell on TM after first date selection
        if (locationSlug === "taylors-mill" && !state._pvUpsellShown) {
          state._pvUpsellShown = true;
          showPowdersvilleUpsell();
        }
        return;
      }

      if (action === "select-time") {
        state.selectedTime = actionTarget.dataset.time;
        renderScheduleStep();
        return;
      }

      if (action === "navigate-month") {
        var delta = Number(actionTarget.dataset.delta);
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

      if (action === "sign-waiver") {
        state.waiverSigned = true;
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
          state.eventIntent = "no";
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
          state.acknowledgements.cleanup = false;
          state.acknowledgements.capacity = false;
          state.acknowledgements.selfService = false;
        }
        renderStepContent();
      }
    });

    document.addEventListener("input", (event) => {
      const target = event.target;

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
          var tmCount = Number(target.value);
          if (tmCount > 50) {
            showCapacityModal("Taylor\u2019s Mill has a maximum capacity of 50 people, including vendors and contractors. Please reduce your count or consider our Powdersville location for larger groups.");
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
          var topCount = Number(state.participants);
          var intakeCount = Number(target.value);
          if (intakeCount && topCount && intakeCount !== topCount) {
            showToast("Your attendee count (" + topCount + ") doesn\u2019t match the participant count you just entered (" + intakeCount + "). Please make sure these match.");
          }
        }
        // PV photo/video: cleaning fee popup for 50+
        if (location.slug === "powdersville" && state.eventIntent !== "yes") {
          var pvCount = Number(target.value);
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

      if (target.matches("[data-input='email-acknowledgment']")) {
        state.emailAcknowledgment = target.value;
        renderStepContent();
      }

      if (target.matches("[data-input='terms-signature']")) {
        state.termsSignature = target.value;
        updateTermsGate();
      }
    });

    document.addEventListener("change", (event) => {
      const target = event.target;

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

      if (target.matches("[data-check='read-email']")) {
        state.intake.readEmail = target.checked;
        updateTermsGate();
      }

      // terms signature handled via input event on [data-input='terms-signature']
    });
  }

  function renderStepContent() {
    renderProgress();
    renderDurations();
    renderEventStep();
    renderAddons();
    renderScheduleStep();
    renderCheckoutPanel();
    renderWaiver();
    renderSummary();
    renderStepVisibility();
    updateTermsGate();
    updateWaiverGate();
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
        return `
          <a href="/book-${item.slug}" class="location-chip ${themeClass} ${stateClass}">
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

    const steps = [
      { index: 1, label: "Timing" },
      { index: 2, label: "Schedule" },
      { index: 3, label: "Details" },
      { index: 4, label: "Waiver" },
      { index: 5, label: "Add-ons" }
    ];

    const maxStep = getMaxAccessibleStep();
    progress.innerHTML = steps
      .map((step) => {
        const isActive = step.index === state.step;
        const isComplete = step.index < state.step;
        const isLocked = step.index > maxStep;
        return `
          <button class="progress-step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""} ${isLocked ? "is-locked" : ""}" type="button" data-action="go-step" data-step="${step.index}" ${isLocked ? "disabled" : ""}>
            <span class="progress-step-index">${step.index}</span>
            <span class="progress-step-label">${step.label}</span>
          </button>
        `;
      })
      .join("");
  }

  function renderDurations() {
    const container = document.querySelector("[data-duration-options]");
    if (!container) {
      return;
    }

    container.innerHTML = location.durations
      .map((duration) => {
        const isActive = duration.id === state.durationId;
        const eventEligible = location.slug === "powdersville" && duration.hours >= 2;
        const isOneHr = location.slug === "powdersville" && duration.hours === 1;
        const priceTag = duration.price ? currency.format(duration.price) : "";
        return `
          <button type="button" class="booking-choice duration-pill ${isActive ? "is-active" : ""}" data-action="select-duration" data-duration-id="${duration.id}">
            <span class="duration-pill-label">${duration.label}${priceTag ? ' <span style="color:rgba(0,0,0,0.4);font-weight:400">' + priceTag + '</span>' : ''}</span>
            ${eventEligible ? '<span class="duration-pill-badge">Event eligible</span>' : ""}
            ${isOneHr ? '<span style="font-size:0.75rem;color:rgba(0,0,0,0.35)">(Not eligible for events)</span>' : ""}
          </button>
        `;
      })
      .join("");
  }

  // --- Schedule & Pay (Step 5) ---

  function getAppointmentTypeID() {
    const selectedDuration = getSelectedDuration();
    if (!selectedDuration) return null;
    const locationSlug = location.slug === "taylors-mill" ? "taylors-mill" : "powdersville";
    const acuityLocations = config.integrations.acuity.locations || {};
    const locConfig = acuityLocations[locationSlug] || {};
    const durConfig = (locConfig.durations || {})[selectedDuration.id] || {};
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
    try {
      const res = await fetch(`/api/availability-times?appointmentTypeID=${appointmentTypeID}&date=${date}`);
      if (!res.ok) throw new Error("Failed to load times");
      const data = await res.json();
      state.availableTimes = (data.times || []).map(function (t) { return t.time; });
    } catch (err) {
      console.error(err);
      state.availableTimes = [];
    }
    state.isLoadingTimes = false;
    renderScheduleStep();
  }

  function renderScheduleStep() {
    var container = document.querySelector("[data-schedule-step]");
    if (!container) return;

    var appointmentTypeID = getAppointmentTypeID();
    if (!appointmentTypeID) {
      container.innerHTML = '<div class="note-card"><p class="ui-copy-strong">Select a duration first to see availability.</p></div>';
      return;
    }

    container.innerHTML =
      renderCalendar() +
      renderTimeSlots();
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

    var cells = "";
    for (var i = 0; i < firstDay; i++) {
      cells += '<span class="calendar-day is-empty"></span>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = state.calendarMonth + "-" + String(d).padStart(2, "0");
      var isAvailable = state.availableDates.indexOf(dateStr) !== -1;
      var isSelected = dateStr === state.selectedDate;
      var isPast = dateStr < today;
      var cls = "calendar-day";
      if (isSelected) cls += " is-selected";
      else if (isAvailable && !isPast) cls += " is-available";
      else cls += " is-unavailable";

      if (isAvailable && !isPast) {
        cells += '<button type="button" class="' + cls + '" data-action="select-date" data-date="' + dateStr + '">' + d + '</button>';
      } else {
        cells += '<span class="' + cls + '">' + d + '</span>';
      }
    }

    var spinner = state.isLoadingDates ? '<div class="booking-spinner"></div>' : '';
    var noAvail = !state.isLoadingDates && state.availableDates.length === 0
      ? '<p class="ui-copy-muted" style="margin-top:1rem;text-align:center">No availability this month</p>'
      : '';

    return '<div class="booking-panel-soft p-5">' +
      '<div class="calendar-nav">' +
        '<button type="button" class="booking-button booking-button-secondary" data-action="navigate-month" data-delta="-1" style="padding:0.5rem 0.8rem">&larr;</button>' +
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

    var pills = state.availableTimes.map(function (t) {
      var d = new Date(t);
      var label = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      var isSelected = t === state.selectedTime;
      var cls = "time-slot" + (isSelected ? " is-selected" : "");
      return '<button type="button" class="' + cls + '" data-action="select-time" data-time="' + escapeAttribute(t) + '">' + label + '</button>';
    }).join("");

    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-kicker" style="margin-bottom:1rem">Available times for ' + state.selectedDate + '</p>' +
      '<div class="time-slot-grid">' + pills + '</div>' +
    '</div>';
  }

  function getCleaningFee() {
    var count = Number(state.participants);
    // Also check intake participants for photo/video sessions
    var intakeCount = Number(state.intake.participants);
    var effectiveCount = Math.max(count || 0, intakeCount || 0);
    if (effectiveCount >= 50) {
      return { label: "Cleaning fee", amount: 150, note: "" };
    }
    if (effectiveCount >= 35 && state.eventIntent === "yes") {
      return { label: "Cleaning fee", amount: 0, note: "We will be in touch if there are any changes." };
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
    var grandTotal = sessionPrice + addonTotal + cleaningFeeAmount;
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
        cleaningFeeHtml += '<div style="margin-top:0.25rem"><span style="font-size:0.75rem;color:rgba(0,0,0,0.45);font-style:italic">' + cleaningFee.note + '</span></div>';
      }
    }

    var btnDisabled = state.isSubmitting ? ' disabled' : '';
    var btnLabel = state.isSubmitting ? 'Processing…' : 'Pay & Book — ' + currency.format(grandTotal);

    return '<div class="booking-panel-soft p-5 mt-5">' +
      '<p class="ui-kicker" style="margin-bottom:1rem">Order summary</p>' +
      '<div class="summary-list">' +
        '<div class="summary-line"><span>' + escapeHtml(selectedDuration.label) + ' session</span><span>' + currency.format(sessionPrice) + '</span></div>' +
        addonHtml +
        cleaningFeeHtml +
        '<div class="summary-divider" style="margin:0.75rem 0"></div>' +
        '<div class="summary-line" style="font-size:1.1rem"><span><strong>Total</strong></span><span class="order-total"><strong>' + currency.format(grandTotal) + '</strong></span></div>' +
      '</div>' +
      '<p class="ui-copy-muted" style="margin-top:1rem">' + escapeHtml(timeLabel) + ' at ' + escapeHtml(location.name) + '</p>' +
      '<div style="margin-top:1.5rem">' +
        '<button type="button" class="booking-button booking-button-primary" data-action="pay-and-book"' + btnDisabled + '>' + btnLabel + '</button>' +
      '</div>' +
      '<p class="ui-copy-muted" style="margin-top:0.75rem;font-size:0.8rem">You\'ll be redirected to Square to complete payment securely.</p>' +
    '</div>';
  }

  function renderCheckoutPanel() {
    var container = document.querySelector("[data-checkout-summary]");
    if (!container) return;

    if (!state.selectedTime) {
      container.innerHTML = '<div class="note-card"><p class="ui-copy-strong">Select a date and time in Step 2 to see your order summary.</p></div>';
      return;
    }

    container.innerHTML = renderOrderSummary();
  }

  async function handlePayAndBook() {
    if (state.isSubmitting) return;

    // Client-side validation safety net — prevents checkout if steps were skipped
    var errors = getValidationErrors();
    if (errors.length > 0) {
      alert(errors[0]); // Show first error
      // Navigate to the earliest incomplete step
      if (!state.durationId) { setStep(1); return; }
      if (!state.selectedTime) { setStep(2); return; }
      if (!state.contact.firstName || !state.contact.email || !isTermsAccepted()) { setStep(3); return; }
      if (!state.waiverSigned) { setStep(4); return; }
      return;
    }

    state.isSubmitting = true;
    renderScheduleStep();

    var appointmentTypeID = getAppointmentTypeID();

    try {
      // Verify the slot is still available
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
        fetchAvailableTimes(appointmentTypeID, state.selectedDate);
        return;
      }

      // Create block (holds slot) + Square Payment Link
      var checkoutRes = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentTypeID: appointmentTypeID,
          datetime: state.selectedTime,
          location: location.slug,
          contact: state.contact,
          intake: state.intake,
          addons: state.addons,
          eventIntent: state.eventIntent,
          participants: state.participants,
          eventDescription: state.eventDescription,
          highTrafficNote: state.highTrafficNote,
          tmHighTrafficNote: state.tmHighTrafficNote,
          waiverSigned: state.waiverSigned,
          cleaningFee: getCleaningFee()
        })
      });
      var checkoutData = await checkoutRes.json();
      if (!checkoutData.checkoutUrl) {
        throw new Error(checkoutData.error || "No checkout URL returned");
      }

      // Redirect to Square's hosted checkout page
      window.location.href = checkoutData.checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong creating your checkout. Please try again.");
      state.isSubmitting = false;
      renderScheduleStep();
    }
  }

  function renderEventStep() {
    const container = document.querySelector("[data-event-step]");
    if (!container) {
      return;
    }

    if (location.slug !== "powdersville") {
      container.innerHTML = `
        <div class="note-card">
          <p class="ui-copy-strong">This location is only approved for photo and video shoots, no events/parties allowed.</p>
        </div>
      `;
      return;
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
      /^\d+$/.test(state.participants.trim()) && Number(state.participants) >= 35
        ? `
          <div class="warning-card" style="margin-top:1rem">
            For events with 35+ attendees, our team will follow up to confirm details, including a potential $150 cleaning fee. For events with 50+ attendees, a $150 cleaning fee will be automatically applied.
          </div>
        `
        : "";

    const participantLabel = state.eventIntent === "yes"
      ? "How many people will be attending your event?"
      : 'Event? How many people will you have? <strong>If this is a photo/video session, leave this blank.</strong>';

    container.innerHTML = `
      <p class="ui-copy" style="margin-bottom:1.5rem;color:rgba(0,0,0,0.55)">Events are allowed for 2-hour sessions and longer.</p>
      <div class="choice-grid is-two-up">
        <button type="button" class="booking-choice ${state.eventIntent === "no" ? "is-active" : ""}" data-action="set-event-intent" data-value="no">
          <p class="ui-kicker">Use this for</p>
          <h3 class="ui-display-sm" style="margin-top:0.75rem">Photo / video session</h3>
          <p class="ui-copy" style="margin-top:1rem">Standard photo, video, or production session.</p>
        </button>
        <button type="button" class="booking-choice ${state.eventIntent === "yes" ? "is-active" : ""}" data-action="set-event-intent" data-value="yes">
          <p class="ui-kicker">Use this for</p>
          <h3 class="ui-display-sm" style="margin-top:0.75rem">Event booking</h3>
          <p class="ui-copy" style="margin-top:1rem">Parties, receptions, workshops, and gatherings.</p>
          ${isOneHour ? '<p class="ui-copy" style="margin-top:0.5rem;color:rgba(0,0,0,0.35);font-size:0.8rem">(Not eligible for events)</p>' : ""}
        </button>
      </div>

      <div style="margin-top:1.5rem">
        <label class="ui-field-label" for="participants">${participantLabel}</label>
        <input class="booking-input" id="participants" data-input="participants" value="${escapeHtml(state.participants)}" placeholder="Expected number of attendees">
      </div>

      <div data-participant-notices>
        ${warning}
        ${capacityNotice}
        ${getHighTrafficHtml()}
      </div>

      <div data-event-form>
      ${
        state.eventIntent === "yes"
          ? getEventFormHtml()
          : ""
      }
      </div>
    `;

    // Hide intake participants field for PV events (already captured at top of step)
    var intakeRow = document.querySelector("[data-intake-participants-row]");
    if (intakeRow) {
      intakeRow.style.display = state.eventIntent === "yes" ? "none" : "";
    }
  }

  function getEventFormHtml() {
    // Safety: capture textarea value before DOM is rebuilt (fixes validation bug)
    var existingTextarea = document.getElementById('event-description');
    if (existingTextarea) {
      state.eventDescription = existingTextarea.value;
    }
    var count = Number(state.participants);

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

    if (count >= 50) {
      borderClass = "event-textarea-warning";
      textareaLabel = "Tell Us About Your Event";
      textareaPrompt = "Please include as much detail as possible so we can fully understand your event. Be sure to book enough time for setup, your event, and returning the studio to its original, clean condition. Our calendar is often booked back-to-back, and it\u2019s common for another booking to be scheduled immediately after yours\u2014so please plan your timing accordingly. A team member will follow up if any additional details or approvals are needed. If you don\u2019t hear from us, you\u2019re all set. For events with 50+ attendees, a $150 cleaning fee will be automatically applied.";
    } else if (count >= 35) {
      borderClass = "event-textarea-warning";
      textareaLabel = "Tell Us About Your Event";
      textareaPrompt = "Please include as much detail as possible so we can fully understand your event. Be sure to book enough time for setup, your event, and returning the studio to its original, clean condition. Our calendar is often booked back-to-back, and it\u2019s common for another booking to be scheduled immediately after yours\u2014so please plan your timing accordingly. A team member will follow up if any additional details or approvals are needed. If you don\u2019t hear from us, you\u2019re all set. For events with 35+ attendees, we may follow up regarding a potential $150 cleaning fee. For events with 50+ attendees, a $150 cleaning fee will be automatically applied.";
    } else {
      textareaLabel = "Tell Us About Your Event";
      textareaPrompt = "Please include as much detail as possible so we can fully understand your event. Be sure to book enough time for setup, your event, and returning the studio to its original, clean condition. Our calendar is often booked back-to-back, and it\u2019s common for another booking to be scheduled immediately after yours\u2014so please plan your timing accordingly.";
    }

    return `
      <div class="choice-grid" style="margin-top:1.5rem">
        <div>
          <label class="ui-field-label" for="event-description">${textareaLabel}</label>
          ${textareaPrompt ? '<p class="ui-copy" style="margin-bottom:0.75rem;color:rgba(0,0,0,0.55);font-size:0.85rem">' + textareaPrompt + '</p>' : ''}
          <textarea class="booking-textarea ${borderClass}" id="event-description" data-input="event-description" placeholder="What are you hosting?">${escapeHtml(state.eventDescription)}</textarea>
        </div>
        <div class="booking-panel-soft panel-pad">
          <p class="ui-kicker">Required acknowledgements</p>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="cleanup" ${state.acknowledgements.cleanup ? "checked" : ""}>
            <span>Please leave the studio exactly how you found it.</span>
          </label>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="capacity" ${state.acknowledgements.capacity ? "checked" : ""}>
            <span>I understand that bookings with 35+ guests require internal approval. The WhiteWall team will review my request and follow up with confirmation, along with any additional details, including a cleaning fee for larger gatherings.</span>
          </label>
          <label class="helper-item" style="margin-top:1rem">
            <input type="checkbox" data-check="self-service" ${state.acknowledgements.selfService ? "checked" : ""}>
            <span>I understand this is a fully self-service event space with no team on site.</span>
          </label>
        </div>
      </div>
    `;
  }

  function getHighTrafficHtml() {
    // Only show high-traffic note for non-event bookings with 35+ participants
    if (state.eventIntent === "yes") return "";
    var count = Number(state.participants);
    if (!count || count < 35) return "";
    return `
      <div class="booking-panel-soft p-5 mt-4">
        <p class="ui-copy-strong" style="margin-bottom:0.75rem">Tell us more about your shoot</p>
        <p class="ui-copy" style="margin-bottom:1rem;color:rgba(0,0,0,0.55)">A cleaning fee may be added due to the high traffic count. If we need to discuss anything further we will reach out. If you don&rsquo;t hear from us, you&rsquo;re good.</p>
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

    var count = Number(state.participants);
    var warning =
      state.eventIntent === "no" && /^\d+$/.test(state.participants.trim())
        ? '<div class="warning-card" style="margin-top:1rem">Looks like you have attendees — did you mean to select "Event booking" above? If this is a photo/video session, leave this blank.</div>'
        : "";
    var capacityNotice =
      /^\d+$/.test(state.participants.trim()) && count >= 35
        ? '<div class="warning-card" style="margin-top:1rem">For events with 35+ attendees, our team will follow up to confirm details, including a potential $150 cleaning fee. For events with 50+ attendees, a $150 cleaning fee will be automatically applied.</div>'
        : "";

    container.innerHTML = warning + capacityNotice + getHighTrafficHtml();
  }

  function renderAddons() {
    const container = document.querySelector("[data-addon-list]");
    if (!container) {
      return;
    }

    var scrollPositions = {};
    container.querySelectorAll(".backdrop-carousel").forEach(function (el) {
      var addonId = el.closest("[data-addon-card-id]");
      if (addonId) {
        scrollPositions[addonId.dataset.addonCardId] = el.scrollLeft;
      }
    });

    container.innerHTML = location.addons.map(renderAddonCard).join("");

    container.querySelectorAll(".backdrop-carousel").forEach(function (el) {
      var addonId = el.closest("[data-addon-card-id]");
      if (addonId && scrollPositions[addonId.dataset.addonCardId]) {
        el.scrollLeft = scrollPositions[addonId.dataset.addonCardId];
      }
    });
  }

  function renderAddonCard(addon) {
    const addonState = state.addons[addon.id];
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
          <p class="ui-copy" style="margin-top:1rem">${addon.description || addon.note || ""}</p>
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
      return `
        <div class="backdrop-carousel">
          <button type="button" class="backdrop-card ${addonState.selected ? "is-selected" : ""}" data-action="toggle-addon" data-addon-id="${addon.id}">
            <img src="${toggleImg}" alt="${escapeHtml(addon.name)}">
            <div class="backdrop-card-body">
              <span class="backdrop-card-label">${addonState.selected ? "Added" : "Add to Booking"}</span>
              <span class="backdrop-card-price">${currency.format(addon.price)}</span>
            </div>
            <span class="backdrop-check ${addonState.selected ? "is-visible" : ""}">&#10003;</span>
          </button>
        </div>
      `;
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
        cleaningFeeHtml += `<div style="margin-top:0.25rem"><span style="font-size:0.75rem;color:rgba(0,0,0,0.45);font-style:italic">${cleaningFee.note}</span></div>`;
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

    addons.innerHTML = addonAndFeeHtml;

    const addonTotal = summaryItems.reduce((sum, item) => sum + item.amount, 0);
    const cleaningFeeAmount = cleaningFee ? cleaningFee.amount : 0;
    const sessionPrice = selectedDuration && selectedDuration.price ? selectedDuration.price : 0;
    const grandTotal = sessionPrice + addonTotal + cleaningFeeAmount;
    total.textContent = currency.format(grandTotal);
  }

  function renderStepVisibility() {
    document.querySelectorAll("[data-step-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === state.step);
    });
  }

  function setStep(step) {
    state.step = clamp(step, 1, 5);
    renderStepContent();

    // Load availability when entering step 2 (Schedule)
    if (state.step === 2) {
      var aptId = getAppointmentTypeID();
      if (aptId && state.availableDates.length === 0 && !state.isLoadingDates) {
        fetchAvailableDates(aptId, state.calendarMonth);
      }
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
          <div class="summary-line"><span>Phone</span><span>${escapeHtml(state.contact.phone || "—")}</span></div>
          <div class="summary-line"><span>Business</span><span>${escapeHtml(state.intake.business || "—")}</span></div>
          <div class="summary-line"><span>Participants</span><span>${escapeHtml(state.intake.participants || "—")}</span></div>
        </div>
      </div>

      <div class="booking-panel-soft p-5 mt-6">
        <p class="text-xs tracking-[0.2em] uppercase text-black/45 mb-5">Liability waiver &amp; use agreement</p>
        <div class="text-sm text-black/60 leading-relaxed space-y-3 max-h-80 overflow-y-auto pr-2" style="scrollbar-width:thin">
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

          <p><strong>5. Damage Responsibility.</strong> I accept full financial responsibility for any damage caused by myself or My Party to the Studio, building, furniture, equipment, props, fixtures, or any other property belonging to WhiteWall Studios.</p>
          <p>I authorize WhiteWall Studios, LLC to <strong>charge the payment method used for booking for any repair or replacement costs</strong>, including labor if applicable.</p>

          <p><strong>6. Studio Rules &amp; Condition.</strong> I agree to:</p>
          <ul style="margin-left:1.5rem;list-style:disc">
            <li>Return all furniture, props, and equipment to their original positions</li>
            <li>Leave the Studio in the condition it was found</li>
          </ul>
          <p>Failure to do so may result in a <strong>minimum $250 cleaning or reset fee</strong>.</p>
          <p>The following are strictly prohibited:</p>
          <ul style="margin-left:1.5rem;list-style:disc">
            <li>Smoking or vaping</li>
            <li>Open flames or candles</li>
            <li>Firearms or weapons</li>
            <li>Illegal drugs or illegal activity</li>
          </ul>
          <p>Haze machines are only permitted with bookings of <strong>four (4) hours or longer</strong>.</p>

          <p><strong>7. Personal Property.</strong> WhiteWall Studios, LLC is <strong>not responsible for lost, stolen, or damaged personal property</strong> brought into the Studio.</p>

          <p><strong>8. Security Cameras.</strong> I acknowledge that <strong>security cameras operate within and around the Studio</strong> for safety and property protection.</p>

          <p><strong>9. Booking Compliance &amp; Cancellation.</strong> I agree to vacate the Studio by the end of my booking time. Failure to do so may result in additional charges.</p>
          <p>Cancellations made <strong>within 48 hours of the booking</strong> will result in the full session charge.</p>
          <p>WhiteWall Studios reserves the right to <strong>terminate a booking immediately without refund</strong> if Studio rules are violated.</p>

          <p><strong>10. Governing Law &amp; Electronic Signature.</strong> This agreement shall be governed by the laws of the <strong>State of South Carolina</strong>.</p>
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
  }

  function isTermsAccepted() {
    var expected = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
    return Boolean(expected && state.termsSignature.trim().toLowerCase() === expected);
  }

  function updateTermsGate() {
    var btn = document.querySelector("[data-requires-terms]");
    if (!btn) return;
    btn.disabled = !isStepComplete(3);
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
        <p class="ui-copy" style="margin-bottom:1.25rem">Our Taylor\u2019s Mill location is significantly smaller than our Powdersville studio and is not well suited for larger shoots or high-traffic sessions. You may proceed with your booking as normal. However, if your session involves a larger group, a team member may contact you to add a cleaning fee after your session.</p>
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
        <h3 class="ui-display-sm" style="margin-bottom:0.75rem">Have You Seen Our Powdersville Studio?</h3>
        <p class="ui-copy" style="margin-bottom:1.25rem;line-height:1.7">
          Our <strong>Powdersville location</strong> is our flagship studio — bigger, brighter, and loaded with more backdrops, lighting options, and equipment. It's closer to downtown Greenville with easy access and plenty of parking.
        </p>
        <div style="background:var(--wws-soft);border-radius:0.5rem;padding:1rem 1.25rem;margin-bottom:1.5rem">
          <p style="font-size:0.95rem;font-weight:600;margin-bottom:0.25rem">Get 10% Off at Powdersville</p>
          <p style="font-size:0.85rem;color:var(--wws-text-muted);margin-bottom:0.5rem">Use code at checkout</p>
          <span style="display:inline-block;background:#000;color:#FCD518;font-weight:700;letter-spacing:0.15em;padding:0.4rem 1.25rem;border-radius:0.25rem;font-size:1.1rem">WW10</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.625rem">
          <a href="/book-powdersville" class="booking-button booking-button-primary" style="text-decoration:none;text-align:center">Book Powdersville Instead</a>
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
    state.eventIntent = "no";
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
  function isStepComplete(step) {
    if (step === 1) return Boolean(state.durationId);
    if (step === 2) return Boolean(state.selectedDate && state.selectedTime);
    if (step === 3) {
      var baseComplete = Boolean(state.contact.firstName && state.contact.email && state.intake.instagram && isTermsAccepted());
      // Email acknowledgment signature must match first+last name
      var expectedName = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
      if (!expectedName || state.emailAcknowledgment.trim().toLowerCase() !== expectedName) return false;
      var count = Number(state.participants);
      // Block PV events with 150+ people
      if (location.slug === "powdersville" && state.eventIntent === "yes" && count > 150) return false;
      // For PV events with 35+ people, require event description
      if (location.slug === "powdersville" && state.eventIntent === "yes" && count >= 35 && !state.eventDescription.trim()) return false;
      // For non-events with 35+ participants, require high-traffic note
      if (state.eventIntent !== "yes" && count >= 35 && !state.highTrafficNote.trim()) return false;
      // TM: hard cap at 50, and if intake participants > 35, require acknowledgment
      var tmCount = Number(state.intake.participants);
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
    if (!isStepComplete(3)) return 3;
    if (!isStepComplete(4)) return 4;
    return 5;
  }

  function getValidationErrors() {
    var errors = [];
    if (!state.durationId) errors.push("Please select a duration.");
    if (!state.selectedTime) errors.push("Please select a date and time.");
    if (!state.contact.firstName) errors.push("Please enter your first name.");
    if (!state.contact.email) errors.push("Please enter your email address.");
    if (!state.intake.instagram) errors.push("Please enter your Instagram handle.");
    var expectedName = (state.contact.firstName + " " + state.contact.lastName).trim().toLowerCase();
    if (!expectedName || state.emailAcknowledgment.trim().toLowerCase() !== expectedName) errors.push("Please sign the email acknowledgment with your full name.");
    if (!isTermsAccepted()) errors.push("Please sign the terms & conditions with your full name.");
    if (!state.waiverSigned) errors.push("Please sign the liability waiver.");
    var count = Number(state.participants);
    if (state.eventIntent !== "yes" && count >= 35 && !state.highTrafficNote.trim()) errors.push("Please describe your shoot (required for 35+ participants).");
    if (location.slug === "powdersville" && state.eventIntent === "yes" && count > 150) errors.push("The event cannot host more than 150 people total, including vendors and contractors.");
    if (location.slug === "powdersville" && state.eventIntent === "yes" && count >= 35 && !state.eventDescription.trim()) errors.push("Please tell us about your event (required for 35+ participants).");
    var tmCount = Number(state.intake.participants);
    if (location.slug === "taylors-mill" && tmCount > 50) errors.push("Taylor\u2019s Mill has a maximum capacity of 50 people.");
    if (location.slug === "taylors-mill" && tmCount > 35 && !state.tmHighTrafficAcknowledged) errors.push("Please acknowledge the high-traffic notice for 35+ participants.");
    return errors;
  }

  // buildAcuityUrl and getAcuityState removed — replaced by API-based scheduling

  function getInitialAddonState(addon) {
    if (addon.type === "toggle") {
      return { selected: false };
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
})();
