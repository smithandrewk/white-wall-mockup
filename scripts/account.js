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
    fetchAvailabilityTimes: fetchAvailabilityTimes,
    submitBookingEdit: submitBookingEdit
  };
})();
