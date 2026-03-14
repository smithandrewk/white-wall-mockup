# Studio One (studione.com.au) — Reference Site Analysis

Drew wants to replicate the "checkout process" feel from this site.

Source: https://studione.com.au/

---

## Platform
Framer (React-based, JS-heavy). Not relevant to us — we're building static HTML.

## What They Actually Have
- **No real booking system** — just a contact inquiry form (name, email, message)
- **No payment processing** — no Stripe, Square, or any checkout
- **No calendar/date picker** — no self-service scheduling
- **No Acuity/Calendly** — everything is manual follow-up

## What Drew Probably Likes (Design Patterns to Replicate)
1. **Dark, premium aesthetic** — black (#000) backgrounds, white text, cinematic feel
2. **Clean form styling** — semi-transparent input backgrounds, subtle borders, rounded corners
3. **Strong mobile UX** — responsive at 3 tiers (desktop 1200px, tablet 810px, mobile 390px)
4. **Image-heavy portfolio** sections with rounded corners (20px border-radius)
5. **Fixed nav header** with persistent booking CTAs
6. **Typography**: Inter Display headings, Inter body, accent font for flair

## How We Beat Them
Studio One requires manual back-and-forth to book. We can give WWS:
- **Self-service scheduling** via Acuity embed (pick date/time instantly)
- **Online payment** for add-ons via Square
- **Multi-step booking flow** with the same premium feel
- **Real-time availability** — no email tag needed

## Design Direction for WWS Booking Pages
- Dark background (black or near-black) for the booking flow — matches Studio One vibe
- Translucent/glassmorphism input fields
- Step-by-step progressive disclosure (not one giant form)
- Large, tappable elements for mobile
- Add-on cards with photos (Drew provided all the photos)
- Smooth transitions between steps
