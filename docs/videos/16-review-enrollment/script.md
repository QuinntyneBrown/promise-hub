# 16 · Review enrollment

Families have enrolled through the link, and their children are waiting. This video shows how Tom, the office manager at Harbourview, reviews them on the program's roster: one child at a time with a note, or several together. It also shows what the guardian is told, and what happens when the camp is full.

## What review promises

Nothing joins a roster until an admin or a program director accepts it. Each child waits with the guardian, their age, the date they applied and whether the family is returning. Tom can accept, put the child on the waitlist with the next number, or decline with a reason the guardian will read. Every decision texts the guardian, and every decision is in the audit log.

## Tom reviews one child

Here is the Winter Camp roster on Tom's laptop, with three children waiting review. He taps Accept beside Ada, adds a welcome note, and the button says who will be texted. Ada leaves the queue, and the Enrolled tab now shows her.

## Several at once

On his phone, Tom selects Kevin and Yusuf. A bar shows two selected, with Accept and Waitlist. He confirms, both guardians are texted, and the queue is empty.

## Full camps, declines and other roles

If the camp is full, accepting is refused and the dialog says to waitlist instead. Declining needs a reason, because the guardian reads it. A site lead who opens the roster review is told who reviews enrollments.

## How it is tested

Backend tests cover the queue with returning and new families, accepting onto the roster with the guardian's text and an audit entry, a second decision refused, waitlist positions, a decline without a reason, capacity, bulk review, site leads refused, another organization's requests never found, and the roster module switched off. The browser tests follow Tom on phone and desktop, with an accessibility check on the page and both dialogs.

## Recap

Things to remember. Staff review before the roster. Accept, waitlist with a number, or decline with a reason. Every guardian is texted. Next, the guardian's own view of the status.
