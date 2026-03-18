// GET /api/availability-dates?appointmentTypeID=X&month=YYYY-MM
//
// Proxies Acuity GET /availability/dates because Acuity does not support
// CORS — all API calls must go through a server-side proxy.
// Docs: https://developers.acuityscheduling.com/reference/get-availability-dates

const { acuityGet, isValidAppointmentTypeID } = require("./_lib/acuity");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { appointmentTypeID, month } = req.query;

  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month format (expected YYYY-MM)" });
  }

  try {
    const params = {
      appointmentTypeID,
      month,
      timezone: "America/New_York" // Both locations are in Eastern time
    };

    const data = await acuityGet("/availability/dates", params);

    // Acuity returns [{ date: "2026-03-17" }, ...]
    const dates = (data || []).map((d) => d.date);

    // Cache briefly — availability changes as bookings come in
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ dates });
  } catch (err) {
    console.error("availability-dates error:", err.message);
    return res.status(502).json({ error: "Unable to load availability" });
  }
};
