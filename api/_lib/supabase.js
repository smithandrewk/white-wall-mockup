// Supabase helpers for the booking site (V3 accounts/bookings).
//
// No SDK — raw fetch, matching api/_lib/square.js house style. Two key kinds:
//   - anon key: PUBLIC, safe to ship to the browser (gated by RLS). Served to
//     the client via /api/booking-public-config.
//   - service_role key: SECRET, server-only. Bypasses RLS. Never sent to the
//     client. Used for admin auth ops and privileged table writes.
//
// Env (set in Vercel): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

function supabaseUrl() {
  return process.env.SUPABASE_URL || "";
}
function anonKey() {
  return process.env.SUPABASE_ANON_KEY || "";
}
function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
function isConfigured() {
  return Boolean(supabaseUrl() && serviceKey());
}

// ---- Auth admin (service_role) ------------------------------------------------

// Create a confirmed auth user. Used by the post-payment account step: the
// customer just transacted with this email, so we auto-confirm (no email
// round-trip) and they're immediately logged in. Returns { id, email } or
// throws with a useful message. If the email already has an account, Supabase
// returns 422 — caller should treat that as "log in instead".
async function adminCreateUser(opts) {
  var email = opts.email;
  var password = opts.password;
  var userMetadata = opts.userMetadata || {};
  var res = await fetch(supabaseUrl() + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      "apikey": serviceKey(),
      "Authorization": "Bearer " + serviceKey(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: userMetadata
    })
  });
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    var err = new Error(data.msg || data.error_description || data.error || ("Supabase admin createUser failed (" + res.status + ")"));
    err.status = res.status;
    err.supabase = data;
    throw err;
  }
  return data; // { id, email, ... }
}

// Verify a user's access token (JWT from the browser) and return the user, or
// null if invalid/expired. Use to authenticate endpoints the customer calls.
async function getUserFromToken(accessToken) {
  if (!accessToken) return null;
  var res = await fetch(supabaseUrl() + "/auth/v1/user", {
    headers: { "apikey": anonKey(), "Authorization": "Bearer " + accessToken }
  });
  if (!res.ok) return null;
  return await res.json().catch(function () { return null; });
}

// ---- PostgREST (service_role; bypasses RLS) ----------------------------------

// Upsert/patch a row by primary key match. `match` is a PostgREST filter object
// (e.g. { id: "eq.<uuid>" }). Returns the updated rows.
async function serviceUpdate(table, match, patch) {
  var qs = Object.keys(match).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(match[k]); }).join("&");
  var res = await fetch(supabaseUrl() + "/rest/v1/" + table + "?" + qs, {
    method: "PATCH",
    headers: {
      "apikey": serviceKey(),
      "Authorization": "Bearer " + serviceKey(),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(patch)
  });
  var data = await res.json().catch(function () { return []; });
  if (!res.ok) {
    var err = new Error("Supabase update " + table + " failed (" + res.status + ")");
    err.status = res.status; err.supabase = data; throw err;
  }
  return data;
}

async function serviceInsert(table, rows) {
  var res = await fetch(supabaseUrl() + "/rest/v1/" + table, {
    method: "POST",
    headers: {
      "apikey": serviceKey(),
      "Authorization": "Bearer " + serviceKey(),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(rows)
  });
  var data = await res.json().catch(function () { return []; });
  if (!res.ok) {
    var err = new Error("Supabase insert " + table + " failed (" + res.status + ")");
    err.status = res.status; err.supabase = data; throw err;
  }
  return data;
}

async function serviceSelect(table, query) {
  var res = await fetch(supabaseUrl() + "/rest/v1/" + table + "?" + (query || ""), {
    headers: { "apikey": serviceKey(), "Authorization": "Bearer " + serviceKey() }
  });
  var data = await res.json().catch(function () { return []; });
  if (!res.ok) {
    var err = new Error("Supabase select " + table + " failed (" + res.status + ")");
    err.status = res.status; err.supabase = data; throw err;
  }
  return data;
}

module.exports = {
  supabaseUrl: supabaseUrl,
  anonKey: anonKey,
  serviceKey: serviceKey,
  isConfigured: isConfigured,
  adminCreateUser: adminCreateUser,
  getUserFromToken: getUserFromToken,
  serviceUpdate: serviceUpdate,
  serviceInsert: serviceInsert,
  serviceSelect: serviceSelect
};
