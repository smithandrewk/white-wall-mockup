// GET /api/availability-times?appointmentTypeID=X&date=YYYY-MM-DD
//
// Proxies Acuity GET /availability/times because Acuity does not support
// CORS — all API calls must go through a server-side proxy.
// Docs: https://developers.acuityscheduling.com/reference/get-availability-times

const { acuityGet, isValidAppointmentTypeID, TYPE_TO_CALENDAR, isStartBeforeEarliest } = require("./_lib/acuity");
const { stagingCalendarID } = require("./_lib/env");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { appointmentTypeID, date, earlyStartOverride } = req.query;

  // DREW-93: the dashboard Session Builder passes earlyStartOverride=1 when the
  // owner has toggled the 8-Hour Override on, so the picker can show the
  // pre-floor slots. This ONLY affects which slots are DISPLAYED — the booking
  // itself is hard-gated by the HMAC-signed offer at create-checkout, so a
  // hand-crafted param here cannot book an early 8h start (verify + create-checkout
  // still reject an early start unless it rides a signed offer with the flag).
  // The customer site never sends this param (the button is builder-only).
  const skipEarliestFloor = earlyStartOverride === "1" || earlyStartOverride === "true";

  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format (expected YYYY-MM-DD)" });
  }

  try {
    // ALWAYS pass calendarID — see availability-dates.js for the why.
    const params = {
      appointmentTypeID,
      date,
      calendarID: stagingCalendarID() || TYPE_TO_CALENDAR[appointmentTypeID],
      timezone: "America/New_York"
    };

    const data = await acuityGet("/availability/times", params);

    // Acuity returns [{ time: "2026-03-17T09:00:00-0400", slotsAvailable: 1 }, ...]
    // Earliest-start floor (e.g. 8h Flagship is 12:30pm ET): Acuity can't enforce
    // a per-type earliest time, so drop any slot before the floor here. (No studio
    // close cap — Drew 2026-06-25: neither studio closes at 10:30pm; that cap is
    // ONLY a multi-day pre-event-day BILLING rule, handled in the cart, not a
    // global availability filter. A solo late booking is fine.)
    const times = (data || [])
      .filter((t) => skipEarliestFloor || !isStartBeforeEarliest(appointmentTypeID, t.time))
      .map((t) => ({ time: t.time }));

    // Shorter cache than dates — time slots are more volatile
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ times });
  } catch (err) {
    console.error("availability-times error:", err.message);
    return res.status(502).json({ error: "Unable to load time slots" });
  }
};
