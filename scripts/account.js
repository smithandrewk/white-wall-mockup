// scripts/account.js — browser auth module for WWS customer accounts (V3 item 7).
//
// Static site, no bundler: pulls the public Supabase config from
// /api/booking-public-config and loads @supabase/supabase-js from a CDN via
// dynamic import. Exposes window.WWSAccount. The anon key is public + RLS-gated;
// nothing secret lives here.

(function () {
  var clientPromise = null;

  async function ensureClient() {
    if (clientPromise) return clientPromise;
    clientPromise = (async function () {
      var cfgRes = await fetch("/api/booking-public-config");
      var cfg = await cfgRes.json();
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        throw new Error("Accounts are not configured yet");
      }
      var mod = await import("https://esm.sh/@supabase/supabase-js@2");
      return mod.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage }
      });
    })();
    return clientPromise;
  }

  async function signInWithPassword(email, password) {
    var c = await ensureClient();
    var r = await c.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: password });
    if (r.error) throw r.error;
    return r.data;
  }

  // Self-serve sign-up (from the login page). Requires email confirmation.
  async function signUp(email, password) {
    var c = await ensureClient();
    var r = await c.auth.signUp({ email: String(email).trim().toLowerCase(), password: password });
    if (r.error) throw r.error;
    return r.data;
  }

  // OAuth sign-in (Google). Redirects the browser to Google; on return Supabase
  // sets the session and we land back on redirectPath (default /account).
  async function signInWithGoogle(redirectPath) {
    var c = await ensureClient();
    var redirectTo = window.location.origin + (redirectPath || "/account");
    var r = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo } });
    if (r.error) throw r.error;
    return r.data;
  }

  // Post-payment account creation: server makes a CONFIRMED user (no email
  // round-trip) + enriches the customers row, then we sign in right away.
  async function createAccountPostPayment(opts) {
    var res = await fetch("/api/account/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts)
    });
    var data = await res.json().catch(function () { return {}; });
    if (res.status === 409) { var e = new Error(data.error || "Account exists"); e.code = "exists"; throw e; }
    if (!res.ok) throw new Error(data.error || "Could not create account");
    await signInWithPassword(opts.email, opts.password);
    return data;
  }

  async function signOut() {
    var c = await ensureClient();
    await c.auth.signOut();
  }

  async function getSession() {
    var c = await ensureClient();
    var r = await c.auth.getSession();
    return r.data ? r.data.session : null;
  }

  async function getAccessToken() {
    var s = await getSession();
    return s ? s.access_token : null;
  }

  async function getUser() {
    var s = await getSession();
    return s ? s.user : null;
  }

  // Fetch the profile (customer + bookings) for the signed-in user.
  async function fetchProfile() {
    var token = await getAccessToken();
    if (!token) return null;
    var res = await fetch("/api/account/profile", { headers: { "Authorization": "Bearer " + token } });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("Could not load profile");
    return await res.json();
  }

  // Open availability slots for a session's appointment type on a given date
  // (YYYY-MM-DD). Public proxy — no auth needed. Returns [{ time }].
  async function fetchAvailabilityTimes(appointmentTypeID, date) {
    var url = "/api/availability-times?appointmentTypeID=" +
      encodeURIComponent(appointmentTypeID) + "&date=" + encodeURIComponent(date);
    var res = await fetch(url);
    if (!res.ok) throw new Error("Could not load times");
    var data = await res.json();
    return (data && data.times) || [];
  }

  // Submit an item-7 live edit for one session (add-only / no-downgrade enforced
  // server-side; client price is never trusted). Returns { ok, status, data } so
  // the caller can handle the money-gate 409 ("not enabled yet") gracefully.
  async function submitBookingEdit(payload) {
    var token = await getAccessToken();
    if (!token) { var e = new Error("Not signed in"); e.status = 401; throw e; }
    var res = await fetch("/api/account/booking-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok, status: res.status, data: data };
  }

  // Save the signed-in customer's editable profile (Drew round-4 item 6).
  // Posts the FULL field set to /api/account/profile-update; the server requires
  // phone and saves all fields at once, so the /account page sends everything
  // regardless of which sub-section's Save was clicked. Email is the auth
  // identity and is intentionally NOT part of the payload. Returns
  // { ok, status, data } so the caller can surface validation details (400).
  async function updateProfile(payload) {
    var token = await getAccessToken();
    if (!token) { var e = new Error("Not signed in"); e.status = 401; throw e; }
    var res = await fetch("/api/account/profile-update", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok, status: res.status, data: data };
  }

  // Save a NEW card on file for the signed-in customer (Drew V3 item 1). The
  // caller tokenizes a card with the Square Web Payments SDK (intent:"STORE" —
  // no charge) and passes the single-use token here. Server resolves/creates the
  // Square customer for this account, stores the card, and returns the new
  // last4/brand. Never trusts the client with anything but the token. Returns
  // { ok, status, data } so the caller can surface a 402 (bad card) gracefully.
  async function saveCard(payload) {
    var token = await getAccessToken();
    if (!token) { var e = new Error("Not signed in"); e.status = 401; throw e; }
    var res = await fetch("/api/account/save-card", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok, status: res.status, data: data };
  }

  // Cheap check for a persisted Supabase session in localStorage (key shape
  // `sb-<ref>-auth-token`). Lets callers (the booking flow) skip loading the
  // Supabase SDK entirely for anonymous visitors — the common case.
  function hasStoredSession() {
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && /^sb-.*-auth-token$/.test(k)) return true;
      }
    } catch (e) { /* localStorage blocked — treat as anonymous */ }
    return false;
  }

  // Booking pre-fill (Drew round-4 item 5): return the signed-in customer's
  // contact + intake fields so a NEW booking can pre-populate them, or null when
  // nobody is signed in. Splits full_name into first/last and maps company_name
  // to the booking flow's "business" field. Never throws — booking must work for
  // anonymous visitors regardless.
  async function getBookingPrefill() {
    if (!hasStoredSession()) return null;
    var profile;
    try { profile = await fetchProfile(); } catch (e) { return null; }
    if (!profile || !profile.customer) return null;
    var c = profile.customer;
    var full = (c.fullName || "").trim();
    var firstName = full, lastName = "";
    var sp = full.indexOf(" ");
    if (sp > 0) { firstName = full.slice(0, sp); lastName = full.slice(sp + 1).trim(); }
    return {
      firstName: firstName,
      lastName: lastName,
      email: c.email || "",
      phone: c.phone || "",
      instagram: c.instagram || "",
      business: c.companyName || ""
    };
  }

  // Pay an outstanding 40% balance for one of the signed-in customer's bookings
  // (V3 item 6 — the lockout pay path). Server charges the card on file; amount
  // + ownership are authoritative server-side. Returns { ok, status, data } so
  // the caller can handle the dark 503 ("not enabled yet") and the 402 (card
  // declined) gracefully without a throw.
  async function payBalance(bookingId) {
    var token = await getAccessToken();
    if (!token) { var e = new Error("Not signed in"); e.status = 401; throw e; }
    var res = await fetch("/api/pay-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ bookingId: bookingId })
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok, status: res.status, data: data };
  }

  window.WWSAccount = {
    ensureClient: ensureClient,
    signInWithPassword: signInWithPassword,
    signInWithGoogle: signInWithGoogle,
    signUp: signUp,
    createAccountPostPayment: createAccountPostPayment,
    signOut: signOut,
    getSession: getSession,
    getAccessToken: getAccessToken,
    getUser: getUser,
    fetchProfile: fetchProfile,
    updateProfile: updateProfile,
    getBookingPrefill: getBookingPrefill,
    fetchAvailabilityTimes: fetchAvailabilityTimes,
    submitBookingEdit: submitBookingEdit,
    payBalance: payBalance,
    saveCard: saveCard
  };
})();
