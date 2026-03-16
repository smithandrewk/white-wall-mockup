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
    addons: {}
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
        renderStepContent();
        return;
      }

      if (action === "go-step") {
        const step = Number(actionTarget.dataset.step);
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

      if (action === "set-event-intent") {
        state.eventIntent = actionTarget.dataset.value;
        if (state.eventIntent !== "yes") {
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
        renderStepContent();
        return;
      }

      if (target.matches("[data-input='event-description']")) {
        state.eventDescription = target.value;
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
    });
  }

  function renderStepContent() {
    renderProgress();
    renderDurations();
    renderAcuity();
    renderEventStep();
    renderAddons();
    renderIntegrations();
    renderSummary();
    renderStepVisibility();
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
      { index: 2, label: "Session details" },
      { index: 3, label: "Add-ons" },
      { index: 4, label: "Finish" }
    ];

    progress.innerHTML = steps
      .map((step) => {
        const isActive = step.index === state.step;
        const isComplete = step.index < state.step;
        return `
          <button class="progress-step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}" type="button" data-action="go-step" data-step="${step.index}">
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
        const eventEligible = duration.hours >= 2;
        return `
          <button type="button" class="booking-choice duration-pill ${isActive ? "is-active" : ""}" data-action="select-duration" data-duration-id="${duration.id}">
            <span class="duration-pill-label">${duration.label}</span>
            ${eventEligible ? '<span class="duration-pill-badge">Event eligible</span>' : ""}
          </button>
        `;
      })
      .join("");
  }

  function renderAcuity() {
    const status = document.querySelector("[data-acuity-status]");
    const embed = document.querySelector("[data-acuity-embed]");
    if (!status || !embed) {
      return;
    }

    const acuityState = getAcuityState();

    status.innerHTML = "";

    if (acuityState.mode === "iframe" && acuityState.durationConfig.iframeSrc) {
      renderAcuityIframe(embed, acuityState);
      return;
    }

    if (acuityState.mode === "scheduler" && acuityState.schedulerUrl) {
      renderAcuityScheduler(embed, acuityState);
      return;
    }

    renderAcuityPlaceholder(embed, acuityState);
  }

  function renderAcuityPlaceholder(embed, acuityState) {
    embed.innerHTML = "";
  }

  function renderAcuityIframe(embed, acuityState) {
    embed.innerHTML = `
      <div class="info-card panel-pad">
        <iframe
          title="Schedule ${escapeAttribute(acuityState.selectedDuration.label)} at ${escapeAttribute(location.name)}"
          class="scheduler-frame"
          src="${escapeAttribute(acuityState.durationConfig.iframeSrc)}"
          loading="lazy">
        </iframe>
      </div>
    `;
  }

  function renderAcuityScheduler(embed, acuityState) {
    embed.innerHTML = "";
  }

  function renderEventStep() {
    const container = document.querySelector("[data-event-step]");
    if (!container) {
      return;
    }

    if (location.slug !== "powdersville") {
      container.innerHTML = `
        <div class="note-card">
          <p class="ui-copy-strong">Events are not available at Taylor's Mill. This location is for photo and video sessions only.</p>
        </div>
      `;
      return;
    }

    const selectedDuration = getSelectedDuration();
    if (!selectedDuration || !selectedDuration.supportsEvents) {
      container.innerHTML = `
        <div class="note-card">
          <p class="ui-copy-strong">Events are available for 4-hour, 6-hour, and full-day bookings.</p>
          <p class="ui-copy" style="margin-top:0.75rem">Select a longer duration on the previous step to add event details.</p>
        </div>
      `;
      return;
    }

    const warning =
      state.eventIntent === "no" && /^\d+$/.test(state.participants.trim())
        ? `
          <div class="warning-card" style="margin-top:1rem">
            Looks like you have attendees — did you mean to select "Event booking" above?
          </div>
        `
        : "";

    const capacityNotice =
      /^\d+$/.test(state.participants.trim()) && Number(state.participants) >= 50
        ? `
          <div class="warning-card" style="margin-top:1rem">
            For events with 50+ attendees, our team will follow up to confirm details.
          </div>
        `
        : "";

    container.innerHTML = `
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
        </button>
      </div>

      <div style="margin-top:1.5rem">
        <label class="ui-field-label" for="participants">Participant count</label>
        <input class="booking-input" id="participants" data-input="participants" value="${escapeHtml(state.participants)}" placeholder="Expected number of attendees">
      </div>

      ${warning}
      ${capacityNotice}

      ${
        state.eventIntent === "yes"
          ? `
            <div class="choice-grid" style="margin-top:1.5rem">
              <div>
                <label class="ui-field-label" for="event-description">Tell us about the event</label>
                <textarea class="booking-textarea" id="event-description" data-input="event-description" placeholder="What are you hosting?">${escapeHtml(state.eventDescription)}</textarea>
              </div>
              <div class="booking-panel-soft panel-pad">
                <p class="ui-kicker">Required acknowledgements</p>
                <label class="helper-item" style="margin-top:1rem">
                  <input type="checkbox" data-check="cleanup" ${state.acknowledgements.cleanup ? "checked" : ""}>
                  <span>Please leave the studio exactly how you found it.</span>
                </label>
                <label class="helper-item" style="margin-top:1rem">
                  <input type="checkbox" data-check="capacity" ${state.acknowledgements.capacity ? "checked" : ""}>
                  <span>I understand 50+ guest events may trigger manual follow-up.</span>
                </label>
                <label class="helper-item" style="margin-top:1rem">
                  <input type="checkbox" data-check="self-service" ${state.acknowledgements.selfService ? "checked" : ""}>
                  <span>I understand this is a fully self-service event space with no team on site.</span>
                </label>
              </div>
            </div>
          `
          : ""
      }
    `;
  }

  function renderAddons() {
    const container = document.querySelector("[data-addon-list]");
    if (!container) {
      return;
    }

    container.innerHTML = location.addons.map(renderAddonCard).join("");
  }

  function renderAddonCard(addon) {
    const addonState = state.addons[addon.id];
    const priceLine = getAddonPriceLine(addon);
    const controls = renderAddonControls(addon, addonState);

    return `
      <article class="addon-card">
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
      return `
        <button type="button" class="booking-button ${addonState.selected ? "booking-button-primary" : "booking-button-secondary"}" data-action="toggle-addon" data-addon-id="${addon.id}">
          ${addonState.selected ? "Added" : "Add to booking"}
        </button>
      `;
    }

    if (addon.type === "quantity") {
      return `
        <div class="ui-row">
          <div class="ui-row-center">
            <button type="button" class="booking-button booking-button-secondary" data-action="adjust-quantity" data-addon-id="${addon.id}" data-delta="-1">-</button>
            <span class="ui-count">${addonState.quantity}</span>
            <button type="button" class="booking-button booking-button-secondary" data-action="adjust-quantity" data-addon-id="${addon.id}" data-delta="1">+</button>
          </div>
          <p class="ui-copy-muted">Max ${addon.max}</p>
        </div>
      `;
    }

    if (addon.type === "tier") {
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
        <div class="ui-stack-sm">
          <div class="addon-chip-row">
            <button type="button" class="addon-chip ${addonState.mode === "all" ? "is-active" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="all">
              All backdrops ${currency.format(addon.allPrice)}
            </button>
            <button type="button" class="addon-chip ${addonState.mode === "single" ? "is-active" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="single">
              Single color ${currency.format(addon.singlePrice)}
            </button>
          </div>
          <div class="addon-chip-row">
            ${addon.colors
              .map(
                (color) => `
                  <button type="button" class="addon-chip ${addonState.colors.includes(color.id) ? "is-active" : ""}" data-action="toggle-color" data-addon-id="${addon.id}" data-color-id="${color.id}">
                    ${color.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (addon.type === "walls") {
      return `
        <div class="ui-stack-sm">
          <div class="addon-chip-row">
            <button type="button" class="addon-chip ${addonState.mode === "all" ? "is-active" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="all">
              All walls ${currency.format(addon.allPrice)}
            </button>
            <button type="button" class="addon-chip ${addonState.mode === "single" ? "is-active" : ""}" data-action="set-addon-mode" data-addon-id="${addon.id}" data-mode="single">
              Per wall ${currency.format(addon.singlePrice)}
            </button>
          </div>
          <div class="addon-chip-row">
            ${addon.walls
              .map(
                (wall) => `
                  <button type="button" class="addon-chip ${addonState.walls.includes(wall.id) ? "is-active" : ""}" data-action="toggle-wall" data-addon-id="${addon.id}" data-wall-id="${wall.id}">
                    ${wall.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return "";
  }

  function renderIntegrations() {
    const container = document.querySelector("[data-integration-readiness]");
    const buttonSlot = document.querySelector("[data-complete-slot]");
    if (!container) {
      return;
    }

    const acuityState = getAcuityState();
    const hasContact = state.contact.firstName && state.contact.email;

    if (acuityState.isReady) {
      var dynamicUrl = buildAcuityUrl(acuityState.schedulerUrl);
      container.innerHTML = `
        <div class="summary-list">
          <div class="summary-line">
            <span>Duration</span>
            <span>${acuityState.selectedDuration.label}</span>
          </div>
          <div class="summary-line">
            <span>Name</span>
            <span>${escapeHtml(state.contact.firstName || "\u2014")} ${escapeHtml(state.contact.lastName || "")}</span>
          </div>
          <div class="summary-line">
            <span>Email</span>
            <span>${escapeHtml(state.contact.email || "\u2014")}</span>
          </div>
          <div class="summary-line">
            <span>Phone</span>
            <span>${escapeHtml(state.contact.phone || "\u2014")}</span>
          </div>
        </div>
        <p class="ui-copy" style="margin-top:1.25rem">Your info will be pre-filled on the scheduling page. Pick your date, confirm add-ons, and pay — all through Acuity.</p>
      `;

      if (buttonSlot) {
        buttonSlot.innerHTML = `
          <a class="booking-button booking-button-primary" href="${escapeAttribute(dynamicUrl)}" target="_blank" rel="noreferrer">
            ${hasContact ? "Schedule on Acuity" : "Schedule on Acuity (no contact info yet)"}
          </a>
        `;
      }
    } else {
      container.innerHTML = `
        <div class="summary-list">
          <div class="summary-line">
            <span>Acuity scheduler</span>
            <span style="color:#ffd7a8">Not configured</span>
          </div>
        </div>
      `;
      if (buttonSlot) {
        buttonSlot.innerHTML = `<button type="button" class="booking-button booking-button-primary" disabled>Acuity not configured</button>`;
      }
    }
  }

  function renderSummary() {
    const durationName = document.querySelector("[data-summary-duration]");
    const eventLine = document.querySelector("[data-summary-event]");
    const addons = document.querySelector("[data-summary-addons]");
    const total = document.querySelector("[data-summary-total]");

    if (!durationName || !eventLine || !addons || !total) {
      return;
    }

    const selectedDuration = getSelectedDuration();
    durationName.textContent = selectedDuration ? selectedDuration.label : "Not selected";

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

    addons.innerHTML = summaryItems.length
      ? summaryItems
          .map(
            (item) => `
              <div class="summary-line summary-line-muted">
                <span>${item.label}</span>
                <span>${currency.format(item.amount)}</span>
              </div>
            `
          )
          .join("")
      : '<p class="ui-empty">No add-ons selected yet.</p>';

    total.textContent = currency.format(
      summaryItems.reduce((sum, item) => sum + item.amount, 0)
    );
  }

  function renderStepVisibility() {
    document.querySelectorAll("[data-step-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === state.step);
    });
  }

  function setStep(step) {
    state.step = clamp(step, 1, 4);
    renderStepContent();
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

  function buildAcuityUrl(baseUrl) {
    var params = [];
    if (state.contact.firstName) {
      params.push("firstName=" + encodeURIComponent(state.contact.firstName));
    }
    if (state.contact.lastName) {
      params.push("lastName=" + encodeURIComponent(state.contact.lastName));
    }
    if (state.contact.email) {
      params.push("email=" + encodeURIComponent(state.contact.email));
    }
    if (state.contact.phone) {
      params.push("phone=" + encodeURIComponent(state.contact.phone));
    }
    if (!params.length) {
      return baseUrl;
    }
    var separator = baseUrl.indexOf("?") !== -1 ? "&" : "?";
    return baseUrl + separator + params.join("&");
  }

  function getAcuityState() {
    const acuity = config.integrations.acuity || {};
    const selectedDuration = getSelectedDuration() || { id: "", label: "", acuityTypeKey: "" };
    const locationConfig = acuity.locations && acuity.locations[location.slug] ? acuity.locations[location.slug] : {};
    const durationConfig =
      locationConfig.durations && selectedDuration.id && locationConfig.durations[selectedDuration.id]
        ? locationConfig.durations[selectedDuration.id]
        : {};
    const schedulerUrl = durationConfig.schedulerUrl || locationConfig.fallbackSchedulerUrl || acuity.accountUrl || "";
    const mode = acuity.mode || "placeholder";
    const isIframeReady = acuity.enabled && mode === "iframe" && Boolean(durationConfig.iframeSrc);
    const isSchedulerReady = acuity.enabled && mode === "scheduler" && Boolean(schedulerUrl);

    return {
      accountUrl: acuity.accountUrl || "",
      mode,
      selectedDuration,
      durationConfig,
      schedulerUrl,
      isReady: isIframeReady || isSchedulerReady
    };
  }

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

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }
})();
