# 52 · Give guardian consent for a youth

A youth under the organization's consent age cannot use Learning until a guardian agrees. This video shows how Sofía is held at the gate, how her mother Carmen consents from a texted link with no account, how staff see the status and send a link, how a guardian withdraws, and where admins set the age and the wording.

## The gate is on the server

Sofía is twelve and signs in to Harbourview with a youth account linked to her child record. When she opens Learning, the server refuses her lessons with a consent required answer, and the page explains why. Hiding a link is never the gate: every Learning call that returns youth work checks consent on each request. Her own record and the request for consent stay open, so the page can explain itself. She taps Ask my guardian, and PromiseHub texts a consent link to the guardians of her household who may sign. The page shows where the link went, masked, and a second tap within ten minutes sends nothing more.

## Carmen consents from her phone

Carmen opens the text. There is no account and no app. Like every guardian link, a new device first gets a six-digit code at a number on file. The page is in Spanish, the Rivera household's language, and says the English wording is the one signed. She reads the organization's wording, chooses how she is related to Sofía, ticks the consent box and types her name. Her first try has no relationship, no tick and a short name, so each field says why and nothing is stored. Then it works. PromiseHub records her name as on file, the relationship, the time, the device, the language, the wording she read with its hash, and a reference, emails her a copy, and audits it.

Sofía taps Check again, and Learning opens. No staff step is needed.

## Staff see the status

On Sofía's record, staff see a Guardian consent card whenever a child with a youth account is under the consent age. It says Needed, Given or Withdrawn, with who signed, the relationship, when and the reference. Admins and program directors can send the consent link from here; other staff roles only read it. Another organization's child is not found, and with Roster off both endpoints answer not found.

## Withdrawing consent

Carmen can change her mind from the same link. The record shows read only, with Withdraw consent. A dialog confirms it. Sofía is gated again from her very next request, without being signed out. The record keeps both the consent and the withdrawal, and the same link offers the form to consent again as a new record.

## The consent policy

Admins and program directors set the consent age and the wording on Privacy and data. The age runs from thirteen to nineteen, eighteen by default, and the wording from twenty to two thousand characters. A change applies from each youth's next request, consents already given stay valid, and saving is audited.

## How it is tested

The API tests check the default policy and its limits, the roles and the module-off answer. They send a link and check the Spanish text, who receives it, the audit entry and the ten-minute rule. They sign with a matching name and check every field of the record, refuse a wrong name or an unticked box, expire a link after thirty days or when a newer one replaces it, and keep consent links away from other guardian pages. They prove the gate answers on every request, that raising the age gates an older youth, that a withdrawal takes effect at once, and that another organization never sees any of it. The browser tests run each screen on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. Consent is checked on the server on every protected youth request. A guardian consents from a verified link, in their own language, with a typed name. A withdrawal gates the youth at once and keeps the record. Next, a new youth completes first-run onboarding.
