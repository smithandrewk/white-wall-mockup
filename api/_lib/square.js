// Square API helpers — raw fetch, no SDK (avoids BigInt serialization on Vercel)
// Docs: https://developer.squareup.com/docs/checkout-api/payment-links
//
// Environment switching:
//   Sandbox:    https://connect.squareupsandbox.com
//   Production: https://connect.squareup.com

const crypto = require("crypto");

const SQUARE_VERSION = "2026-01-22";

function getBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getAccessToken() {
  var isProd = process.env.SQUARE_ENVIRONMENT === "production";
  var token = isProd
    ? (process.env.SQUARE_PROD_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN)
    : (process.env.SQUARE_SANDBOX_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN);
  if (!token) throw new Error("Missing Square access token for " + (isProd ? "production" : "sandbox"));
  return token;
}

function getLocationId() {
  var isProd = process.env.SQUARE_ENVIRONMENT === "production";
  var id = isProd
    ? (process.env.SQUARE_PROD_LOCATION_ID || process.env.SQUARE_LOCATION_ID)
    : (process.env.SQUARE_SANDBOX_LOCATION_ID || process.env.SQUARE_LOCATION_ID);
  if (!id) throw new Error("Missing Square location ID for " + (isProd ? "production" : "sandbox"));
  return id;
}

function getHeaders() {
  return {
    "Authorization": "Bearer " + getAccessToken(),
    "Content-Type": "application/json",
    "Square-Version": SQUARE_VERSION
  };
}

// Create a Square Payment Link with itemized line items
// lineItems: [{ name, amount (cents), quantity }]
// redirectUrl: where Square sends the customer after payment
// buyerEmail: optional, pre-fills email on checkout page
async function createPaymentLink(lineItems, redirectUrl, buyerEmail) {
  const locationId = getLocationId();

  const orderLineItems = lineItems.map(function (item) {
    // If item has a catalog variation ID, use it so Square coupons can target it
    if (item.catalogObjectId) {
      return {
        catalog_object_id: item.catalogObjectId,
        quantity: String(item.quantity)
      };
    }
    return {
      name: item.name,
      quantity: String(item.quantity),
      base_price_money: {
        amount: item.amount,
        currency: "USD"
      }
    };
  });

  const body = {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: locationId,
      line_items: orderLineItems
    },
    checkout_options: {
      redirect_url: redirectUrl
    }
  };

  if (buyerEmail) {
    body.pre_populated_data = { buyer_email: buyerEmail };
  }

  const res = await fetch(getBaseUrl() + "/v2/online-checkout/payment-links", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square " + res.status + ": " + msg);
  }

  return {
    checkoutUrl: data.payment_link.url,
    orderId: data.payment_link.order_id,
    paymentLinkId: data.payment_link.id
  };
}

// Verify an order is COMPLETED (paid)
async function getOrder(orderId) {
  const res = await fetch(getBaseUrl() + "/v2/orders/" + orderId, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error("Square order lookup failed: " + res.status);
  }
  return data.order;
}

// Delete a payment link (invalidates it — customer can no longer pay)
// Also sets the associated order to CANCELED
async function deletePaymentLink(paymentLinkId) {
  const res = await fetch(getBaseUrl() + "/v2/online-checkout/payment-links/" + paymentLinkId, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Square delete payment link failed: " + res.status + " " + text);
  }
}

// Refund a payment (for slot-conflict-after-payment edge case)
async function refundPayment(paymentId, amountCents, reason) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    payment_id: paymentId,
    amount_money: {
      amount: amountCents,
      currency: "USD"
    },
    reason: reason || "Booking conflict — automatic refund"
  };

  const res = await fetch(getBaseUrl() + "/v2/refunds", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square refund failed: " + res.status + ": " + msg);
  }
  return data.refund;
}

// ---------------------------------------------------------------------------
// Card-on-file flow (Web Payments SDK). The hosted Payment Link checkout
// cannot save a card; this set of helpers replaces it.
//   findOrCreateCustomer -> createPayment -> createCardOnFile
// chargeCardOnFile is the future merchant-initiated (MIT) charge used to
// bill damage / late-exit / unauthorized-add-on fees after the session.
// ---------------------------------------------------------------------------

// Find a Square customer by exact email, or create one. Square does not
// guarantee email uniqueness, so we take the first exact match if any.
async function findOrCreateCustomer(opts) {
  const email = opts.email;
  const searchRes = await fetch(getBaseUrl() + "/v2/customers/search", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      query: { filter: { email_address: { exact: email } } },
      limit: 1
    })
  });
  const searchData = await searchRes.json();
  if (searchRes.ok && searchData.customers && searchData.customers.length > 0) {
    return searchData.customers[0].id;
  }

  const createRes = await fetch(getBaseUrl() + "/v2/customers", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: opts.firstName || "",
      family_name: opts.lastName || "",
      email_address: email,
      phone_number: opts.phone || undefined
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    const msg = createData.errors ? createData.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square createCustomer " + createRes.status + ": " + msg);
  }
  return createData.customer.id;
}

// Charge the tokenized card (customer-initiated). The SCA / 3DS result is
// already baked into sourceId by the client-side tokenize() call.
async function createPayment(opts) {
  const body = {
    idempotency_key: opts.idempotencyKey || crypto.randomUUID(),
    source_id: opts.sourceId,
    customer_id: opts.customerId,
    location_id: getLocationId(),
    amount_money: { amount: opts.amountCents, currency: "USD" },
    autocomplete: true
  };
  if (opts.note) body.note = opts.note;

  const res = await fetch(getBaseUrl() + "/v2/payments", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square createPayment " + res.status + ": " + msg);
  }
  return data.payment;
}

// Save the just-charged card on file. Square performs a $0 verification
// on CreateCard. source_id is the payment.id from createPayment().
async function createCardOnFile(opts) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    source_id: opts.paymentId,
    card: {
      customer_id: opts.customerId
    }
  };
  if (opts.cardholderName) body.card.cardholder_name = opts.cardholderName;

  const res = await fetch(getBaseUrl() + "/v2/cards", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square createCard " + res.status + ": " + msg);
  }
  return data.card;
}

// Charge a saved card later (merchant-initiated, customer absent). Used
// for post-session damage / late-exit / unauthorized-add-on fees. Not
// surfaced in any UI yet — Drew uses the Square Dashboard until an admin
// page exists. Built here so the capability is ready and tested.
async function chargeCardOnFile(opts) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    source_id: opts.cardId,
    customer_id: opts.customerId,
    location_id: getLocationId(),
    amount_money: { amount: opts.amountCents, currency: "USD" },
    autocomplete: true,
    customer_initiated: false
  };
  if (opts.note) body.note = opts.note;

  const res = await fetch(getBaseUrl() + "/v2/payments", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(function (e) { return e.detail; }).join(", ") : "Unknown error";
    throw new Error("Square chargeCardOnFile " + res.status + ": " + msg);
  }
  return data.payment;
}

module.exports = {
  createPaymentLink,
  getOrder,
  deletePaymentLink,
  refundPayment,
  findOrCreateCustomer,
  createPayment,
  createCardOnFile,
  chargeCardOnFile
};
