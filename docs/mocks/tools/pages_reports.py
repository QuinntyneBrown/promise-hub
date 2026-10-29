"""Report, export and import learning data (prompt 80, L2-127 to L2-130): the cohort report (`report-cohort`), the youth report
(`report-youth`), the staff activity report (`report-staff`) and the progress board (`progress-board`), each reached from Detailed reports on
Reports and each exporting exactly what its filters show as CSV (`export-data`). A section whose module is off is not rendered: learning
progress needs Learning, mentoring activity Mentoring, attendance Roll Call. The staff report needs Mentoring and the progress board Learning.
Ported from Waypoint's reporting-and-data report-youth, report-cohort, report-staff and program-administration cohort-progress mocks
(ADR 0043, ADR 0074). The import's cohort and youth-invite columns are in pages_ops (`import-roster`).

Cast: Marisol Delgado (Program director), Aisha Bello (Youth worker, forbidden), Grace Mensah (Admin, Northgate, where Learning and Mentoring
are off). After‑School Tutoring follows Leadership Foundations (Knowing Yourself, Leading by Serving, Speaking Up); Daniel Osei and Hana Kim
mentor. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN_REPORTS = ["L2-127", "L2-128", "L2-129", "L2-130", "L2-024", "L2-025", "L2-001", "L2-005", "L2-007", "L2-032", "L2-035", "L2-036"]

M = STAFF["marisol"]
A = STAFF["aisha"]
GRACE = dict(name="Grace Mensah", initials="GM", color="lilac", role="Admin")
NG_MODULES = ["today", "check-in", "families", "events", "programs", "reports"]

FORBIDDEN = (f'<div class="error-page">{empty("Reports are for directors and site leads", "Ask a program director for the numbers you need.", action=btn("Go to Today", "primary", href=page("today")), icon_name="lock", heading="h1")}</div>')


def crumbs(current: str) -> str:
    return breadcrumb([("Reports", page("reports"))], current)


def export_btn(busy: bool = False) -> str:
    if busy:
        return btn("Exporting…", "primary", busy=True)
    return btn("Export CSV", "primary", icon_name="download", data_href=dialog("export-report"), attrs='aria-haspopup="dialog"')


def failed_load(title: str) -> str:
    return card(empty(title, "Your data is safe. Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def cell(state: str) -> str:
    return {"done": badge("Done", "success"), "in": badge("In progress", "info"), "not": badge("Not started"), "na": badge("No account")}[state]


# ------------------------------------------------------------------ Cohort report
COHORT_ROWS = [
    ([f'<a href="{page("report-youth")}">Sofía Rivera</a>', "60%", "92%", "4", badge("On track", "success")]),
    ([f'<a href="{page("report-youth")}">Nadia Haddad</a>', "80%", "88%", "6", badge("On track", "success")]),
    ([f'<a href="{page("report-youth", "empty")}">Yusuf Haddad</a>', "No account", "75%", "2", badge("At risk", "danger")]),
    ([f'<a href="{page("report-youth", "empty")}">Mateo Rivera</a>', "No account", "96%", "3", badge("On track", "success")]),
    ([f'<a href="{page("report-youth", "empty")}">Jordan Thompson</a>', "No account", "81%", "—", badge("On track", "success")]),
    ([f'<a href="{page("report-youth", "empty")}">Emily Tran</a>', "No account", "79%", "—", badge("Ended", "")]),
]


def cohort_filters(cohort: str = "After‑School Tutoring") -> str:
    return (f'<div class="toolbar">{select("rc-cohort", "Cohort", ["After‑School Tutoring", "Saturday Sports", "One-to-one Mentoring", "Winter Camp 2026"], selected=cohort, visually_hidden_label=True)}'
            f'{select("rc-range", "Period", ["This term (Sep 2026– )", "Last 30 days", "Custom…"], visually_hidden_label=True)}</div>')


def cohort_body(*, learning: bool = True, mentoring: bool = True) -> str:
    numbers = [("Youth enrolled", "48", "46 active · 2 ended"), ("Attendance", "89%", "present of present and absent"), ("Retention", "96%", "still enrolled")]
    if learning:
        numbers.insert(1, ("Average completion", "64%", "program average 58%"))
    if mentoring:
        numbers.append(("At risk", "1", "open flags"))
    out = kpis(numbers)
    split = []
    if learning:
        split.append(card('<div class="stack">' + progress(92, 100, "Knowing Yourself completion", show="92%") .replace('<div class="progress-row">', '<div class="progress-row"><span class="progress-row__label">Knowing Yourself</span>', 1)
                          + progress(41, 100, "Leading by Serving completion", show="41%").replace('<div class="progress-row">', '<div class="progress-row"><span class="progress-row__label">Leading by Serving</span>', 1)
                          + progress(0, 100, "Speaking Up completion", show="0%").replace('<div class="progress-row">', '<div class="progress-row"><span class="progress-row__label">Speaking Up</span>', 1)
                          + '</div><p class="hint" style="margin-top: var(--space-3);">Leadership Foundations · youth with an account only.</p>', title="Completion by module", tid="modules"))
    split.append(card(facts([("This cohort", "89% · 64% completion · 96% retention"), ("Program average", "87% · 58% completion · 93% retention")]), title="Compared with the program average", tid="compare"))
    out += f'<div class="split">{"".join(split)}</div>'
    head = ["Youth", "Learning", "#Attendance", "#Check-ins", "Status"] if mentoring else ["Youth", "#Attendance", "Status"]
    rows = COHORT_ROWS if mentoring else [[r[0], r[2], r[4]] for r in COHORT_ROWS]
    if not learning and mentoring:
        head = ["Youth", "#Attendance", "#Check-ins", "Status"]
        rows = [[r[0], r[2], r[3], r[4]] for r in COHORT_ROWS]
    if learning and not mentoring:
        head = ["Youth", "Learning", "#Attendance", "Status"]
        rows = [[r[0], r[1], r[2], r[4]] for r in COHORT_ROWS]
    out += (f'<h2 class="section-title" style="margin-top: var(--space-6);">Youth · 48</h2>'
            + table("Youth in After‑School Tutoring", head, rows, hide_sm={2} if mentoring else set())
            + '<p class="hint" style="margin-top: var(--space-2);">Showing 6 of 48. Choose a name for the youth report.</p>')
    return out


@screen("report-cohort", "page", "Cohort report", route="/reports/cohorts/:programId", reqs=R_LEARN_REPORTS, na={})
def report_cohort(S):
    hdr = crumbs("Cohort report") + page_header("After‑School Tutoring", "Cohort report · Sep 2026 to today · Leadership Foundations", export_btn())
    S.add("default", "Marisol’s cohort report for After‑School Tutoring: enrolment, average completion, attendance, retention and at-risk count, completion by module, the program average and each youth.",
          nav="reports", user=M, main=hdr + cohort_filters() + cohort_body(),
          notes=note("Learning numbers come from youth with an account; children without one show “No account”. At risk is an open flag from a mentor.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Building the cohort report.", nav="reports", user=M, main=crumbs("Cohort report") + page_header("After‑School Tutoring", "") + skeleton_kpis() + skeleton_list(6, "Loading youth"))
    S.add("empty", "Winter Camp 2026 has no one enrolled yet.", nav="reports", user=M, main=crumbs("Cohort report") + page_header("Winter Camp 2026", "Cohort report · starts Mon 21 Dec") + cohort_filters("Winter Camp 2026") +
          card(empty("No youth in this cohort yet", "Enrol youth to see enrolment, attendance and learning here.", action=btn("Open the roster", "primary", href=page("roster")), icon_name="users"), cls="card--flush"))
    S.add("error", "The cohort report failed to load.", nav="reports", user=M, main=crumbs("Cohort report") + page_header("After‑School Tutoring", "") + failed_load("We couldn’t build the cohort report"))
    S.add("forbidden", "A youth worker following a link to a cohort report.", nav="reports", user=A, main=FORBIDDEN)
    S.add("modules-off", "Grace at Northgate, where Learning and Mentoring are off: enrolment, attendance and retention only; no learning column, no check-ins, no at-risk count.",
          nav="reports", user=GRACE, modules=NG_MODULES, main=crumbs("Cohort report") + page_header("Sunday Kids Club", "Cohort report · Sep 2026 to today", export_btn()) + cohort_filters("Sunday Kids Club").replace("After‑School Tutoring", "Sunday Kids Club") + cohort_body(learning=False, mentoring=False).replace("After‑School Tutoring", "Sunday Kids Club"))
    S.add("exported", "The CSV is ready: one row per youth with exactly the columns shown, and the export is in the audit log.",
          nav="reports", user=M, main=hdr + cohort_filters() + alert("success", "Export ready", "harbourview-youth-collective-cohort-after-school-tutoring-2026-11-05.csv · 48 rows", actions=btn("Download", "primary", size="sm", icon_name="download"), dismiss=True) + cohort_body(),
          toast_html=toast_region(toast("success", "Export ready", "48 rows · link lasts 7 days", action="Download")))


# ------------------------------------------------------------------ Youth report
def youth_body(*, learning: bool = True, mentoring: bool = True, attendance: bool = True) -> str:
    numbers = []
    if learning:
        numbers += [("Lessons done", "6 of 10", "60%"), ("Quiz average", "85%", "2 quizzes"), ("Badges", "2", "First Steps, Towel Picker")]
    if attendance:
        numbers.append(("Attendance", "92%", "23 of 25 sessions"))
    out = kpis(numbers)
    cards = []
    if learning:
        cards.append(card(table("Module completion", ["Module", "#Lessons", "Status"], [["Knowing Yourself", "3 of 3", badge("Done", "success")], ["Leading by Serving", "3 of 4", badge("In progress", "info")], ["Speaking Up", "0 of 3", badge("Not started")]], cls="table-wrap--flush"), title="Learning · Leadership Foundations", tid="learning", cls="card--flush"))
        cards.append(card(table("Quiz scores", ["Quiz", "#Best score"], [["Knowing Yourself quiz", "90%"], ["Leading by Serving quiz", "80%"]], cls="table-wrap--flush"), title="Quizzes", tid="quizzes", cls="card--flush"))
    if attendance:
        cards.append(card(facts([("Present", "22"), ("Late", "1"), ("Excused", "1"), ("Absent", "1")]), title="Attendance", tid="attendance"))
    if mentoring:
        cards.append(card(facts([("Mentor", "Daniel Osei"), ("Check-ins", "4 this term"), ("Latest", "Tue 3 Nov · Engaged"), ("Open flag", "None")]), title="Mentoring", tid="mentoring"))
    return out + f'<div class="split">{"".join(cards)}</div>'


@screen("report-youth", "page", "Youth report", route="/reports/youth/:childId", reqs=R_LEARN_REPORTS, na={})
def report_youth(S):
    hdr = crumbs("Youth report") + page_header("Sofía Rivera", "Youth report · After‑School Tutoring · 12 · Sep 2026 to today", btn("Print", "", icon_name="file", attrs='onclick="window.print()"'))
    S.add("default", "Sofía’s report for a guardian meeting: lessons, quiz average, badges and attendance, module completion, quiz scores, the attendance breakdown and her mentor’s check-ins (never their notes).",
          nav="reports", user=M, main=hdr + youth_body(),
          notes=note("Mentor check-in notes stay private (ADR 0061): the report counts check-ins and shows the latest date and engagement only.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Building Sofía’s report.", nav="reports", user=M, main=crumbs("Youth report") + page_header("Youth report", "") + skeleton_kpis() + skeleton_list(4, "Loading sections"))
    S.add("empty", "Mateo (9) has no youth account, so there is no learning to show; attendance and mentoring still are.",
          nav="reports", user=M, main=crumbs("Youth report") + page_header("Mateo Rivera", "Youth report · After‑School Tutoring · 9 · Sep 2026 to today") +
          alert("info", "Mateo has no youth account", "Learning shows here once he has one. Youth accounts are for ages 12 to 18.") + youth_body(learning=False))
    S.add("error", "The youth report failed to load.", nav="reports", user=M, main=crumbs("Youth report") + page_header("Youth report", "") + failed_load("We couldn’t build the youth report"))
    S.add("forbidden", "A youth worker opening a youth report.", nav="reports", user=A, main=FORBIDDEN)
    S.add("not-found", "A child of another organization, or one that doesn’t exist: the same answer either way.", nav="reports", user=M,
          main=crumbs("Youth report") + card(empty("We couldn’t find that youth", "They may have been removed, or the link is wrong.", action=btn("Back to Reports", "primary", href=page("reports")), icon_name="search", heading="h1"), cls="card--flush"))
    S.add("modules-off", "Lucía at Northgate, where Learning and Mentoring are off: attendance only.", nav="reports", user=GRACE, modules=NG_MODULES,
          main=crumbs("Youth report") + page_header("Lucía Rivera", "Youth report · Sunday Kids Club · 14 · Sep 2026 to today", btn("Print", "", icon_name="file")) + youth_body(learning=False, mentoring=False))


# ------------------------------------------------------------------ Staff activity report
STAFF_ROWS = [
    ["Daniel Osei", "Saturday Sports (lead)", "9", "14", "6", badge("Overloaded", "warning")],
    ["Hana Kim", "After‑School Tutoring (lead)", "5", "11", "4", badge("Balanced", "success")],
    ["Samira Khan", "—", "1", "0", "0", badge("Underloaded")],
]


@screen("report-staff", "page", "Staff activity report", route="/reports/staff", reqs=R_LEARN_REPORTS, na={})
def report_staff(S):
    hdr = crumbs("Staff activity") + page_header("Staff activity", "Mentor caseloads, check-ins and reviews · Sep 2026 to today", export_btn())
    filters = f'<div class="toolbar">{select("rs-range", "Period", ["This term (Sep 2026– )", "Last 30 days", "Custom…"], visually_hidden_label=True)}</div>'
    body = (kpis([("Active mentors", "3", ""), ("Check-ins logged", "25", "this term"), ("Reviews completed", "10", "graded work"), ("Youth per mentor", "5", "target 4 to 8")])
            + alert("warning", "Daniel Osei has 9 youth", "Above the target of 4 to 8. Samira Khan has 1 and can take more.")
            + table("Mentor activity", ["Mentor", "Cohorts", "#Youth", "#Check-ins", "#Reviews", "Load"], STAFF_ROWS, hide_sm={1})
            + '<p class="hint" style="margin-top: var(--space-2);">Overloaded: more than 8 youth. Underloaded: fewer than 4.</p>')
    S.add("default", "Marisol’s staff activity report: each mentor’s caseload, check-ins and reviews in the period, and the load against the 4 to 8 target.",
          nav="reports", user=M, main=hdr + filters + body)
    S.add("loading", "Building the staff report.", nav="reports", user=M, main=crumbs("Staff activity") + page_header("Staff activity", "") + skeleton_kpis() + skeleton_list(3, "Loading mentors"))
    S.add("empty", "No mentors yet.", nav="reports", user=M, main=hdr.replace(export_btn(), "") + filters +
          card(empty("No mentors yet", "Invite a mentor to see caseloads and check-ins here.", action=btn("Invite staff", "primary", href=page("staff")), icon_name="users"), cls="card--flush"))
    S.add("error", "The staff report failed to load.", nav="reports", user=M, main=crumbs("Staff activity") + page_header("Staff activity", "") + failed_load("We couldn’t build the staff report"))
    S.add("forbidden", "A youth worker opening the staff report.", nav="reports", user=A, main=FORBIDDEN)


# ------------------------------------------------------------------ Progress board
BOARD = [
    ("Nadia Haddad", ["done", "in", "not"], "90%", "80%"),
    ("Sofía Rivera", ["done", "in", "not"], "85%", "60%"),
    ("Malik Johnson", ["in", "not", "not"], "—", "20%"),
    ("Yusuf Haddad", ["na", "na", "na"], "—", "—"),
]


def board(rows=BOARD) -> str:
    body = [[name, *[cell(c) for c in cells], quiz, overall] for name, cells, quiz, overall in rows]
    return table("Progress board: every youth by every module of Leadership Foundations", ["Youth", "Knowing Yourself", "Leading by Serving", "Speaking Up", "#Quiz average", "#Overall"], body,
                 foot=["Cohort average", "67%", "33%", "0%", "88%", "53%"])


@screen("progress-board", "page", "Progress board", route="/reports/progress", reqs=R_LEARN_REPORTS, na={})
def progress_board(S):
    hdr = crumbs("Progress board") + page_header("Progress board", "Every youth, every module · the spreadsheet, replaced", export_btn())
    filters = f'<div class="toolbar">{select("pb-cohort", "Cohort", ["After‑School Tutoring", "Saturday Sports"], visually_hidden_label=True)}</div>'
    legend = f'<p class="cluster" aria-label="Key">{badge("Done", "success")} all lessons done {badge("In progress", "info")} some {badge("Not started")} none {badge("No account")} no youth account</p>'
    S.add("default", "The progress board for After‑School Tutoring on Leadership Foundations: a row per youth, a cell per module, quiz average, overall and the cohort average.",
          nav="reports", user=M, main=hdr + filters + legend + board(),
          notes=note("The table scrolls sideways in its own frame on a phone; the page never does. It refreshes when reopened.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Loading the board.", nav="reports", user=M, main=crumbs("Progress board") + page_header("Progress board", "") + skeleton_list(5, "Loading the progress board"))
    S.add("empty", "Saturday Sports has no youth with an account yet.", nav="reports", user=M, main=hdr.replace(export_btn(), "") + filters.replace('<option>Saturday Sports</option>', '<option selected>Saturday Sports</option>') +
          card(empty("No youth in this cohort yet", "Enrol youth and invite them to see their progress here.", action=btn("Open the roster", "primary", href=page("roster")), icon_name="users"), cls="card--flush"))
    S.add("no-track", "One-to-one Mentoring follows no track: there are no modules to show.", nav="reports", user=M, main=hdr.replace(export_btn(), "") + filters.replace("Saturday Sports", "One-to-one Mentoring") +
          card(empty("This cohort follows no track", "Choose a track for it in Curriculum to see module progress.", action=btn("Open Curriculum", "primary", href=page("curriculum-tracks")), icon_name="list"), cls="card--flush"))
    S.add("error", "The board failed to load.", nav="reports", user=M, main=crumbs("Progress board") + page_header("Progress board", "") + failed_load("We couldn’t load the progress board"))
    S.add("forbidden", "A youth worker opening the board.", nav="reports", user=A, main=FORBIDDEN)
    S.add("exported", "The board exported as CSV for the chosen cohort.", nav="reports", user=M,
          main=hdr + filters + alert("success", "Export ready", "harbourview-youth-collective-progress-after-school-tutoring-2026-11-05.csv · 4 rows", actions=btn("Download", "primary", size="sm", icon_name="download"), dismiss=True) + legend + board(),
          toast_html=toast_region(toast("success", "Export ready", "4 rows · link lasts 7 days", action="Download")))
