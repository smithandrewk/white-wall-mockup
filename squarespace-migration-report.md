# WhiteWall Studios: Squarespace Migration Report

**Prepared by Andrew Smith — March 2026**

---

## What You're Currently Paying

Based on the site audit, WWS is running **Squarespace Core** (or the legacy Business plan) since you have commerce enabled with product pages. You're likely paying:

| Item | Monthly | Annual |
|------|---------|--------|
| Squarespace Core (annual billing) | $23/mo | **$276/yr** |
| Squarespace Core (monthly billing) | $33/mo | **$396/yr** |
| Custom domain (whitewallstudios.co) | Included first year, ~$20/yr renewal | ~$20/yr |
| Acuity Scheduling (if separate) | $20+/mo | **$240+/yr** |
| **Total (annual billing, no Acuity)** | | **~$296/yr** |
| **Total (annual billing, with Acuity)** | | **~$536/yr** |
| **Total (monthly billing, with Acuity)** | | **~$656/yr** |

> If you're on the Plus plan (for subscription products), that's $39/mo annual ($468/yr) or $56/mo monthly ($672/yr), plus Acuity on top.
>
> **Note on Acuity**: No Acuity embed was found on the live site, but if you're using Acuity standalone (sending booking links directly to clients via email/text), that's a separate subscription. Acuity is owned by Squarespace but billed separately and is NOT tied to your Squarespace site. It works with any platform.

---

## What Squarespace Is Actually Doing for You

After a full audit of every page on whitewallstudios.co, here's what the platform provides:

### Heavily Used
- **Static pages** (29 total) — home, locations, studio sets, gear rentals, FAQs, contact
- **Image hosting/CDN** — all photos served via Squarespace CDN
- **Gallery** — 36-image masonry grid with lightbox
- **SSL + hosting** — standard web hosting
- **Mobile responsive layout**

### Lightly Used
- **Commerce** — but only as a booking workaround. Two $0.00 "products" (one per location) that users add to cart to initiate a booking. Actual scheduling happens via email/text.
- **Subscription products** — three placeholder membership plans ($40/$70/$100) with template content. Appears unused or in-progress.
- **One form** — free trial signup (yoga, boxing, running, pilates classes)
- **Facebook Pixel** tracking
- **reCAPTCHA** on forms

### Not Used At All
- **No Acuity Scheduling** — no embeds, no links, no scripts. Booking is manual (email/phone).
- **No email marketing** integration
- **No blog**
- **No member areas**
- **No Google Analytics**
- **No chat widget**

### Placeholder / Dead Content
- Terms & Conditions page — empty placeholder
- Privacy Policy page — empty placeholder
- FAQs-1 page — duplicate with template questions
- Free Trial page — fitness class form (possibly from a template, unclear if active)

---

## The Recommendation: Static Site + Modern Tooling

Your site is overwhelmingly static content. The "commerce" is a workaround for not having a real booking system. Moving off Squarespace doesn't just save money, it opens up an entire ecosystem of modern tools that Squarespace locks you out of.

### Where to Host

Any of these work. The site is static HTML/CSS/JS, so hosting is effectively free:

| Platform | Free Tier | Best For | Deploy Method |
|----------|-----------|----------|---------------|
| **Vercel** | 100GB bandwidth, unlimited deploys | If you ever want server-side features (API routes, AI integrations) | Git push auto-deploys |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo | Pure static sites, fastest global CDN | Git push auto-deploys |
| **GitHub Pages** | 100GB bandwidth, 10 builds/hr | Simplest setup, already have GitHub | Git push auto-deploys |
| **Netlify** | 100GB bandwidth, 300 build min/mo | Forms built-in, easy setup | Git push auto-deploys |

**Recommendation: Vercel.** Free for this use case, and if you ever want to add server-side features (AI chatbot, dynamic pricing, automated emails), Vercel supports it natively without needing a separate server. GitHub Pages is the simplest if you just want static and nothing else.

All four options: push code to GitHub, site updates automatically. No FTP, no manual uploads, no waiting for Squarespace to rebuild.

### Full Service Replacement Map

| Component | Solution | Cost | Notes |
|-----------|----------|------|-------|
| **Hosting** | Vercel / Cloudflare Pages / GitHub Pages | **$0/mo** | All free for this scale |
| **Domain** | Cloudflare Registrar or Namecheap | **~$10/yr** | At-cost, no markup |
| **SSL** | Included with any host | **$0** | Automatic HTTPS |
| **Image CDN** | Cloudflare (auto) or Vercel Image Optimization | **$0** | Images served from edge |
| **Scheduling/Booking** | Acuity (keep) or Cal.com (free) | **$0-20/mo** | Embed on site, works anywhere |
| **Forms** | Formspree / Netlify Forms / Vercel serverless | **$0/mo** | Free tiers cover this |
| **Gallery** | GLightbox / PhotoSwipe (JS libraries) | **$0** | Lightweight, fast |
| **Memberships** | Stripe Checkout + Billing | **Per-txn only** | No monthly platform fee |
| **Facebook Pixel** | Script tag | **$0** | Copy-paste, works anywhere |
| **reCAPTCHA** | Script tag | **$0** | Same setup as now |
| **Analytics** | PostHog (free, see below) | **$0** | Way better than Squarespace analytics |
| **Automations** | Zapier / Make / n8n (see below) | **$0-20/mo** | Not possible on Squarespace |
| **AI features** | Claude API via Vercel (see below) | **Pay-per-use** | Not possible on Squarespace |
| **Total** | | **~$10/yr + optional services** | |

### If Drew/Max Want to Edit Pages Themselves

If they want a visual editor (the one thing Squarespace does well):

| Option | How It Works | Cost |
|--------|-------------|------|
| **Decap CMS** (formerly Netlify CMS) | Git-based CMS, visual editor in browser, edits go to GitHub | $0 |
| **Tina CMS** | Similar to Decap, live visual editing | $0 (free tier) |
| **Notion as CMS** | Write in Notion, site pulls content automatically | $0 |
| **Just ask Andrew** | Text me, I push the change in 5 minutes | $0 + friendship |

---

## What You Unlock by Leaving Squarespace

This is the part that matters beyond cost savings. Squarespace is a walled garden. Once you're on a standard web stack, you get access to the entire modern web ecosystem:

### Analytics: PostHog (Free, Replaces Squarespace Analytics)

Squarespace gives you basic page views. PostHog gives you:

- **Session recordings** — watch exactly how visitors navigate your site. See where they hesitate, what they click, where they drop off before booking.
- **Heatmaps** — visual overlay of where people click and scroll on each page.
- **Funnels** — track the path from landing page to booking. "80% of visitors see the gallery, but only 10% click Book Now." Now you know where to optimize.
- **A/B testing** — test two versions of a page and see which converts better. Different hero images, different CTAs, different layouts.
- **Feature flags** — roll out changes to 10% of visitors first, check the data, then go to 100%.
- **Free tier**: 1 million events/month, 5,000 session recordings/month. More than enough.

This is not possible on Squarespace at any price tier.

### Automations: Zapier / Make / n8n

Connect your site events to anything:

- **New booking → auto-send confirmation email** with studio access codes, parking info, prep checklist
- **New booking → add to Google Sheets** for tracking revenue per location
- **Form submission → create a lead in your CRM** (or just a Google Sheet)
- **New booking → send SMS reminder** 24 hours before the session
- **Membership signup → auto-add to a private Instagram Close Friends list** or email list
- **Low booking week → auto-post Instagram story** with availability

Zapier has a free tier (100 tasks/month). Make.com is even more generous. n8n is fully free and self-hosted.

On Squarespace, you're limited to their handful of built-in integrations. Off Squarespace, your site can talk to literally anything.

### AI-Powered Features (Claude / OpenAI via Vercel)

This is where it gets interesting. With Vercel, you can add server-side API routes that run AI models. Examples:

- **AI booking assistant** — a chat widget on the site that answers questions about the studios, pricing, availability, and walks visitors through booking. Powered by Claude, knows everything about both locations.
- **Smart inquiry routing** — when someone fills out a contact form, AI reads the message and auto-categorizes it (booking inquiry, gear rental question, event inquiry, partnership pitch) and routes it to the right person or sends an auto-reply.
- **Auto-generate social captions** — upload a new gallery photo, AI writes an Instagram caption with relevant hashtags based on the studio, the vibe, and your brand voice.
- **Dynamic FAQ** — instead of a static FAQ page, a conversational interface that answers any question about the studios using your content as context.
- **Personalized landing pages** — returning visitors see content tailored to their location preference (Taylor's Mill vs Powdersville) based on their previous browsing.

Cost: Claude API is pay-per-use. A booking assistant handling 100 conversations/month would cost roughly $2-5/month in API fees. Compare that to a $49/mo chatbot SaaS.

**None of this is possible on Squarespace.** You can't run server-side code, you can't call APIs, you can't add custom logic. Moving to Vercel turns your website from a digital brochure into a platform you can build anything on top of.

---

## Cost Comparison

| | Squarespace + Acuity (current) | Option A (keep Acuity) | Option B (switch to Cal.com) |
|--|-------------------------------|------------------------|------------------------------|
| **Squarespace/Hosting** | $276-468/yr | $0 | $0 |
| **Scheduling** | $240+/yr | $240/yr (keep Acuity) | $0 (Cal.com free) |
| **Domain** | ~$20/yr | ~$10/yr | ~$10/yr |
| **Year 1 Total** | $536-728 | ~$250 | ~$10 |
| **5-Year Total** | $2,680-3,640 | ~$1,250 | ~$50 |
| **5-Year Savings** | — | **$1,430-2,390** | **$2,630-3,590** |

Transaction fees on memberships (if activated) would be Stripe's 2.9% + $0.30 + 0.5% per charge vs. Squarespace's 0-2% + Stripe's processing fee. Roughly equivalent for low volume.

---

## Scheduling & Booking

### Current State

On the live site, booking works like this:
1. Customer clicks "Book Now"
2. Adds a $0.00 product to cart on Squarespace
3. Checks out (giving contact info)
4. WWS follows up via email/text to schedule

If you're also using **Acuity Scheduling** separately (sending links to clients directly), that's an additional ~$20+/mo on top of Squarespace. Acuity is owned by Squarespace but billed as a separate product.

### Key Point: Acuity Is Not Tied to Squarespace

Acuity works as a standalone product. If you leave Squarespace, you can:
1. **Keep Acuity as-is** and just embed it on the new site instead. Zero disruption to your booking flow. Same links, same system. This is the lowest-risk option.
2. **Switch to Cal.com (free)** to eliminate the Acuity cost entirely, saving ~$240/yr. Cal.com offers unlimited bookings, separate event types per location, Google Calendar sync, confirmation emails, and embeds anywhere.
3. **Switch to Calendly** ($10/mo for multiple event types, or free for 1 event type).

### Scheduling Options Compared

| Feature | Acuity ($20+/mo) | Cal.com (Free) | Calendly ($10/mo) |
|---------|-------------------|----------------|-------------------|
| Unlimited bookings | Yes | Yes | Yes |
| Multiple event types (per location) | Yes | Yes | Paid only |
| Embed on any site | Yes | Yes | Yes |
| Google Calendar sync | Yes | Yes | Yes |
| Payment collection at booking | Yes (Stripe/Square/PayPal) | Yes (Stripe) | Yes (Stripe) |
| Confirmation emails | Yes | Yes | Yes |
| Works without Squarespace | Yes | Yes | Yes |
| Cost/year | ~$240+ | $0 | ~$120 |

**Bottom line**: If you like Acuity, keep it. It'll work exactly the same on a new site. If you want to save ~$240/yr, Cal.com's free tier does everything you need.

---

## Membership Subscriptions

The site has three subscription plans ($40/$70/$100) with placeholder content. If these become real:

- **Stripe Billing** handles recurring payments directly. No middleman platform needed.
- Customers subscribe via a Stripe Checkout link on the site.
- Stripe manages billing, retries, cancellations, invoices.
- Cost: 2.9% + $0.30 per charge + 0.5% Billing fee. On a $70/mo subscription, that's ~$2.39/mo in fees.
- No monthly platform fee for Stripe (pay-per-transaction only).

vs. Squarespace Commerce which also charges Stripe processing fees plus its own 0-2% cut depending on plan.

---

## Migration Effort

### What Needs to Be Built
| Task | Effort | Notes |
|------|--------|-------|
| Convert 29 pages to static HTML/Astro | ~8-12 hours | We already have 4 pages mocked up |
| Set up image hosting + migrate photos | ~1-2 hours | Download from Squarespace CDN, upload to new CDN |
| Gallery with lightbox | ~1-2 hours | GLightbox or similar JS library |
| FAQ accordion | ~30 min | Standard component |
| Cal.com setup (2 locations) | ~1-2 hours | Create event types, embed on site |
| Stripe subscriptions (if needed) | ~2-3 hours | Create products, add checkout links |
| Contact form | ~30 min | Formspree or similar |
| Facebook Pixel | ~15 min | Script tag |
| DNS migration | ~30 min | Point domain to new host |
| Testing + polish | ~2-3 hours | Cross-browser, mobile, links |
| **Total** | **~16-24 hours** | |

### What We Already Have
- 4-page HTML mockup with the design system already built
- Design sheets (letter + phone) for reference
- Font files (Cormorant Garamond, Inter)
- Logo asset

### Migration Steps
1. Finish remaining pages using the existing mockup as a template
2. Set up Cloudflare Pages (or Netlify) and connect the domain
3. Set up Cal.com with two location-specific booking event types
4. If subscriptions are active, set up Stripe Billing
5. Migrate images from Squarespace CDN
6. Add Facebook Pixel, reCAPTCHA, forms
7. Test everything
8. Switch DNS (5-minute cutover, no downtime if prepped)

---

## Risks & Considerations

- **Editing without code**: If Drew/Max frequently edit page content, they'll need either a CMS (Option B) or someone to make HTML changes. Squarespace's visual editor is the one thing that's hard to replace for free.
- **Squarespace email**: They use Google Workspace for email (MX records), NOT Squarespace email. No email migration needed.
- **SEO**: Redirect old Squarespace URLs to new ones. Squarespace uses paths like `/about-taylors-mill-location` which we can keep or redirect.
- **Domain transfer**: whitewallstudios.co needs to be transferred away from Squarespace. Standard process, ~10 minutes + up to 5 day transfer window.

---

## Summary

| Question | Answer |
|----------|--------|
| Can they leave Squarespace? | **Yes, easily.** The site is mostly static pages with images. |
| Do they use Acuity? | **Not on the site itself.** If used standalone, it works anywhere and can move with you. |
| What Squarespace features do they depend on? | Hosting, image CDN, and a hacky $0 product-as-booking-form. That's it. |
| How much would they save? | **$280-720/year** (keep Acuity) or **$520-720/year** (switch to Cal.com). Up to **$3,590 over 5 years**. |
| What happens to Acuity? | **Nothing.** Keep it as-is and embed on the new site, or switch to Cal.com (free) for more savings. |
| What's the effort? | ~16-24 hours to build and migrate. We're ~25% done with the mockup already. |
| What do they lose? | Squarespace's visual page editor. Everything else is replaceable for free or cheaper. |
