// POST /api/verify-availability
// Body: { appointmentTypeID, datetime }
//
// Pre-checkout slot check — confirms the selected time is still available
// right before we create the appointment. Minimizes the window for double-booking.
//
// Uses the same Acuity GET /availability/times endpoint and checks if the
// exact datetime is still in the list.

const { acuityGet, isValidAppointmentTypeID } = require("./_lib/acuity");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { appointmentTypeID, datetime } = req.body || {};

  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }

  if (!datetime) {
    return res.status(400).json({ error: "Missing datetime" });
  }

  try {
    // Extract date from ISO datetime (e.g. "2026-03-17T09:00:00-0400" → "2026-03-17")
    const date = datetime.slice(0, 10);
    const data = await acuityGet("/availability/times", {
      appointmentTypeID,
      date,
      timezone: "America/New_York"
    });

    const available = (data || []).some((t) => t.time === datetime);
    return res.status(200).json({ available });
  } catch (err) {
    console.error("verify-availability error:", err.message);
    return res.status(502).json({ error: "Unable to verify availability" });
  }
};
