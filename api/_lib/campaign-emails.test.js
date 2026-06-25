// api/_lib/campaign-emails.test.js — standalone (node api/_lib/campaign-emails.test.js).
// Asserts the customer email templates RENDER with the right surface: subject,
// non-empty HTML + text, the tokenized add-on menu link (4-touch campaign), and
// the account link + balance amount (reminder). Pure — no IO, no send.

"use strict";

const assert = require("assert");
const emails = require("./campaign-emails");

const ctx = {
  firstName: "Dana",
  sessionLabel: "8 Hour Session",
  startsAt: "2026-08-01T16:30:00Z",
  location: "powdersville",
  baseUrl: "https://staging.whitewallstudios.co",
  token: "abc123token"
};

// --- buildAddonMenuUrl is the shared link the emails point to ---
const menuUrl = emails.buildAddonMenuUrl(ctx.baseUrl, ctx.token);
assert.strictEqual(
  menuUrl,
  "https://staging.whitewallstudios.co/addon-menu?token=abc123token",
  "addon menu url uses /addon-menu?token=<token>"
);
// trailing-slash base is normalized
assert.strictEqual(
  emails.buildAddonMenuUrl("https://x.co/", "t"),
  "https://x.co/addon-menu?token=t"
);

// --- all 4 touches render ---
for (let n = 1; n <= 4; n++) {
  const m = emails.buildCampaignTouch(n, ctx);
  assert.ok(m.subject && m.subject.length > 0, "touch " + n + " has a subject");
  assert.ok(/<html/i.test(m.html), "touch " + n + " html is a document");
  assert.ok(m.html.indexOf(menuUrl) !== -1, "touch " + n + " html links the tokenized menu");
  assert.ok(m.text.indexOf(menuUrl) !== -1, "touch " + n + " text links the tokenized menu");
  assert.ok(m.html.indexOf("8 Hour Session") !== -1, "touch " + n + " shows the session label");
  assert.ok(m.text.indexOf("Dana") !== -1, "touch " + n + " greets by first name");
  assert.strictEqual(m.touchNo, n);
}

// touch copy differs per touch (sanity: subjects are not all identical)
const subjects = [1, 2, 3, 4].map((n) => emails.buildCampaignTouch(n, ctx).subject);
assert.strictEqual(new Set(subjects).size, 4, "each touch has a distinct subject");

// subjectPrefix is honored
const pref = emails.buildCampaignTouch(1, Object.assign({}, ctx, { subjectPrefix: "[STAGING] " }));
assert.ok(pref.subject.indexOf("[STAGING] ") === 0, "subjectPrefix prepends");

// unknown touch throws
assert.throws(function () { emails.buildCampaignTouch(9, ctx); }, /unknown touch/);

// missing first name falls back to "there"
const noName = emails.buildCampaignTouch(1, Object.assign({}, ctx, { firstName: "" }));
assert.ok(noName.html.indexOf("Hi there") !== -1, "falls back to 'there' with no name");

// --- balance reminder renders with amount + account link ---
const acctUrl = emails.buildAccountUrl(ctx.baseUrl);
assert.strictEqual(acctUrl, "https://staging.whitewallstudios.co/account");

const rem = emails.buildBalanceReminder(Object.assign({}, ctx, { balanceDueCents: 30000 }));
assert.ok(/balance/i.test(rem.subject), "reminder subject mentions balance");
assert.ok(rem.subject.indexOf("$300.00") !== -1, "reminder subject shows the amount");
assert.ok(rem.html.indexOf(acctUrl) !== -1, "reminder html links the account page");
assert.ok(rem.html.indexOf("$300.00") !== -1, "reminder html shows balance due");
assert.ok(rem.text.indexOf(acctUrl) !== -1, "reminder text links the account page");

// reminder with no amount still renders a generic subject + body
const remNoAmt = emails.buildBalanceReminder(Object.assign({}, ctx, { balanceDueCents: 0 }));
assert.ok(/settle the balance/i.test(remNoAmt.subject), "generic reminder subject when amount unknown");
assert.ok(/<html/i.test(remNoAmt.html));

// --- formatting helpers ---
assert.strictEqual(emails.fmtMoney(75000), "$750.00");
assert.strictEqual(emails.fmtMoney(0), "$0.00");
assert.strictEqual(emails.locationLabel("taylors-mill"), "Taylor's Mill");

// --- HTML escaping: a malicious session label cannot inject markup ---
const xss = emails.buildCampaignTouch(1, Object.assign({}, ctx, { sessionLabel: '<script>x</script>' }));
assert.ok(xss.html.indexOf("<script>x</script>") === -1, "session label is escaped in html");
assert.ok(xss.html.indexOf("&lt;script&gt;") !== -1, "escaped form present");

console.log("All campaign-emails.test.js assertions passed.");
