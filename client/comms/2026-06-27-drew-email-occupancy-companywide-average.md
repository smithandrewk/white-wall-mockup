# Drew email — Occupancy tab: company-wide should be an average, not a sum

- **Source:** Gmail, thread "WhiteWall dashboard revisions" (`19ed260797a3f02c`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Sat, 27 Jun 2026 16:06:42 -0400
- **Msg id:** `19f0ab1392fbd9cc` (`<03D2CB65-2C3F-4F4A-95D1-979AF6E5C471@entrpy.co>`)
- **Class:** change-request (dashboard bug fix)

## Verbatim

> In the occupancy tab, the occupancy for company wide needs to be an average of Powdersville location and Taylors mill location. Not adding them up, it should be 16%. You need to add up total time across the company and find the average occupancy for the whole company.

## Triage

Dashboard-only metric bug. Company-wide occupancy currently appears to SUM the two
locations' occupancy percentages; Drew wants a true company-wide occupancy = total booked
time across both locations / total available time across both locations (a time-weighted
average), which he says should read ~16%. Not money/legal/customer-scale — gate is
`npm run build`. Ship-now.
