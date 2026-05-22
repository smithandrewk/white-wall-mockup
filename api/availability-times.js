// GET /api/availability-times?appointmentTypeID=X&date=YYYY-MM-DD
//
// Proxies Acuity GET /availability/times because Acuity does not support
// CORS — all API calls must go through a server-side proxy.
// Docs: https://developers.acuityscheduling.com/reference/get-availability-times

const { acuityGet, isValidAppointmentTypeID, TYPE_TO_CALENDAR } = require("./_lib/acuity");
const { stagingCalendarID } = require("./_lib/env");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { appointmentTypeID, date } = req.query;

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
    const times = (data || []).map((t) => ({ time: t.time }));

    // Shorter cache than dates — time slots are more volatile
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ times });
  } catch (err) {
    console.error("availability-times error:", err.message);
    return res.status(502).json({ error: "Unable to load time slots" });
  }
};
