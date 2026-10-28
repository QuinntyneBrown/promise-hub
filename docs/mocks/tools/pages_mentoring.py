"""The mentor dashboard (prompt 55, L2-063 to L2-065): Mentoring's home, My youth, a youth's record and a cohort a mentor is on.
Ported from Waypoint's mentor dashboard, my-youth, youth-detail and group mocks. Everything is scoped on the server to the
youth and cohorts assigned to the signed-in mentor. Progress, reviews, check-ins and at-risk flags arrive with later prompts."""
from kit import *  # noqa: F401,F403
from reg import screen

R_MENTOR = "L1-024"
DANIEL = STAFF["daniel"]
HANA = STAFF["hana"]
KW = dict(nav="mentor-dashboard", role="mentor", user=DANIEL, unread=0, modules=["today", "mentor-dashboard"])
NA_FORM = "Read only: nothing on this screen is a form."

# Daniel leads Saturday Sports, supports After‑School Tutoring and mentors Mateo directly (L2-062).
MY_YOUTH = [
    ("emily", "Saturday Sports", 10),
    ("jordan", "After‑School Tutoring", 11),
    ("kevin", "Saturday Sports", 8),
    ("mateo", "After‑School Tutoring", 9),
    ("sofia", "After‑School Tutoring", 12),
    ("yusuf", "After‑School Tutoring", 13),
]
COHORTS = [
    ("sports", "Saturday Sports", "Lead mentor", 2),
    ("tutoring", "After‑School Tutoring", "Supporting mentor", 4),
]
ACTIVITY = [
    ("mateo", "checked in to Tutoring night", "Today, 4:02 pm"),
    ("jordan", "checked in to Tutoring night", "Today, 4:05 pm"),
    ("sofia", "was signed out of Tutoring night", "Wed 4 Nov, 6:01 pm"),
    ("yusuf", "was marked absent from Tutoring night", "Wed 4 Nov, 4:20 pm"),
]


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def forbidden(title: str, text: str) -> str:
    return card(empty(title, text, action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush")


def youth_item(cid: str, cohort: str, age: int, *, href: str = "") -> str:
    c = CHILD[cid]
    return list_item(c["name"], f"Age {age} · {cohort}", person=c, href=href or page("mentor-youth-detail"))


def feed(rows) -> str:
    items = "".join(f'<li>{avatar(CHILD[cid])}<div class="feed__body"><strong>{CHILD[cid]["name"]}</strong> {text}<div class="feed__meta">{when}</div></div></li>'
                    for cid, text, when in rows)
    return f'<ul class="feed" aria-label="Recent activity">{items}</ul>'


# ---------------------------------------------------------------- mentor-dashboard
@screen("mentor-dashboard", "page", "Mentoring", route="/mentoring", reqs=["L2-063", "L2-065", R_MENTOR])
def mentor_dashboard(S):
    hdr = page_header("Mentoring", "Welcome back, Daniel. Here’s how your youth are doing.",
                      btn("Reviews · 4", "", icon_name="check", href=page("mentor-reviews")) + btn("At-risk flags", "", icon_name="flag", href=page("mentor-flags")) + btn("Mentor check-ins", "", icon_name="message", href=page("mentor-check-in-history"))
                      + btn("My youth", "", icon_name="users", href=page("mentor-youth")))
    hdr_no_learning = page_header("Mentoring", "Welcome back, Daniel. Here’s how your youth are doing.",
                                  btn("At-risk flags", "", icon_name="flag", href=page("mentor-flags")) + btn("Mentor check-ins", "", icon_name="message", href=page("mentor-check-in-history")) + btn("My youth", "", icon_name="users", href=page("mentor-youth")))
    from pages_checkins import followups_card
    follow = followups_card()
    numbers = kpis([("My youth", "6", "Across 2 cohorts"), ("My cohorts", "2", "Lead mentor on 1"), ("Checked in this week", "4", "of your 6 youth")])
    youth = card(ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH[:5]], card=False, label="Your youth"),
                 title="My youth", tid="my-youth", cls="card--flush", footer=btn("View all 6", "ghost", href=page("mentor-youth")))
    cohorts = card(ul_list([list_item(n, f"{r} · {k} youth", href=page("mentor-group")) for _, n, r, k in COHORTS], card=False, label="Your cohorts"),
                   title="My cohorts", tid="my-cohorts", cls="card--flush")
    activity = card(feed(ACTIVITY), title="Recent activity", tid="activity")
    S.add("default", "Daniel opens Mentoring: his six youth (Mateo directly, the rest through the two cohorts he is on), his cohorts and their latest check-ins.", **KW,
          main=hdr + numbers + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{follow}{cohorts}{activity}</div></div>',
          notes=note("Follow-ups come from the latest mentor check-in of each of his youth that has a follow-up date, soonest first; overdue ones say so. Every number and row is computed on the server over Daniel’s assigned youth only; recent activity is the last five attendance changes in 14 days.", "top: 5rem; right: 1rem;"))
    S.add("loading", "The dashboard loading: skeletons in the same layout.", **KW,
          main=hdr + skeleton_kpis(3) + f'<div class="split"><div class="stack">{skeleton_list(5, "Loading your youth")}</div><div class="stack">{skeleton_list(2, "Loading your cohorts")}</div></div>')
    S.add("empty", "Hana, a mentor nobody has assigned yet: one calm empty state instead of zeros.", **(KW | {"user": HANA}),
          main=page_header("Mentoring", "Welcome back, Hana. Here’s how your youth are doing.")
          + card(empty("No youth assigned yet", "A program director assigns youth to you, or adds you to a cohort’s mentors. They appear here with their latest activity.", icon_name="users"), cls="card--flush"))
    S.add("error", "The dashboard failed to load; the shell stays.", **KW, main=hdr + failed("We couldn’t load your dashboard"))
    S.add("rollcall-off", "Roll Call is off for Harbourview: no attendance number and no Recent activity card; nothing about check-in is mentioned.", **KW,
          main=hdr + kpis([("My youth", "6", "Across 2 cohorts"), ("My cohorts", "2", "Lead mentor on 1")])
          + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{follow}{cohorts}</div></div>')
    S.add("learning-off", "Learning is off: no Reviews, because there is nothing to grade; everything else stays.", **KW,
          main=hdr_no_learning + numbers + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{follow}{cohorts}{activity}</div></div>')
    S.add("no-follow-ups", "No mentor check-in of his has a follow-up date: the Follow-ups card says how to plan one.", **KW,
          main=hdr + numbers + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{followups_card([])}{cohorts}{activity}</div></div>')
    S.add("forbidden", "Marisol (Program director) opens /mentoring directly: the dashboard is for mentors; the server answers 403.", nav="today", user=STAFF["marisol"],
          main=page_header("Mentoring", "") + forbidden("Mentoring is for mentors", "Program directors assign mentors from a cohort’s page in Programs."))


# ---------------------------------------------------------------- mentor-youth
@screen("mentor-youth", "page", "My youth", route="/mentoring/youth", reqs=["L2-063", "L2-065", R_MENTOR])
def mentor_youth(S):
    back = breadcrumb([("Mentoring", page("mentor-dashboard"))], "My youth")
    hdr = back + page_header("My youth", "6 youth assigned to you, directly or through a cohort you’re on.")
    search = lambda v="": f'<form role="search" action="#" class="stack">{field("q", "Search your youth", type_="search", value=v, autocomplete="off")}</form>'
    rows = ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH], label="Your youth")
    S.add("default", "Daniel’s six youth by name, each with age and cohort; each row opens the youth’s record.", **KW, main=hdr + search() + rows)
    S.add("searched", "Searching “tran” narrows to Emily and Kevin Tran.", **KW,
          main=hdr + search("tran") + ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH if CHILD[c]["name"].endswith("Tran")], label="Your youth"))
    S.add("no-results", "A search nothing matches: a labelled empty state with Clear search.", **KW,
          main=hdr + search("zed") + card(empty("No youth match “zed”", "Try another name, or clear the search to see everyone.", action=btn("Clear search", ""), icon_name="search"), cls="card--flush"))
    S.add("loading", "My youth loading.", **KW, main=hdr + skeleton_list(6, "Loading your youth"))
    S.add("empty", "Hana, with no assignments: no search box, just the empty state.", **(KW | {"user": HANA}),
          main=back + page_header("My youth", "Youth assigned to you, directly or through a cohort you’re on.")
          + card(empty("No youth assigned yet", "A program director assigns youth to you. They appear here.", icon_name="users"), cls="card--flush"))
    S.add("error", "My youth failed to load.", **KW, main=hdr + failed("We couldn’t load your youth"))
    S.add("forbidden", "A site lead opening /mentoring/youth: only mentors have a roster here.", nav="today", user=STAFF["jaylen"],
          main=page_header("My youth", "") + forbidden("Mentoring is for mentors", "Staff open children from Families."))


# ---------------------------------------------------------------- mentor-youth-detail
@screen("mentor-youth-detail", "page", "Youth record", route="/mentoring/youth/:childId", reqs=["L2-064", "L2-065", "L2-007", "L2-019", R_MENTOR],
        na={"empty": "A youth record always has a name and a program; empty sections say so in place."})
def mentor_youth_detail(S):
    m = CHILD["mateo"]
    crumbs = lambda cur: breadcrumb([("Mentoring", page("mentor-dashboard")), ("My youth", page("mentor-youth"))], cur)
    back = crumbs("Youth record")
    head = crumbs("Mateo Rivera") + page_header("Mateo Rivera", "Age 9 · Bennetto Elementary, Grade 4", btn("Log a mentor check-in", "", icon_name="plus", data_href=dialog("mentor-check-in", "from-record")) + btn("Competencies", "", icon_name="star", href=page("mentor-competency")))
    about = card(facts([("Programs", "After‑School Tutoring"), ("Mentor", "Daniel Osei"), ("Goes by", "Not set"), ("Pronouns", "Not set")]), title="About", tid="about")
    contacts = card('<ol class="call-list" aria-label="Guardian contacts">'
                    f'<li class="call-list__item">{avatar(GUARDIANS["carmen"])}<div class="call-list__body"><div class="call-list__name">Carmen Rivera · mother</div><div class="call-list__meta">Primary contact · carmen.rivera@example.com</div></div><a class="btn btn--primary" href="tel:905-555-0142" aria-label="Call Carmen Rivera, 905-555-0142">905-555-0142</a></li>'
                    '<li class="call-list__item"><span class="avatar avatar--sm" aria-hidden="true">LR</span><div class="call-list__body"><div class="call-list__name">Luis Rivera · uncle or aunt</div></div><a class="btn" href="tel:905-555-0199" aria-label="Call Luis Rivera, 905-555-0199">905-555-0199</a></li></ol>',
                    title="Guardian contacts", tid="contacts", cls="card--flush")
    attendance = card(table("Recent attendance", ["Session", "When", "Status"], [
        ["Tutoring night", "Thu 5 Nov, 4:02 pm", badge("Checked in", "success")],
        ["Tutoring night", "Wed 4 Nov, 6:01 pm", badge("Signed out", "neutral")],
        ["Tutoring night", "Tue 3 Nov, 4:00 pm", badge("Absent", "danger")],
    ]).replace("table-wrap card card--flush", "table-wrap"), title="Recent attendance", tid="attendance", cls="card--flush")
    restricted = alert("info", "Medical details stay with staff on site", "Allergies, medication, the date of birth and the Quick Card are not part of a mentor’s view.")
    from pages_checkins import CHECKINS, record_card
    body = f'<div class="split"><div class="stack">{about}{record_card(CHECKINS[:1])}{attendance}</div><div class="stack">{contacts}{restricted}</div></div>'
    S.add("default", "Daniel opens Mateo, whom he mentors: what a mentor may see, nothing more. The open is audited.", **KW, main=head + body,
          notes=note("The API never sends the date of birth, medical fields, health card, notes or approved pickups to a mentor; the page has nothing to hide.", "top: 5rem; right: 1rem;"))
    S.add("onboarded", "Sofía finished her first-run setup: the record shows the name she goes by and her pronouns.", **KW,
          main=head.replace("Mateo Rivera", "Sofía Rivera").replace("Age 9 · Bennetto Elementary, Grade 4", "Age 12 · Bennetto Elementary, Grade 7")
          + body.replace(facts([("Programs", "After‑School Tutoring"), ("Mentor", "Daniel Osei"), ("Goes by", "Not set"), ("Pronouns", "Not set")]),
                         facts([("Programs", "After‑School Tutoring"), ("Mentor", "Hana Kim"), ("Goes by", "Sofía"), ("Pronouns", "she/her")])))
    sofia_head = head.replace("Mateo Rivera", "Sofía Rivera").replace("Age 9 · Bennetto Elementary, Grade 4", "Age 12 · Bennetto Elementary, Grade 7")
    shared = card(ul_list([
        list_item("Pick Up the Towel", "Leading by Serving · Feeling thoughtful · Thu 5 Nov, 4:12 pm")
        .replace("</div></div>", '</div><p class="list__text">My little brother Mateo cleared the table after dinner on Tuesday without anyone asking, so Mom could sit down. '
                 'I noticed I usually wait to be asked. I want to be the one who notices first.</p><div class="list__meta">One thing I’ll do this week: Pack my own lunch on Thursday so Mom has one less thing to do.</div></div>', 1),
    ], card=False, label="Shared reflections, newest first"), title="Shared reflections", tid="reflections", cls="card--flush",
        footer="Only reflections Sofía chose to share. Private reflections and drafts never reach you.")
    S.add("reflections", "Sofía shared her Pick Up the Towel reflection: Daniel reads it on her record, newest first, with her mood and the one thing she’ll do. The read is audited.", **KW,
          main=sofia_head + f'<div class="split"><div class="stack">{about}{shared}</div><div class="stack">{contacts}{restricted}</div></div>',
          notes=note("GET /mentoring/youth/{childId}/reflections answers only saved reflections she shared; the card is not shown while Learning is off.", "top: 5rem; right: 1rem;"))
    S.add("no-reflections", "Sofía hasn’t shared a reflection: the card says so without hinting at private ones.", **KW,
          main=sofia_head + f'<div class="split"><div class="stack">{about}' + card(empty("No shared reflections yet", "When Sofía shares a reflection on a lesson, it appears here.", icon_name="book", heading="h3"),
                                                                                    title="Shared reflections", tid="reflections", cls="card--flush")
          + f'</div><div class="stack">{contacts}{restricted}</div></div>')
    S.add("check-ins", "Daniel’s mentor check-ins with Mateo on his record, newest first, with Log a mentor check-in and a link to all of them. Only Daniel’s own check-ins show.", **KW,
          main=head + f'<div class="split"><div class="stack">{about}{record_card(CHECKINS[:1])}{attendance}</div><div class="stack">{contacts}{restricted}</div></div>')
    S.add("no-check-ins", "Daniel hasn’t logged a mentor check-in with Mateo: the card says so and offers the action.", **KW,
          main=head + f'<div class="split"><div class="stack">{about}{record_card([])}{attendance}</div><div class="stack">{contacts}{restricted}</div></div>')
    S.add("rollcall-off", "Roll Call is off: the attendance card is gone.", **KW,
          main=head + f'<div class="split"><div class="stack">{about}</div><div class="stack">{contacts}{restricted}</div></div>')
    S.add("loading", "The record loading.", **KW, main=back + page_header("Youth record") + f'<div class="split"><div class="stack">{skeleton_list(4, "Loading the record")}</div><div class="stack">{skeleton_list(2, "Loading contacts")}</div></div>')
    S.add("error", "The record failed to load.", **KW, main=back + page_header("Youth record") + failed("We couldn’t load this record"))
    S.add("forbidden", "Daniel opens Amara Okonkwo, who is not assigned to him: 403, audited, and the page says so without naming anything from her record.", **KW,
          main=back + page_header("Youth record") + card(empty("This youth isn’t assigned to you", "You can open the records of the youth you mentor. Ask a program director if this looks wrong.", action=btn("Back to My youth", "", href=page("mentor-youth")), icon_name="lock"), cls="card--flush"))
    S.add("not-found", "A child of another organization, or an unknown address: not found, without saying which.", **KW,
          main=back + page_header("Youth record") + card(empty("We can’t find that youth", "They may belong to another organization.", action=btn("Back to My youth", "", href=page("mentor-youth")), icon_name="search"), cls="card--flush"))


# ---------------------------------------------------------------- mentor-group
@screen("mentor-group", "page", "My cohort", route="/mentoring/cohorts/:programId", reqs=["L2-065", "L2-063", R_MENTOR])
def mentor_group(S):
    crumbs = lambda cur: breadcrumb([("Mentoring", page("mentor-dashboard"))], cur)
    back = crumbs("Cohort")
    hdr = crumbs("After‑School Tutoring") + page_header("After‑School Tutoring", "2026–27 · Mon–Thu, 4–6 pm · You’re a supporting mentor")
    team = card(ul_list([list_item("Hana Kim", "Lead mentor", person=HANA), list_item("Daniel Osei", "Supporting mentor", person=DANIEL)], card=False, label="Mentors"),
                title="Mentors", tid="mentors", cls="card--flush")
    members = [("jordan", 11, "Hana Kim"), ("mateo", 9, "Daniel Osei"), ("sofia", 12, "Hana Kim"), ("yusuf", 13, "No mentor")]
    roster = card(ul_list([list_item(CHILD[c]["name"], f"Age {a} · {('Mentor: ' + mm) if mm != 'No mentor' else mm}", person=CHILD[c], href=page("mentor-youth-detail"))
                           for c, a, mm in members], card=False, label="Members"), title="Members · 4", tid="members", cls="card--flush")
    S.add("default", "Daniel opens After‑School Tutoring from his dashboard: the cohort’s term and schedule, its mentors and its four youth, each linking to their record.", **KW,
          main=hdr + f'<div class="split"><div class="stack">{roster}</div><div class="stack">{team}</div></div>')
    S.add("loading", "The cohort loading.", **KW, main=back + page_header("Cohort") + f'<div class="split"><div class="stack">{skeleton_list(4, "Loading members")}</div><div class="stack">{skeleton_list(2, "Loading mentors")}</div></div>')
    S.add("empty", "A cohort Daniel leads before anyone is enrolled: the members card says so.", **KW,
          main=crumbs("Winter Camp 2026") + page_header("Winter Camp 2026", "Winter 2026 · 21–23 Dec, 8 am–5 pm · You’re the lead mentor")
          + f'<div class="split"><div class="stack">{card(empty("No youth in this cohort yet", "When a program director enrolls youth, they show up here.", icon_name="users"), title="Members · 0", tid="members", cls="card--flush")}</div>'
          f'<div class="stack">{card(ul_list([list_item("Daniel Osei", "Lead mentor", person=DANIEL)], card=False, label="Mentors"), title="Mentors", tid="mentors", cls="card--flush")}</div></div>')
    S.add("error", "The cohort failed to load.", **KW, main=back + page_header("Cohort") + failed("We couldn’t load this cohort"))
    S.add("forbidden", "Daniel opens One-to-one Mentoring, a cohort he is not on: 403, audited.", **KW,
          main=back + page_header("Cohort") + card(empty("You’re not a mentor on this cohort", "You can open the cohorts you lead or support.", action=btn("Back to Mentoring", "", href=page("mentor-dashboard")), icon_name="lock"), cls="card--flush"))
    S.add("not-found", "A program of another organization, or an unknown address.", **KW,
          main=back + page_header("Cohort") + card(empty("We can’t find that cohort", "It may belong to another organization.", action=btn("Back to Mentoring", "", href=page("mentor-dashboard")), icon_name="search"), cls="card--flush"))


# ================================================================ Grade and assess (prompt 63, L2-080 to L2-083)
# Ported from Waypoint's reviews, grade-submission, assessment-approvals and competency mocks. Reviews need Learning as well as
# Mentoring; competencies need Mentoring only. Everything is scoped on the server to Daniel's youth (L2-065).
R_GRADE = ["L2-080", "L2-083", "L2-065", "L2-007", "L2-032", R_MENTOR]
R_QUIZ = ["L2-081", "L2-065", "L2-007", "L2-032", R_MENTOR]
R_COMP = ["L2-082", "L2-065", "L2-007", "L2-032", R_MENTOR]
SOFIA_Y = YOUTH["sofia"]
NADIA_Y = YOUTH["nadia"]
RKW = KW | {"modules": ["today", "mentor-dashboard"]}
ASSIGN = "Serve someone this week"
G_BRIEF = ("This week, put Pick Up the Towel into practice. Choose one person to serve without being asked, at home, at school or in your cohort. "
           "Afterwards, tell us what you did, how it felt and what you noticed.")
G_REFLECTION = ("On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. "
                "It felt small, but he noticed and said thanks.")
G_RUBRIC = [("Chose someone and served without being asked", 10), ("Described what they did and how it felt", 10), ("Named one thing they noticed", 5)]
G_COMMENT = "This is exactly it, Sofía. Serving is noticing what needs doing. Proud of you."
G_NOTE = "Great story, Sofía! Can you add a line about one thing you noticed? Then this is a full pass."
# The review queue: two assignments and two quizzes waiting, oldest first within each.
QUEUE = [
    (NADIA_Y, ASSIGN, "Assignment", "Mon 2 Nov, 7:40 pm", "Late", "mentor-grade"),
    (SOFIA_Y, ASSIGN, "Assignment", "Tue 3 Nov, 4:12 pm", "", "mentor-grade"),
    (NADIA_Y, "Knowing Yourself quiz", "Quiz · 75%", "Wed 4 Nov, 5:02 pm", "", "mentor-quiz-approvals"),
    (SOFIA_Y, "Leading by Serving quiz", "Quiz · 50%", "Thu 5 Nov, 9:15 am", "", "mentor-quiz-approvals"),
]
QUIZZES = [
    (NADIA_Y, "Knowing Yourself quiz", "Knowing Yourself", "75%", "70%", "Attempt 1", "Wed 4 Nov, 5:02 pm"),
    (SOFIA_Y, "Leading by Serving quiz", "Leading by Serving", "50%", "70%", "Attempt 1", "Thu 5 Nov, 9:15 am"),
]
COMPETENCIES = [
    ("Serves others", "Notices what needs doing and helps without being asked.", "Proficient", "Stacked the chairs after tutoring two weeks running."),
    ("Speaks up", "Shares ideas in the group and says when something is wrong.", "Developing", "Quiet in big groups; spoke up twice in pairs this week."),
    ("Leads a small group", "Guides a discussion and keeps a small group on track.", "Not started", ""),
    ("Follows through", "Finishes what they start and keeps their promises.", "Mastered", "Every assignment in on time this term."),
    ("Works with others", "Listens, takes turns and helps the group decide.", "Proficient", ""),
]
LEVELS = ["Not started", "Developing", "Proficient", "Mastered"]
LEVEL_KIND = {"Not started": "", "Developing": "info", "Proficient": "success", "Mastered": "success"}


def review_crumbs(cur: str) -> str:
    return breadcrumb([("Mentoring", page("mentor-dashboard")), ("Reviews", page("mentor-reviews"))], cur)


def queue_table(rows) -> str:
    body = [[f'<span class="cluster cluster--snug">{avatar(y)}<strong>{esc(y["name"])}</strong></span>', esc(t), esc(k),
             badge(f"{w} · {late}", "warning") if late else esc(w),
             btn("Review", "", size="sm", href=page(target), aria_label=f"Review {y['name']}’s {t}")] for y, t, k, w, late, target in rows]
    return table("Waiting for your review", ["Youth", "Work", "Type", "Submitted", "Actions"], body, hide_sm={2, 3})


# ---------------------------------------------------------------- mentor-reviews
@screen("mentor-reviews", "page", "Reviews", route="/mentoring/reviews", reqs=["L2-080", "L2-081", "L2-065", R_MENTOR])
def mentor_reviews(S):
    back = breadcrumb([("Mentoring", page("mentor-dashboard"))], "Reviews")
    hdr = back + page_header("Reviews", "Work from your youth waiting for you, oldest first.",
                             btn("Quiz approvals", "", icon_name="check", href=page("mentor-quiz-approvals")))
    tabs = lambda cur: tabs_nav([("All 4", page("mentor-reviews"), cur == "all"), ("Assignments 2", page("mentor-reviews", "assignments"), cur == "a"),
                                 ("Quizzes 2", page("mentor-reviews", "quizzes"), cur == "q")], "Filter reviews")
    S.add("default", "Daniel opens Reviews: two assignments and two quiz results from his youth, oldest first; Nadia’s came in after the due date.", **RKW,
          main=hdr + tabs("all") + queue_table(QUEUE),
          notes=note("Only work from Daniel’s youth (assigned directly or through a cohort he is on) ever reaches this list; the server filters it.", "top: 5rem; right: 1rem;"))
    S.add("assignments", "Filtered to assignments: the two submissions waiting for a grade.", **RKW, main=hdr + tabs("a") + queue_table(QUEUE[:2]))
    S.add("quizzes", "Filtered to quizzes: the two results waiting for his approval.", **RKW, main=hdr + tabs("q") + queue_table(QUEUE[2:]))
    S.add("loading", "Reviews loading.", **RKW, main=back + page_header("Reviews", "Work from your youth waiting for you, oldest first.") + skeleton_list(4, "Loading reviews"))
    S.add("empty", "Nothing waiting: Daniel is caught up.", **RKW,
          main=back + page_header("Reviews", "Work from your youth waiting for you, oldest first.")
          + card(empty("You’re all caught up", "New assignments and quiz results from your youth show up here.", action=btn("Back to Mentoring", "", href=page("mentor-dashboard")), icon_name="check-circle"), cls="card--flush"))
    S.add("error", "Reviews failed to load.", **RKW, main=back + page_header("Reviews") + failed("We couldn’t load your reviews"))
    S.add("forbidden", "Marisol (Program director) opens /mentoring/reviews: reviews are for mentors; the server answers 403.", nav="today", user=STAFF["marisol"],
          main=page_header("Reviews", "") + forbidden("Reviews are for mentors", "A youth’s mentor grades their work."))


# ---------------------------------------------------------------- mentor-grade
def score_rows(scores, err=None) -> str:
    err = err or {}
    out = []
    for i, ((d, pts), s) in enumerate(zip(G_RUBRIC, scores)):
        out.append(field(f"score-{i + 1}", f"{d} (0 to {pts})", type_="number", value="" if s is None else str(s), inputmode="numeric",
                         attrs=f' min="0" max="{pts}" step="1"', error=err.get(f"score-{i + 1}", "")))
    return "".join(out)


def grade_form(scores=(10, 10, 5), comment=G_COMMENT, err=None, busy="", extra="") -> str:
    err = err or {}
    total = sum(s for s in scores if s is not None)
    summary = form_summary(list(err.items())) if err else ""
    rubric = card(f'<div class="stack">{score_rows(scores, err)}<p class="text-muted" aria-live="polite">Total: <strong>{total} / 25</strong></p></div>', title="Rubric", tid="rubric")
    feedback = card(textarea("comment", f"Comment to Sofía", value=comment, rows=4, optional=True, count=f"{len(comment):,} / 2,000",
                             help_="They see this with their points. A request for revision needs a note.", error=err.get("comment", "")), title="Feedback", tid="feedback")
    actions = (f'<div class="form-actions">{btn("Save draft", "ghost", icon_name="check", busy=busy == "draft")}'
               f'{btn("Request revision", "", icon_name="edit", attrs=" aria-haspopup=\"dialog\"", data_href=dialog("request-revision"))}'
               f'{btn("Approve", "primary", icon_name="check-circle", busy=busy == "approve", attrs=" aria-haspopup=\"dialog\"", data_href=dialog("approve-submission"))}</div>')
    return f'<form class="stack" action="#" method="post" novalidate>{summary}{extra}{rubric}{feedback}{actions}</form>'


def submitted_work(late=False) -> str:
    photo = list_item("stacked-chairs.jpg", "Photo · 1.2 MB", lead=f'<span class="icon-tile" aria-hidden="true">{icon("file")}</span>',
                      end=btn("Open", "ghost", size="sm", aria_label="Open the photo stacked-chairs.jpg"))
    lt = badge("Late", "warning") if late else ""
    task = f'<details><summary>The task</summary><p>{esc(G_BRIEF)}</p></details>'
    return card(f'<div class="stack">{lt}<div class="reading">{esc(G_REFLECTION)}</div>{ul_list([photo], card=False, label="Attached")}{task}</div>', title="What Sofía sent", tid="sent")


@screen("mentor-grade", "page", "Grade a submission", route="/mentoring/reviews/submissions/:id", reqs=R_GRADE,
        na={"empty": "A submission always carries the work it was sent with and its assignment’s rubric."})
def mentor_grade(S):
    hdr = lambda st="In review", kind="info": review_crumbs("Grade") + page_header(f'{ASSIGN} {badge(st, kind)}', "Sofía Rivera · Leading by Serving · submitted Tue 3 Nov, 4:12 pm")
    who = card(f'<div class="cluster">{avatar(SOFIA_Y, "md")}<div><strong>Sofía Rivera</strong><div class="text-muted">Round 1</div></div></div>', title="Youth", tid="youth")

    def body(form, late=False) -> str:
        return f'<div class="split"><div class="stack">{who}{submitted_work(late)}</div><div class="stack">{form}</div></div>'

    S.add("default", "Daniel opens Sofía’s submission: what she sent beside the rubric, a score for each criterion, the total and his comment. Opening it moves it to In review.", **RKW,
          main=hdr() + body(grade_form()),
          notes=note("Scores are checked against each criterion’s points on the server; the total is computed there too. Leaving with changes asks first.", "top: 5rem; right: 1rem;"))
    S.add("draft-saved", "Save draft keeps his scores and comment without changing what Sofía sees (still In review).", **RKW,
          main=hdr() + body(grade_form(scores=(10, 8, None), comment="Strong start.")),
          toast_html=toast_region(toast("success", "Draft saved", "Sofía still sees In review.")))
    S.add("invalid", "Approve with a criterion blank and one over its points: inline errors and a summary; nothing is sent.", **RKW,
          main=hdr() + body(grade_form(scores=(12, 10, None), err={"score-1": "Give 0 to 10 points.", "score-3": "Score this criterion before you approve."})))
    S.add("busy", "Saving: the buttons are busy and nothing can be sent twice.", **RKW, main=hdr() + body(grade_form(busy="approve")))
    S.add("failed", "The save failed: everything he entered is still on the page.", **RKW,
          main=hdr() + body(grade_form(extra=alert("danger", "That didn’t save", "Your scores and comment are still here. Try again."))))
    S.add("conflict", "Hana Kim, lead of Sofía’s cohort, saved a grade after Daniel opened it: 409, his entries kept, and Load the latest.", **RKW,
          main=hdr() + body(grade_form(extra=alert("warning", "This submission changed after you opened it", "Someone else saved a grade for it. Your scores and comment are still here; load the latest before you save.",
                                                   actions=btn("Load the latest", "", size="sm", icon_name="refresh")))))
    S.add("approved", "Approved: Accepted with 25 of 25 points; Sofía sees the points and the comment, and the queue moves on.", **RKW,
          main=hdr("Accepted", "success") + alert("success", "Approved", "Sofía sees 25 of 25 points and your comment.", actions=btn("Back to Reviews", "", size="sm", href=page("mentor-reviews")))
          + body(card(facts([("Points", "25 / 25"), ("Comment", esc(G_COMMENT)), ("Reviewed by", "Daniel Osei, Thu 5 Nov, 10:20 am")]), title="Your review", tid="outcome")),
          toast_html=toast_region(toast("success", "Approved", f"{ASSIGN} · Sofía Rivera")))
    S.add("revision-sent", "Revision requested: Needs revision with his note; she can resubmit, and it returns to this list when she does.", **RKW,
          main=hdr("Needs revision", "warning") + alert("info", "Sent back to Sofía", "She sees your note and can resubmit.", actions=btn("Back to Reviews", "", size="sm", href=page("mentor-reviews")))
          + body(card(facts([("Your note", esc(G_NOTE)), ("Sent", "Thu 5 Nov, 10:20 am")]), title="Your review", tid="outcome")))
    S.add("late", "Nadia’s submission came in after the due date and grace period: marked Late.", **RKW,
          main=review_crumbs("Grade") + page_header(f'{ASSIGN} {badge("In review", "info")}', "Nadia Haddad · Knowing Yourself · submitted Mon 2 Nov, 7:40 pm · late")
          + body(grade_form(scores=(None, None, None), comment="").replace("Comment to Sofía", "Comment to Nadia"), late=True).replace("Sofía Rivera", "Nadia Haddad").replace("What Sofía sent", "What Nadia sent").replace("Age 12", "Age 18"))
    S.add("loading", "The submission loading.", **RKW, main=review_crumbs("Grade") + page_header("Grade a submission") + f'<div class="split">{skeleton_list(3, "Loading the work")}{skeleton_list(3, "Loading the rubric")}</div>')
    S.add("error", "The submission failed to load.", **RKW, main=review_crumbs("Grade") + page_header("Grade a submission") + failed("We couldn’t load this submission"))
    S.add("not-found", "A submission from a youth who isn’t his, another organization’s, or an unknown address: not found, without saying which.", **RKW,
          main=review_crumbs("Grade") + page_header("Grade a submission") + card(empty("We can’t find that submission", "It may belong to a youth you don’t mentor.", action=btn("Back to Reviews", "", href=page("mentor-reviews")), icon_name="search"), cls="card--flush"))


# ---------------------------------------------------------------- mentor-quiz-approvals
def quiz_table(rows) -> str:
    body = [[f'<span class="cluster cluster--snug">{avatar(y)}<strong>{esc(y["name"])}</strong></span>', esc(q), esc(m),
             badge(f"{s} · Below pass mark", "warning") if int(s[:-1]) < int(p[:-1]) else badge(f"{s} · Pass", "success"), esc(w),
             btn("Approve", "", size="sm", data_href=dialog("approve-quiz"), attrs=' aria-haspopup="dialog"', aria_label=f"Approve {y['name']}’s {q}")]
            for y, q, m, s, p, a, w in rows]
    return table("Quiz results waiting for approval", ["Youth", "Quiz", "Module", "Auto-score", "Submitted", "Actions"], body, hide_sm={2, 4})


@screen("mentor-quiz-approvals", "page", "Quiz approvals", route="/mentoring/reviews/quizzes", reqs=R_QUIZ)
def mentor_quiz_approvals(S):
    hdr = review_crumbs("Quiz approvals") + page_header("Quiz approvals", "Confirm a quiz’s score, or override it, before it counts.",
                                                        btn("Approve all", "primary", icon_name="check", attrs=' aria-haspopup="dialog"', data_href=dialog("approve-all-quizzes")))
    info = alert("info", "Youth see only the approved score", "Quizzes are scored automatically. Override a score when a written answer deserves partial credit; the auto-score is kept too.")
    S.add("default", "Two quiz results that need Daniel’s approval: the auto-score against the pass mark, Approve for each and Approve all.", **RKW, main=hdr + info + quiz_table(QUIZZES))
    S.add("approved", "Nadia’s result approved: it leaves the list and counts toward her progress.", **RKW, main=hdr + info + quiz_table(QUIZZES[1:]),
          toast_html=toast_region(toast("success", "Approved", "Knowing Yourself quiz · Nadia Haddad · 75%")))
    S.add("loading", "Quiz approvals loading.", **RKW, main=review_crumbs("Quiz approvals") + page_header("Quiz approvals", "Confirm a quiz’s score, or override it, before it counts.") + skeleton_list(2, "Loading quiz results"))
    S.add("empty", "Nothing to approve: completed quizzes that need approval appear here.", **RKW,
          main=review_crumbs("Quiz approvals") + page_header("Quiz approvals", "Confirm a quiz’s score, or override it, before it counts.")
          + card(empty("No quiz results to approve", "When one of your youth finishes a quiz that needs your approval, it appears here.", action=btn("Back to Reviews", "", href=page("mentor-reviews")), icon_name="check-circle"), cls="card--flush"))
    S.add("error", "Quiz approvals failed to load.", **RKW, main=review_crumbs("Quiz approvals") + page_header("Quiz approvals") + failed("We couldn’t load quiz results"))


# ---------------------------------------------------------------- mentor-competency
def level_group(i: int, name: str, level: str) -> str:
    items = "".join(f'<button class="btn" type="button" aria-pressed="{"true" if lv == level else "false"}">{lv}</button>' for lv in LEVELS)
    return f'<div class="button-group" role="group" aria-label="{esc(name)} level">{items}</div>'


def comp_item(i, name, desc, level, notes, err="") -> str:
    head = f'<div class="cluster cluster--between"><div><h3 class="card__title" id="comp-{i}">{esc(name)}</h3><p class="text-muted">{esc(desc)}</p></div>{badge(level, LEVEL_KIND[level])}</div>'
    return card(f'<div class="stack">{head}{level_group(i, name, level)}{textarea(f"notes-{i}", f"Notes on {name}", value=notes, rows=2, optional=True, error=err)}</div>', tag="article")


def comp_body(items=COMPETENCIES, err=None, busy=False, extra="", saved="Last saved Wed 28 Oct by Daniel Osei") -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    count = sum(1 for c in items if c[2] in ("Proficient", "Mastered"))
    head = card(f'<div class="cluster">{avatar(SOFIA_Y, "md")}<div><strong>Sofía Rivera</strong><div class="text-muted">{count} of {len(items)} proficient or mastered</div></div></div>'
                f'<p class="text-muted">Rate each competency as you see it: Not started, Developing, Proficient, Mastered.</p>', title="Summary", tid="summary")
    rows = "".join(comp_item(i + 1, *c, err=err.get(f"notes-{i + 1}", "")) for i, c in enumerate(items))
    bar = f'<div class="form-actions"><span class="text-muted">{saved}</span>{btn("Cancel", "ghost", href=page("mentor-youth-detail"))}{btn("Save changes", "primary", icon_name="check", busy=busy)}</div>'
    return f'<form class="stack" action="#" method="post" novalidate>{summary}{extra}{head}{rows}{bar}</form>'


@screen("mentor-competency", "page", "Competencies", route="/mentoring/youth/:childId/competencies", reqs=R_COMP)
def mentor_competency(S):
    crumbs = breadcrumb([("Mentoring", page("mentor-dashboard")), ("My youth", page("mentor-youth")), ("Sofía Rivera", page("mentor-youth-detail", "onboarded"))], "Competencies")
    hdr = crumbs + page_header("Competencies", "Sofía Rivera · After‑School Tutoring · set each level and add a note.")
    S.add("default", "Daniel assesses Sofía: five competencies of Harbourview’s framework, each with its latest level and note, and how many are proficient or mastered.", **RKW,
          main=hdr + comp_body(), notes=note("Every save adds an assessment with who and when; the latest per competency is what shows. Only changed competencies are sent.", "top: 5rem; right: 1rem;"))
    S.add("saved", "Saved: Speaks up moved to Proficient; the count and the last-saved line update.", **RKW,
          main=hdr + comp_body([c if c[0] != "Speaks up" else (c[0], c[1], "Proficient", "Spoke up in the whole group on Thursday.") for c in COMPETENCIES], saved="Last saved Thu 5 Nov by Daniel Osei"),
          toast_html=toast_region(toast("success", "Competencies saved", "Sofía Rivera · 1 changed")))
    S.add("invalid", "A note over 2,000 characters: inline error and summary; nothing is saved.", **RKW,
          main=hdr + comp_body(err={"notes-2": "Keep the note to 2,000 characters."}))
    S.add("busy", "Saving: Save changes is busy.", **RKW, main=hdr + comp_body(busy=True))
    S.add("failed", "The save failed: every level and note he set is still there.", **RKW, main=hdr + comp_body(extra=alert("danger", "That didn’t save", "Your changes are still here. Try again.")))
    S.add("loading", "Competencies loading.", **RKW, main=crumbs + page_header("Competencies") + skeleton_list(5, "Loading competencies"))
    S.add("empty", "The organization has no competencies yet: one calm empty state.", **RKW,
          main=hdr + card(empty("No competencies yet", "Your organization hasn’t set up its competency framework. A program director adds it in Curriculum.", icon_name="star"), cls="card--flush"))
    S.add("error", "Competencies failed to load.", **RKW, main=crumbs + page_header("Competencies") + failed("We couldn’t load competencies"))
    S.add("forbidden", "Amara Okonkwo isn’t assigned to Daniel: 403, nothing about her shown.", **RKW,
          main=crumbs.replace("Sofía Rivera", "Youth record") + page_header("Competencies") + card(empty("This youth isn’t assigned to you", "You can assess the youth you mentor.", action=btn("Back to My youth", "", href=page("mentor-youth")), icon_name="lock"), cls="card--flush"))
