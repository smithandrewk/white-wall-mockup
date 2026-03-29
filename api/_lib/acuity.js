// Acuity Scheduling API wrapper
// Docs: https://developers.acuityscheduling.com/reference/quick-start
// Auth: HTTP Basic over SSL (userId:apiKey)
// Base URL: https://acuityscheduling.com/api/v1/
//
// IMPORTANT — Undocumented behavior we rely on:
//
// 1. `noPayment: true` on POST /appointments — creates appointment without
//    requiring immediate payment. Not in official docs but widely used and
//    needed for admin-created appointments. Tested 2026-03-17.
//
// 2. `confirmationPagePaymentLink` in appointment responses — returns a URL
//    to Acuity's Square-powered payment page for a specific appointment.
//    Not documented in the API reference but present on every appointment
//    object. This is how we redirect customers to pay.
//
// 3. Duplicate addonIDs for quantity — passing the same addon ID multiple
//    times in the addonIDs array charges the addon price × count. The
//    response deduplicates the IDs, but the price math is correct.
//    Tested: 3× backdrop ($20) = $60 added to total. (2026-03-17)
//
// 4. `fields` accepts {id, value} objects — the docs mention a `label`
//    property, but ID-based lookup works and is more reliable since
//    field labels could change.

const ACUITY_BASE = "https://acuityscheduling.com/api/v1";

function getAuthHeader() {
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  if (!userId || !apiKey) {
    throw new Error("Missing ACUITY_USER_ID or ACUITY_API_KEY");
  }
  return "Basic " + Buffer.from(`${userId}:${apiKey}`).toString("base64");
}

// Generic GET — supports both simple params and array params (e.g. addonIDs[])
// For array params, pass { "addonIDs[]": [id1, id2] }
async function acuityGet(path, params = {}) {
  const url = new URL(`${ACUITY_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach((item) => url.searchParams.append(k, item));
    } else {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: getAuthHeader() }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Acuity ${res.status}: ${text}`);
  }
  return res.json();
}

async function acuityPost(path, body) {
  const res = await fetch(`${ACUITY_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Acuity ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Appointment type allowlist
// Source: GET /appointment-types (verified 2026-03-17)
// ---------------------------------------------------------------------------
const VALID_APPOINTMENT_TYPE_IDS = new Set([
  // Powdersville (calendarID: 6255578)
  "89113040", // 1hr  — $130
  "89113116", // 2hr  — $200
  "89114444", // 3hr  — $270
  "89114517", // 4hr  — $350
  "89114539", // 6hr  — $500
  "89114581", // Full — $980
  // Taylor's Mill (calendarID: 6252295)
  "38342199", // 1hr  — $110
  "28312352", // 2hr  — $170
  "28312534", // 3hr  — $230
  "28312549", // 4hr  — $280
  "36030598", // 6hr  — $420
  "28312569"  // Full — $550
]);

function isValidAppointmentTypeID(id) {
  return VALID_APPOINTMENT_TYPE_IDS.has(String(id));
}

// ---------------------------------------------------------------------------
// Acuity add-on IDs
// Source: GET /appointment-addons (verified 2026-03-17)
//
// Legacy add-ons (public, will be deleted after migration):
//   2592725 — "Paper Backdrop" ($20)
//
// Lighting — PV is $100 in Acuity but $125 on our site. Need to confirm
// with Drew and update Acuity if $125 is correct.
// ---------------------------------------------------------------------------
const ACUITY_ADDON_IDS = {
  // Lighting
  "lighting-powdersville": 6723268, // "Lighting Package (2 Fixtures)" — $100 (confirm $125 with Drew)
  "lighting-taylors-mill": 2387016, // "Lighting Rental" — $50

  // Backdrops (all 12 types)
  "backdrops-all": 6840261,         // "All Backdrops" — $50
  "backdrops-single": 6840263,      // "Single Backdrop" — $15 (pass N times for N colors)

  // Rolling walls (PV only)
  "walls-all": 6840264,             // "All Rolling Walls" — $70
  "walls-single": 6840265,          // "Single Rolling Wall" — $30 (pass N times for N walls)

  // Chairs (PV only)
  "chairs-25": 6840270,             // "25 Chairs" — $100
  "chairs-50": 6840271,             // "50 Chairs" — $190
  "chairs-75": 6840272,             // "75 Chairs" — $280
  "chairs-100": 6840274,            // "100 Chairs" — $370

  // Tables (PV only)
  "table": 6840275,                 // "8ft Folding Table" — $15 (pass N times for N tables)

  // Equipment (PV only)
  "tv": 6840276,                    // "86in Rolling TV" — $50
  "pa-system": 6840278              // "PA System" — $40
};

// ---------------------------------------------------------------------------
// Acuity intake form field IDs
// Source: GET /forms (verified 2026-03-17)
//
// Form 1935872: "Photographer/Videographer Intake Form" (all 12 types)
// Form 3189363: "Terms & Conditions Powdersville Location" (6 PV types)
// Form 1935852: "Terms & Conditions Taylor's Mill" (6 TM types)
// ---------------------------------------------------------------------------
const ACUITY_FIELD_IDS = {
  businessName: 10764621,  // "Business Legal Name" (optional)
  participants: 10764623,  // "Total Number of Participants" (required)
  instagram: 10764624,     // "Instagram Handle" (optional)
  readEmail: 10947712,     // "Will you read the entire email..." (required)
  pvTerms: 18026152,       // PV: "I have read...and agree" (required)
  tmTerms: 10764522,       // TM: "I have read...and agree" (required)
  tmWalking: 18026602      // TM: "I will only walk to WhiteWall Studios..." (required)
};

// ---------------------------------------------------------------------------
// Build the addonIDs array for POST /appointments
//
// For quantity: pass the same ID multiple times (see undocumented behavior
// note #3 at top of file). Specific colors/wall numbers go in appointment
// notes since Acuity add-ons are just price line items.
// ---------------------------------------------------------------------------
function buildAcuityAddonIDs(addons, location) {
  const ids = [];
  if (!addons) return ids;

  // Lighting
  if (addons.lighting && addons.lighting.selected) {
    var lightingKey = location === "powdersville" ? "lighting-powdersville" : "lighting-taylors-mill";
    ids.push(ACUITY_ADDON_IDS[lightingKey]);
  }

  // Backdrops
  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") {
      ids.push(ACUITY_ADDON_IDS["backdrops-all"]);
    } else if (addons.backdrops.colors && addons.backdrops.colors.length > 0) {
      for (var i = 0; i < addons.backdrops.colors.length; i++) {
        ids.push(ACUITY_ADDON_IDS["backdrops-single"]);
      }
    }
  }

  // Rolling walls (PV only — TM config doesn't have this add-on)
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") {
      ids.push(ACUITY_ADDON_IDS["walls-all"]);
    } else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length > 0) {
      for (var w = 0; w < addons["rolling-walls"].walls.length; w++) {
        ids.push(ACUITY_ADDON_IDS["walls-single"]);
      }
    }
  }

  // Chairs (PV only)
  if (addons.chairs && addons.chairs.selection) {
    var chairKey = "chairs-" + addons.chairs.selection;
    if (ACUITY_ADDON_IDS[chairKey]) {
      ids.push(ACUITY_ADDON_IDS[chairKey]);
    }
  }

  // Tables (PV only) — pass ID once per table for quantity pricing
  if (addons.tables && addons.tables.quantity > 0) {
    var qty = Math.min(addons.tables.quantity, 10);
    for (var t = 0; t < qty; t++) {
      ids.push(ACUITY_ADDON_IDS["table"]);
    }
  }

  // TV (PV only)
  if (addons.tv && addons.tv.selected) {
    ids.push(ACUITY_ADDON_IDS["tv"]);
  }

  // PA System (PV only)
  if (addons["pa-system"] && addons["pa-system"].selected) {
    ids.push(ACUITY_ADDON_IDS["pa-system"]);
  }

  return ids;
}

// Build the fields array for POST /appointments
// Uses {id, value} format (see undocumented behavior note #4 at top of file)
function buildAcuityFields(intake, location) {
  const fields = [];

  fields.push({ id: ACUITY_FIELD_IDS.businessName, value: intake.business || "" });
  fields.push({ id: ACUITY_FIELD_IDS.participants, value: intake.participants || "1" });
  fields.push({ id: ACUITY_FIELD_IDS.instagram, value: intake.instagram || "" });
  fields.push({ id: ACUITY_FIELD_IDS.readEmail, value: intake.readEmail ? "Yes" : "No" });

  if (location === "powdersville") {
    fields.push({ id: ACUITY_FIELD_IDS.pvTerms, value: "yes" });
  } else {
    fields.push({ id: ACUITY_FIELD_IDS.tmTerms, value: "yes" });
    fields.push({ id: ACUITY_FIELD_IDS.tmWalking, value: "yes" });
  }

  return fields;
}

// Build appointment notes with details Acuity can't represent as structured data.
// This is the only way Drew sees backdrop colors, wall selections, etc. in his dashboard.
function buildAppointmentNotes(bookingState) {
  const lines = [];

  if (bookingState.eventIntent === "yes") {
    lines.push("Event booking: Yes");
    if (bookingState.participants) lines.push("Event guests: " + bookingState.participants);
    if (bookingState.eventDescription) lines.push("Event description: " + bookingState.eventDescription);
  }

  const addons = bookingState.addons || {};
  const addonLines = [];

  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") addonLines.push("Backdrops: All");
    else if (addons.backdrops.colors && addons.backdrops.colors.length) addonLines.push("Backdrop colors: " + addons.backdrops.colors.join(", "));
  }
  if (addons.lighting && addons.lighting.selected) addonLines.push("Lighting rental: Yes");
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") addonLines.push("Rolling walls: All");
    else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length) addonLines.push("Rolling walls: " + addons["rolling-walls"].walls.join(", "));
  }
  if (addons.chairs && addons.chairs.selection) addonLines.push("Chairs: " + addons.chairs.selection);
  if (addons.tables && addons.tables.quantity > 0) addonLines.push("Tables: " + addons.tables.quantity);
  if (addons.tv && addons.tv.selected) addonLines.push("86in TV: Yes");
  if (addons["pa-system"] && addons["pa-system"].selected) addonLines.push("PA system: Yes");

  if (addonLines.length) {
    lines.push("", "Add-ons:", ...addonLines);
  }

  if (bookingState.cleaningFee) {
    if (bookingState.cleaningFee.amount > 0) {
      lines.push("", "Cleaning fee: $" + bookingState.cleaningFee.amount + " (auto-applied, 50+ participants)");
    } else {
      lines.push("", "Cleaning fee: pending review (35-49 event participants)");
    }
  }

  lines.push("", "Booked via whitewallstudios.co");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Acuity DELETE helper (for blocks)
// ---------------------------------------------------------------------------
async function acuityDelete(path) {
  const res = await fetch(`${ACUITY_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: getAuthHeader() }
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Acuity DELETE ${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Calendar IDs — needed for POST /blocks
// Source: GET /appointment-types (verified 2026-03-17)
// ---------------------------------------------------------------------------
const CALENDAR_IDS = {
  powdersville: 6255578,
  "taylors-mill": 6252295
};

// Map appointment type ID to its calendar ID
const TYPE_TO_CALENDAR = {};
["89113040","89113116","89114444","89114517","89114539","89114581"].forEach(function(id) {
  TYPE_TO_CALENDAR[id] = CALENDAR_IDS.powdersville;
});
["38342199","28312352","28312534","28312549","36030598","28312569"].forEach(function(id) {
  TYPE_TO_CALENDAR[id] = CALENDAR_IDS["taylors-mill"];
});

// Map appointment type ID to duration in minutes (for block end time)
const TYPE_TO_DURATION = {
  "89113040": 60, "89113116": 120, "89114444": 180,
  "89114517": 240, "89114539": 360, "89114581": 1080,
  "38342199": 60, "28312352": 120, "28312534": 180,
  "28312549": 240, "36030598": 360, "28312569": 720
};

// ---------------------------------------------------------------------------
// Session prices in cents — server-side source of truth for Square line items
// Must match Acuity appointment type prices
// ---------------------------------------------------------------------------
const SESSION_PRICES = {
  "89113040": { label: "1 Hour Session", cents: 13000 },
  "89113116": { label: "2 Hour Session", cents: 20000 },
  "89114444": { label: "3 Hour Session", cents: 27000 },
  "89114517": { label: "4 Hour Session", cents: 35000 },
  "89114539": { label: "6 Hour Session", cents: 50000 },
  "89114581": { label: "Full Day Session", cents: 98000 },
  "38342199": { label: "1 Hour Session", cents: 11000 },
  "28312352": { label: "2 Hour Session", cents: 17000 },
  "28312534": { label: "3 Hour Session", cents: 23000 },
  "28312549": { label: "Half Day Session", cents: 28000 },
  "36030598": { label: "6 Hour Session", cents: 42000 },
  "28312569": { label: "Full Day Session", cents: 55000 }
};

// Add-on prices in cents — for building Square line items
const ADDON_PRICES = {
  "lighting-powdersville": { label: "Lighting Rental", cents: 12500 },
  "lighting-taylors-mill": { label: "Lighting Rental", cents: 5000 },
  "backdrops-all": { label: "All Backdrops", cents: 5000 },
  "backdrops-single": { label: "Single Backdrop", cents: 1500 },
  "walls-all": { label: "All Rolling Walls", cents: 7000 },
  "walls-single": { label: "Single Rolling Wall", cents: 3000 },
  "chairs-25": { label: "25 Chairs", cents: 10000 },
  "chairs-50": { label: "50 Chairs", cents: 19000 },
  "chairs-75": { label: "75 Chairs", cents: 28000 },
  "chairs-100": { label: "100 Chairs", cents: 37000 },
  "table": { label: "8ft Folding Table", cents: 1500 },
  "tv": { label: "86in Rolling TV", cents: 5000 },
  "pa-system": { label: "PA System", cents: 4000 }
};

// Build Square line items array from booking state
// Returns [{ name, amount (cents), quantity }]
function buildSquareLineItems(appointmentTypeID, addons, location) {
  const items = [];
  const session = SESSION_PRICES[String(appointmentTypeID)];
  if (!session) throw new Error("Unknown appointment type: " + appointmentTypeID);

  items.push({ name: session.label, amount: session.cents, quantity: 1 });

  if (!addons) return items;

  // Lighting
  if (addons.lighting && addons.lighting.selected) {
    var lk = location === "powdersville" ? "lighting-powdersville" : "lighting-taylors-mill";
    items.push({ name: ADDON_PRICES[lk].label, amount: ADDON_PRICES[lk].cents, quantity: 1 });
  }

  // Backdrops
  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") {
      items.push({ name: ADDON_PRICES["backdrops-all"].label, amount: ADDON_PRICES["backdrops-all"].cents, quantity: 1 });
    } else if (addons.backdrops.colors && addons.backdrops.colors.length > 0) {
      items.push({ name: ADDON_PRICES["backdrops-single"].label, amount: ADDON_PRICES["backdrops-single"].cents, quantity: addons.backdrops.colors.length });
    }
  }

  // Rolling walls
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") {
      items.push({ name: ADDON_PRICES["walls-all"].label, amount: ADDON_PRICES["walls-all"].cents, quantity: 1 });
    } else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length > 0) {
      items.push({ name: ADDON_PRICES["walls-single"].label, amount: ADDON_PRICES["walls-single"].cents, quantity: addons["rolling-walls"].walls.length });
    }
  }

  // Chairs
  if (addons.chairs && addons.chairs.selection) {
    var ck = "chairs-" + addons.chairs.selection;
    if (ADDON_PRICES[ck]) {
      items.push({ name: ADDON_PRICES[ck].label, amount: ADDON_PRICES[ck].cents, quantity: 1 });
    }
  }

  // Tables
  if (addons.tables && addons.tables.quantity > 0) {
    var tq = Math.min(addons.tables.quantity, 10);
    items.push({ name: ADDON_PRICES["table"].label, amount: ADDON_PRICES["table"].cents, quantity: tq });
  }

  // TV
  if (addons.tv && addons.tv.selected) {
    items.push({ name: ADDON_PRICES["tv"].label, amount: ADDON_PRICES["tv"].cents, quantity: 1 });
  }

  // PA
  if (addons["pa-system"] && addons["pa-system"].selected) {
    items.push({ name: ADDON_PRICES["pa-system"].label, amount: ADDON_PRICES["pa-system"].cents, quantity: 1 });
  }

  return items;
}

// ---------------------------------------------------------------------------
// HMAC signing — pass booking state safely through Square's redirect URL
// ---------------------------------------------------------------------------
const crypto = require("crypto");

function signState(stateObj) {
  const secret = process.env.BOOKING_SECRET;
  if (!secret) throw new Error("Missing BOOKING_SECRET");
  const payload = JSON.stringify(stateObj);
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const encoded = Buffer.from(payload).toString("base64url");
  return { encoded, sig };
}

function verifyAndDecodeState(encoded, sig) {
  const secret = process.env.BOOKING_SECRET;
  if (!secret) throw new Error("Missing BOOKING_SECRET");
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid signature");
  }
  return JSON.parse(payload);
}

module.exports = {
  acuityGet,
  acuityPost,
  acuityDelete,
  isValidAppointmentTypeID,
  CALENDAR_IDS,
  TYPE_TO_CALENDAR,
  TYPE_TO_DURATION,
  ACUITY_ADDON_IDS,
  ACUITY_FIELD_IDS,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes,
  buildSquareLineItems,
  signState,
  verifyAndDecodeState
};
