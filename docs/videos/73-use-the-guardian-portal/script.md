# 73 · Use the guardian portal

Families want to know how their children are doing without creating an account or installing an app. This video shows the guardian portal in PromiseHub: a guardian opens the verified link the organization texted, in their own language, and sees each of their children, the schedule, the consents on record and, when Learning is on, read-only learning progress. They read the announcements meant for their family, and they keep their own contact details current. There is no guardian account. The portal is the household link's family page.

## The family page

Carmen Rivera's household at Harbourview Youth Collective has two children, Mateo, who is nine, and Sofía, who is twelve and has a youth account. Carmen opens the link from her last text. Her phone verified a six-digit code before, so the page opens straight away. Your children lists Mateo and Sofía with the programs they are enrolled in, and each name opens that child's page. Below it, Announcements says two are new, with Read announcements. Everything that was already there stays: enrollments, her details, health and approved pickups.

## A child's page

Sofía's page is read only. Schedule lists the sessions of her programs in the next four weeks, so tonight's Tutoring night is marked Today, and the field trip to the Royal Botanical Gardens follows, marked Cancelled if staff cancel it. Consents shows the consents on record: her participation in Learning and mentoring, given and signed by Carmen with the reference, and the field trip's permission slip, not signed yet, with the date to sign by from the link she was texted. Nothing on this page changes a record.

## Attendance and Learning

While Roll Call is on, Attendance shows how often Sofía came, eleven of twelve sessions, and her five most recent sessions marked present, late, excused or absent. While Learning is on and Sofía has a youth account, Learning shows her overall progress, four of nine lessons, each module with a bar and Complete, In progress or Not started, and the badges she has earned. The numbers come from the same reads Sofía's own journey uses, so they always agree. Her lessons, quiz answers, reflections and her mentor's notes stay between Sofía and her mentor: the answer simply has no field for them. Mateo has no youth account, so his page has no Learning section at all.

## Announcements

Read announcements lists the messages staff sent her household from Messages, newest first, each with who sent it and when, and New on the two she has not read. Permission slip texts, absence alerts and enrollment decisions are not announcements, and messages to other families never appear. Mark all read clears the New badges, the page says she is all caught up, and back on the family page the card says there is nothing new. If marking read fails, nothing changes and the page says to try again.

## Contact details

Carmen keeps her own details current from the family page with Update your details: her mobile, her email and the language for texts and pages, saved and audited. A new mobile number ends every link of the household, so new links go to the new number. The consents themselves are given or withdrawn from their own links, which is why the child's page only shows them.

## On a phone

On a phone, the family page, Sofía's page and the announcements each fit one column with nothing scrolling sideways. Carmen opens Sofía from Your children, and the schedule, consents and attendance stack one above the other. She scrolls to Learning, where each module's bar spans the width of the screen, then goes back with the link at the top of the page and opens the announcements. Every link and button is large enough for a thumb, and the household's language follows her from page to page. Here are the family page, Sofía's progress and the announcements on the phone.

## Language, empty, failed and refused

In Spanish, Carmen's household language, every heading, date and status is in Spanish, while names and announcements read as staff wrote them, and the page tells the browser it is Spanish so a screen reader pronounces it right. Mateo's page has schedule, consents and attendance, and no Learning section. If marking announcements read fails, the alert says nothing changed and the New badges stay. A household with nothing sent yet sees No announcements yet. Another family's child is not available, a link ended by a changed mobile number says it has expired and how to get a new one, and with Messages off there is no Announcements card and the page is not available.

## How it is tested

The API tests cover the family page's children, a child's schedule, cancelled sessions, consents with slips signed and not, Slips off, attendance with late and excused, Roll Call off, Learning progress without any of her work, Learning off, and announcements with read flags, Mark all read, other households, another organization and Messages off, plus unverified devices, expired links and other families' children. The browser tests walk Carmen's family page, Sofía, Mateo and the announcements on a phone and a laptop against the fake API, with accessibility checks on every state.

## Recap

Things to remember. The guardian portal is the household link, not an account. Each child's page shows the schedule, consents, attendance and, when Learning is on, progress, read only. Announcements are the Messages sent to the family, with New and Mark all read. Next, staff announce and message families and youth.
