# Google Reviews Widget Research

Date: March 14, 2026
Status: Tabled — not a priority right now

## Recommendation: Featurable (Free)

- Unlimited page views (no cap)
- Auto-syncs every 24-48 hours
- Static site compatible — just an embed snippet
- Clean/minimal layouts (carousel, badge)
- Small "Powered by Featurable" branding on free plan
- Site: https://featurable.com

## Alternatives

| Service | Free Tier | Auto-Update | Notes |
|---|---|---|---|
| Featurable | Unlimited views | Yes (24-48hr) | Best free option |
| Elfsight | 200 views/mo | Yes (~72hr) | Useless on free; $6/mo paid |
| Trustmary | 200 views/mo | Yes | Same cap problem |
| Shapo | 10 reviews | Yes | Review count cap |
| Google Places API | $200/mo credit | Manual | Only 5 reviews, exposes API key |
| Direct Google embed | N/A | N/A | Doesn't exist for reviews |

## Why Not Google Places API

- Hard cap of 5 reviews (no pagination)
- API key exposed in client-side code
- Have to build UI yourself
- Every page load = API call = cost

## When Ready

1. Create Featurable account, connect Google Business listing
2. Copy embed snippet
3. Add reviews section to homepage or location pages
