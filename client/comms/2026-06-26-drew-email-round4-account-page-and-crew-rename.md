# Drew email — round 4: account-page restructure, crew rename, nav label, checkbox parens (verbatim)

- **Source:** Reply on thread `19ed260797a3f02c`, work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Fri, 26 Jun 2026 09:26:05 -0400
- **msgid:** `<198F1231-3F38-4420-A0C5-93CEB504C53F@entrpy.co>`
- **Attachment:** `2026-06-26-drew-round4-attachments/setup-crew-photo.jpeg` (the email thumbnail for the crew add-on).

---

## Verbatim message body

Pip,

I'm loving the new website and dashboard updates. I wanted to flag a couple of things I think we can make even better. 

- Whenever I'm going through the booking process, I want to change the three checkboxes (only for events)  underneath the required acknowledgments section. For the last two checkboxes, let's add some parentheses that elude this being optional because of the setup crew add-on availability. My thinking is to keep exactly what we have for those last two points, but then put parentheses that say “Unless you select the Setup Crew Add-On”. 

Also, for the setup crew add on, use this photo in the email for the thumbnail. 

Let’s also change the name of this add on to: Event Setup and Reset Crew. Change that language everywhere on the site. 

Also, on the site, I can login perfectly. I logged in through google, and it worked. Went to my account and everything. Once I was on the site, I go to the top right tab in the menu bar, and it says "My Account" because I'm already logged in. If I'm not logged in, it just says "Account". If I'm logged in, let's keep it "My Account". If I'm not logged in, let's change that to say "Login/Create Account". Then, of course, they can either log in through Google or they can make their own account, and we just need to get all their information from them. It's also important that all their account information auto populates every single time they go to make a new booking. Lastly, because I'm already logged into my account when I click in there, it says "Your Account" and then it gives me:
the name
phone
email
Instagram
payment information
your sessions
Two things you need to change here:
Underneath where you have the title text saying "Your Account”, make a sub tab that says Account Info: then we need to have their full name, Company name, an optional spot for Company Website. 
Then another sub section that says Contact Info: it should all be mandatory. Email, phone, instagram. 
Then a section that says Card On File
Then Your Upcoming Sessions (they should be able to see all the different sessions they have on the calendar upcoming, see all the details for that booking, and then be able to edit it per the conditions we put in motion before. )
Then Completed Sessions ( this is where they can see a historical record of all their previous sessions they've had in the finances and add-ons tied to it specifically)




￼

---

## Triage — 6 items (all UI/copy/profile; none hit money/architecture/legal/customer-scale, so build + ship autonomously)

1. **Event acknowledgment checkboxes (booking flow):** for the LAST TWO of the three events-only acknowledgment checkboxes, append a parenthetical "(Unless you select the Setup Crew Add-On)" — keep existing text, the parens signal those two become optional when the crew add-on is purchased. Copy change in scripts/booking-flow.js.
2. **Crew add-on email thumbnail:** use the attached photo as the thumbnail in the (setup-crew) email. Save into images/ + wire into the add-on/email. (Confirm WHICH email — likely the booking confirmation / owner notice; the add-on card image too.)
3. **Rename the add-on EVERYWHERE:** "Studio Setup Crew" -> **"Event Setup and Reset Crew"**. booking-config.js (name + copy), booking-flow.js, acuity.js notes, FAQ entry, anywhere the string appears.
4. **Nav label when logged OUT:** currently "Account"; change to **"Login/Create Account"**. Logged-in stays "My Account" (already works). Update scripts/nav-account.js + the static link default. (Drew confirmed Google login + My Account work great.)
5. **Auto-populate booking from account:** when logged in, every new booking pre-fills ALL their account info (name/company/contact/etc.). booking-flow.js reads the profile (WWSAccount.fetchProfile) and pre-fills.
6. **/account page restructure** into titled sub-sections under "Your Account":
   - **Account Info:** full name, **Company name (NEW field)**, optional **Company Website (NEW field)**.
   - **Contact Info** (all mandatory): email, phone, Instagram.
   - **Card On File**
   - **Your Upcoming Sessions:** all upcoming calendar sessions, full details, editable per the item-7 conditions (reschedule/add-only already built).
   - **Completed Sessions:** historical record of past sessions with the finances + add-ons tied to each.
   New customer fields company_name + company_website (migration), profile form to edit them, profile.js to return + split sessions upcoming vs completed (by starts_at vs now), completed shows spend + add-ons.

**Plan:** one PR (worker/v3-round4) on white-wall-mockup. Quick copy wins (1,3,4) + asset (2) + the account-page rebuild + 2 new profile fields (5,6). Verify on staging + Playwright, ship to prod. Reply to Drew. Items 5/6 reuse the existing accounts + item-7 edit infra (all live).
