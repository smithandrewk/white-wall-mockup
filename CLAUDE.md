# White Wall Studios - Website Mockup

## Context Management (Avoid Rate Limits)

This project involves multiple large HTML files. Follow these rules to avoid blowing up the context window:

- **Never read back files you just wrote.** The content is already in context from the Write call.
- **Run `/compact` after writing or editing multiple HTML files.** Large HTML files snowball the context fast.
- **Split multi-phase work into separate sessions.** Don't do HTML mockups and LaTeX design sheets in the same session.
- **Prefer Edit over Write** for changes to existing files. Edit sends only the diff, not the full file.
- **Avoid bulk re-reads.** If you need to check consistency across pages, read one at a time, compact between if needed.

## Project Structure

- `index.html` - Main landing page
- `taylors-mill.html` - Taylors Mill venue page
- `powdersville.html` - Powdersville venue page
- `gallery.html` - Photo gallery
- `design-sheet.tex` / `design-sheet.pdf` - LaTeX design sheet
- `fonts/` - Web fonts
- `wws-logo.png` - Logo asset
