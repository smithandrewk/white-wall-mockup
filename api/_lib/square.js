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

function getHeaders() {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN");
  }
  return {
    "Authorization": "Bearer " + process.env.SQUARE_ACCESS_TOKEN,
    "Content-Type": "application/json",
    "Square-Version": SQUARE_VERSION
  };
}

// Create a Square Payment Link with itemized line items
// lineItems: [{ name, amount (cents), quantity }]
// redirectUrl: where Square sends the customer after payment
// buyerEmail: optional, pre-fills email on checkout page
async function createPaymentLink(lineItems, redirectUrl, buyerEmail) {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) throw new Error("Missing SQUARE_LOCATION_ID");

  const orderLineItems = lineItems.map(function (item) {
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

module.exports = {
  createPaymentLink,
  getOrder,
  deletePaymentLink,
  refundPayment
};
