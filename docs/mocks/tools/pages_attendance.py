"""Take attendance for cohort sessions (prompt 71, L2-095 to L2-099): a mentor or site lead takes attendance for a cohort session in Roll
Call (present, late, excused, absent), online or offline, and reviews attendance history and rates by session and by youth; admins and
program directors correct a mark, and every correction is audited. Ported from Waypoint's mentor attendance, attendance history, admin
attendance and offline mocks. There is one attendance system: late is a check-in that came after the start and excused is an absence the
organization accepts (ADR 0065). The check-in page's late, excused and mentor states are in pages_core.py, the check-in sheet and the
correct-attendance dialog in dialogs.py."""
from kit import *  # noqa: F401,F403
from reg import screen

R_HISTORY = ["L2-097", "L2-095", "L2-018", "L2-007", "L2-032", "L2-005", "L2-001", "L1-007", "L2-035", "L2-036"]
MARISOL = STAFF["marisol"]
DANIEL = STAFF["daniel"]
AISHA = STAFF["aisha"]
DIRECTOR = dict(nav="check-in", user=MARISOL)
MENTOR = dict(nav="check-in", role="mentor", user=DANIEL, unread=0, modules=["today", "mentor-dashboard", "check-in"])

# After‑School Tutoring's sessions so far this term as Marisol sees them on Thu 5 Nov 2026 at 4:30 pm; the cohort is the four seeded youth.
# Each: date, session, present, late, excused, absent, status.
SESSIONS = [
    ("Thu 5 Nov", "Tutoring night", 1, 1, 1, 0, ("In progress", "info")),
    ("Wed 4 Nov", "Tutoring night", 3, 0, 0, 1, ("Recorded", "success")),
    ("Tue 3 Nov", "Tutoring night", 2, 1, 1, 0, ("Recorded", "success")),
    ("Mon 2 Nov", "Tutoring night", 3, 1, 0, 0, ("Recorded", "success")),
    ("Thu 29 Oct", "Tutoring night", 0, 0, 0, 0, ("Not recorded", "danger")),
]
# Each youth: name, attended, marked, late, excused, absent.
YOUTH_ROWS = [
    ("Jordan Thompson", 4, 4, 2, 0, 0),
    ("Mateo Rivera", 4, 4, 0, 0, 0),
    ("Sofía Rivera", 2, 4, 0, 2, 0),
    ("Yusuf Haddad", 2, 3, 1, 0, 1),
]


def rate(attended: int, marked: int) -> str:
    return f"{round(100 * attended / marked)}%" if marked else "—"


def session_rows(*, correct: bool, corrected: bool = False) -> list[list[str]]:
    rows = []
    for i, (day, name, p, l, e, a, st) in enumerate(SESSIONS):
        if corrected and i == 1:
            p, a = 3, 0
            e = 1
        marked = p + l + e + a
        recorded = marked > 0
        date = esc(day)
        cells = [date, esc(name), str(p) if recorded else "—", str(l) if recorded else "—", str(e) if recorded else "—", str(a) if recorded else "—",
                 rate(p + l, marked), badge(*st)]
        if correct:
            cells.append(f'<div class="row-actions">{btn("Correct", "ghost", size="sm", data_href=dialog("correct-attendance"), aria_label=f"Correct attendance for {name}, {day}")}</div>')
        rows.append(cells)
    return rows


def sessions_table(*, correct: bool = True, corrected: bool = False) -> str:
    head = ["Date", "Session", "#Present", "#Late", "#Excused", "#Absent", "#Rate", "Status"] + (["Actions"] if correct else [])
    return table("Attendance by session, newest first", head, session_rows(correct=correct, corrected=corrected), hide_sm={1, 3, 4, 5}, cls="table-wrap--fit")


def youth_table() -> str:
    rows = []
    for name, att, marked, late, exc, absent in YOUTH_ROWS:
        low = marked and att / marked < 0.7
        flag_html = f' {badge("Below 70%", "warning")}' if low else ""
        rows.append([f'{esc(name)}{flag_html}', f"{att} / {marked}", str(late), str(exc), str(absent), rate(att, marked)])
    return table("Attendance by youth", ["Youth", "#Attended", "#Late", "#Excused", "#Absent", "#Rate"], rows, hide_sm={2, 3}, cls="table-wrap--fit")


def toolbar(cohort: str = "After‑School Tutoring", options=None) -> str:
    options = options or ["After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"]
    return f'<div class="toolbar">{select("ah-cohort", "Cohort", options, selected=cohort)}</div>'


def view_tabs(current: str = "session") -> str:
    return tabs_nav([("By session", page("attendance-history"), current == "session"), ("By youth", page("attendance-history", "by-youth"), current == "youth")], "Attendance view")


def numbers(rate_: str = "86%", recorded: str = "3 of 4", low: str = "1") -> str:
    return kpis([("Attendance rate", rate_, "present or late, of marked"), ("Sessions recorded", recorded, "held so far"), ("Below 70%", low, "youth to follow up")])


def hdr(sub: str = "After‑School Tutoring · Mon–Thu, 4–6 pm · 4 youth") -> str:
    return breadcrumb([("Check-in", page("check-in"))], "Attendance history") + page_header("Attendance history", sub, btn("Take attendance", "primary", icon_name="clipboard", href=page("check-in")))


@screen("attendance-history", "page", "Attendance history", route="/check-in/history", reqs=R_HISTORY, na={})
def attendance_history(S):
    S.add("default", "Marisol’s After‑School Tutoring by session, newest first: present, late, excused and absent, the rate, Recorded, In progress or Not recorded, and Correct on each session (an unrecorded one can be filled in after the fact).", **DIRECTOR,
          main=hdr() + toolbar() + view_tabs() + numbers() + alert("warning", "Thu 29 Oct has no attendance", "Nobody took attendance at that session.") + sessions_table(),
          notes=note("GET /attendance?programId= answers the cohort’s sessions that have started, newest first, and each youth on its roster. Rate is present or late of those marked.", "top: 5rem; right: 1rem;"))
    S.add("by-youth", "By youth: each youth on the roster with sessions attended of marked, late, excused, absent and the rate; Sofía and Yusuf are below 70% and flagged.", **DIRECTOR,
          main=hdr() + toolbar() + view_tabs("youth") + numbers() + youth_table())
    S.add("mentor", "Daniel’s view: only the cohorts he leads or supports, no corrections; he takes attendance from Check-in.", **MENTOR,
          main=hdr() + toolbar(options=["After‑School Tutoring", "Saturday Sports"]) + view_tabs() + numbers() + sessions_table(correct=False))
    S.add("corrected", "Marisol just corrected Yusuf on Wed 4 Nov from Absent to Excused: a toast says the change is in the audit log and the row has moved.", **DIRECTOR,
          main=hdr() + toolbar() + view_tabs() + numbers("92%", "3 of 4", "1") + sessions_table(corrected=True),
          toast_html=toast_region(toast("success", "Attendance corrected", "Yusuf Haddad · Wed 4 Nov · Excused. The change is in the audit log.")))
    S.add("loading", "History loading: the toolbar and tabs stay, skeletons hold the numbers and the table.", **DIRECTOR,
          main=hdr("") + toolbar() + view_tabs() + skeleton_kpis(3) + skeleton_list(5, "Loading attendance"))
    S.add("empty", "Winter Camp 2026 has not met yet: say so and point to check-in on its first day.", **DIRECTOR,
          main=hdr("Winter Camp 2026 · 21–23 Dec") + toolbar("Winter Camp 2026") + card(empty("No attendance recorded yet", "Once someone takes attendance at a Winter Camp 2026 session, its history and rates show up here.",
                                                                                  action=btn("Open check-in", "primary", icon_name="clipboard", href=page("check-in")), icon_name="clipboard"), cls="card--flush"))
    S.add("error", "History failed to load; the toolbar stays so she can try again or pick another cohort.", **DIRECTOR,
          main=hdr("") + toolbar() + card(empty("We couldn’t load attendance", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"),
                                                 error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "Aisha, a youth worker, follows a link to the history: attendance rates are for site leads, directors and mentors.", nav="check-in", user=AISHA,
          main=f'<div class="error-page">{empty("Attendance history is for site leads, directors and mentors", "You can still take attendance at the sessions you work.", action=btn("Back to check-in", "primary", href=page("check-in")), icon_name="lock", heading="h1")}</div>')
