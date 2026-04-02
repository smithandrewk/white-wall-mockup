const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LOCATIONS = [
  {
    name: 'powdersville',
    query: 'WhiteWall Studios Easley SC',
    mapsUrl: null,
  },
  {
    name: 'taylors-mill',
    query: 'WhiteWall Studios Taylors SC',
    mapsUrl: null,
  },
];

const OUTPUT_PATH = path.join(__dirname, 'google-reviews.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function cleanName(raw) {
  // Remove trailing metadata like "Local Guide · 11 reviews · 9 photos" or "2 reviews"
  return raw
    .replace(/Local Guide\s*·.*$/, '')
    .replace(/\d+\s*reviews?(\s*·\s*\d+\s*photos?)?$/, '')
    .replace(/\s*·\s*$/, '')
    .trim();
}

async function scrapeReviews(page, location) {
  const reviews = [];

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(location.query)}`;
  console.log(`Navigating to: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(4000);

  // Click on the first result if needed
  try {
    const listing = await page.$('a[href*="place"]');
    if (listing) {
      await listing.click();
      await sleep(3000);
    }
  } catch (e) {
    console.log('No listing link to click');
  }

  // Find the reviews count on the page to see if there are any
  const reviewCount = await page.evaluate(() => {
    // Look for text like "X reviews" near the rating
    const els = document.querySelectorAll('button, span, div');
    for (const el of els) {
      const text = el.textContent || '';
      const match = text.match(/(\d+)\s*reviews?/i);
      if (match) return parseInt(match[1]);
    }
    return 0;
  });
  console.log(`Detected ${reviewCount} reviews on page for ${location.name}`);

  if (reviewCount === 0) {
    console.log(`No reviews found for ${location.name}, skipping`);
    return reviews;
  }

  // Click the reviews tab
  try {
    // Try aria-label selectors first
    let clicked = false;
    const selectors = [
      'button[aria-label*="Reviews"]',
      'button[aria-label*="review"]',
      '[data-tab-index="1"]',
    ];

    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        clicked = true;
        console.log(`Clicked reviews via: ${sel}`);
        break;
      }
    }

    if (!clicked) {
      // Try by text
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(e => e.textContent, btn);
        if (text && /\d+\s*reviews?/i.test(text)) {
          await btn.click();
          clicked = true;
          console.log('Clicked reviews by text match');
          break;
        }
      }
    }

    await sleep(3000);
  } catch (e) {
    console.log('Could not click reviews tab:', e.message);
  }

  // Scroll the reviews panel to load more
  try {
    const scrollable = await page.$('div.m6QErb.DxyBCb.kA9KIf.dS8AEf');
    if (scrollable) {
      console.log('Scrolling reviews panel...');
      for (let i = 0; i < 15; i++) {
        await page.evaluate(el => el.scrollTop += 1500, scrollable);
        await sleep(600);
      }
    }
  } catch (e) {
    console.log('Could not scroll reviews panel');
  }

  // Click all "More" buttons to expand review text
  try {
    const moreButtons = await page.$$('button[aria-label="See more"]');
    console.log(`Found ${moreButtons.length} "See more" buttons`);
    for (const btn of moreButtons) {
      try { await btn.click(); } catch (e) {}
    }
    await sleep(500);
  } catch (e) {}

  // Extract reviews using only [data-review-id] to avoid duplicates
  const reviewData = await page.evaluate(() => {
    const results = [];
    const reviewEls = document.querySelectorAll('[data-review-id]');

    for (const el of reviewEls) {
      try {
        // Get reviewer name - use the specific class
        const nameEl = el.querySelector('.d4r55');
        const name = nameEl ? nameEl.textContent.trim() : null;

        // Get star rating
        const starsEl = el.querySelector('[role="img"][aria-label*="star"]') ||
                        el.querySelector('span[aria-label*="star"]');
        let stars = null;
        if (starsEl) {
          const label = starsEl.getAttribute('aria-label');
          const match = label && label.match(/(\d)/);
          if (match) stars = parseInt(match[1]);
        }

        // Get review text
        const textEl = el.querySelector('.wiI7pd');
        const text = textEl ? textEl.textContent.trim() : '';

        if (name && stars !== null) {
          results.push({ name, text, stars });
        }
      } catch (e) {}
    }

    return results;
  });

  console.log(`Found ${reviewData.length} total reviews for ${location.name}`);

  // Filter to 5-star only and clean names
  const seen = new Set();
  for (const r of reviewData) {
    if (r.stars === 5) {
      const cleaned = cleanName(r.name);
      const key = `${cleaned}|${r.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        reviews.push({
          name: cleaned,
          text: r.text,
          stars: 5,
          location: location.name,
        });
      }
    }
  }

  console.log(`Found ${reviews.length} unique five-star reviews for ${location.name}`);
  return reviews;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--lang=en-US',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 900 });

  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  let allReviews = [];

  for (const loc of LOCATIONS) {
    try {
      const reviews = await scrapeReviews(page, loc);
      allReviews = allReviews.concat(reviews);
    } catch (err) {
      console.error(`Error scraping ${loc.name}:`, err.message);
    }
  }

  await browser.close();

  // Remove reviews with empty text
  const withText = allReviews.filter(r => r.text.length > 0);
  const withoutText = allReviews.length - withText.length;
  if (withoutText > 0) {
    console.log(`Removed ${withoutText} reviews with no text`);
  }

  console.log(`\nTotal 5-star reviews with text: ${withText.length}`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(withText, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
