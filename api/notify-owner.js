// Internal module — sends email to Drew for high-traffic bookings.
// Called from booking-callback.js, not exposed as an endpoint.
//
// Uses Resend API (raw fetch, no SDK needed).
// Env vars: RESEND_API_KEY, NOTIFICATION_EMAIL

async function notifyOwner(bookingState, appointmentId) {
  var apiKey = process.env.RESEND_API_KEY;
  var toEmail = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !toEmail) {
    console.warn("notify-owner: RESEND_API_KEY or NOTIFICATION_EMAIL not set, skipping");
    return;
  }

  var participants = Number(bookingState.participants) || 0;
  if (participants < 35) return; // Only notify for high-traffic bookings

  var isCapacityAlert = participants >= 50;
  var subject = isCapacityAlert
    ? "[White Wall] CAPACITY ALERT — " + participants + " participants"
    : "[White Wall] High Traffic Booking — " + participants + " participants";

  var contact = bookingState.contact || {};
  var locationName = bookingState.location === "powdersville" ? "Powdersville" : "Taylor's Mill";
  var highTrafficNote = bookingState.highTrafficNote || bookingState.tmHighTrafficNote || "(none provided)";

  var body = [
    isCapacityAlert ? "CAPACITY ALERT — FOLLOW-UP REQUIRED" : "High Traffic Booking",
    "",
    "Customer: " + (contact.firstName || "") + " " + (contact.lastName || ""),
    "Email: " + (contact.email || ""),
    "Phone: " + (contact.phone || ""),
    "Location: " + locationName,
    "Date/Time: " + (bookingState.datetime || ""),
    "Participants: " + participants,
    "Appointment ID: " + (appointmentId || ""),
    "",
    "Customer's note:",
    highTrafficNote,
    "",
    isCapacityAlert
      ? "This booking has 50+ participants and requires follow-up."
      : "This booking has 35+ participants. A cleaning fee may apply."
  ].join("\n");

  try {
    var res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "WhiteWall Studios <contact@whitewallstudios.co>",
        to: [toEmail],
        subject: subject,
        text: body
      })
    });

    if (!res.ok) {
      var errText = await res.text();
      console.error("notify-owner: Resend API error", res.status, errText);
    }
  } catch (err) {
    // Don't let notification failure affect the booking flow
    console.error("notify-owner: failed to send", err.message);
  }
}

module.exports = { notifyOwner };
