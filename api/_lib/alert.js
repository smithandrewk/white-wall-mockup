// Internal module — sends alert emails for critical booking system failures.
// Modeled on notify-owner.js. Uses Resend API (raw fetch).
//
// Env vars: RESEND_API_KEY, ALERT_EMAILS (comma-separated recipients)
//
// Severity levels:
//   CRITICAL — requires immediate action (e.g., refund needed)
//   ALERT    — something failed but no money involved
//   WARNING  — degraded functionality, non-blocking

async function alertFailure(severity, subject, details) {
  var apiKey = process.env.RESEND_API_KEY;
  var alertEmails = process.env.ALERT_EMAILS;
  if (!apiKey || !alertEmails) {
    console.warn("alert: RESEND_API_KEY or ALERT_EMAILS not set, skipping");
    return;
  }

  var recipients = alertEmails.split(",").map(function (e) { return e.trim(); }).filter(Boolean);
  if (recipients.length === 0) return;

  var env = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
  var fullSubject = "[WhiteWall " + severity.toUpperCase() + "] " + subject;

  var lines = [
    severity.toUpperCase() + ": " + subject,
    "",
    "Time: " + new Date().toISOString(),
    "Environment: " + env,
    ""
  ];

  if (details) {
    lines.push("Details:");
    Object.keys(details).forEach(function (key) {
      lines.push("  " + key + ": " + (details[key] != null ? details[key] : "(none)"));
    });
    lines.push("");
  }

  if (severity.toLowerCase() === "critical") {
    lines.push("ACTION REQUIRED — see details above.");
  }

  var body = lines.join("\n");

  try {
    var res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "WhiteWall Alerts <contact@whitewallstudios.co>",
        to: recipients,
        subject: fullSubject,
        text: body
      })
    });

    if (!res.ok) {
      var errText = await res.text();
      console.error("alert: Resend API error", res.status, errText);
    }
  } catch (err) {
    console.error("alert: failed to send", err.message);
  }
}

module.exports = { alertFailure };
