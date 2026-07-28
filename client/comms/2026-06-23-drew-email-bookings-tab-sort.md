# Drew email — dashboard bookings tab sort/filter (verbatim)

- **Source:** Reply on thread `19ed260797a3f02c`, work mailbox.
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Tue, 23 Jun 2026 08:08:53 -0400 (msgid 1C99B8A3-38CF-4932-8C28-7E366ECA7487)
- **Repo:** wws-dashboard (folds into the V3 dashboard work, PR #63 worker/v3-dashboard).

---

Hey Pip, another thing.
On the dashboard, for the bookings tab, I want them to auto display in order of the next booking to physically happen on the calendar.

Also, in the top left corner of this booking chart, I want to have a way to toggle between Powdersville, Taylors Mill, or company wide.

Next to that button, I want another button to change the order of the display of the bookings. Default is the next ones to physically happen on the calendar, then next option is bookings in order of when they booked the session itself on the website, starting with the most recent booking booked at the top, and then last option is Events that are going to physically happen in the studio next. So I can easily just see all the vent bookings coming up, in what order.

These two buttons don't even need to be in the header of the table chart, they can be separate buttons above the chart, below the outstanding balance card. . Theyre just quick access buttons fo rme.

---

## Triage
Bookings tab (wws-dashboard): (1) default sort = next session to physically happen (soonest upcoming start, calendar order). (2) Quick-access buttons ABOVE the chart, below the outstanding-balance card: a location toggle (Powdersville / Taylor's Mill / company-wide) and a sort-order toggle with 3 options — (a) next-on-calendar [default], (b) most-recently-booked-on-website-first (by booking creation date desc), (c) events only, in calendar order. Powdersville-first ordering convention applies to the location toggle. Folds into PR #63.
