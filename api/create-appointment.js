// POST /api/create-appointment
//
// Creates an unpaid Acuity appointment with all booking data pre-filled,
// then returns the confirmationPagePaymentLink for the customer to pay
// through Acuity's built-in Square checkout.
//
// Flow:
//   1. Client calls verify-availability first (separate endpoint)
//   2. Client calls this endpoint with full booking state
//   3. We create the appointment in Acuity with noPayment: true
//   4. We return the payment URL
//   5. Client redirects to Acuity's Square payment page
//   6. Acuity handles payment, confirmation email, and marking as paid
//
// Note: PUT /appointments CANNOT update price or addonIDs after creation.
// The appointment must be created with the correct add-ons from the start.

const {
  acuityPost,
  isValidAppointmentTypeID,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes
} = require("./_lib/acuity");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const {
    appointmentTypeID,
    datetime,
    location,
    contact,
    intake,
    addons,
    eventIntent,
    participants,
    eventDescription,
    waiverSigned
  } = body;

  // Validate required fields
  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }
  if (!datetime) {
    return res.status(400).json({ error: "Missing datetime" });
  }
  if (!location || !["powdersville", "taylors-mill"].includes(location)) {
    return res.status(400).json({ error: "Invalid location" });
  }
  if (!contact || !contact.firstName || !contact.email) {
    return res.status(400).json({ error: "Missing contact info" });
  }
  if (!waiverSigned) {
    return res.status(400).json({ error: "Waiver must be signed" });
  }

  try {
    const addonIDs = buildAcuityAddonIDs(addons, location);
    const fields = buildAcuityFields(intake || {}, location);
    const notes = buildAppointmentNotes({
      eventIntent,
      participants,
      eventDescription,
      addons
    });

    const appointment = await acuityPost("/appointments", {
      appointmentTypeID,
      datetime,
      firstName: contact.firstName,
      lastName: contact.lastName || "",
      email: contact.email,
      phone: contact.phone || "",
      addonIDs,
      fields,
      notes,
      noPayment: true  // Undocumented — see api/_lib/acuity.js header notes
    });

    // confirmationPagePaymentLink is undocumented but present on every
    // appointment object — see api/_lib/acuity.js header notes
    if (!appointment.confirmationPagePaymentLink) {
      console.error("create-appointment: no payment link returned", appointment.id);
      return res.status(500).json({ error: "Appointment created but no payment link returned" });
    }

    return res.status(200).json({
      paymentUrl: appointment.confirmationPagePaymentLink,
      appointmentId: appointment.id
    });
  } catch (err) {
    console.error("create-appointment error:", err.message);
    return res.status(500).json({ error: "Failed to create appointment" });
  }
};
