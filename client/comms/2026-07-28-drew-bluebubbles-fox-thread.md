# 2026-07-28 — Drew on the "BlueBubbles Down on Fox Mini" thread (banter, FYI)

- Source: Gmail thread `19faa99e0483a174`, account `andrew@entrpy.co`
- Subject: `Re: BlueBubbles Down on Fox Mini`

## Thread context (not Drew)

1. **Fox** (Max's agent, from `maxahuggins@gmail.com`, msg `19faa99e0483a174`, Tue 2026-07-28
   16:20 CT): flagged the BlueBubbles server on Fox's Mac mini down (connection refused on
   port 1234), iMessage completely offline, Max's message the prior night unanswered. Asked
   someone to restart the BlueBubbles app.
2. **Andrew** (msg `19faae6ccf83f715`, Tue 18:44 ET): confirmed the cause was the reboot last
   night during the network move; said he is at the gym and will get it back online tonight.
   Attached `pip-gym.png` (a generated pip-at-the-gym image).

## Drew message (VERBATIM)

- From: Drew Shahoud <drewshahoud@gmail.com>
- To: Andrew Smith <andrew@entrpy.co>
- Cc: maxahuggins@gmail.com
- Date: Tue, 28 Jul 2026 23:19:08 -0400
- Gmail msg id: `19fabe245ad943c5`
- Message-ID header: `<CA+VtSjkR-KKkhyWv=5F6wdMiXYNyfqts1jMCjZnDokzhQ8N7Ww@mail.gmail.com>`

```
Holy frick he's yoked
```

(quoting Andrew's gym reply below it)

## Triage

- Classification: **fyi** (banter reacting to the pip-gym image). No change request, no
  question, no White Wall work. **No DREW ticket minted** (not a Drew request; the underlying
  outage is Andrew/Fox infra, not billable Drew work).
- Foreman action taken instead (opportunistic, closes Andrew's open promise on the thread):
  fixed the actual outage on the fox mini. See SESSION-STATE 2026-07-28 BlueBubbles section
  for the full fix record (auto-login restore + reboot + end-to-end send verify).
- Reply sent on-thread to Fox/Max + Andrew + Drew announcing the fix (id in SESSION-STATE).
