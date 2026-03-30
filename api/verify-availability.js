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

    // PV full day: we hardcode 5 AM on the client, which may not match any
    // Acuity time slot. Check date-level availability instead (any slot open
    // for this 18-hour type means the day is free).
    const PV_FULL_DAY_TYPE = "89114581";
    if (String(appointmentTypeID) === PV_FULL_DAY_TYPE) {
      const dates = await acuityGet("/availability/dates", {
        appointmentTypeID,
        month: date.slice(0, 7),
        timezone: "America/New_York"
      });
      const available = (dates || []).some((d) => d.date === date);
      return res.status(200).json({ available });
    }

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
