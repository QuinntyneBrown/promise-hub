# 28 · Update household details

Phone numbers change, families move between languages, and a child develops a new allergy halfway through the season. If the only way to fix the record is to call the office, it stays wrong. This video shows how a guardian corrects their own details and their child's health information from the family page.

## What updating promises

After the same six-digit code check as every guardian page, the family page shows the guardian's mobile, email and language, and each child's allergies and medication. Each opens a short form. Bad entries are caught and named, and nothing is saved until they're fixed. Staff see the change at once, on the household and on the Quick Card, and every correction is recorded as made by the guardian. A new mobile number ends the current link, so the next link goes to the new number.

## Linh corrects her details

Here is Linh's family page on her phone. She taps Update your details, adds her email, and saves. Then she opens Kevin's medical details, adds his peanut allergy, and saves. The page shows the new allergy, and Jaylen will see it on Kevin's Quick Card tonight. She didn't need an account or a password, and she didn't need to wait for the office to open. The record is right before the next session starts.

## Language and a new number

If Linh prefers French, she picks it in the same form, and the page and future messages switch to French. If she changes her mobile number, this link stops working on purpose, so links always go to the number on file.

## How it is tested

Backend tests cover email and language changes seen by staff, a new mobile ending the link, invalid contacts named, medical changes on the Quick Card with an audit entry, another household's child refused, and an unverified phone refused. The browser tests follow Linh on phone and desktop, including the invalid email, the switch to French and the changed number, with accessibility checks.

## Recap

Things to remember. Families keep their own record current. Staff see changes at once. A new number means a new link. Next, sending messages to families.
