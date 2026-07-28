const { chromium } = require("/Users/pip/code/white-wall/white-wall-mockup/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage();
  const dir = "/private/tmp/claude-501/-Users-pip-code-white-wall/d1305725-3706-4995-8f51-030c9d6c295f/scratchpad";
  await page.goto("file://" + dir + "/wws-recap.html", { waitUntil:"networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.pdf({
    path: dir + "/entrpy-whitewall-multiday-recap.pdf",
    printBackground: true,
    preferCSSPageSize: true
  });
  await browser.close();
  console.log("PDF rendered");
})();
