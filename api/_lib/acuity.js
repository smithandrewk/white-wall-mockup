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

  lines.push("", "Booked via whitewallstudios.co");
  return lines.join("\n");
}

module.exports = {
  acuityGet,
  acuityPost,
  isValidAppointmentTypeID,
  ACUITY_ADDON_IDS,
  ACUITY_FIELD_IDS,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes
};
