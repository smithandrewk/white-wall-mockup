// LIVE driver against staging — NO mocks, NO Square stub. Renders the real
// Square sandbox card iframe. Stops at step 5 (does not click Pay), so no
// booking is created. Usage: node tools/verify-booking-live.mjs <slug> <viewport>
import { chromium } from "playwright";
import fs from "node:fs";
const SLUG = process.argv[2] || "powdersville";
const VP = process.argv[3] || "desktop";
const OUT = `/tmp/ww-ui-live/${SLUG}-${VP}`;
fs.mkdirSync(OUT, { recursive: true });
const SIZE = VP === "mobile" ? { width: 390, height: 844 } : { width: 1280, height: 900 };
const BASE = "https://staging.whitewallstudios.co";
const errs = [];

const b = await chromium.launch();
const p = await b.newContext({ viewport: SIZE }).then(c => c.newPage());
p.on("pageerror", e => errs.push(String(e)));
await p.goto(`${BASE}/book-${SLUG}`, { waitUntil: "networkidle" });
const cb = p.locator('button:has-text("Accept"), button:has-text("ACCEPT")').first();
if (await cb.count()) await cb.click().catch(()=>{});

const goStep = async n => {
  await p.locator(`[data-action="go-step"][data-step="${n}"]:not([disabled]):not(.progress-dot)`).first().click();
  await p.waitForSelector(`[data-step-panel="${n}"].is-active`, { timeout: 15000 });
};
const shoot = async (n) => { await p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); };
// 1 duration
await p.waitForSelector('[data-action="select-duration"]', { timeout: 15000 });
await shoot('step1-duration');
await p.locator('[data-action="select-duration"]').first().click();
await p.waitForSelector('[data-step-panel="2"].is-active');
// 2 date+time (real Acuity)
await p.waitForSelector('[data-action="select-date"]:not([disabled])', { timeout: 20000 });
await shoot('step2-calendar');
await p.locator('[data-action="select-date"]:not([disabled])').first().click();
const upsell = p.locator('#pv-upsell-dismiss');
if (await upsell.count()) { await shoot('step2-pv-upsell'); await upsell.click(); await p.waitForSelector('.booking-modal-overlay', { state:'detached', timeout:5000 }).catch(()=>{}); }
await p.waitForSelector('.time-slot', { timeout: 20000 });
await p.locator('.time-slot').first().click();
await p.waitForSelector('.time-slot.is-selected');
await shoot('step2-time-selected');
await goStep(3);
// 3 details
const evtNo = p.locator('[data-action="set-event-intent"][data-value="no"]').first();
try { await evtNo.waitFor({ state:'visible', timeout:4000 }); await evtNo.click(); } catch {}
await p.waitForSelector('[data-input="contact-first-name"]', { state:'visible', timeout:10000 });
const fill = async (s,v)=>{ const e=p.locator(s).first(); if(await e.count()) await e.fill(v); };
await fill('[data-input="contact-first-name"]','Test');
await fill('[data-input="contact-last-name"]','Booking');
await fill('[data-input="contact-email"]','andrewsmith1025@gmail.com');
await fill('[data-input="contact-phone"]','8035551234');
await fill('[data-input="intake-business"]','Test Co');
await fill('[data-input="intake-participants"]','10');
await fill('[data-input="intake-instagram"]','@teststudio');
await fill('[data-input="email-acknowledgment"]','Test Booking');
await fill('[data-input="terms-signature"]','Test Booking');
await p.locator("[data-check='read-email']").first().check().catch(()=>{});
await p.waitForTimeout(200);
await shoot('step3-details');
await goStep(4);
// 4 waiver
await p.waitForSelector('[data-action="sign-waiver"]', { timeout:10000 });
await shoot('step4-waiver');
await p.locator('[data-action="sign-waiver"]').first().click();
await p.waitForTimeout(200);
await goStep(5);
// 5 — wait for the REAL Square iframe to mount inside #card-container
await p.waitForSelector('[data-payment-section]', { timeout:10000 });
let iframeUp = false;
try { await p.waitForSelector('#card-container iframe', { timeout: 20000 }); iframeUp = true; } catch {}
await p.waitForTimeout(1500); // let Square paint number/exp/cvv/zip
await p.screenshot({ path: `${OUT}/step5-REAL-card.png`, fullPage: true });
// tight crop of the payment panel
const pay = p.locator('[data-payment-section]');
try { await pay.screenshot({ path: `${OUT}/step5-card-closeup.png` }); } catch {}
console.log(JSON.stringify({ slug:SLUG, vp:VP, realSquareIframe: iframeUp, pageErrors: errs.slice(0,3), out: OUT }, null, 2));
await b.close();
