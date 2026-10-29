# 80 · Report, export and import learning data

Programs keep spreadsheets today: one tab with who is in each cohort, one with how far everyone is through the lessons, one with how often each mentor checks in. This video shows the reports that replace them in PromiseHub, the exports that take exactly what a report shows into a funder's template, and a roster import that places youth in their cohorts and invites them to a youth account in the same step.

## Detailed reports

Marisol Delgado is the program director at Harbourview Youth Collective. Reports still opens on the headline numbers funders ask for. Below them, a new card called Detailed reports lists the reports her organization can use. The cohort report is always there. The progress board appears only while Learning is on, and staff activity only while Mentoring is on. A youth report opens from a name on the cohort report.

## The cohort report

Marisol opens the cohort report for After-School Tutoring. Five youth are enrolled and none has left, so retention is a hundred percent. Attendance is attended out of marked, the same rule Roll Call's history uses. Average completion is how many of the track's published lessons the cohort's youth have done, counting only youth with an account, and each module of Leadership Foundations has its own bar. Beside them, the same numbers for every active program, so a cohort can be read against the organization. At risk counts open flags from mentors.

## Each youth

The table lists every youth enrolled now or before. Mateo is nine, too young for a youth account, so his learning reads No account rather than zero. Check-ins count the mentor check-ins about him since the program started. Every number is computed when the page opens, from the same tables the rest of PromiseHub writes, so a lesson finished a minute ago is already counted.

## The youth report

Marisol chooses Nadia. Her report is a snapshot for a guardian meeting or a funder: lessons done, her quiz average from her best scores, her badges and her attendance, then each module's status, each quiz, the attendance breakdown and her mentoring. Mentoring shows who her mentor is, how many check-ins and the latest date and engagement. It never shows what was said. Check-in notes stay with the mentor who wrote them.

## The progress board

The progress board is the spreadsheet itself, replaced. Each row is a youth, each column a module of the cohort's track, and each cell says Done, In progress, Not started or No account in words, not colour. The last columns are the quiz average and overall completion, and a footer row gives the cohort average. On a phone the board scrolls sideways inside its own frame and the page never does.

## Exports

Every detailed report has Export CSV. The file holds exactly the rows and columns the report shows for that cohort or period, and a column for a module that is off is left out too. It is named for the organization, the report, the cohort and the date, its link works for seven days and then answers gone, and the export is in the audit log with who asked, which report and how many rows.

## Staff activity

Staff activity shows each mentor's cohorts, how many youth are assigned to them, the check-ins they logged and the work they reviewed, for all time or the last thirty or ninety days. Waypoint's target is four to eight youth per mentor. Daniel has nine, so the page warns that he is overloaded and points out that Hana has room for more. Reviews appear only while Learning is on, because there is nothing to review without it.

## Import with cohorts and invitations

Tom Nguyen, the admin, imports a roster exported from a spreadsheet. Two columns are new. Group is matched to Cohort, and each row's child is enrolled in the program it names, matched without regard to case, spacing or the kind of hyphen. Youth email is matched to Youth email, and each eligible youth is invited to a youth account. The review counts the cohort places and the invitations and says, row by row, why one is not placed or not invited: a cohort nobody runs, a child outside twelve to eighteen, an email already used on an earlier row. After the import the same reasons are listed, each invitation is emailed and audited, and running the same file again duplicates nothing.

## Rules on the server

Every report needs the Reports module and the reports permission, so admins, program directors and site leads read them and everyone else gets forbidden. The staff report also needs Mentoring and the progress board Learning; while either is off its endpoint answers not found and its route goes back to Today. A youth email column needs Learning and an admin, because only admins invite youth. Every query stays inside the signed-in organization: another organization's cohort or child is simply not found.

## Off, forbidden, empty and failed

At Northgate, Learning and Mentoring are off. Grace sees the cohort report only, with enrolment, attendance and retention and nothing about learning or mentoring, and nothing is requested for them. Aisha, a youth worker, is told reports are for directors and site leads. A cohort with nobody enrolled says so, and a report that fails to load keeps the page and offers Try again.

## How it is tested

The API tests CohortReportTests, YouthReportTests, StaffReportTests, ProgressBoardTests, FilteredExportTests and ImportCohortsTests cover every number, each module gate, the roles and a second organization that is never counted. In the browser, the cohort report, youth report, staff report, progress board and import with cohorts specs walk Marisol, Tom, Grace and Aisha on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. Detailed reports list only what the organization's modules allow. Learning comes from youth accounts, attendance from Roll Call marks, and mentoring never shows a mentor's notes. Every export is exactly what the report shows, logged and gone after seven days. And a roster import can place youth in cohorts and invite them in one step. Next, the public website.
