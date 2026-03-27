// GET /api/qbo-test
// Read-only test endpoint — fetches the most recent invoice from QuickBooks.
// Safe to call — does NOT modify any data.

const { findInvoice, refreshAccessToken } = require("./_lib/quickbooks");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Force a token refresh first to ensure we have a valid token
    await refreshAccessToken();

    // Test the connection by querying recent invoices
    var invoice = await findInvoice("", "");

    if (!invoice) {
      return res.status(200).json({
        status: "connected",
        message: "QuickBooks API working. No unpaid invoices found."
      });
    }

    return res.status(200).json({
      status: "connected",
      message: "QuickBooks API working. Most recent unpaid invoice:",
      invoice: {
        id: invoice.Id,
        customerName: invoice.CustomerRef && invoice.CustomerRef.name,
        total: invoice.TotalAmt,
        balance: invoice.Balance,
        created: invoice.MetaData && invoice.MetaData.CreateTime
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
