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
                      btn("My youth", "", icon_name="users", href=page("mentor-youth")))
    numbers = kpis([("My youth", "6", "Across 2 cohorts"), ("My cohorts", "2", "Lead mentor on 1"), ("Checked in this week", "4", "of your 6 youth")])
    youth = card(ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH[:5]], card=False, label="Your youth"),
                 title="My youth", tid="my-youth", cls="card--flush", footer=f'<a href="{page("mentor-youth")}">View all 6</a>')
    cohorts = card(ul_list([list_item(n, f"{r} · {k} youth", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("users", "icon--sm")}</span>',
                                      href=page("mentor-group")) for _, n, r, k in COHORTS], card=False, label="Your cohorts"),
                   title="My cohorts", tid="my-cohorts", cls="card--flush")
    activity = card(feed(ACTIVITY), title="Recent activity", tid="activity")
    S.add("default", "Daniel opens Mentoring: his six youth (Mateo directly, the rest through the two cohorts he is on), his cohorts and their latest check-ins.", **KW,
          main=hdr + numbers + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{cohorts}{activity}</div></div>',
          notes=note("Every number and row is computed on the server over Daniel’s assigned youth only; recent activity is the last five attendance changes in 14 days.", "top: 5rem; right: 1rem;"))
    S.add("loading", "The dashboard loading: skeletons in the same layout.", **KW,
          main=hdr + skeleton_kpis(3) + f'<div class="split"><div class="stack">{skeleton_list(5, "Loading your youth")}</div><div class="stack">{skeleton_list(2, "Loading your cohorts")}</div></div>')
    S.add("empty", "Hana, a mentor nobody has assigned yet: one calm empty state instead of zeros.", **(KW | {"user": HANA}),
          main=page_header("Mentoring", "Welcome back, Hana. Here’s how your youth are doing.")
          + card(empty("No youth assigned yet", "A program director assigns youth to you, or adds you to a cohort’s mentors. They appear here with their latest activity.", icon_name="users"), cls="card--flush"))
    S.add("error", "The dashboard failed to load; the shell stays.", **KW, main=hdr + failed("We couldn’t load your dashboard"))
    S.add("rollcall-off", "Roll Call is off for Harbourview: no attendance number and no Recent activity card; nothing about check-in is mentioned.", **KW,
          main=hdr + kpis([("My youth", "6", "Across 2 cohorts"), ("My cohorts", "2", "Lead mentor on 1")])
          + f'<div class="split"><div class="stack">{youth}</div><div class="stack">{cohorts}</div></div>')
    S.add("forbidden", "Marisol (Program director) opens /mentoring directly: the dashboard is for mentors; the server answers 403.", nav="today", user=STAFF["marisol"],
          main=page_header("Mentoring", "") + forbidden("Mentoring is for mentors", "Program directors assign mentors from a cohort’s page in Programs."))


# ---------------------------------------------------------------- mentor-youth
@screen("mentor-youth", "page", "My youth", route="/mentoring/youth", reqs=["L2-063", "L2-065", R_MENTOR])
def mentor_youth(S):
    back = f'<p><a href="{page("mentor-dashboard")}">{icon("arrow-left", "icon--sm")} Mentoring</a></p>'
    hdr = back + page_header("My youth", "6 youth assigned to you, directly or through a cohort you’re on.")
    search = lambda v="": f'<form role="search" action="#" class="stack">{field("q", "Search your youth", type_="search", value=v, autocomplete="off")}</form>'
    rows = ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH], label="Your youth")
    S.add("default", "Daniel’s six youth by name, each with age and cohort; each row opens the youth’s record.", **KW, main=hdr + search() + rows)
    S.add("searched", "Searching “tran” narrows to Emily and Kevin Tran.", **KW,
          main=hdr + search("tran") + ul_list([youth_item(c, p, a) for c, p, a in MY_YOUTH if CHILD[c]["name"].endswith("Tran")], label="Your youth"))
    S.add("no-results", "A search nothing matches: a labelled empty state with Clear search.", **KW,
          main=hdr + search("zed") + card(empty("No youth match “zed”", "Try another name, or clear the search to see all six.", action=btn("Clear search", ""), icon_name="search"), cls="card--flush"))
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
    back = f'<p><a href="{page("mentor-youth")}">{icon("arrow-left", "icon--sm")} My youth</a></p>'
    head = (back + '<div class="page-header"><div class="cluster">' + avatar(m, "lg") + '<div><h1>Mateo Rivera</h1>'
            '<p class="subtitle">Age 9 · Bennetto Elementary, Grade 4</p></div></div></div>')
    about = card(facts([("Programs", "After‑School Tutoring"), ("Mentor", "Daniel Osei (you)"), ("Goes by", "Not set"), ("Pronouns", "Not set")]), title="About", tid="about")
    contacts = card(ul_list([
        list_item("Carmen Rivera", f'Mother · primary contact<br><a href="tel:9055550142">905-555-0142</a> · <a href="mailto:carmen.rivera@example.com">carmen.rivera@example.com</a>', person=GUARDIANS["carmen"]),
        list_item("Luis Rivera", 'Uncle or aunt<br><a href="tel:9055550199">905-555-0199</a>', person=dict(name="Luis Rivera", initials="LR", color="peach")),
    ], card=False, label="Guardian contacts"), title="Guardian contacts", tid="contacts", cls="card--flush")
    attendance = card(table("Recent attendance", ["Session", "When", "Status"], [
        ["Tutoring night", "Today, 4:02 pm", status("Checked in", "success")],
        ["Tutoring night", "Wed 4 Nov", status("Signed out", "")],
        ["Tutoring night", "Tue 3 Nov", status("Absent", "danger")],
    ]).replace("table-wrap card card--flush", "table-wrap"), title="Recent attendance", tid="attendance", cls="card--flush")
    restricted = alert("info", "Medical details stay with staff on site", "Allergies, medication, the date of birth and the Quick Card are not part of a mentor’s view.")
    body = f'<div class="split"><div class="stack">{about}{attendance}</div><div class="stack">{contacts}{restricted}</div></div>'
    S.add("default", "Daniel opens Mateo, whom he mentors: what a mentor may see, nothing more. The open is audited.", **KW, main=head + body,
          notes=note("The API never sends the date of birth, medical fields, health card, notes or approved pickups to a mentor; the page has nothing to hide.", "top: 5rem; right: 1rem;"))
    S.add("onboarded", "Sofía finished her first-run setup: the record shows the name she goes by and her pronouns.", **KW,
          main=head.replace("Mateo Rivera", "Sofía Rivera").replace("Age 9 · Bennetto Elementary, Grade 4", "Age 12 · Bennetto Elementary, Grade 7").replace(avatar(m, "lg"), avatar(CHILD["sofia"], "lg"))
          + body.replace(facts([("Programs", "After‑School Tutoring"), ("Mentor", "Daniel Osei (you)"), ("Goes by", "Not set"), ("Pronouns", "Not set")]),
                         facts([("Programs", "After‑School Tutoring"), ("Mentor", "Hana Kim"), ("Goes by", "Sofía"), ("Pronouns", "she/her")])))
    S.add("rollcall-off", "Roll Call is off: the attendance card is gone.", **KW,
          main=head + f'<div class="split"><div class="stack">{about}</div><div class="stack">{contacts}{restricted}</div></div>')
    S.add("loading", "The record loading.", **KW, main=back + page_header("Youth record") + f'<div class="split"><div class="stack">{skeleton_list(4, "Loading the record")}</div><div class="stack">{skeleton_list(2, "Loading contacts")}</div></div>')
    S.add("error", "The record failed to load.", **KW, main=back + page_header("Youth record") + failed("We couldn’t load this record"))
    S.add("forbidden", "Daniel opens Amara Okonkwo, who is not assigned to him: 403, audited, and the page says so without naming anything from her record.", **KW,
          main=back + page_header("Youth record") + forbidden("This youth isn’t assigned to you", "You can open the records of the youth you mentor. Ask a program director if this looks wrong."))


# ---------------------------------------------------------------- mentor-group
@screen("mentor-group", "page", "My cohort", route="/mentoring/cohorts/:programId", reqs=["L2-065", "L2-063", R_MENTOR])
def mentor_group(S):
    back = f'<p><a href="{page("mentor-dashboard")}">{icon("arrow-left", "icon--sm")} Mentoring</a></p>'
    hdr = back + page_header("After‑School Tutoring", "2026–27 · Mon–Thu, 4–6 pm · You’re a supporting mentor")
    team = card(ul_list([list_item("Hana Kim", "Lead mentor", person=HANA), list_item("Daniel Osei (you)", "Supporting mentor", person=DANIEL)], card=False, label="Mentors"),
                title="Mentors", tid="mentors", cls="card--flush")
    members = [("jordan", 11, "Hana Kim"), ("mateo", 9, "Daniel Osei"), ("sofia", 12, "Hana Kim"), ("yusuf", 13, "No mentor")]
    roster = card(ul_list([list_item(CHILD[c]["name"], f"Age {a} · {('Mentor: ' + mm) if mm != 'No mentor' else mm}", person=CHILD[c], href=page("mentor-youth-detail"))
                           for c, a, mm in members], card=False, label="Members"), title="Members · 4", tid="members", cls="card--flush")
    S.add("default", "Daniel opens After‑School Tutoring from his dashboard: the cohort’s term and schedule, its mentors and its four youth, each linking to their record.", **KW,
          main=hdr + f'<div class="split"><div class="stack">{roster}</div><div class="stack">{team}</div></div>')
    S.add("loading", "The cohort loading.", **KW, main=back + page_header("Cohort") + f'<div class="split"><div class="stack">{skeleton_list(4, "Loading members")}</div><div class="stack">{skeleton_list(2, "Loading mentors")}</div></div>')
    S.add("empty", "A cohort Daniel leads before anyone is enrolled: the members card says so.", **KW,
          main=back + page_header("Winter Camp 2026", "Winter 2026 · 21–23 Dec, 8 am–5 pm · You’re the lead mentor")
          + f'<div class="split"><div class="stack">{card(empty("No youth in this cohort yet", "When a program director enrolls youth, they show up here.", icon_name="users"), title="Members · 0", tid="members", cls="card--flush")}</div>'
          f'<div class="stack">{card(ul_list([list_item("Daniel Osei (you)", "Lead mentor", person=DANIEL)], card=False, label="Mentors"), title="Mentors", tid="mentors", cls="card--flush")}</div></div>')
    S.add("error", "The cohort failed to load.", **KW, main=back + page_header("Cohort") + failed("We couldn’t load this cohort"))
    S.add("forbidden", "Daniel opens One-to-one Mentoring, a cohort he is not on: 403, audited.", **KW,
          main=back + page_header("Cohort") + forbidden("You’re not a mentor on this cohort", "You can open the cohorts you lead or support."))
