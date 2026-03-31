// POST /api/qbo-mark-paid
// Called from the confirmation page to mark the QBO invoice as paid.
// Separate function invocation so it has its own lifecycle and won't get killed.

const { markInvoicePaid } = require("./_lib/quickbooks");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var { firstName, lastName } = req.body || {};
  if (!firstName) {
    return res.status(400).json({ error: "Missing firstName" });
  }

  try {
    var payment = await markInvoicePaid({ contact: { firstName: firstName, lastName: lastName || "" } });
    if (payment) {
      return res.status(200).json({ status: "paid", paymentId: payment.Id });
    } else {
      return res.status(200).json({ status: "not_found", message: "No unpaid invoice found" });
    }
  } catch (err) {
    console.error("qbo-mark-paid error:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
