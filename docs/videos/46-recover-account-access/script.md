# 46 · Recover account access

Everyone forgets a password eventually, usually five minutes before a session starts. This video shows how a staff member gets back in on their own: a link by email, a new password, and straight back to Today.

## What recovery promises

From the sign-in page, "Forgot your password?" asks for a work email. The page always says a link is on its way if the address has an account, so it never reveals who has one. The emailed link works once, for one hour, and only a scrambled version of it is stored. Opening it names the account. The new password must be at least twelve characters, typed twice. Saving it signs out every other device, is recorded in the audit log, and signs the person in, through the two-step code when their role needs one.

## Jaylen asks for a link

Here is the forgot password page on Jaylen's phone. He enters his work email and asks for a link, and the page tells him to check his email.

## Jaylen chooses a new password

Here is the link from that email. It names his account. He types a new password twice and saves it, and he's straight back on Today.

## When a link has expired

A link more than an hour old, or one already used, says it has expired and offers a new one.

## How it is tested

Backend tests cover a link emailed with the same answer for unknown addresses, a valid link setting a password that signs in while the old one stops working, other devices signed out, short and mismatched passwords refused per field, and links expiring after an hour and working only once. The browser tests follow Jaylen from sign in to a new password, plus the errors and an expired link, with accessibility checks.

## Recap

Things to remember. The answer never reveals who has an account. Links work once, for an hour, and are stored scrambled. Resetting signs out other devices. Next, platform admins managing organizations.
