# Drew emails — dashboard charts + campaign redesign/send (verbatim)

Thread `19ed260797a3f02c`, work mailbox. Repo: wws-dashboard (folds into the V3 dashboard work).

---

## Message — 2026-06-23 10:05 (msgid AF2B5C68-C4B0-4EB1-B794-80B3DFF32171) — charts + Revenue tab

Incredible! In the dashboard, there are tons of charts. For example, the homepage overview has a chart with the $48,000. Revenue has a chart where you can see net revenue over time, and there are tons of stat options as well. They all have their own charts.

I personally don't like it where you have to hover your mouse over this continuous line that ebbs and flows up and down. I'd much rather be a bar chart where I can visually tell, without having to hover my mouse exactly where each individual bar goes. Let's convert all the charts that make sense to a vertical bar chart like that

Additionally, specifically in the Revenue tab, let's do a bunch of renovations here. Right now, there are four cards at the top of the screen:
Net collected over the last 12 months
Let's change that to default to net collected this year to date. With the toggles, we can toggle between company-wide, Taylor's Mill, or Powdersville. I also like having additional options right there where I can switch it over to:
the last 12 months
the last quarter, et cetera
At the bottom of this revenue tab, you have a horizontal bar chart for booked value by session type, and it looks great, but the text is all jumbled. We probably need to spread it vertically a little bit more so the text doesn't get all jumbled for each individual bar. I also think we need to add some more dollar denominations at the very bottom to match up with each individual horizontal bar.

---

## Message — 2026-06-23 11:02 (msgid E0C713BE-2CC0-4306-9250-75832490FCC6) — campaign email/text redesign + send

Campaign new email design and copy:

Subject line logic:
25% OFF WhiteWall Bookings! – This weekend Only

Email Copy:
Header: WhiteWall Studios (no space between white and wall)
Bold Header: Last Minute Availability, At a Discount.
Subtext: We're giving 25% off to existing customers for all new bookings made for this weekend! See what Location and Times are available, use the coupon code below, and book this weekend 25% off!

Your Code design card Logic:
Flagship Location – Saturday.
Code.
Book Flagship Location Link.
dont put sub text of 25% off you session.

continue this format for the other 3 options.

keep the text saying the code ends Sunday at 12pm.

keep book your session button.

keep the already booked sentences.

get rid of "youre receiving this because…" sentence.
keep the address in there still and the unsubscribe clause too.

For the Text design and copy – less isomer. This is what should be on the text:
Header text: Last Minute WhiteWall Availability, At a Discount
Subtext: We're giving 25% off to existing customers for all new bookings made for this weekend! See what Location and Times are available, use the coupon code below, and book this weekend 25% off!

Then leave two Returns for spacing, and do this:
Flagship Saturday:
Code –

Flagship Sunday:
Code

Etc.
And one link at the bottom to click on that takes your other book the flagship location.

Thats it. Less it more.

Make those revisions for me to review. Let me know when done. Im also having a hard time figuring out how to actually send this email out to these first 50 people. I do like the test option tho. I want to test it with the nee email copy first, and then try sending it out to honestly everyone on the total available email list – provided it works for me first. No nee for the 25 person cap etc. rn I cant figure out how to add the recipients to blast to send it. It just says "send to 2 reciepients". I see the button that says Lord recipient form client list, which is great. I then click it, it puts the first 50 recipients into the giant text box, and then at the very bottom it says 50 recipients, over 25 cap. I guess I need to delete 25 people to be able to send it to 25 recipients?

As long as the test email is working, there really shouldn't be a cap. I should be able to load all 1,248 people, whatever that number is, and then send it out to all of them at the exact same time.
We also need to make sure we are tracking how many people unsubscribe form the email list after we send this blast out.

---

## Triage
**Charts (wws-dashboard):** convert continuous line charts to vertical bar charts where sensible (overview $ chart, revenue-over-time, stat charts). Revenue tab: top cards default to net-collected-YTD with company/PV/TM toggle + time-range options (YTD / last 12 months / last quarter / etc.); bottom "booked value by session type" horizontal bar chart — increase vertical spacing so labels don't jumble + add $ axis ticks aligned to bars.
**Campaign email redesign:** per the copy/layout above — header "WhiteWall Studios", bold "Last Minute Availability, At a Discount", the subtext, per-location code cards ("Flagship Location – Saturday / Code / Book link", NO "25% off your session" subtext on cards), keep "code ends Sunday at 12pm", keep "book your session" button, keep already-booked sentences, REMOVE "you're receiving this because…", KEEP address + unsubscribe.
**Campaign SMS redesign:** minimal — header + subtext, blank line, per-location "Flagship Saturday: Code –" lines, one book link at bottom.
**Send mechanics:** remove the 25-recipient cap; support loading the full client list (~1,248) + sending to all at once; KEEP the test-send; respect suppression/unsubscribes; track unsubscribe count after a blast. SAFETY: build the capability but actual blast stays a deliberate human click after a successful test — no automatic/cron blast; a confirmation showing the recipient count for large sends.
