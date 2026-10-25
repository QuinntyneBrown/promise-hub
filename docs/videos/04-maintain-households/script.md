# 04 · Maintain households

The roster is the data every other module reads. Check-in, Quick Cards, slips and messages are only as good as the households behind them. This video shows Tom, Harbourview's office manager, keeping that roster right, and what the people who should not see medical details see instead.

## What the roster promises

A household holds guardians and children. Each child carries a date of birth, a school and medical details. Families can be searched by a child, a guardian or a phone number, and households nobody can reach are flagged. Every change is audited, every view of medical details is logged, and a deleted household is kept for thirty days before it is purged.

## Tom keeps the roster

Here is Tom in Families on a laptop. He searches for Mateo and opens the Rivera household: two children and two guardians, Carmen and Luis, the children's uncle. He adds Lucía, the newest Rivera, with her date of birth and school. Then he opens Mateo, whose card shows the peanut allergy, his EpiPen and his doctor, and adds sesame to the allergies. The card now says Tom changed it, and the audit log holds both versions.

## The states

The add family dialog asks only for the first guardian and a way to reach them; leave both empty and each field says what is missing. A household with no mobile number and a bounced email carries the missing info flag, so the office knows who to chase. Deleting a household asks for a reason and for its name to be typed, and the button stays disabled until it matches.

## Who sees what

Aisha is a youth worker. On her phone she sees the Rivera household, but no allergy or medication flags, and a note that some details are hidden for her role. On Mateo's page the medical card says so too. The server never sends those fields to her, so nothing is hidden only by the screen. Office staff and directors add and edit; site leads read medical details and every read is logged; only admins delete.

## How it is tested

Backend tests list, search and filter households, add families, children and guardians, edit medical details and check the audit entries, prove that another organization's household answers not found, check each role, and turn the roster off. The browser tests do the same journeys at phone and desktop widths with an accessibility check on every page and dialog.

## Recap

Things to remember. Search finds a child, a guardian or a phone. Medical changes and medical views are always logged. Roles without medical access never receive medical data. A deleted household waits thirty days. Next, program directors create programs and events.
