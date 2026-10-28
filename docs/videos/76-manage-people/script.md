# 76 · Manage people

An organization's accounts grow quickly: staff, mentors, a volunteer, and youth who sign in to Learning. Someone has to find any of them, change what they may do, and turn an account off when a person leaves. This video shows the People directory and the person record in PromiseHub: one place for every account, role changes that are checked on the server, and deactivation that ends access without deleting anything.

## One directory for every account

Tom Nguyen is the admin at Harbourview Youth Collective. People sits in his More menu, beside Settings, and only admins see it. The directory lists every account of Harbourview that has not been removed, by name: Aisha, Daniel and Hana, Jaylen, Leo, Marisol, Nadia, Priya, Sofía and Tom himself. Each row shows the role, the programs a youth's child is enrolled in or a mentor leads, a youth's mentor, the status and when the person last signed in. A page holds twenty five, with Previous, the page numbers and Next.

## Search and filters

Search looks at names and emails. Role, status and program narrow the list, and every filter runs on the server, so a big organization answers just as fast. Tom chooses Mentor and sees Daniel Osei and Hana Kim. He searches for Petrov, and the page says no one matches, with Clear search and Invite staff. The filters live in the address, so the back button returns to the same view.

## A person's record

A name opens the record. Sofía Rivera's shows her account, the child record her youth account follows with her age and household, her program, her mentor Daniel Osei while Mentoring is on, and her Learning progress while Learning is on. The history on the right is the audit log for her account, newest first. A youth account's role is fixed by its child record, so the record offers only Deactivate.

## Changing a role

Leo Martins volunteers on Thursday nights and is taking on more. Tom opens Change role. The dialog offers the five staff roles, Volunteer and, while Mentoring is on, Mentor; never Youth, since youth are invited from their child record. Choosing Youth worker shows a warning: a staff role sees every family's records. Tom confirms. The role applies on Leo's next request, a toast says so, and the history records the change with the role before and after.

## Deactivate and reactivate

When someone leaves, Tom deactivates the account. Cancel has the focus, and the dialog says what happens: they are signed out everywhere and cannot sign in, and their attendance and history stay. After Deactivate, the record says when and by whom, and Reactivate takes the place of Deactivate. Leo's next request answers that the account is inactive, and signing in says the same, but only after the right password. Someone who belongs to two organizations simply continues in the other one. The directory's Deactivated filter finds him, and Reactivate turns him back on with the same role. Both changes are audited. Removing access for good stays on Staff and roles.

## A youth account follows its child

A youth account is tied to a child record. When a household is deleted, by an admin or at a guardian's request, the youth accounts of its children are deactivated with it and audited. Nadia Haddad's record now says her child record was deleted, and Reactivate is disabled; the server refuses it too.

## On a phone

On a phone the filters stack, and the table keeps person, role and status, scrolling within itself rather than the page. The record's cards sit one under the other. Here are the directory and Sofía's record on the phone.

## Modules and other states

People administration belongs to no module and is always on. With Mentoring off, the Mentor column and the Mentor filter disappear, and the server leaves mentoring out of every answer; mentor accounts stay listed so they can be managed. Learning off removes the Learning card the same way. A brand-new organization says it is just you so far. A failed load offers Try again. Marisol, a program director, is told only admins manage people, and the server answers forbidden.

## How it is tested

The API tests cover the directory's search, filters, pages and refused filters, the record with and without Mentoring and Learning, role changes and their refusals, deactivation ending the next request and sign-in, reactivation, a youth deactivated with her household, and every endpoint refusing other roles and other organizations. The browser tests walk Tom and Marisol on a laptop and a phone against the fake API, with accessibility checks on every state.

## Recap

Things to remember. People lists every account of the organization, filtered on the server. Role changes are checked and audited, and a youth's role follows her child record. Deactivation ends access on the next request, keeps every record, and can be undone. Next, resetting a password.
