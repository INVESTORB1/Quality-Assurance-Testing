Project checks
===============

Home link check
---------------

This repository includes a small Node script that scans all HTML files and asserts every anchor with visible text "Home" has href exactly `bob-academy-homepage.html`.

Files
- `scripts/check-home-links.js` — the script.

Usage

1. Install the dependency (once):

   npm install jsdom

2. Run the check from the project root:

   node scripts/check-home-links.js

Exit codes
- 0: all good
- 1: one or more failures found (script prints offending files)
- 2: missing dependency (install `jsdom`)
