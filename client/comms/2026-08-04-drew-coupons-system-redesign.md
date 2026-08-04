# Drew — Coupons system redesign (evergreen/campaign, columns, redemptions drill-down, generating tab)

- **Source:** Gmail thread `19fa478568fc46a2` "WhiteWall Dashboard Revisions" (work mailbox `andrew@entrpy.co`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Tue, 4 Aug 2026 09:26:52 -0400
- **msgid:** `19fccf4d73481f38`
- **Classify:** change-request (deliberative — large, multi-part, design questions asked)
- **Access:** PAID window active (Drew paid $30 for the day; access GRANTED per launch). armed=ON.

## Verbatim

> Pip lets rip it. Give me a link, and let's get it.
>
> First thing we'll work on:
> Coupons.
> The coupon tab is great, but there are way too many active coupons. A majority of them are the coupons that we do for weekends. It seems like they're not auto-deleting, so we're going to go with that. Any campaign-based coupon codes that we have for weekends and such should only last that single weekend. If no one uses it at all, then the coupon just deletes entirely from the system. If someone does use one of them, then it should reflect in the coupon tracking redemptions list, which we already have on that toggle, which is great. For the actual coupon lists that you have, when we click on the coupons tab and then the coupons toggle, it should really only be the active coupons we have. Another important thing is I want to have different sections here:
> Evergreen coupons: These are coupons that work all the time, no matter who has a coupon, and they're pretty much always active. These ones are the 20% off, 25% off, Switch 20, Thank You, 75%, WW10, WWS50, and WWS100. Those are just always active and always live as evergreen coupons. Of course, I can still deactivate them whenever I want to, but those work infinitely for whoever wants to use them whenever they use it. Of course, we still keep track of the progress for that coupon in the redemptions section under the coupon tracking.
> The other coupons should pretty much only be the active coupons we have out right now. There probably will be some of these campaign-based ones for the different locations and 25% off, but the only ones that should show up there are the ones that are active. After that weekend passes and those dates are no longer even physically possible, we should delete it. We don't really need it anywhere, honestly. The only place we need those campaign coupons is in the redemptions tab if anyone actually redeems it.
> Also, on this main coupons toggle, I want to have a column for who it's available for. The column can literally be titled "Who?" The default is going to be anyone, but there might be times where we make specific coupons for specific customers, or at least coupons that can only be used whenever a specific email is used for the booking itself. Of course, Watson should be able to communicate with this platform and make coupons as needed. I also want a column that says "Uses?" The default should always be infinite, but there might be times where I only want to make it a one-time use code. That's just an option that I need to be able to have as I'm building out new coupons, so you may need to adjust the coupon generator whenever I make a new coupon. Also, right now the discount column is great, but the text doesn't align centered with it. There's just this random white dead space under the discount column, and then you see the percentages aligned right directly next to the location column. We need to make sure that all the columns and the information are centered.
>
> also, I think there's just some confusion in general right now because whenever I go to the coupons toggle I see 39 total coupons and then it says 39 are active, but then whenever you toggle over to coupon tracking and then says the live codes are only 12, 27 are expired or hidden. So we just need to remediate that because it's confusing. I also want to be able to click on any coupon within the redemptions section. Comma, because it's only there if it's actually been used, comma, and then see who has used that coupon. We pretty much already have that set up right now. I love how we have this section laid out. But really the section data you have here with all the different columns should be, something that opens up once you click on the coupon itself. This section should pretty much only show the coupon that was redeemed and then the data tracking based on that coupon. Then if I click on that coupon, it then opens up another menu that now shows this section. So for example, the first one on this Redemptions toggle is WW10, which is great. So instead of the columns being who used it used on session, session date, studio discount, the column should be how many uses, total money claimed, Powdersville uses, Taylor's Mill uses, average session time per use event slash photo video question mark and then after I click on the actual coupon itself I then see all the information again for every specific person who's used it.
>
> honestly, I'm vocalizing all this while looking at it live
>
> and almost feels like we don't even need the coupons toggle at all. It looks like the coupon tracking toggle is everything we need, or at least that's what it feels like. Maybe I'm not reading that properly. Legitimately correct my line of thinking if that seems accurate, but based off of what I'm communicating so far, doesn't it feel like the coupon tracking toggle has all the information that I want?
>
> The only other thing that I wish we had was a full-blown section, just like the All Coupons, Codes, and Redemptions, that was for coupon generating. If my line of thinking is correct, I think the two toggles shouldn't be Coupons and Coupon Tracking. It should be now Coupon Tracking and Coupon Generating. I click to that Coupon Generating toggle, and that's where there's a whole section with great UI for me to physically build out the coupons manually rather than having to click that New Coupon button.
>
> Let me know your thoughts. Let's try and get this fixed

## Triage (parsed sub-requests)

1. **Campaign-coupon lifecycle / auto-expiry** — weekend/campaign coupons should be scoped to a date window; after the window passes, if never redeemed → delete from system; if redeemed → drop from the coupon list but keep in redemptions/tracking. Main coupon list shows only ACTIVE.
2. **Evergreen vs campaign sections** — coupon list split into "Evergreen" (20%, 25%, SWITCH20, THANKYOU75, WW10, WWS50, WWS100 — always live, manually deactivatable) and campaign/active-only.
3. **New columns:** "Who?" (default anyone; can bind a coupon to a specific customer email) + "Uses?" (default infinite; can be one-time). Generator must expose both. Watson too.
4. **Alignment bug** — discount column text not centered; dead space + right-aligned %; center all columns.
5. **Count reconciliation** — Coupons toggle "39 total / 39 active" vs Coupon Tracking "12 live, 27 expired/hidden". Confusing — remediate.
6. **Redemptions drill-down redesign** — redemptions list becomes per-coupon AGGREGATE rows (uses, total money claimed, Powdersville uses, Taylor's Mill uses, avg session time, event/photo-video); click a coupon → detail with the current per-person columns (who used it, session, date, studio, discount).
7. **Structure question (asked for my recommendation)** — does the Coupons toggle even need to exist? He proposes the two toggles become **Coupon Tracking** + **Coupon Generating** (a full manual builder UI replacing the "New Coupon" button). Correct his thinking if wrong.

## Escalation check
- Coupons are Drew's money/policy call — [[drew-self-authorizes-money]] — data writes to the pip-owned coupon table. No hard gate on creating/expiring coupons.
- **Cross-repo watch:** "Who?" (email-restricted) + "Uses?" (one-time) are ENFORCED at booking-site checkout redemption, not just dashboard display — booking `api/` validate path must honor them or it's cosmetic. Verify enforcement point before promising it.
- Auto-DELETE of DB rows on a schedule = irreversible data lifecycle. Reversible-ish (recreate) + Drew-authorized; soft-note. Redemption history must survive the row deletion.
