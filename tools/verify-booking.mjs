// Booking-flow UI driver. Mocks Acuity availability + Square SDK so the full
// 5-step card-on-file flow renders deterministically with no credentials.
//
// Usage: node tools/verify-booking.mjs <slug> <viewport> <outdir>
//   slug:     powdersville | taylors-mill
//   viewport: desktop | mobile
//   outdir:   directory for screenshots + report.json
import { chromium } from "playwright";
import fs from "node:fs";

const SLUG = process.argv[2] || "powdersville";
const VIEWPORT = process.argv[3] || "desktop";
const OUTDIR = process.argv[4] || `/tmp/ww-ui/${SLUG}-${VIEWPORT}`;
const BASE = process.env.BASE_URL || "http://localhost:8099";
fs.mkdirSync(OUTDIR, { recursive: true });

const SIZE = VIEWPORT === "mobile" ? { width: 390, height: 844 } : { width: 1280, height: 900 };
const report = { slug: SLUG, viewport: VIEWPORT, steps: [], consoleErrors: [], pageErrors: [], failures: [] };

// Mocked availability: a spread of dates in the current + next month.
function datePayload() {
  const now = new Date();
  const dates = [];
  for (let m = 0; m < 2; m++) {
    const y = now.getFullYear(), mo = now.getMonth() + m;
    const dim = new Date(y, mo + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(y, mo, d);
      if (dt < new Date(now.toDateString())) continue;     // no past days
      if (dt.getDay() === 0) continue;                      // skip Sundays
      dates.push(dt.toISOString().slice(0, 10));
    }
  }
  return dates;
}
function timePayload(date) {
  // EDT offset for June; good enough for the mock
  return ["10:00:00", "12:00:00", "14:00:00", "16:00:00"].map((t) => ({ time: `${date}T${t}-0400` }));
}

const SQUARE_STUB = () => {
  // Fake Square Web Payments SDK. attach() injects a visible placeholder so
  // screenshots show a styled card field where Square's real iframe would be.
  window.Square = {
    payments() {
      return {
        async card() {
          return {
            async attach(sel) {
              const el = document.querySelector(sel);
              if (el) {
                el.innerHTML =
                  '<div style="display:flex;gap:8px;align-items:center;padding:14px 12px;font:14px -apple-system,sans-serif;color:#333">' +
                  '<span style="letter-spacing:3px">•••• •••• •••• ••••</span>' +
                  '<span style="margin-left:auto;color:#888">MM/YY</span>' +
                  '<span style="color:#888">CVV</span></div>';
              }
              return true;
            },
            async tokenize() { return { status: "OK", token: "cnon:card-nonce-ok" }; },
          };
        },
      };
    },
  };
};

async function shoot(page, name, note) {
  const file = `${OUTDIR}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  report.steps.push({ name, note: note || "", file });
}
function fail(msg) { report.failures.push(msg); }

async function fillIfPresent(page, selector, value) {
  const el = page.locator(selector).first();
  if (await el.count()) { await el.fill(String(value)); return true; }
  return false;
}

let _page = null;
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext({ viewport: SIZE }).then((c) => c.newPage());
  _page = page;

  page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => report.pageErrors.push(String(e)));

  await page.addInitScript(SQUARE_STUB);
  await page.route("**/api/booking-public-config", (r) =>
    r.fulfill({ json: { squareAppId: "sandbox-stub", squareLocationId: "LOC_STUB", squareSdkUrl: "about:blank" } }));
  await page.route("**/api/availability-dates**", (r) => r.fulfill({ json: { dates: datePayload() } }));
  await page.route("**/api/availability-times**", (r) => {
    const u = new URL(r.request().url());
    r.fulfill({ json: { times: timePayload(u.searchParams.get("date")) } });
  });
  await page.route("**/api/verify-availability", (r) => r.fulfill({ json: { available: true } }));
  await page.route("**/api/create-checkout", (r) =>
    r.fulfill({ json: { success: true, redirect: "/booking-confirmation?id=stub" } }));

  await page.goto(`${BASE}/book-${SLUG}.html`, { waitUntil: "networkidle" });

  // Dismiss cookie banner if present (it overlays the bottom of the page)
  const cookieBtn = page.locator('button:has-text("Accept"), button:has-text("ACCEPT")').first();
  if (await cookieBtn.count()) await cookieBtn.click().catch(() => {});

  const goStep = async (n) => {
    await page.locator(`[data-action="go-step"][data-step="${n}"]:not([disabled]):not(.progress-dot)`).first().click();
    await page.waitForSelector(`[data-step-panel="${n}"].is-active`, { timeout: 10000 });
  };

  // ---- Step 1: Duration (selecting auto-advances to step 2) ----
  await page.waitForSelector('[data-action="select-duration"]', { timeout: 10000 });
  await shoot(page, "step1-duration", "Duration picker");
  await page.locator('[data-action="select-duration"]').first().click();
  await page.waitForSelector('[data-step-panel="2"].is-active', { timeout: 10000 });

  // ---- Step 2: Schedule (calendar + time) ----
  await page.waitForSelector('[data-action="select-date"]:not([disabled])', { timeout: 10000 });
  await shoot(page, "step2a-calendar", "Calendar");
  await page.locator('[data-action="select-date"]:not([disabled])').first().click();
  // TM pops a Powdersville-upsell modal on first date pick — dismiss it.
  const upsell = page.locator('#pv-upsell-dismiss');
  if (await upsell.count()) {
    await shoot(page, "step2-pv-upsell", "Powdersville upsell modal (TM only)");
    await upsell.click();
    await page.waitForSelector('.booking-modal-overlay', { state: "detached", timeout: 5000 }).catch(() => {});
  }
  await page.waitForSelector('.time-slot', { timeout: 10000 });           // times loaded
  await page.locator('.time-slot').first().click();
  await page.waitForSelector('.time-slot.is-selected', { timeout: 10000 }); // selection registered
  await shoot(page, "step2b-time-selected", "Time selected");
  await goStep(3);

  // ---- Step 3: Details ----
  // On PV the contact form (data-step3-details) is hidden until event intent is
  // chosen. TM has no events, so the question may be absent — handle both.
  const evtNo = page.locator('[data-action="set-event-intent"][data-value="no"]').first();
  await shoot(page, "step3a-details-top", "Top of step 3 (event-intent question if present)");
  try {
    await evtNo.waitFor({ state: "visible", timeout: 4000 });
    await evtNo.click();
  } catch { /* no event-intent gate on this page */ }
  await page.waitForSelector('[data-input="contact-first-name"]', { state: "visible", timeout: 10000 });
  await fillIfPresent(page, '[data-input="contact-first-name"]', "Test");
  await fillIfPresent(page, '[data-input="contact-last-name"]', "Booking");
  await fillIfPresent(page, '[data-input="contact-email"]', "test@example.com");
  await fillIfPresent(page, '[data-input="contact-phone"]', "5551234567");
  await fillIfPresent(page, '[data-input="intake-business"]', "Test Co");
  await fillIfPresent(page, '[data-input="intake-participants"]', "10");
  await fillIfPresent(page, '[data-input="intake-instagram"]', "@teststudio");
  await fillIfPresent(page, '[data-input="email-acknowledgment"]', "Test Booking");
  await fillIfPresent(page, '[data-input="terms-signature"]', "Test Booking");
  // Required (per Drew): confirm the read-the-email checkbox to advance.
  await page.locator("[data-check='read-email']").first().check().catch(() => {});
  await page.waitForTimeout(150);
  await shoot(page, "step3-details", "Contact + intake + signatures");
  if (await page.locator('[data-requires-terms]').first().isDisabled())
    fail("Step 3: 'Continue to sign waiver' still disabled after filling all fields");
  else await goStep(4);

  // ---- Step 4: Waiver ----
  await page.waitForSelector('[data-action="sign-waiver"]', { timeout: 10000 });
  await shoot(page, "step4a-waiver", "Waiver before signing");
  await page.locator('[data-action="sign-waiver"]').first().click();
  await page.waitForTimeout(200);
  await shoot(page, "step4b-waiver-signed", "Waiver after signing");
  if (await page.locator('[data-requires-waiver]').first().isDisabled())
    fail("Step 4: 'Continue to add-ons' still disabled after signing waiver");
  else await goStep(5);

  // ---- Step 5: Add-ons + Pay ----
  await page.waitForSelector('[data-payment-section]', { timeout: 10000 });
  await page.waitForTimeout(400); // let Square stub attach
  await shoot(page, "step5a-addons-pay", "Add-ons + payment panel");

  // Assertions on the card-on-file UI
  const cardFilled = await page.locator('#card-container').evaluate((el) => el.children.length > 0).catch(() => false);
  if (!cardFilled) fail("Step 5: #card-container did not render a card field (Square attach failed)");
  const consent = page.locator('[data-input="card-on-file-consent"]').first();
  if (!(await consent.count())) fail("Step 5: card-on-file consent checkbox missing");
  const payBtn = page.locator('[data-pay-btn]').first();
  const payDisabledBefore = await payBtn.isDisabled();
  if (!payDisabledBefore) fail("Step 5: Pay button enabled BEFORE consent checked (should be gated)");
  await consent.check();
  await page.waitForTimeout(150);
  const payDisabledAfter = await payBtn.isDisabled();
  if (payDisabledAfter) fail("Step 5: Pay button still disabled AFTER consent checked + card ready");
  report.payButtonText = (await payBtn.textContent() || "").trim();
  await shoot(page, "step5b-consent-checked", "Consent checked, pay enabled");

  await browser.close();
  fs.writeFileSync(`${OUTDIR}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ slug: SLUG, viewport: VIEWPORT, failures: report.failures, consoleErrors: report.consoleErrors.slice(0, 5), pageErrors: report.pageErrors.slice(0, 5), payButtonText: report.payButtonText, shots: report.steps.length }, null, 2));
};

run().catch(async (e) => {
  report.failures.push("DRIVER CRASH: " + e.message);
  if (_page) {
    try {
      await _page.screenshot({ path: `${OUTDIR}/CRASH.png`, fullPage: true });
      const st = await _page.evaluate(() => ({
        activePanels: [...document.querySelectorAll('[data-step-panel].is-active')].map((e) => e.dataset.stepPanel),
        contactVisible: (() => { const c = document.querySelector('[data-input=contact-first-name]'); return c ? c.offsetParent !== null : null; })(),
        signWaiverPresent: !!document.querySelector('[data-action="sign-waiver"]'),
      }));
      report.crashState = st;
      console.log("CRASH STATE", JSON.stringify(st));
    } catch {}
  }
  try { fs.writeFileSync(`${OUTDIR}/report.json`, JSON.stringify(report, null, 2)); } catch {}
  console.log(JSON.stringify({ slug: SLUG, viewport: VIEWPORT, crash: e.message, failures: report.failures }, null, 2));
  process.exit(1);
});
