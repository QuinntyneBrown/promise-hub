# 54 · Manage cohorts and assign mentors

Youth move through a program together, and every youth needs a trusted adult who knows them. This video shows how a program director runs a cohort in PromiseHub: giving the program its term, placing youth on its roster, setting the cohort's lead and supporting mentors, and assigning a mentor to one youth. It also shows what a mentor then sees, and what happens when the Mentoring module is off.

## A cohort is a program

PromiseHub has no separate cohort screen. A cohort is a program, with the roster, capacity, events and archiving every program already has. What a cohort adds is a term. Marisol, the program director at Harbourview, opens After-School Tutoring and taps Edit. Beside the schedule there is a new field, Term, and she types twenty twenty-six to twenty-seven. The program's own start and end dates bound the term, so there is nothing else to fill in. She saves. The header now reads the schedule, the term and the season, and the Programs list shows the term on the row. A term longer than forty characters is refused beside the field, and the change is audited like every other edit to a program.

## Placing youth

Placing a youth in a cohort is enrolling their child record on the program's roster, with Add a child on the program page. Capacity and the plan limit apply as they always have, a child already on the roster is refused, and an archived program takes nobody. The moment a youth is placed, their Learning opens, because placement is what the Learning lock reads.

## The cohort's mentors

With the Mentoring module on, the program page gains a Mentors card. After-School Tutoring has nobody yet, so the card says no mentors yet and offers Assign mentors. The dialog asks for one lead mentor and any supporting mentors. Saving without a lead is refused with choose a lead mentor. Marisol picks Daniel Osei as lead and ticks Hana Kim as supporting, and saves. The card now lists Daniel as lead mentor and Hana as supporting mentor. Saving again replaces the whole team, a mentor may lead one cohort and support another, and the lead cannot also be supporting. Only active mentors of her own organization are offered or accepted.

## One youth's mentor

Each roster row now says who mentors that youth, or no mentor, with a Mentor button. On her phone, Marisol taps Mentor on Mateo's row. Saving without a choice asks her to choose a mentor. If the save fails, the dialog says nothing was changed and keeps her choice, so she simply tries again. She assigns Daniel Osei. The row reads mentor, Daniel Osei, and a toast confirms it. A youth has one mentor at a time: assigning Hana later replaces Daniel, and Remove mentor clears it. Each change is audited.

## What the mentor sees

Daniel signs in and opens Mentoring. His list holds every youth assigned to him directly, plus every youth on the roster of each cohort he leads or supports, each once and by name. A youth whose enrollment ended, or whose cohort was archived, drops off unless Daniel was assigned to them directly. Hana, with no assignments, still sees the empty state. The full mentor dashboard comes next.

## Mentoring off

Turning Mentoring off hides it without deleting anything. The program page neither asks for mentors nor shows the card or the Mentor buttons, and every assignment endpoint answers not found. Turn Mentoring back on, and the same team and the same assignments are there. Roster off answers not found too, and the Programs route goes to Today. Site leads and other staff can read the assignments but not change them; youth, mentors and volunteers are refused. An archived cohort shows its mentors read only, and another organization's cohort is never found.

## How it is tested

The API tests save a term, read it back in the program and the list, refuse a long one, and check the audit entry. For mentors, they read a cohort's mentoring, assign, replace and remove a youth's mentor, set a team, refuse a missing lead, a lead who is also supporting and anyone who is not an active mentor, and prove what each mentor's list holds. They cover roles, another organization, archived cohorts, and both modules being off. The browser tests run each screen on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. A cohort is a program with a term, and placing a youth is enrolling them. While Mentoring is on, a cohort has one lead and any supporting mentors, and each youth has one mentor. A mentor sees exactly the youth assigned to them and the youth of their cohorts. Next, mentors use their dashboard.
