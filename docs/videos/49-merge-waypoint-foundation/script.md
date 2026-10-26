# 49 · Merge Waypoint: foundation

Waypoint is a youth leadership platform: lessons, quizzes, assignments, mentors, cohorts and a public site. It is coming into PromiseHub one journey at a time, in prompts fifty to eighty-one. This video shows the foundation those journeys stand on: where each part of Waypoint lands, three new modules, three new roles, and the cast that tests and demos now use.

## Where Waypoint lands

Most of Waypoint already has a home. A cohort becomes a program, a session becomes an event, and attendance is Roll Call, so there is one attendance system, not two. Applications use the open enrollment link, announcements use Messages, and guardians still use verified links instead of accounts. The mapping is written once, in architecture decision record forty-three, so every journey prompt follows the same rules.

## Three new modules

What is new becomes three modules. Learning holds lessons, quizzes, badges and the authoring behind them. Mentoring holds the mentor's youth, check-ins and at-risk flags. Public website holds an organization's public pages. Each one needs the roster, each one starts off, and the whole suite preset leaves them off, so nothing changes for an organization until an admin turns one on.

## Tom switches them

Here is Tom, Harbourview's admin, in Settings, Modules. Learning and Mentoring are on, listed after Reports, each saying it needs the roster. He turns both off and saves. Back on Today, his More menu no longer lists Curriculum, because curriculum authoring belongs to Learning. He turns them back on, saves, and Curriculum returns. He opens it, and it says no tracks are written yet. Turning a module off hides it; it never deletes anything, and turning it back on restores every record.

## Three new roles

There are three new roles. A youth signs in with an account linked to one child record in their own organization, and reads only that record. A mentor sees only the youth assigned to them, and nobody is assigned yet. A volunteer runs only the sessions they are assigned to, just like a youth worker. Every existing staff endpoint now refuses these roles unless it opts in, so families, search and the staff summary stay closed to them on the server.

## The shell follows

Here is Sofía, a youth, on her phone. Her tab bar shows Today and Learning, with no search and no staff sections. She opens Learning. Then Tom turns Learning off. Sofía's Learning tab is gone, the address for Learning brings her back to Today, which says there is nothing to do yet, and her More menu lists only Today, notifications and her account.

Daniel, a mentor, gets Today and Mentoring. His list is empty until a program director assigns him youth.

## How it is tested

The API tests turn each module off and on and check the answer is not found while it is off, for one organization and not the other. They prove every staff endpoint refuses the new roles, that a volunteer opens only his assigned session, and that a youth account links only to a child in its own organization. The browser tests check each role's navigation, each module's address when it is off, and run accessibility checks on every new page.

## Recap

Things to remember. Waypoint maps onto programs, events, Roll Call and Messages where it can. Learning, Mentoring and Public website are modules that start off. Youth, mentors and volunteers see only what is theirs. Next, youth and mentors sign in.
