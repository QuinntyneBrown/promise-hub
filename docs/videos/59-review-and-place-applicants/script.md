# 59 · Review and place applicants

Applications now arrive three ways: from parents, from young people themselves, and from the teachers and counsellors who refer them. This video shows how an admin or program director works all of them from one place in PromiseHub: reading who applied and why, keeping notes, and placing a young person into a cohort, or waitlisting or declining with a message to the family.

## One pipeline

Tom Nguyen is the office manager at Harbourview. Applications is in the More menu while the Roster module is on, and Today's count of enrollments to review leads straight to it. Everything waiting review in every program is listed newest first. Each row says who applied: a guardian by name, a young person applying for themselves, or a referral with the referrer's name and role. A referral is marked, and so is an application still missing the season consent. The tabs filter by status on the server, with a count for each: waiting review, waitlisted, accepted and declined.

## Reading an application

Tom opens Zoe Campbell. The young person card shows her date of birth, the program she applied for, her status and whether the season consent was given. For a referral, the next card is Rachel Ellis: her role, her school, the email she verified and why she is referring Zoe. The family card shows Tanya Campbell, her mobile, her language and that this is a new household. When a young person applies for themselves, that card says so instead, and reminds Tom who must consent.

## Staff notes

Notes are for staff only. Tom adds one after calling Tanya, and it appears first with his name and the time. A note can be up to two thousand characters, an empty one is refused, and each one is audited without its text. No guardian page, link or message ever reads them.

## Placing a young person

A cohort in PromiseHub is a program. Place opens a dialog with the organization's programs that are not archived, each with its places taken. The one Zoe applied for is chosen, and a full cohort can't be picked, so Tom waitlists instead. He adds a note to the family. Because Tom is an admin and Learning is on, he can also invite Zoe to a youth account with her email. Placing moves the application to the chosen cohort, enrolls Zoe on its roster, texts Tanya with the note and is audited. The invitation goes out after the placement, through the same youth invitation as a child's record. If it is refused, say for an email that already has access, Zoe stays placed and the dialog says why.

## Waitlist or decline

Waitlist and Decline open the same review dialog as the program roster, with only those two choices. Malik Johnson goes on the waitlist and his place shows on his application; he can still be placed later. Declining needs a reason the family will read, so an empty one is refused. Once an application is accepted or declined it says who decided, when and what the family read, it offers no more decisions, and notes can still be added.

## Every state

With nothing waiting review, the pipeline says you're all caught up. A failed load offers Try again. Another organization's application is simply not found, and a site lead or youth worker is told that only admins and program directors review applications. With Roster off, the routes lead back to Today and the API answers not found.

## How it is tested

The API tests cover the list and its counts, each status, the application with its referral and family, notes and their limits, placing into another cohort, leaving a waitlist, full and archived cohorts, decided applications, other roles, Roster off and another organization. The browser tests walk the pipeline, the application, notes, placement with and without an invitation, waitlisting and declining on a phone and a laptop against the fake API, with accessibility checks on every screen.

## Recap

Things to remember. One pipeline lists every application with who applied. Notes stay with staff. Placing chooses the cohort, enrolls the young person, texts the family and can invite them to a youth account. Waitlisting and declining work as on the roster, with a message the family reads. Next, managing youth, mentor and volunteer accounts.
