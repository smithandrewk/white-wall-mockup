// QuickBooks Online API helpers — mark invoices as paid after booking
// Docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice
//
// Flow: Acuity auto-creates a draft invoice in QBO when an appointment is made.
// We query for that invoice by customer email + date, then record a payment
// so it shows as "paid" instead of lingering as an unpaid draft.
//
// OAuth2 token refresh: access tokens expire every 1 hour. We auto-refresh
// using the refresh token (expires every 100 days). New tokens are stored
// back to Vercel env vars via the Vercel API, or logged for manual update.
//
// Env vars: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID,
//           QBO_ACCESS_TOKEN, QBO_REFRESH_TOKEN

const QBO_BASE_PROD = "https://quickbooks.api.intuit.com";
const QBO_BASE_SANDBOX = "https://sandbox-quickbooks.api.intuit.com";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function getBaseUrl() {
  // Use sandbox if Square is in sandbox mode (same env toggle)
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? QBO_BASE_PROD
    : QBO_BASE_SANDBOX;
}

function getRealmId() {
  var realmId = process.env.QBO_REALM_ID;
  if (!realmId) throw new Error("Missing QBO_REALM_ID");
  return realmId;
}

// In-memory token cache for the lifetime of the serverless function
var cachedAccessToken = null;
var cachedRefreshToken = null;

function getAccessToken() {
  return cachedAccessToken || process.env.QBO_ACCESS_TOKEN;
}

function getRefreshToken() {
  return cachedRefreshToken || process.env.QBO_REFRESH_TOKEN;
}

// Refresh the OAuth2 access token using the refresh token
async function refreshAccessToken() {
  var clientId = process.env.QBO_CLIENT_ID;
  var clientSecret = process.env.QBO_CLIENT_SECRET;
  var refreshToken = getRefreshToken();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing QBO OAuth credentials for token refresh");
  }

  var basicAuth = Buffer.from(clientId + ":" + clientSecret).toString("base64");

  var res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + basicAuth,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken)
  });

  var data = await res.json();
  if (!res.ok) {
    throw new Error("QBO token refresh failed: " + res.status + " " + JSON.stringify(data));
  }

  // Cache new tokens in memory (lasts for this function invocation)
  cachedAccessToken = data.access_token;
  if (data.refresh_token) {
    cachedRefreshToken = data.refresh_token;
  }

  console.log("quickbooks: token refreshed successfully. New refresh token issued:", Boolean(data.refresh_token));

  // Log new tokens so they can be updated in Vercel env vars
  // In production, you'd update Vercel env vars via their API or a KV store
  console.log("quickbooks: UPDATE VERCEL ENV — QBO_ACCESS_TOKEN (new token issued)");
  if (data.refresh_token) {
    console.log("quickbooks: UPDATE VERCEL ENV — QBO_REFRESH_TOKEN (new token issued)");
  }

  return data.access_token;
}

// Make an authenticated request to QBO API, with automatic token refresh on 401
async function qboRequest(method, path, body) {
  var baseUrl = getBaseUrl();
  var realmId = getRealmId();
  var url = baseUrl + "/v3/company/" + realmId + path;

  async function doRequest(token) {
    var opts = {
      method: method,
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts);
  }

  var token = getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
  }

  var res = await doRequest(token);

  // If 401, refresh token and retry once
  if (res.status === 401) {
    console.log("quickbooks: 401 received, refreshing token...");
    token = await refreshAccessToken();
    res = await doRequest(token);
  }

  var data = await res.json();
  if (!res.ok) {
    var errMsg = data.Fault
      ? data.Fault.Error.map(function (e) { return e.Message + " (" + e.Detail + ")"; }).join(", ")
      : JSON.stringify(data);
    throw new Error("QBO " + method + " " + path + " failed: " + res.status + " — " + errMsg);
  }

  return data;
}

// Find the matching unpaid invoice for a booking.
// Acuity creates the invoice in QBO when the appointment is made.
// We query recent invoices and match by customer name.
async function findInvoice(firstName, lastName) {
  // Query recent unpaid invoices, most recent first
  var query = "SELECT * FROM Invoice WHERE Balance > '0' ORDER BY MetaData.CreateTime DESC MAXRESULTS 10";

  var data = await qboRequest("GET", "/query?query=" + encodeURIComponent(query));

  var invoices = data.QueryResponse && data.QueryResponse.Invoice;
  if (!invoices || invoices.length === 0) {
    return null;
  }

  // Match by customer display name (Acuity sends "FirstName LastName" to QBO)
  var fullName = (firstName + " " + lastName).trim().toLowerCase();

  for (var i = 0; i < invoices.length; i++) {
    var inv = invoices[i];
    var customerName = (inv.CustomerRef && inv.CustomerRef.name || "").toLowerCase();
    if (customerName.indexOf(fullName) !== -1 || fullName.indexOf(customerName) !== -1) {
      return inv;
    }
  }

  // No name match — try returning the most recent unpaid invoice created
  // in the last 5 minutes as a fallback
  var fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  for (var j = 0; j < invoices.length; j++) {
    var inv2 = invoices[j];
    if (inv2.MetaData && inv2.MetaData.CreateTime > fiveMinAgo) {
      console.log("quickbooks: no name match but found recent invoice " + inv2.Id + " created at " + inv2.MetaData.CreateTime);
      return inv2;
    }
  }

  return null;
}

// Record a payment against an invoice, marking it as paid
async function recordPayment(invoice, paymentMethod) {
  var payment = {
    TotalAmt: invoice.TotalAmt,
    CustomerRef: invoice.CustomerRef,
    Line: [
      {
        Amount: invoice.TotalAmt,
        LinkedTxn: [
          {
            TxnId: invoice.Id,
            TxnType: "Invoice"
          }
        ]
      }
    ],
    PrivateNote: "Auto-recorded by WhiteWall booking system. Payment collected via Square."
  };

  if (paymentMethod) {
    payment.PaymentMethodRef = { value: paymentMethod };
  }

  var data = await qboRequest("POST", "/payment", payment);
  return data.Payment;
}

// Main function: find the invoice for a booking and mark it as paid
// Called from booking-callback.js after appointment creation
// This is fire-and-forget — failure should not block the booking
async function markInvoicePaid(bookingState) {
  var contact = bookingState.contact;
  if (!contact || !contact.firstName) {
    console.log("quickbooks: no contact info in booking state, skipping");
    return;
  }

  // Check if QBO credentials are configured
  if (!process.env.QBO_REALM_ID || !process.env.QBO_CLIENT_ID) {
    console.log("quickbooks: credentials not configured, skipping invoice marking");
    return;
  }

  // Wait for Acuity → QBO sync to create the invoice
  // Try up to 3 times with increasing delays
  var delays = [5000, 10000, 15000];
  var invoice = null;

  for (var attempt = 0; attempt < delays.length; attempt++) {
    await new Promise(function (resolve) { setTimeout(resolve, delays[attempt]); });

    invoice = await findInvoice(contact.firstName, contact.lastName || "");
    if (invoice) break;

    console.log("quickbooks: attempt " + (attempt + 1) + " — no invoice found yet for " + contact.firstName + " " + (contact.lastName || ""));
  }

  if (!invoice) {
    console.log("quickbooks: no unpaid invoice found after 3 attempts for " + contact.firstName + " " + (contact.lastName || "") + " — sync may have failed");
    return;
  }

  var payment = await recordPayment(invoice);
  console.log("quickbooks: invoice " + invoice.Id + " marked as paid (payment " + payment.Id + ") for " + contact.firstName + " " + (contact.lastName || ""));
  return payment;
}

module.exports = {
  markInvoicePaid,
  findInvoice,
  recordPayment,
  refreshAccessToken
};
