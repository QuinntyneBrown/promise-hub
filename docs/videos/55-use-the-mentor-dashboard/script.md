# 55 · Use the mentor dashboard

A mentor's job is to know their youth: who they are, how to reach their families, and whether they are showing up. This video shows the mentor dashboard in PromiseHub: what a mentor sees when they open Mentoring, how they find a youth and open their record, how they look at a cohort they are on, and how the server makes sure a mentor never sees a youth who is not theirs.

## The dashboard

Daniel Osei is a mentor at Harbourview. Marisol, the program director, assigned Mateo Rivera to him directly, made him lead mentor of Saturday Sports, and supporting mentor of After-School Tutoring. When Daniel signs in he lands on Mentoring. Three numbers sit at the top: his six youth, his two cohorts, and how many of his youth were checked in this week. Below them are his first five youth, each with their age and program, and View all. Beside them are his cohorts, with his role and the size of each roster, and recent activity: the latest check-ins, sign-outs and absences of his youth at sessions in the last two weeks.

## Found on the server

Every number and every row is computed on the server, from the youth assigned to Daniel directly plus the active roster of each cohort he leads or supports. A youth whose enrollment ended, or whose cohort is archived, drops off unless they were assigned to him directly. The attendance comes from Roll Call, so when Roll Call is off, the server sends none, and the page shows neither the number nor the activity card.

## My youth

View all opens My youth, the whole list. Daniel types tran, and only Emily and Kevin Tran remain. A search that matches nobody says so, by name, and Clear search brings everyone back.

## A youth's record

On his phone, Daniel opens Mateo. The record shows what a mentor needs: Mateo's age and school, his program, his mentor, the name he goes by and his pronouns once a youth account finishes setup, and his guardians, each mobile number a button that starts a call. While Roll Call is on, his recent attendance is listed with its status. What the record never holds is just as important: no date of birth, no allergies or medication, no health card, no staff notes and no pickups. Those stay with staff on site, and the page says so. Every open of a record is audited.

## Not his youth

Daniel then opens a link to Amara Okonkwo, who is not assigned to him. The server answers forbidden, records the attempt in the audit log, and the page says this youth isn't assigned to him without showing anything from her record. A child of another organization is simply not found.

## A cohort he is on

From My cohorts, Daniel opens After-School Tutoring. The cohort page shows its term, schedule and his role, the lead and supporting mentors, and every youth on its roster with their own mentor, or no mentor. Each youth opens their record. A cohort he neither leads nor supports, or one that is archived, is forbidden and audited, just like a youth who is not his.

## Empty, failed and off

Hana Kim has no assignments yet, so her dashboard shows one calm empty state instead of zeros. If the dashboard fails to load, the error says so and Try again reloads it. Turn Mentoring off, and every mentor page goes to Today and every endpoint answers not found. Staff, youth and volunteers are refused, and a removed mentor is signed out.

## How it is tested

The API tests build Daniel's assignments, check each youth once with age and programs, his cohorts and roles, the attendance with Roll Call on and off, the record field by field with nothing restricted in it, the forbidden and audited cases, other roles, another organization and Mentoring off. The browser tests run every screen on a phone and a laptop against the fake API, with accessibility checks and no sideways scrolling.

## Recap

Things to remember. Mentoring opens on a dashboard of a mentor's own youth and cohorts. One scope on the server decides what every mentor page returns. A mentor's record of a youth is built field by field, and nothing medical is ever in it. Next, mentors grade and assess their youth's work.
