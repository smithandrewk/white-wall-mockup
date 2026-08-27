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

async function acuityPut(path, body) {
  const res = await fetch(`${ACUITY_BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Acuity PUT ${res.status}: ${text}`);
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
  "94823049", // 8hr  — $750 (V3 item 3, earliest 12:30pm)
  "89114581", // Full — $980
  // Taylor's Mill (calendarID: 6252295)
  "38342199", // 1hr  — $110
  "28312352", // 2hr  — $170
  "28312534", // 3hr  — $230
  "28312549", // 4hr  — $280
  "36030598", // 6hr  — $420
  "28312569"  // Full — $550
]);

// ---------------------------------------------------------------------------
// ⚠️ Acuity per-location EMAIL TEMPLATE routing — dashboard-only, NOT enforced here
//
// Confirmation + reminder emails are sent by Acuity, not by this code. Each
// appointment type is assigned (in the Acuity admin, Emails & Texts > Client
// Emails) to exactly ONE confirmation template and ONE reminder template, and
// those templates carry the location's ADDRESS + DOOR CODES + video links.
// This assignment lives only in the Acuity dashboard — there is no API for it —
// so nothing in this repo can validate it. Get it wrong and a customer receives
// the other location's address and door codes.
//
//   Powdersville types (89113040, 89113116, 89114444, 89114517, 89114539,
//     94823049, 89114581)  ->  "Booking Confirmation 2"  +  "Reminder 1B"
//   Taylor's Mill types (38342199, 28312352, 28312534, 28312549, 36030598,
//     28312569)            ->  "Booking Confirmation"    +  "Reminder 1A"
//
// INVARIANT when adding/creating a NEW appointment type in Acuity: immediately
// attach it to its location's confirmation AND reminder templates, then verify
// (checkbox-by-checkbox) that no type is on the wrong location's template.
//
// Incident history: the 8-Hour Powdersville type (94823049, added for V3 item 3)
// shipped attached to the Taylor's Mill templates, so pre-2026-08-25 Powdersville
// 8-Hour bookings received Taylor's Mill info. Fixed 2026-08-25 (DREW-77). Surfaced
// again 2026-08-27 by a customer (Denise Ko) who had booked 2026-07-22, before the
// fix (DREW-95). Routing re-verified correct for all 13 types on 2026-08-27.
// ---------------------------------------------------------------------------

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
  "lighting-powdersville": 6723268, // "Lighting Package (2 Fixtures)" — $125 (updated 2026-04-01)
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
  "pa-system": 6840278,             // "PA System" — $40

  // Event Setup and Reset Crew (PV events only) — $750 (V3 item 5)
  "setup-crew": 7088190,            // "Studio Setup, Tear down, and Reset Crew."

  // Cleaning fee (auto-applied at 35+ participants)
  "cleaning-fee": 6881547           // "Cleaning Fee" — $150
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

  // Event Setup and Reset Crew (PV events only)
  if (addons["setup-crew"] && addons["setup-crew"].selected) {
    ids.push(ACUITY_ADDON_IDS["setup-crew"]);
  }

  return ids;
}

// Build the fields array for POST /appointments
// Uses {id, value} format (see undocumented behavior note #4 at top of file)
function buildAcuityFields(intake, location) {
  const fields = [];

  fields.push({ id: ACUITY_FIELD_IDS.businessName, value: intake.business || "" });
  // DREW-31: never fake the headcount. The count is now a required field on every
  // path (photo/video via intake.participants, events mirror the attendee count in);
  // write the real value, or an honest blank when genuinely absent, never "1".
  fields.push({ id: ACUITY_FIELD_IDS.participants, value: intake.participants ? String(intake.participants) : "" });
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

  const intake = bookingState.intake || {};
  if (intake.leadSource) {
    // "Other" records the exact free text the customer typed, not the word "Other".
    const heard =
      intake.leadSource === "Other" && intake.leadSourceOther
        ? intake.leadSourceOther
        : intake.leadSource;
    lines.push("Heard about us: " + heard);
  }

  // DREW-31: uniform "Session purpose:" line on EVERY booking (what they are using
  // the space for). Photo/video answers a fixed dropdown ("Other" carries its free
  // text as "Other: ..."); events/multi-day answer the open-ended event description.
  // The dashboard purpose analytics parses exactly this label.
  let sessionPurpose = "";
  if (bookingState.eventIntent === "yes") {
    sessionPurpose = (bookingState.eventDescription || "").trim();
  } else {
    const purpose = (intake.purpose || "").trim();
    if (purpose === "Other") {
      sessionPurpose = intake.purposeOther ? "Other: " + String(intake.purposeOther).trim() : "Other";
    } else {
      sessionPurpose = purpose;
    }
  }
  if (sessionPurpose) lines.push("Session purpose: " + sessionPurpose);

  if (bookingState.eventIntent === "yes") {
    lines.push("Event booking: Yes");
    if (bookingState.participants) lines.push("Event guests: " + bookingState.participants);
    lines.push("Food or drinks: " + (bookingState.foodDrinks ? "Yes" : "No"));
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
  if (addons["setup-crew"] && addons["setup-crew"].selected) addonLines.push("Event Setup and Reset Crew: Yes");

  if (addonLines.length) {
    lines.push("", "Add-ons:", ...addonLines);
  }

  if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
    lines.push("", "Cleaning fee: $" + bookingState.cleaningFee.amount + " (auto-applied, 35+ participants)");
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
// Reschedule an existing appointment (V3 item-7 live profile edit).
// Acuity: PUT /appointments/:id/reschedule with { datetime, calendarID }.
//  - admin=true lets an authenticated account edit move the slot outside the
//    normal client-facing window (we re-check availability ourselves first).
//  - calendarID is REQUIRED here on purpose: the multi-calendar gotcha applies
//    to writes too — an appointment type that belongs to multiple calendars
//    (every prod type also has STAGING 14110701) misroutes without it. We throw
//    rather than let Acuity silently pick the first calendar.
//  - datetime is ISO 8601 with the America/New_York offset.
// This is a dormant primitive: the edit endpoint is its only intended caller.
// ---------------------------------------------------------------------------
async function rescheduleAppointment(appointmentId, opts) {
  opts = opts || {};
  if (!appointmentId) throw new Error("rescheduleAppointment: appointmentId is required");
  if (!opts.datetime) throw new Error("rescheduleAppointment: datetime is required");
  if (!opts.calendarID) throw new Error("rescheduleAppointment: calendarID is required (multi-calendar gotcha)");
  return acuityPut(
    `/appointments/${encodeURIComponent(appointmentId)}/reschedule?admin=true`,
    { datetime: opts.datetime, calendarID: opts.calendarID }
  );
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
["89113040","89113116","89114444","89114517","89114539","94823049","89114581"].forEach(function(id) {
  TYPE_TO_CALENDAR[id] = CALENDAR_IDS.powdersville;
});
["38342199","28312352","28312534","28312549","36030598","28312569"].forEach(function(id) {
  TYPE_TO_CALENDAR[id] = CALENDAR_IDS["taylors-mill"];
});

// Map appointment type ID to duration in minutes (for block end time)
const TYPE_TO_DURATION = {
  "89113040": 60, "89113116": 120, "89114444": 180,
  "89114517": 240, "89114539": 360, "94823049": 480, "89114581": 1080,
  "38342199": 60, "28312352": 120, "28312534": 180,
  "28312549": 240, "36030598": 360, "28312569": 720
};

// ---------------------------------------------------------------------------
// Earliest-start floor — Eastern local minutes-since-midnight, keyed by type.
// Acuity has no per-type "earliest time" setting, so we enforce it in code
// across availability-times (filter), verify-availability + create-checkout
// (reject). Single source of truth so the three sites can't drift.
// ---------------------------------------------------------------------------
const TYPE_EARLIEST_START_MINUTES = {
  "94823049": 12 * 60 + 30  // 8h Flagship — earliest 12:30pm ET (V3 item 3)
};

// Eastern (America/New_York) local minutes-since-midnight for an ISO datetime.
function easternMinutesFromISO(iso) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(iso));
  let h = 0, m = 0;
  for (const p of parts) {
    if (p.type === "hour") h = parseInt(p.value, 10);
    if (p.type === "minute") m = parseInt(p.value, 10);
  }
  if (h === 24) h = 0; // some runtimes emit "24" for midnight under hour12:false
  return h * 60 + m;
}

// True when this type has an earliest-start floor and the given start is before it.
function isStartBeforeEarliest(appointmentTypeID, iso) {
  const floor = TYPE_EARLIEST_START_MINUTES[String(appointmentTypeID)];
  if (floor == null) return false;
  return easternMinutesFromISO(iso) < floor;
}

// ---------------------------------------------------------------------------
// Studio CLOSE-time cap — the upper bookend to the earliest-start floor above.
// A session must not be schedulable to END after the studio closes; like the
// floor, this is a duration-SELECTION rule (it bounds which start slots are
// offerable for a given duration), NOT per-hour billing math. Enforced across
// availability-times (filter) + verify-availability + create-checkout (reject),
// single source of truth so the sites can't drift. (V3 item 2 multi-day cart.)
//
// Default close is 22:30 ET (10:30pm) for BOTH locations. The full-day types are
// the documented exception: their product window is explicitly "5am-11pm access",
// so they close at 23:00 — overridden below so the cap never rejects an otherwise
// valid full day. (Taylors Mill's real close time is TBD with Drew; built on the
// 22:30 default for now.)
// ---------------------------------------------------------------------------
const STUDIO_CLOSE_MINUTES = 22 * 60 + 30; // 1350 = 22:30 ET default close

const TYPE_CLOSE_MINUTES = {
  "89114581": 23 * 60, // PV Full Day — "5am-11pm access" window
  "28312569": 23 * 60  // TM Full Day — full-day access window
};

// Latest END minute (Eastern, minutes-since-midnight) allowed for this type.
function closeMinutesFor(appointmentTypeID) {
  const override = TYPE_CLOSE_MINUTES[String(appointmentTypeID)];
  return override != null ? override : STUDIO_CLOSE_MINUTES;
}

// True when this session's END (start + its full duration) falls after the close
// cap. Mirrors isStartBeforeEarliest: pure, Eastern-local, DST-safe — because
// easternMinutesFromISO reads the wall-clock hour in America/New_York, the EDT/EST
// offset is already baked into the start minutes, so the same wall-clock start
// yields the same result in summer and winter. Unknown-duration types are treated
// as not-after-close (never a false reject).
function isEndAfterClose(appointmentTypeID, iso) {
  const durationMin = TYPE_TO_DURATION[String(appointmentTypeID)];
  if (durationMin == null) return false;
  const endMin = easternMinutesFromISO(iso) + durationMin;
  return endMin > closeMinutesFor(appointmentTypeID);
}

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
  "94823049": { label: "8 Hour Session", cents: 75000 },
  "89114581": { label: "Full Day Session", cents: 98000 },
  "38342199": { label: "1 Hour Session", cents: 11000 },
  "28312352": { label: "2 Hour Session", cents: 17000 },
  "28312534": { label: "3 Hour Session", cents: 23000 },
  "28312549": { label: "Half Day Session", cents: 28000 },
  "36030598": { label: "6 Hour Session", cents: 42000 },
  "28312569": { label: "Full Day Session", cents: 55000 }
};

// ---------------------------------------------------------------------------
// Square Catalog IDs — session items in "Booking Sessions" category
// Coupons scoped to this category apply only to the session, not add-ons.
// These are sandbox IDs — run scripts/square-catalog-setup.js --create
// against production to get production IDs, then set via env var.
// ---------------------------------------------------------------------------
const SQUARE_CATALOG_SANDBOX = {
  "89113040": "VGCZJLPLEAJUTX566UEEE4F3",
  "89113116": "RTHUB45BQHZ2AHPZGVS6G373",
  "89114444": "RVIEPZLDJ3YDLTIXZPIJA4CO",
  "89114517": "DO2VVO55EE5JIWVDVLDYEHME",
  "89114539": "CQUBMEHPZOXZMLIDO6CA5R4A",
  "94823049": "KUWJ3TEUOQWIZTG46Q4TBX7D", // 8h session (V3 item 3). PROD catalog id still TODO — needs prod Square creds; only affects coupon targeting, not charging.
  "89114581": "CIHBY3IG7LAWHFCQZYFTICU7",
  "38342199": "HCML3FUK2CBN2YCA4WJEXRSW",
  "28312352": "3DGAVCMMITO2NFTZD6V6XQNY",
  "28312534": "6JBCZQQRBRC7JYTROP4FBFIS",
  "28312549": "EJUGP6WJRKPWLBOQTI2ZML73",
  "36030598": "TVEHKO634YS3S5Y5G3NZD63U",
  "28312569": "WVGRL35QGU3IUOMYK7CWOQF2"
};

function getSquareCatalogVariationId(appointmentTypeID) {
  var isProd = process.env.SQUARE_ENVIRONMENT === "production";
  if (isProd) {
    // Production catalog IDs stored as JSON env var
    var prodMap = process.env.SQUARE_CATALOG_SESSIONS
      ? JSON.parse(process.env.SQUARE_CATALOG_SESSIONS) : null;
    return prodMap ? prodMap[String(appointmentTypeID)] : null;
  }
  return SQUARE_CATALOG_SANDBOX[String(appointmentTypeID)] || null;
}

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
  "pa-system": { label: "PA System", cents: 4000 },
  "setup-crew": { label: "Event Setup and Reset Crew", cents: 75000 }
};

// ---------------------------------------------------------------------------
// Resilient appointment creation — survive a type that is missing an add-on in
// its Acuity config.
//
// Acuity validates each addonID against the appointment TYPE's allowed add-on
// list (a DASHBOARD setting the public API cannot edit — POST/PUT on
// appointment-types return 403/405). When a type is missing an add-on (e.g. the
// V3 8-hour Powdersville type 94823049 shipped with only the Setup Crew add-on
// attached), POST /appointments fails AFTER payment with:
//   {"error":"invalid_addons_type","message":"The addons \"6840271, ...\" are
//    not valid with this appointment type."}
// and the caller then auto-refunds — so the customer is charged, refunded, and
// left with NO booking (the 2026-07-22 Denise Ko incident).
//
// This helper makes the create resilient: on invalid_addons_type it STRIPS the
// offending add-on IDs, records them (name + qty + price) in the appointment
// notes so the studio still sets them up, and retries ONCE. The customer stays
// charged (the add-ons were paid via Square) and the booking completes. Any
// other error, or a still-failing retry, is rethrown so the caller's
// refund/alert path runs unchanged. This also self-heals any future type/add-on
// config gap without an Acuity dashboard change.
// ---------------------------------------------------------------------------

// Numeric Acuity addon ID -> { label, cents } for readable stripped-addon notes.
const ADDON_ID_TO_INFO = (function () {
  var m = {};
  Object.keys(ACUITY_ADDON_IDS).forEach(function (key) {
    var id = ACUITY_ADDON_IDS[key];
    var price = ADDON_PRICES[key];
    m[id] = { label: price ? price.label : key, cents: price ? price.cents : null };
  });
  // Cleaning fee is a fee, not in ADDON_PRICES.
  if (ACUITY_ADDON_IDS["cleaning-fee"]) {
    m[ACUITY_ADDON_IDS["cleaning-fee"]] = { label: "Cleaning Fee", cents: 15000 };
  }
  return m;
})();

// Extract the numeric addon IDs Acuity flagged as invalid from an error message.
// The message body is JSON with escaped quotes; parse it when possible, else
// fall back to a tolerant regex over the raw text.
function parseInvalidAddonIDs(message) {
  var msg = String(message || "");
  if (msg.indexOf("invalid_addons_type") === -1) return [];
  var ids = [];
  var brace = msg.indexOf("{");
  if (brace !== -1) {
    try {
      var inner = JSON.parse(msg.slice(brace)).message || "";
      var mm = inner.match(/"([0-9][0-9,\s]*)"/);
      if (mm) ids = mm[1].split(",");
    } catch (e) { /* fall through to regex */ }
  }
  if (!ids.length) {
    var mm2 = msg.match(/addons?[\\"\s]+([0-9][0-9,\s]*)/i);
    if (mm2) ids = mm2[1].split(",");
  }
  return ids.map(function (s) { return parseInt(String(s).trim(), 10); })
            .filter(function (n) { return !isNaN(n); });
}

async function createAppointment(payload) {
  try {
    return await acuityPost("/appointments?admin=true", payload);
  } catch (err) {
    var badIds = parseInvalidAddonIDs(err && err.message);
    if (!badIds.length) throw err; // not an addon-type problem — let the caller handle it
    var badSet = {};
    badIds.forEach(function (id) { badSet[id] = true; });

    // Count each stripped add-on (addonIDs may repeat for quantity) for the note.
    var counts = {};
    (payload.addonIDs || []).forEach(function (id) {
      if (badSet[id]) counts[id] = (counts[id] || 0) + 1;
    });
    var lines = Object.keys(counts).map(function (id) {
      var info = ADDON_ID_TO_INFO[id] || { label: "Add-on " + id, cents: null };
      var qty = counts[id];
      var priceStr = info.cents != null ? " ($" + ((info.cents * qty) / 100).toFixed(2) + ")" : "";
      return "  - " + info.label + (qty > 1 ? " x" + qty : "") + priceStr;
    });
    var keptAddons = (payload.addonIDs || []).filter(function (id) { return !badSet[id]; });

    var strippedNote =
      "\n\n[!] ADD-ONS PAID BUT NOT SHOWN AS ACUITY LINE ITEMS (this appointment " +
      "type is missing them in its add-on config). They WERE charged and MUST be " +
      "set up for this booking:\n" + lines.join("\n");

    console.warn("acuity: appointment type rejected add-ons " + JSON.stringify(badIds) +
      " — stripping them into notes and retrying (booking preserved, customer stays charged)");

    var retryPayload = Object.assign({}, payload, {
      addonIDs: keptAddons,
      notes: (payload.notes || "") + strippedNote
    });
    return await acuityPost("/appointments?admin=true", retryPayload);
  }
}


// Build Square line items array from booking state
// Returns [{ name, amount (cents), quantity, catalogObjectId? }]
// Session item includes catalogObjectId so Square coupons can target it
function buildSquareLineItems(appointmentTypeID, addons, location) {
  const items = [];
  const session = SESSION_PRICES[String(appointmentTypeID)];
  if (!session) throw new Error("Unknown appointment type: " + appointmentTypeID);

  var sessionItem = { name: session.label, amount: session.cents, quantity: 1, addonId: null };
  var variationId = getSquareCatalogVariationId(appointmentTypeID);
  if (variationId) sessionItem.catalogObjectId = variationId;
  items.push(sessionItem);

  if (!addons) return items;

  // Lighting
  if (addons.lighting && addons.lighting.selected) {
    var lk = location === "powdersville" ? "lighting-powdersville" : "lighting-taylors-mill";
    items.push({ name: ADDON_PRICES[lk].label, amount: ADDON_PRICES[lk].cents, quantity: 1, addonId: lk });
  }

  // Backdrops
  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") {
      items.push({ name: ADDON_PRICES["backdrops-all"].label, amount: ADDON_PRICES["backdrops-all"].cents, quantity: 1, addonId: "backdrops-all" });
    } else if (addons.backdrops.colors && addons.backdrops.colors.length > 0) {
      items.push({ name: ADDON_PRICES["backdrops-single"].label, amount: ADDON_PRICES["backdrops-single"].cents, quantity: addons.backdrops.colors.length, addonId: "backdrops-single" });
    }
  }

  // Rolling walls
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") {
      items.push({ name: ADDON_PRICES["walls-all"].label, amount: ADDON_PRICES["walls-all"].cents, quantity: 1, addonId: "walls-all" });
    } else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length > 0) {
      items.push({ name: ADDON_PRICES["walls-single"].label, amount: ADDON_PRICES["walls-single"].cents, quantity: addons["rolling-walls"].walls.length, addonId: "walls-single" });
    }
  }

  // Chairs
  if (addons.chairs && addons.chairs.selection) {
    var ck = "chairs-" + addons.chairs.selection;
    if (ADDON_PRICES[ck]) {
      items.push({ name: ADDON_PRICES[ck].label, amount: ADDON_PRICES[ck].cents, quantity: 1, addonId: ck });
    }
  }

  // Tables
  if (addons.tables && addons.tables.quantity > 0) {
    var tq = Math.min(addons.tables.quantity, 10);
    items.push({ name: ADDON_PRICES["table"].label, amount: ADDON_PRICES["table"].cents, quantity: tq, addonId: "table" });
  }

  // TV
  if (addons.tv && addons.tv.selected) {
    items.push({ name: ADDON_PRICES["tv"].label, amount: ADDON_PRICES["tv"].cents, quantity: 1, addonId: "tv" });
  }

  // PA
  if (addons["pa-system"] && addons["pa-system"].selected) {
    items.push({ name: ADDON_PRICES["pa-system"].label, amount: ADDON_PRICES["pa-system"].cents, quantity: 1, addonId: "pa-system" });
  }

  // Event Setup and Reset Crew (PV events only) — flat once-per-event
  if (addons["setup-crew"] && addons["setup-crew"].selected) {
    items.push({ name: ADDON_PRICES["setup-crew"].label, amount: ADDON_PRICES["setup-crew"].cents, quantity: 1, addonId: "setup-crew" });
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
  createAppointment,
  parseInvalidAddonIDs,
  acuityPut,
  acuityDelete,
  rescheduleAppointment,
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
  SESSION_PRICES,
  ADDON_PRICES,
  TYPE_EARLIEST_START_MINUTES,
  easternMinutesFromISO,
  isStartBeforeEarliest,
  STUDIO_CLOSE_MINUTES,
  TYPE_CLOSE_MINUTES,
  closeMinutesFor,
  isEndAfterClose,
  signState,
  verifyAndDecodeState
};
