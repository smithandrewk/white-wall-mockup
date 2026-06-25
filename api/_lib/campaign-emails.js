// api/_lib/campaign-emails.js — V3 item 6 customer email templates (DARK surface).
//
// PURE template builders: no IO, no env reads, no Resend, no DB. Each builder
// takes a plain context object and returns { subject, html, text }. The unified
// dispatcher (api/_lib/scheduler-dispatch.js) and the send helper
// (api/_lib/campaign-send.js) own WHEN/WHETHER a template is actually delivered;
// this module only owns the words and markup. Building a template sends nothing.
//
// Two families:
//   1. The 4-touch ADD-ON campaign (buildCampaignTouch / touch_no 1..4) — the
//      upsell emails that drive the recipient to the tokenized add-on menu
//      (/addon-menu?token=...), where one click adds an add-on + charges the card
//      on file. Touch cadence comes from api/_lib/campaign-schedule.js.
//   2. The deposit / balance REMINDER (buildBalanceReminder) — the every-6h
//      "settle your balance / update your card" chase that runs after the 48h
//      auto-charge could not collect.
//
// Style mirrors api/notify-owner.js buildEmailBody (a plain-text body is always
// produced) but these are customer-facing HTML emails, so a simple inline-styled
// responsive layout wraps each. No dash characters are used as sentence
// punctuation in customer copy (house rule).

"use strict";

// ---------------------------------------------------------------------------
// formatting helpers (pure)
// ---------------------------------------------------------------------------
function fmtMoney(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

function fmtDateTime(iso) {
  if (!iso) return "your session";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch (e) {
    return String(iso);
  }
}

function locationLabel(slug) {
  if (slug === "powdersville") return "Flagship Location (Powdersville)";
  if (slug === "taylors-mill") return "Taylor's Mill";
  return "White Wall Studios";
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Public so callers (dispatcher / email links) build the same tokenized URL.
function buildAddonMenuUrl(baseUrl, token) {
  var base = (baseUrl || "https://whitewallstudios.co").replace(/\/+$/, "");
  return base + "/addon-menu?token=" + encodeURIComponent(token || "");
}

function buildAccountUrl(baseUrl) {
  var base = (baseUrl || "https://whitewallstudios.co").replace(/\/+$/, "");
  return base + "/account";
}

// ---------------------------------------------------------------------------
// shared HTML layout (pure)
// ---------------------------------------------------------------------------
function renderLayout(opts) {
  var preheader = esc(opts.preheader || "");
  var inner = opts.bodyHtml || "";
  var footerNote = opts.footerNote
    ? '<p style="margin:16px 0 0;color:#9aa0a6;font-size:12px;line-height:18px;">' + opts.footerNote + "</p>"
    : "";
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "</head>" +
    '<body style="margin:0;padding:0;background:#f4f4f5;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + preheader + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">' +
    '<tr><td align="center" style="padding:24px 12px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;' +
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;">' +
    '<tr><td style="background:#111111;padding:20px 28px;">' +
    '<span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.4px;">White Wall Studios</span>' +
    "</td></tr>" +
    '<tr><td style="padding:28px;color:#1f2328;font-size:15px;line-height:23px;">' +
    inner +
    footerNote +
    "</td></tr>" +
    '<tr><td style="padding:18px 28px;background:#fafafa;color:#9aa0a6;font-size:12px;line-height:18px;">' +
    "White Wall Studios, Greenville SC. " +
    "Questions? Reply to this email or text (803) 873-8153." +
    "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

function button(label, href) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;">' +
    '<tr><td style="border-radius:8px;background:#111111;">' +
    '<a href="' + esc(href) + '" ' +
    'style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;' +
    'font-size:15px;font-weight:600;border-radius:8px;">' + esc(label) + "</a>" +
    "</td></tr></table>"
  );
}

// ---------------------------------------------------------------------------
// 4-touch add-on campaign copy (pure). Keyed by touch_no 1..4.
// ---------------------------------------------------------------------------
var TOUCH_COPY = {
  1: {
    subject: "Make your White Wall session unforgettable",
    preheader: "Add lighting, backdrops, and more in one click.",
    heading: "Your session is booked.",
    lead:
      "Thanks for booking with White Wall Studios. While you plan, take a look at the " +
      "add-ons that make a shoot or event come together. You can add any of them to " +
      "your booking in one click, and the card on file covers it automatically.",
    cta: "View add-ons"
  },
  2: {
    subject: "Still time to add to your White Wall session",
    preheader: "Lighting, backdrops, rolling walls, TV, PA, and more.",
    heading: "Planning ahead?",
    lead:
      "Your session is on the calendar. If you are thinking about lighting, extra " +
      "backdrops, a TV, or a PA system, now is a great time to lock them in so your " +
      "setup is ready the moment you arrive.",
    cta: "Browse add-ons"
  },
  3: {
    subject: "One week to go, lock in your add-ons",
    preheader: "A few days left to add to your booking.",
    heading: "Just over a week away.",
    lead:
      "Your White Wall session is coming up soon. Adding gear now means it is staged " +
      "and waiting for you. One click adds it to your booking and charges the card on " +
      "file, no checkout needed.",
    cta: "Add to my booking"
  },
  4: {
    subject: "Tomorrow is the day, last call for add-ons",
    preheader: "Final chance to add gear to your session.",
    heading: "See you tomorrow.",
    lead:
      "Your session is almost here. If you still want lighting, backdrops, a TV, or a " +
      "PA system, this is the last call to add them. One click and we will have it " +
      "ready for you.",
    cta: "Add before my session"
  }
};

// buildCampaignTouch(touchNo, ctx) -> { subject, html, text }
//   ctx: { firstName, sessionLabel, startsAt, location, baseUrl, token,
//          addonMenuUrl?, subjectPrefix? }
function buildCampaignTouch(touchNo, ctx) {
  ctx = ctx || {};
  var copy = TOUCH_COPY[touchNo];
  if (!copy) throw new Error("campaign-emails: unknown touch_no " + touchNo);

  var first = ctx.firstName ? String(ctx.firstName).trim() : "there";
  var when = fmtDateTime(ctx.startsAt);
  var session = ctx.sessionLabel || "your session";
  var loc = locationLabel(ctx.location);
  var menuUrl = ctx.addonMenuUrl || buildAddonMenuUrl(ctx.baseUrl, ctx.token);

  var detailHtml =
    '<p style="margin:0 0 6px;color:#5f6368;font-size:13px;">YOUR SESSION</p>' +
    '<p style="margin:0;font-weight:600;">' + esc(session) + "</p>" +
    '<p style="margin:2px 0 0;color:#5f6368;">' + esc(loc) + "</p>" +
    '<p style="margin:2px 0 0;color:#5f6368;">' + esc(when) + "</p>";

  var bodyHtml =
    '<p style="margin:0 0 14px;font-size:18px;font-weight:600;">' + esc(copy.heading) + "</p>" +
    '<p style="margin:0 0 8px;">Hi ' + esc(first) + ",</p>" +
    '<p style="margin:0 0 16px;">' + esc(copy.lead) + "</p>" +
    '<div style="margin:18px 0;padding:14px 16px;background:#fafafa;border-radius:10px;">' +
    detailHtml + "</div>" +
    button(copy.cta, menuUrl) +
    '<p style="margin:14px 0 0;color:#5f6368;font-size:13px;">' +
    "Add-on prices are confirmed at the time you add them, and the card on file is " +
    "charged for the exact amount." +
    "</p>";

  var html = renderLayout({
    preheader: copy.preheader,
    bodyHtml: bodyHtml,
    footerNote:
      "You are receiving this because you have an upcoming booking with White Wall Studios."
  });

  var text =
    copy.heading +
    "\n\nHi " + first + ",\n\n" + copy.lead +
    "\n\nYour session: " + session +
    "\nLocation: " + loc +
    "\nWhen: " + when +
    "\n\n" + copy.cta + ": " + menuUrl +
    "\n\nAdd-on prices are confirmed when you add them, and the card on file is charged for the exact amount." +
    "\n\nWhite Wall Studios";

  var subject = (ctx.subjectPrefix || "") + copy.subject;
  return { subject: subject, html: html, text: text, touchNo: touchNo };
}

// ---------------------------------------------------------------------------
// deposit / balance reminder (pure). The every-6h chase after the 48h auto-charge
// could not collect: tells the customer the balance is still owed and points them
// at their account to update the card or pay the balance.
// ---------------------------------------------------------------------------
//   ctx: { firstName, sessionLabel, startsAt, location, balanceDueCents,
//          baseUrl, accountUrl? }
function buildBalanceReminder(ctx) {
  ctx = ctx || {};
  var first = ctx.firstName ? String(ctx.firstName).trim() : "there";
  var when = fmtDateTime(ctx.startsAt);
  var session = ctx.sessionLabel || "your session";
  var loc = locationLabel(ctx.location);
  var acctUrl = ctx.accountUrl || buildAccountUrl(ctx.baseUrl);
  var hasAmount = Number(ctx.balanceDueCents) > 0;
  var amountLine = hasAmount ? " of " + fmtMoney(ctx.balanceDueCents) : "";

  var detailHtml =
    '<p style="margin:0 0 6px;color:#5f6368;font-size:13px;">YOUR SESSION</p>' +
    '<p style="margin:0;font-weight:600;">' + esc(session) + "</p>" +
    '<p style="margin:2px 0 0;color:#5f6368;">' + esc(loc) + "</p>" +
    '<p style="margin:2px 0 0;color:#5f6368;">' + esc(when) + "</p>" +
    (hasAmount
      ? '<p style="margin:8px 0 0;font-weight:600;">Balance due: ' + esc(fmtMoney(ctx.balanceDueCents)) + "</p>"
      : "");

  var bodyHtml =
    '<p style="margin:0 0 14px;font-size:18px;font-weight:600;">Action needed: settle your balance</p>' +
    '<p style="margin:0 0 8px;">Hi ' + esc(first) + ",</p>" +
    '<p style="margin:0 0 16px;">' +
    "We were not able to collect the remaining balance" + esc(amountLine) +
    " for your upcoming session. Your appointment is still reserved. To keep it, please " +
    "update your card or pay the balance from your account before your session begins." +
    "</p>" +
    '<div style="margin:18px 0;padding:14px 16px;background:#fafafa;border-radius:10px;">' +
    detailHtml + "</div>" +
    button("Update card or pay balance", acctUrl) +
    '<p style="margin:14px 0 0;color:#5f6368;font-size:13px;">' +
    "If you have already settled the balance, you can ignore this message." +
    "</p>";

  var html = renderLayout({
    preheader: "Your session balance is still outstanding.",
    bodyHtml: bodyHtml,
    footerNote: "You are receiving this because a balance remains on your upcoming booking."
  });

  var text =
    "Action needed: settle your balance\n\nHi " + first + ",\n\n" +
    "We were not able to collect the remaining balance" + amountLine +
    " for your upcoming session. Your appointment is still reserved. Update your card or " +
    "pay the balance from your account before your session begins.\n\n" +
    "Your session: " + session + "\nLocation: " + loc + "\nWhen: " + when +
    (hasAmount ? "\nBalance due: " + fmtMoney(ctx.balanceDueCents) : "") +
    "\n\nUpdate card or pay balance: " + acctUrl +
    "\n\nIf you have already settled the balance, you can ignore this message.\n\nWhite Wall Studios";

  var subject = hasAmount
    ? "Balance due " + fmtMoney(ctx.balanceDueCents) + " for your White Wall session"
    : "Settle the balance for your White Wall session";
  return { subject: subject, html: html, text: text };
}

module.exports = {
  // template builders
  buildCampaignTouch: buildCampaignTouch,
  buildBalanceReminder: buildBalanceReminder,
  // url + formatting helpers (shared with the dispatcher / landing page)
  buildAddonMenuUrl: buildAddonMenuUrl,
  buildAccountUrl: buildAccountUrl,
  fmtMoney: fmtMoney,
  fmtDateTime: fmtDateTime,
  locationLabel: locationLabel,
  TOUCH_COPY: TOUCH_COPY
};
