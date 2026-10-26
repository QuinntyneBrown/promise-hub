# 44 · Review audit history

When a parent asks who looked at their child's medical details, an admin should be able to answer in a minute. This video shows the audit log: every sensitive action, searchable by person, record and time, and exportable.

## What the audit log promises

Every view of medical details, every change to a record, every signature, export and sign-in is recorded with when it happened, who did it and what it touched. Admins open the log under Settings. It starts with the last seven days, newest first. Search matches a person, a record or the details; an action filter and a longer period narrow or widen it, fifty entries a page. Export downloads exactly what's shown as a spreadsheet, and the export is itself recorded. Only admins can read the log, and an organization only ever sees its own.

## Tom checks who viewed Mateo's details

Here is the audit log on Tom's laptop. Carmen signed Mateo's slip this afternoon, and Tom accepted an enrollment. He searches for Mateo, and narrows to views. Jaylen viewed Mateo's medical details last night, on his phone.

## Exporting and access

Export carries the same search and period, so the file matches the screen. Program directors who open the log are told admins read it.

## How it is tested

Backend tests cover newest-first entries with who and what, search by person and action filters, the period leaving out older entries, the export as a spreadsheet that is itself logged, and directors refused while each organization sees its own. The browser tests cover the log, search and action, a wider period with export, no results, the forbidden page and another organization, with accessibility checks.

## Recap

Things to remember. Every sensitive action is recorded. Search by person, record, action and time. Exports are logged too. Next, managing sessions.
