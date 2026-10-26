# 34 · Search records

When a parent calls, staff need the family on screen before the second ring. This video shows how search finds children, families and events by name or by part of a phone number, and how it only ever returns what the person searching is allowed to see.

## What search promises

Type part of a name, an email or at least three digits of a phone number. Results come back grouped as children, families and events, ten of each at most. Punctuation in a phone number doesn't matter. A youth worker only finds the children and families of the sessions she works. Events only appear when Permission slips is on, because events live there. Another organization's records are never returned.

## Jaylen searches

Here is Search on Jaylen's laptop. He types Rivera. Mateo and Sofía appear under children, and the Rivera household under families, with Carmen's number. Then he types part of a phone number, five five five, zero one six three, and the Tran household comes up.

## Nothing found, and errors

When nothing matches, search says so and, for staff who can, offers to add a family. If search fails, it offers to try again.

## How it is tested

Backend tests cover name fragments grouped by type, a phone fragment with any punctuation, a youth worker finding only her families, events left out with Permission slips off, another organization finding only its own, and search answering not found with Roster off. The browser tests search from the top bar on desktop and the page on phones, with accessibility checks.

## Recap

Things to remember. Names, emails or phone digits. Grouped by type. Only what you're allowed to see. Next, the notifications that tell staff what changed.
