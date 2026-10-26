# 43 · Request household data

Families have a right to see what an organization holds about them, and to ask for it to be deleted. This video shows how Carmen asks from her family page, and how Tom answers in a couple of clicks, with every step on the record.

## What data requests promise

A guardian asks from their family page, which only opens on a verified link. They choose a copy of their data or deletion, and give an email. The request is recorded, and admins and directors get a notification. In Settings, under Privacy, staff see the requests. Sending a copy builds a file with only that household's guardians, children and enrollments, keeps it for download, and emails the guardian. Deleting removes the household, its guardians and children, and they're purged after thirty days. Each request is fulfilled once, and every step goes in the audit log.

## Carmen asks for a copy

Here is Carmen's family page on her phone, in Spanish. Under Your data she asks for a copy, the email is already filled in, and she sends it. The page says the request was received and they'll hear back within thirty days.

## Tom sends it

Here is Privacy and data on Tom's laptop. The Rivera household's request is waiting. He chooses Send copy. The toast says the copy went to Carmen's email, and the request shows it was done by Tom, with the file ready to download.

## How it is tested

Backend tests cover a verified guardian asking and admins being told, an email required, an export containing only the household and emailed and audited, a deletion soft-deleting the household for thirty days, fulfilling twice refused, site leads and other organizations kept out, and a survey link never opening the family page. The browser tests follow Carmen asking in Spanish and Tom sending a copy and deleting a household, with accessibility checks.

## Recap

Things to remember. Families ask from a verified page. Staff fulfil once. Exports hold only that family; deletions purge after thirty days. Next, reviewing the audit history.
