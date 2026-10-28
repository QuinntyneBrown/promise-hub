"""Core staff pages: today, check-in, quick card, events, families, programs."""
from kit import *  # noqa: F401,F403
from reg import screen

J = STAFF["jaylen"]
M = STAFF["marisol"]
T = STAFF["tom"]

R_ENROLL, R_SLIPS, R_ROLL, R_QC, R_PICKUP, R_NOTIFY, R_INC, R_REPORTS = (
    "L1-005", "L1-006", "L1-007", "L1-008", "L1-009", "L1-010", "L1-011", "L1-012")
R_MOBILE, R_PRIVACY, R_DATA = "L1-014", "L1-015", "L1-005"


def child_href(cid: str, state: str = "default") -> str:
    return page("child", state)


def child_name_link(c: dict) -> str:
    return f'<a href="{child_href(c["id"])}">{esc(c["name"])}</a>'


def offline_banner(queued: int = 0) -> str:
    q = f" {queued} check-in{'s' if queued != 1 else ''} queued." if queued else ""
    return alert("warning", "You’re offline", f"Roster saved 3:58 pm.{q}", banner=True)


# ------------------------------------------------------------------ Today
@screen("today", "page", "Today", route="/", reqs=[R_ROLL, R_SLIPS, R_NOTIFY, "L2-100", "L2-101"], na={})
def today(S):
    def main_default(partial=False):
        greeting = page_header("Good afternoon, Jaylen", f"{TODAY} · Harbourview Community Centre",
                               btn("Open check-in", "primary", icon_name="clipboard", href=page("check-in")))
        sess = card(
            '<div class="stack">' + progress(31, 48, "Checked in: 31 of 48", kind="success", show="31 of 48 checked in") +
            f'<div class="cluster cluster--snug">{status("31 checked in", "success")}{status("2 absent, guardians told", "danger")}{status("15 not yet here", "")}</div>'
            f'<div class="cluster">{btn("Continue check-in", "primary", href=page("check-in"))}{btn("Quick Cards", "", icon_name="heart-pulse", href=page("quick-card"))}</div></div>',
            title="Tutoring night" + ' <span class="text-muted nowrap" style="font: var(--text-body-sm);">4:00–6:00 pm · Room 2</span>', tid="sess")
        if partial:
            slips = card(empty("Slips didn’t load", "Try again.",
                               action=btn("Try again", "", icon_name="refresh") + btn("Open events", "ghost", href=page("events")), error=True, icon_name="alert-triangle"),
                         title="Slips due", tid="slips", cls="card--flush")
        else:
            slips = card(ul_list([
                list_item('Fall field trip: Royal Botanical Gardens', '41 of 48 signed · due 12 Nov', lead=f'<span class="icon-tile" aria-hidden="true">{icon("bus")}</span>',
                          href=page("event"), end=badge("7 unsigned", "warning")),
                list_item('Winter Camp · Day 1', '12 of 35 signed · due 18 Dec', lead=f'<span class="icon-tile" aria-hidden="true">{icon("sun")}</span>',
                          href=page("event", "upcoming"), end=badge("23 unsigned", "")),
            ], card=False), title="Slips due", tid="slips", cls="card--flush", footer=f'<a href="{page("slips")}">All slips</a>')
        up = card(ul_list([
            list_item("Saturday Sports", "Sat 7 Nov, 10:00 am · Bennetto School gym · 62 on roster", lead=f'<span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>', href=page("event", "upcoming")),
            list_item("Fall field trip: Royal Botanical Gardens", "Sat 14 Nov, 9:00 am · bus leaves 8:45 am", lead=f'<span class="icon-tile" aria-hidden="true">{icon("bus")}</span>', href=page("event")),
        ], card=False), title="Coming up", tid="up", cls="card--flush", footer=f'<a href="{page("events")}">All events</a>')
        act = card('<ul class="feed">'
                   f'<li>{avatar(GUARDIANS["carmen"])}<div class="feed__body"><strong>Carmen Rivera</strong> signed Mateo’s RBG slip<div class="feed__meta">Today, 3:41 pm</div></div></li>'
                   f'<li>{avatar(T)}<div class="feed__body"><strong>Tom Nguyen</strong> accepted 3 Tutoring enrollments<div class="feed__meta">Today, 1:10 pm</div></div></li>'
                   f'<li>{avatar(GUARDIANS["nour"])}<div class="feed__body"><strong>Nour Haddad</strong> updated Yusuf’s medication<div class="feed__meta">Yesterday, 8:22 pm</div></div></li>'
                   f'<li>{avatar(M)}<div class="feed__body"><strong>Marisol Delgado</strong> reminded 7 guardians<div class="feed__meta">Yesterday, 5:05 pm</div></div></li>'
                   '</ul>', title="Recent activity", tid="act", cls="card--flush")
        tasks = card(ul_list([
            list_item("1 incident to review", "Reported by Aisha Bello · today", lead=f'<span class="icon-tile" aria-hidden="true">{icon("alert-triangle")}</span>', href=page("incidents")),
            list_item("3 enrollments to review", "Applications, referrals and enrollments", lead=f'<span class="icon-tile" aria-hidden="true">{icon("users")}</span>', href=page("applications")),
        ], card=False), title="Waiting for you", tid="tasks", cls="card--flush")
        return greeting + kpis([("Active children", "184", "+6 this month"), ("Households", "112", "3 waiting review"), ("Slips unsigned", "30", "across 2 events"), ("Sessions this week", "9", "7 attendance recorded")]) + \
            f'<div class="split"><div class="stack">{tasks}{sess}{up}</div><div class="stack">{slips}{act}</div></div>'

    S.add("default", "Site lead’s home at 4:12 pm on a tutoring night: today’s session, slips due, upcoming events and recent activity.",
          nav="today", main=main_default(), checkin_badge=15)
    S.add("roster-only", "An organization with only Roster on: counts and what is coming up; no sessions, slips or review work, and nothing links to an off module.", nav="today",
          main=page_header("Good afternoon, Marisol", f"{TODAY} · Harbourview Community Centre") + kpis([("Active children", "184", "+6 this month"), ("Households", "112", "")]) +
          card(ul_list([
              list_item("Saturday Sports", "Sat 7 Nov, 10:00 am · Bennetto School gym", lead=f'<span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>'),
              list_item("Fall field trip: Royal Botanical Gardens", "Sat 14 Nov, 9:00 am", lead=f'<span class="icon-tile" aria-hidden="true">{icon("bus")}</span>'),
          ], card=False), title="Coming up", tid="up", cls="card--flush"))
    S.add("loading", "Today while the first request is in flight: skeletons match the final layout.", nav="today",
          main=page_header("Good afternoon, Jaylen", f"{TODAY} · Harbourview Community Centre") + skeleton_kpis() +
          f'<div class="split"><div class="card" aria-busy="true" aria-label="Loading today’s session">{skeleton_header()}<span class="skeleton skeleton--card" aria-hidden="true"></span></div>{skeleton_list(2, "Loading slips due")}</div>')
    S.add("empty", "First run: the organization has no programs or children yet. One action: import a roster.", nav="today", unread=0,
          main=page_header("Welcome, Marisol", f"{ORG} · {TODAY}") +
          card(empty("Nothing here yet", "Import a roster to begin.",
                     action=btn("Start setup", "primary", icon_name="arrow-right", href=page("onboard-welcome")) + btn("Import a roster", "", icon_name="upload", href=page("import-roster")), icon_name="sparkle"), cls="card--flush"),
          user=M)
    S.add("error", "Today failed to load: the chrome stays, the message says what to try.", nav="today",
          main=page_header("Good afternoon, Jaylen", f"{TODAY} · Harbourview Community Centre") +
          card(empty("Couldn’t load Today", "Try again.",
                     action=btn("Try again", "primary", icon_name="refresh") + btn("Open check-in", "", href=page("check-in", "offline")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("partial", "The session and events loaded but the slips section failed; the rest keeps working.", nav="today", main=main_default(partial=True), checkin_badge=15)
    S.add("single-module", "The organization turned every module off except Roll Call: Today shows only tonight’s session and the navigation shrinks to Today and Check-in.", nav="today",
          modules=["today", "check-in"], checkin_badge=15,
          main=page_header("Good afternoon, Jaylen", f"{TODAY} · Harbourview Community Centre", btn("Open check-in", "primary", icon_name="clipboard", href=page("check-in"))) +
          kpis([("Active children", "184", "+6 this month"), ("Sessions this week", "9", "7 attendance recorded"), ("Checked in now", "31", "of 48 on roster"), ("Absent tonight", "2", "guardians told")]) +
          card('<div class="stack">' + progress(31, 48, "Checked in: 31 of 48", kind="success", show="31 of 48 checked in") +
               f'<div class="cluster cluster--snug">{status("31 checked in", "success")}{status("2 absent, guardians told", "danger")}{status("15 not yet here", "")}</div>'
               f'<div class="cluster">{btn("Continue check-in", "primary", href=page("check-in"))}{btn("Quick Cards", "", icon_name="heart-pulse", href=page("quick-card"))}</div></div>',
               title='Tutoring night <span class="text-muted nowrap" style="font: var(--text-body-sm);">4:00–6:00 pm · Room 2</span>', tid="sess") +
          card(empty("Only Roll Call is on", "Admins can turn modules on in Settings.",
                     action=btn("Open Modules", "", icon_name="settings", href=page("settings-modules", "single")), icon_name="settings"), cls="card--flush"),
          notes=note("Navigation, search scopes, the More menu and the phone tab bar all follow the module configuration; nothing that is off is reachable or mentioned.", "top: 5rem; right: 1rem;"))
    S.add("offline", "Phone is offline: a banner says what is cached, check-in and Quick Cards stay available.", nav="today",
          main=offline_banner() + main_default(), checkin_badge=15,
          notes=note("Offline banner stays until the connection returns; queued actions sync in order and a toast confirms.", "top: 5.5rem; right: 1rem;"))

    # Participant roles (ADR 0043): a welcome and one card per module that is on and serves the role.
    def participant(name, cards):
        return page_header(f"Welcome, {name}", f"{TODAY} · {ORG}") + (
            card(ul_list(cards, card=False), title="Your work", tid="yours", cls="card--flush") if cards else
            card(empty("Nothing to do here yet", "Your program staff will tell you what comes next.", icon_name="sparkle"), cls="card--flush"))
    learning_card = list_item("Learning", "Your lessons, quizzes and badges", href=page("learn-home"))
    S.add("youth", "Sofía (Youth, 12) signs in: the youth shell shows Today and Learning only; no search, no staff sections.", nav="today", role="youth",
          user=YOUTH["sofia"], unread=0, modules=["today", "learning", "schedule"], main=participant("Sofía", [learning_card]),
          notes=note("A youth reaches only their own record: the child linked to their account. Families, events and search are closed to them on the server.", "top: 5rem; right: 1rem;"))
    S.add("youth-learning-off", "The same youth while Learning is off: Learning is gone from the bar, the tab bar and the menu, and Today says there is nothing to do.", nav="today", role="youth",
          user=YOUTH["sofia"], unread=0, modules=["today", "schedule"], main=participant("Sofía", []),
          notes=note("Opening /learning while Learning is off redirects here to Today.", "top: 5rem; right: 1rem;"))
    S.add("mentor", "Daniel (Mentor) signs in: Today, Mentoring and Check-in; a mentor sees only the youth assigned to them and takes attendance for his cohorts’ sessions.", nav="today", role="mentor",
          user=STAFF["daniel"], unread=0, modules=["today", "mentor-dashboard", "check-in"],
          main=participant("Daniel", [list_item("Mentoring", "The youth assigned to you", href=page("mentor-dashboard")),
                                      list_item("Check-in", "Take attendance for your cohorts’ sessions today", href=page("check-in", "mentor"))]))
    # The volunteer portal (L2-100, L2-101, ADR 0066): today's assigned session first, then his schedule. No youth records.
    VKW = dict(nav="today", role="volunteer", user=STAFF["leo"], unread=0, modules=["today", "check-in", "my-schedule"])
    vhdr = page_header("Welcome, Leo", f"{TODAY} · {ORG}")
    vwork = card(ul_list([list_item("Your schedule", "The sessions you’re assigned to in the next four weeks", href=page("my-schedule"),
                                    lead=f'<span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>')], card=False),
                 title="Your work", tid="yours", cls="card--flush")
    vsession = card(f'<div class="stack"><p class="text-muted">Your session today · 4:00–6:00 pm · Harbourview Community Centre, Room 2</p>'
                    f'<p class="section-title">4 youth on the roster</p><p class="text-muted">0 of 4 checked in · After‑School Tutoring</p>'
                    f'<div class="cluster">{btn("Take attendance", "primary", icon_name="clipboard", href=page("check-in", "volunteer"))}</div></div>',
                    title="Tutoring night", tid="vsess")
    S.add("volunteer", "Leo (Volunteer) signs in: Today, Check-in and Schedule. Today shows the session he is assigned to tonight with how many youth are on the roster and Take attendance, then his schedule. Nothing about any youth’s progress or record.", **VKW,
          main=vhdr + vsession + vwork,
          notes=note("GET /sessions/today answers only the sessions Leo is assigned to. Two sessions today show two cards, soonest first.", "top: 5rem; right: 1rem;"))
    S.add("volunteer-empty", "Leo has no session today: say so and point to his schedule.", **VKW,
          main=vhdr + card(empty("No session today", "You’re not assigned to a session today. Your schedule shows what’s next.",
                                 action=btn("See your schedule", "primary", icon_name="calendar", href=page("my-schedule")), icon_name="calendar"), cls="card--flush") + vwork)
    S.add("volunteer-loading", "Leo’s Today while his sessions load: a skeleton holds the session card’s place.", **VKW,
          main=vhdr + f'<div class="card" aria-busy="true" aria-label="Loading your session today">{skeleton_header()}<span class="skeleton skeleton--card" aria-hidden="true"></span></div>' + vwork)
    S.add("volunteer-error", "Leo’s sessions failed to load: the welcome and his schedule stay, the card offers Try again.", **VKW,
          main=vhdr + card(empty("Your session didn’t load", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"),
                                 error=True, icon_name="alert-triangle"), cls="card--flush") + vwork)


# ------------------------------------------------------------------ Check-in (Roll Call)
def roster_row(c: dict, state: str, meta: str, kind: str = "page") -> str:
    act = {
        "in": btn("Sign out", "", size="sm", data_href=rel(kind, "dialog", "confirm-pickup")),
        "out": f'<span class="status status--success">Signed out</span>',
        "none": btn("Check in", "primary", size="sm", data_href=rel(kind, "dialog", "check-in-sheet")),
        "absent": btn("Check in", "", size="sm", data_href=rel(kind, "dialog", "check-in-sheet")),
        "missing": btn("Sign on tablet", "", size="sm", data_href=rel(kind, "dialog", "sign-on-tablet")),
        "queued": btn("Sign out", "", size="sm", disabled=True),
    }[state]
    cls = {"in": "roster__item--in", "out": "roster__item--out", "none": "", "absent": "roster__item--absent", "missing": "roster__item--missing", "queued": "roster__item--queued"}[state]
    fl = flag(c["flag"]) if c["flag"] else ""
    return (f'<li class="roster__item {cls}">{avatar(c)}<div class="roster__body"><div class="roster__name"><a href="{rel(kind, "page", "quick-card")}" aria-label="Quick Card for {esc(c["name"])}" style="color: inherit; text-decoration: none;">{esc(c["name"])}</a>{fl}</div>'
            f'<div class="roster__meta">{meta}</div></div><div class="roster__action">{act}</div></li>')


def roster_rows(kind="page", offline=False):
    rows = [
        roster_row(CHILD["mateo"], "in", "Checked in 4:02 pm · Grade 4", kind),
        roster_row(CHILD["sofia"], "in", "Checked in 4:02 pm · Grade 7", kind),
        roster_row(CHILD["jordan"], "queued" if offline else "in", "Checked in 4:05 pm · waiting to sync" if offline else "Checked in 4:05 pm · Grade 6", kind),
        roster_row(CHILD["kevin"], "none", "Not yet here · Grade 3", kind),
        roster_row(CHILD["emily"], "none", "Not yet here · Grade 5", kind),
        roster_row(CHILD["yusuf"], "in", "Checked in 4:01 pm · medication at noon, done", kind),
        roster_row(CHILD["amara"], "absent", "Absent · guardian texted 4:15 pm", kind),
        roster_row(CHILD["deshawn"], "in", "Late · checked in 4:21 pm · Grade 4", kind),
        roster_row(CHILD["lily"], "none", "Not yet here · Grade 3", kind),
        roster_row(CHILD["omar"], "absent", "Excused · guardian told us this morning", kind),
    ]
    return rows


def checkin_header(kind="page", sync: str = ""):
    s = f'<span class="sync-chip sync-chip--ok">{icon("check")}Synced 4:12 pm</span>' if not sync else sync
    return page_header("Tutoring night", f"Today, 4:00–6:00 pm · Room 2 · 48 on roster &nbsp;{s}",
                       btn("Session notes", "", icon_name="edit", data_href=rel(kind, "dialog", "session-notes")) + btn("End session", "", icon_name="check-circle", data_href=rel(kind, "dialog", "end-session")))


def checkin_summary(i=31, a=2, n=15, c=48, late=1, excused=1, cleared=True):
    clr = f'<div class="card stat"><span class="stat__label">Cleared</span><span class="stat__value">{c}<span class="text-caption"> / {c}</span></span></div>' if cleared else stat("On roster", str(c))
    return (f'<div class="roster-summary" role="group" aria-label="Session totals">{stat("Checked in", str(i), f"{late} late" if late else "")}{stat("Absent", str(a), f"{excused} excused" if excused else "")}{stat("Not yet", str(n))}'
            f'{clr}</div>')


def checkin_filters(current="all"):
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="roster-q">Find a child</label>'
            f'<input class="input" id="roster-q" type="search" placeholder="Find a child"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            + chips([("All 48", current == "all"), ("Not yet 15", current == "not-yet"), ("Checked in 31", current == "in"), ("Absent 2", current == "absent")], "Filter roster") + "</div>")


@screen("check-in", "page", "Check-in", route="/check-in", reqs=[R_ROLL, R_PICKUP, R_MOBILE, "L2-095", "L2-096", "L2-098", "L2-099", "L2-100"], na={})
def check_in(S):
    kind = "page"
    body = checkin_header() + checkin_summary() + checkin_filters() + f'<div class="card card--flush"><ul class="roster" aria-label="Roster for Tutoring night">{"".join(roster_rows())}</ul></div>' + \
        f'<div class="list-more">{btn("Show 38 more", "ghost")}</div>'
    S.add("default", "Tutoring night at 4:12 pm: 31 checked in, 2 absent, 15 not yet; one tap checks a child in, sign-out confirms pickup.", nav="check-in", main=body, checkin_badge=15,
          notes=note("Tap Check in: the child is marked present immediately (optimistic). Tap the name for the Quick Card. The no-show alert goes to guardians at 4:15 pm, 15 minutes after start (Settings › Notifications).", "top: 5rem; right: 1rem;"))
    S.add("loading", "Roster loading: skeleton rows the same height as the real ones so nothing jumps.", nav="check-in",
          main=page_header("Tutoring night", "Today, 4:00–6:00 pm · Room 2") + skeleton_kpis(4) + skeleton_list(8, "Loading roster"))
    S.add("empty", "A session with nobody on the roster yet: explain and point to the program roster.", nav="check-in",
          main=page_header("Winter Camp · Day 1", "Mon 21 Dec, 8:00 am–5:00 pm · 0 on roster") +
          card(empty("No one on this roster yet", "12 enrollments are waiting review.",
                     action=btn("Review enrollments", "primary", href=page("roster")) + btn("Add a child", "", icon_name="plus", data_href=dialog("add-child")), icon_name="users"), cls="card--flush"))
    S.add("error", "Roster failed to load and nothing is cached; retry or open the printed fallback.", nav="check-in",
          main=page_header("Tutoring night", "Today, 4:00–6:00 pm · Room 2") +
          card(empty("Couldn’t load the roster", "Try again.",
                     action=btn("Try again", "primary", icon_name="refresh") + btn("Back to Today", "ghost", href=page("today")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Searching the roster for a name that isn’t enrolled tonight.", nav="check-in",
          main=checkin_header() + checkin_summary() +
          checkin_filters().replace('placeholder="Find a child"', 'value="Petrov"') +
          card(empty("No “Petrov” on tonight’s roster", "Nikolai Petrov is waitlisted.",
                     action=btn("Clear search", "") + btn("Add walk-in", "primary", icon_name="plus", data_href=dialog("add-walk-in")), icon_name="search"), cls="card--flush"))
    S.add("offline", "Offline on the phone: cached roster, one check-in queued, Quick Cards still open.", nav="check-in",
          main=offline_banner(1) + checkin_header(sync=f'<span class="sync-chip">{icon("wifi-off")}1 queued</span>') + checkin_summary() + checkin_filters() +
          f'<div class="card card--flush"><ul class="roster" aria-label="Roster for Tutoring night">{"".join(roster_rows(offline=True))}</ul></div>',
          notes=note("Check-in keeps working from the saved roster; each tap is queued and sent in order when the connection returns. Sign-out is disabled while a child’s check-in is unsent.", "top: 9rem; right: 1rem;"))
    S.add("day-of", "Field-trip morning: the roster shows who is cleared, who still has no slip, and offers the tablet sign-on fallback.", nav="check-in", user=J,
          main=page_header("Fall field trip: Royal Botanical Gardens", "Sat 14 Nov, 9:00 am · bus leaves 8:45 am · 48 on roster",
                           btn("Text 7 unsigned", "", icon_name="send", data_href=dialog("send-reminder")) + btn("End session", "", icon_name="check-circle", data_href=dialog("end-session"))) +
          f'<div class="roster-summary" role="group" aria-label="Trip totals">{stat("Cleared", "41")}{stat("Missing slip", "7")}{stat("On the bus", "29")}{stat("Absent", "0")}</div>' +
          alert("warning", "7 children have no signed slip", "They can’t board without one.",
                actions=btn("Show the 7", "primary", size="sm") + btn("Text 7 unsigned", "ghost", size="sm", data_href=dialog("send-reminder"))) +
          checkin_filters("all").replace("All 48", "All 48").replace("Not yet 15", "Missing slip 7").replace("Checked in 31", "Cleared 41").replace("Absent 2", "On the bus 29") +
          f'<div class="card card--flush"><ul class="roster" aria-label="Roster for the field trip">'
          + roster_row(CHILD["mateo"], "in", "On the bus 8:41 am · slip signed by Carmen Rivera", kind)
          + roster_row(CHILD["kevin"], "missing", "No slip · Linh Tran · 289-555-0119", kind)
          + roster_row(CHILD["emily"], "missing", "No slip · Linh Tran · 289-555-0119", kind)
          + roster_row(CHILD["jordan"], "none", "Cleared · not here yet", kind)
          + roster_row(CHILD["yusuf"], "in", "On the bus 8:44 am · medication packed", kind)
          + roster_row(CHILD["nikolai"], "missing", "No slip · Elena Petrova · 289-555-0150", kind)
          + roster_row(CHILD["lily"], "in", "On the bus 8:40 am · egg allergy, lunch checked", kind)
          + "</ul></div>",
          notes=note("“Sign on tablet” opens the guardian’s slip on this device so they can sign at the bus door; the record is identical to a remote signature.", "top: 5rem; right: 1rem;"))
    S.add("complete", "Session ended: all 46 present children are signed out and attendance has rolled into the program totals.", nav="check-in",
          main=page_header("Tutoring night", "Today, 4:00–6:00 pm · ended 6:04 pm") +
          card(f'<div class="stack">{icon("check-circle", "icon--lg")}<h2 class="empty__title">Session recorded</h2><p class="text-muted measure">46 present, 2 absent. Attendance saved.</p>'
               f'<div class="cluster">{btn("Back to Today", "primary", href=page("today"))}{btn("View attendance", "", href=page("attendance-history"))}{btn("Report an incident", "ghost", icon_name="flag", href=page("new-incident"))}</div></div>', cls="card--success"),
          toast_html=toast_region(toast("success", "Session ended", "46 present · 2 absent · attendance saved")))
    DANIEL = STAFF["daniel"]
    MKW = dict(nav="check-in", role="mentor", user=DANIEL, unread=0, modules=["today", "mentor-dashboard", "check-in"])
    cohort = (f'<div class="card card--flush"><ul class="roster" aria-label="Roster for Tutoring night">'
              + roster_row(dict(CHILD["jordan"], flag=""), "in", "Late · checked in 4:21 pm · Grade 6", kind)
              + roster_row(dict(CHILD["mateo"], flag=""), "in", "Checked in 4:02 pm · Grade 4", kind)
              + roster_row(dict(CHILD["sofia"], flag=""), "absent", "Excused · Grade 7", kind)
              + roster_row(dict(CHILD["yusuf"], flag=""), "none", "Not yet here · Grade 8", kind) + "</ul></div>")
    mhdr = page_header("Tutoring night", "Today, 4:00–6:00 pm · Room 2 · 4 on roster · After‑School Tutoring",
                       btn("Session notes", "", icon_name="edit", data_href=rel(kind, "dialog", "session-notes")))
    mfoot = lambda rest: (f'<div class="cluster" style="margin-top: var(--space-3);">{btn("Mark the rest present", "", icon_name="check", aria_label="Mark the rest present, 1 not yet here") if rest else ""}'
                          f'{btn("Add walk-in", "ghost")}{btn("Attendance history", "ghost", icon_name="chart", href=page("attendance-history", "mentor"))}</div>')
    S.add("mentor", "Daniel takes attendance for his cohort’s session: the same roster, Late and Excused beside Checked in and Absent, and, under the roster, Mark the rest present for everyone not yet marked and Attendance history.", **MKW,
          main=mhdr + checkin_summary(2, 1, 1, 4, late=1, excused=1, cleared=False) + cohort + mfoot(True),
          notes=note("A mentor runs the sessions of the cohorts he leads or supports (ADR 0065). Mentors don’t see medical flags. Each mark saves at once and queues on the phone without signal.", "top: 5rem; right: 1rem;"))
    allin = cohort.replace(roster_row(dict(CHILD["yusuf"], flag=""), "none", "Not yet here · Grade 8", kind), roster_row(dict(CHILD["yusuf"], flag=""), "in", "Checked in 4:30 pm · Grade 8", kind))
    S.add("all-marked", "Mark the rest present: Yusuf, the one not yet here, is checked in and a toast says how many.", **MKW,
          main=mhdr + checkin_summary(3, 1, 0, 4, late=1, excused=1, cleared=False) + allin + mfoot(False),
          toast_html=toast_region(toast("success", "1 marked present", "Everyone on the roster is marked.")))
    LEO = STAFF["leo"]
    VKW = dict(nav="check-in", role="volunteer", user=LEO, unread=0, modules=["today", "check-in", "my-schedule"])
    vrows = (f'<div class="card card--flush"><ul class="roster" aria-label="Roster for Tutoring night">'
             + roster_row(dict(CHILD["jordan"], flag=""), "in", "Checked in 4:03 pm", kind)
             + roster_row(dict(CHILD["mateo"], flag=""), "in", "Checked in 4:02 pm", kind)
             + roster_row(dict(CHILD["sofia"], flag=""), "absent", "Absent", kind)
             + roster_row(dict(CHILD["yusuf"], flag=""), "none", "Not yet here", kind) + "</ul></div>")
    # Sign-out is staff only: a volunteer's checked-in rows say so instead of offering it.
    vrows = vrows.replace(btn("Sign out", "", size="sm", data_href=rel(kind, "dialog", "confirm-pickup")), status("Checked in", "success"))
    S.add("volunteer", "Leo takes attendance for the session he is assigned to: names only, Check in or Mark absent from the sheet, and Mark the rest present. No medical flags, Quick Cards, sign-out, late, excused or attendance history.", **VKW,
          main=mhdr + checkin_summary(2, 1, 1, 4, late=0, excused=0, cleared=False) + vrows +
          f'<div class="cluster" style="margin-top: var(--space-3);">{btn("Mark the rest present", "", icon_name="check", aria_label="Mark the rest present, 1 not yet here")}{btn("Add walk-in", "ghost")}</div>',
          notes=note("A volunteer runs only the sessions he is assigned to (L2-007 criterion 6). Late and Excused are refused for volunteers on the server (403).", "top: 5rem; right: 1rem;"))
    S.add("volunteer-forbidden", "Leo opens a session he is not assigned to: the roster answers 403 and the page says why and who can add him.", **VKW,
          main=card(empty("You’re not assigned to this session", "Volunteers open the sessions they’re assigned to. Ask your volunteer coordinator to add you.",
                          action=btn("Your sessions today", "primary", href=page("check-in", "volunteer")), icon_name="lock", heading="h1"), cls="card--flush"))
    S.add("long", "A camp day with 212 children: search and filters first, the list virtualizes, nothing breaks.", nav="check-in", user=J,
          main=page_header("Summer Camp · Week 3, Monday", "Mon 20 Jul, 8:00 am–5:00 pm · 212 on roster", btn("End session", "", icon_name="check-circle", data_href=dialog("end-session"))) +
          f'<div class="roster-summary" role="group" aria-label="Session totals">{stat("Checked in", "1,187".split(",")[0] + "87")}{stat("Absent", "9")}{stat("Not yet", "16")}{stat("Cleared", "212")}</div>' +
          checkin_filters().replace("All 48", "All 212").replace("Not yet 15", "Not yet 16").replace("Checked in 31", "Checked in 187").replace("Absent 2", "Absent 9") +
          f'<div class="card card--flush"><ul class="roster" aria-label="Roster, A to C">'
          + "".join(roster_row(c, "in", "Checked in 8:12 am", kind) for c in CHILDREN[:4])
          + roster_row(dict(name=LONG_CHILD, initials="AF", color="sun", flag="Allergy"), "none", f"Not yet here · guardian {LONG_GUARDIAN}", kind)
          + "".join(roster_row(c, "none", "Not yet here", kind) for c in CHILDREN[4:7])
          + "</ul></div>" + f'<div class="list-more">{btn("Show 204 more", "ghost")}</div>')


# ------------------------------------------------------------------ Quick Card
@screen("quick-card", "page", "Quick Card", route="/children/:id/quick-card", reqs=[R_QC, R_PRIVACY, R_MOBILE], na={})
def quick_card(S):
    c = CHILD["mateo"]

    def qc(alert_html="", medical=True, pickups=True, sync=f'<span class="sync-chip sync-chip--ok">{icon("check")}Saved on this phone · 3:58 pm</span>'):
        head_ = (f'<div class="quick-card__head">{avatar(c, "lg")}<div><h1 class="quick-card__name">Mateo Rivera</h1><p class="text-muted">9 years · Grade 4 · After‑School Tutoring, Saturday Sports</p>{sync}</div></div>')
        al = alert_html if alert_html is not None else ""
        med = ""
        if medical:
            med = (f'<div class="quick-card__alert" role="note">{icon("alert-triangle", "icon--lg")}<div><div class="quick-card__alert-title">Peanut allergy, severe</div>'
                   f'<div class="quick-card__alert-text">EpiPen in backpack front pocket. Use it, call 911, then Carmen.</div></div></div>'
                   f'<section class="quick-card__section card" aria-labelledby="qc-med"><h2 id="qc-med">Medical</h2>{facts([("Allergies", "Peanuts (anaphylaxis); tree nuts (hives)"), ("Medication", "EpiPen 0.3 mg · carried"), ("Conditions", "None"), ("Health card", "Ontario ···· 4471 (ask Marisol)"), ("Doctor", "Dr. Amrita Sethi · 905-555-0100")])}</section>')
        else:
            med = card(empty("No medical information yet", "Ask Carmen Rivera to add it.",
                             action=btn("Text Carmen the form", "primary", icon_name="send", data_href=dialog("send-reminder")), icon_name="heart-pulse"), cls="card--flush")
        calls = ('<section class="quick-card__section" aria-labelledby="qc-call"><h2 id="qc-call">Call, in this order</h2><ol class="call-list">'
                 f'<li class="call-list__item">{avatar(GUARDIANS["carmen"])}<div class="call-list__body"><div class="call-list__name">Carmen Rivera · mother</div><div class="call-list__meta">Spanish · text in English</div></div><a class="btn btn--primary" href="tel:+19055550142">{icon("phone")}905-555-0142</a></li>'
                 f'<li class="call-list__item"><span class="avatar avatar--sm" aria-hidden="true">LR</span><div class="call-list__body"><div class="call-list__name">Luis Rivera · uncle</div><div class="call-list__meta">Backup contact</div></div><a class="btn" href="tel:+19055550199">{icon("phone")}905-555-0199</a></li>'
                 '</ol></section>')
        pk = ""
        if pickups:
            pk = ('<section class="quick-card__section card" aria-labelledby="qc-pick"><h2 id="qc-pick">Approved to pick up</h2><ul class="list">'
                  + list_item("Carmen Rivera", "Mother · photo ID on file", person=GUARDIANS["carmen"], end=badge("Primary", "success"))
                  + list_item("Luis Rivera", "Uncle · ask for ID", lead='<span class="avatar avatar--sm" aria-hidden="true">LR</span>')
                  + list_item("Rosa Alvarez", "Grandmother · ask for ID", lead='<span class="avatar avatar--sm" aria-hidden="true">RA</span>')
                  + f'</ul><p class="hint">Others need Carmen’s okay by phone. <a href="{page("child")}">Full profile</a></p></section>')
        other = f'<section class="quick-card__section card" aria-labelledby="qc-other"><h2 id="qc-other">Also good to know</h2>{facts([("School", "Bennetto Elementary"), ("Language at home", "Spanish"), ("Notes", "Sits with Jordan.")])}</section>'
        return f'<div class="quick-card page-start">{head_}{al}{med}{calls}{pk}{other}</div>'

    S.add("default", "Mateo’s emergency card: allergy first, who to call in order, who may pick up; saved offline on the phone.", nav="check-in", main=qc(),
          notes=note("Opens in under a second from the roster; the whole card is cached for every child on today’s roster so it works with no signal.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Quick Card loading (first open on a new phone).", nav="check-in",
          main=f'<div class="quick-card page-start" aria-busy="true" aria-label="Loading Quick Card"><div class="quick-card__head"><span class="skeleton avatar avatar--lg" aria-hidden="true"></span><div style="flex: 1;">{skeleton_header()}</div></div>'
               '<span class="skeleton skeleton--card" aria-hidden="true" style="height: 6rem;"></span><span class="skeleton skeleton--card" aria-hidden="true" style="height: 9rem;"></span><span class="skeleton skeleton--card" aria-hidden="true" style="height: 8rem;"></span></div>'
               '<h1 class="visually-hidden">Quick Card</h1>')
    S.add("empty", "A child with no medical information recorded yet: say so and offer to ask the guardian.", nav="check-in", main=qc(medical=False))
    S.add("error", "The card isn’t cached and the network failed: offer retry and the emergency phone numbers from the roster.", nav="check-in",
          main=f'<div class="quick-card page-start"><div class="quick-card__head">{avatar(c, "lg")}<div><h1 class="quick-card__name">Mateo Rivera</h1><p class="text-muted">9 years · Grade 4</p></div></div>' +
          card(empty("Couldn’t load Mateo’s card", "Try again.",
                     action=btn("Try again", "primary", icon_name="refresh") + f'<a class="btn" href="tel:+19055550142">{icon("phone")}Call Carmen Rivera</a>', error=True, icon_name="alert-triangle"), cls="card--flush") + "</div>")
    S.add("offline", "Offline: the cached card with the time it was saved and no editing.", nav="check-in",
          main=offline_banner() + qc(sync=f'<span class="sync-chip">{icon("wifi-off")}Saved on this phone · 3:58 pm</span>'))
    S.add("forbidden", "A volunteer’s view: medical and health-card fields are hidden by role; contacts and pickups remain.", nav="check-in", user=STAFF["aisha"],
          main=qc(alert_html=alert("info", "Medical details are hidden for your role", "Ask Jaylen Okafor if you need them."), medical=False).replace(
              '<h2 class="empty__title">No medical information yet</h2>', '<h2 class="empty__title">Medical card restricted</h2>').replace(
              "Ask Carmen Rivera to add it.", "Staff roles only. Views are logged.").replace(
              btn("Text Carmen the form", "primary", icon_name="send", data_href=dialog("send-reminder")), f'<a class="btn" href="tel:+19055550181">{icon("phone")}Call Jaylen</a>'))
    S.add("edge", "Longest plausible content: a long name, four allergies, two medications and six approved adults; nothing clips.", nav="check-in",
          main=qc().replace("Mateo Rivera", LONG_CHILD).replace("Peanut allergy, severe", "Peanut, tree nut, sesame and shellfish allergies, severe").replace(
              "EpiPen in backpack front pocket. Use it, call 911, then Carmen.", "Two EpiPens, red pouch, front pocket. Use one, call 911, then the guardian; second dose after 5 min.").replace(
              "Peanuts (anaphylaxis); tree nuts (hives)", "Peanuts, tree nuts, sesame, shellfish (anaphylaxis); latex (contact rash); grass pollen (seasonal)").replace(
              "Carmen Rivera · mother", f"{LONG_GUARDIAN} · mother"))


# ------------------------------------------------------------------ Events
def event_row(e: dict, kind="page", href_state="default") -> str:
    if e["slip"]:
        b = badge(f'{e["roster"] - e["signed"]} unsigned', "warning") if e["signed"] < e["roster"] else badge("All signed", "success")
    else:
        b = badge("No slip needed", "")
    ic = "bus" if "trip" in e["name"].lower() else ("sun" if "Camp" in e["name"] else "calendar")
    return list_item(esc(e["name"]), f'{esc(e["when"])} · {esc(e["program"])} · {e["roster"]} on roster', lead=f'<span class="icon-tile" aria-hidden="true">{icon(ic)}</span>',
                     href=rel(kind, "page", "event", href_state), end=b)


def events_toolbar(q=""):
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="ev-q">Search events</label>'
            f'<input class="input" id="ev-q" type="search" placeholder="Search events" value="{esc(q)}"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            + chips([("Upcoming", True), ("Needs slips", False), ("Past", False)], "Filter events")
            + select("ev-prog", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"], visually_hidden_label=True).replace('class="field"', 'class="field toolbar__end"') + "</div>")


@screen("events", "page", "Events", route="/events", reqs=[R_SLIPS, R_ROLL], na={})
def events(S):
    hdr = page_header("Events", "23 upcoming · 2 need slips · 30 unsigned", btn("Calendar", "", icon_name="calendar", href=page("events-calendar")) + btn("New event", "primary", icon_name="plus", href=page("event-form")))
    rows = [event_row(EVENTS[0], href_state="default"), event_row(EVENTS[2], href_state="upcoming"), event_row(EVENTS[1]), event_row(EVENTS[4], href_state="upcoming"), event_row(EVENTS[3], href_state="upcoming")]
    S.add("default", "Upcoming events with slip status at a glance.", nav="events", main=hdr + events_toolbar() + ul_list(rows, label="Upcoming events") + f'<div class="list-more">{btn("Show 18 more", "ghost")}</div>')
    S.add("loading", "Events loading.", nav="events", main=page_header("Events", "") + skeleton_list(6, "Loading events"))
    S.add("empty", "No events yet: explain that events hang off programs and offer to create one.", nav="events",
          main=page_header("Events", "No events yet") + card(empty("No events yet", "Create one to start.",
                                                                   action=btn("New event", "primary", icon_name="plus", href=page("event-form")), icon_name="calendar"), cls="card--flush"))
    S.add("error", "Events failed to load.", nav="events", main=page_header("Events", "") + card(empty("Couldn’t load events", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "A search with no matching events; filters stay visible and clearable.", nav="events",
          main=hdr + events_toolbar("canoe") + card(empty("No events match “canoe”", "Clear the filters.", action=btn("Clear search and filters", ""), icon_name="search"), cls="card--flush"))
    S.add("long", "A full year of events: grouped by month, 140 items, paged.", nav="events",
          main=hdr.replace("23 upcoming · 2 need slips · 30 unsigned", "140 events in 2026 · showing 1–20") + events_toolbar().replace('aria-pressed="true">Upcoming', 'aria-pressed="false">Upcoming').replace('aria-pressed="false">Past', 'aria-pressed="true">Past') +
          '<h2 class="overline" style="margin-bottom: var(--space-2);">November 2026</h2>' + ul_list(rows[:3], label="November events") +
          '<h2 class="overline" style="margin: var(--space-6) 0 var(--space-2);">October 2026</h2>' + ul_list([event_row(dict(EVENTS[0], name="Tutoring night", when=f"Thu {d} Oct, 4:00–6:00 pm"), href_state="default") for d in (29, 22, 15, 8, 1)], label="October events") +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–20 of 140</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')


@screen("event", "page", "Event", route="/events/:id", reqs=[R_SLIPS, R_ROLL, R_NOTIFY], na={})
def event(S):
    e = EVENTS[1]

    def hdr(actions=True):
        act = (btn("Send reminder to 7", "", icon_name="send", data_href=dialog("send-reminder")) + btn("Edit", "", icon_name="edit", href=page("event-form", "edit")) +
               icon_btn("more", "More actions", data_href=dialog("event-actions"))) if actions else ""
        return breadcrumb([("Events", page("events"))], e["name"]) + page_header(esc(e["name"]), f'{e["when"]} · {e["program"]} · 48 on roster', act)

    def slip_card(signed=41, total=48):
        unsigned = [("Kevin Tran", "Linh Tran · reminded Tue 3 Nov", GUARDIANS["linh"]), ("Emily Tran", "Linh Tran · reminded Tue 3 Nov", GUARDIANS["linh"]), ("Nikolai Petrov", "Elena Petrova · link opened, not signed", GUARDIANS["elena"]),
                    ("Omar Siddiqui", "Farah Siddiqui · no reminders yet", dict(initials="FS", color="sage")), ("Grace Adeyemi", "Bola Adeyemi · bounced email", dict(initials="BA", color="rose")), ("DeShawn Williams", "Keisha Williams · reminded Tue 3 Nov", dict(initials="KW", color="lilac")), ("Lily Chen", "Wen Chen · no reminders yet", dict(initials="WC", color="sky"))]
        tabs_ = ('<div class="tabs" role="tablist" aria-label="Slip status">'
                 f'<button class="tab" role="tab" type="button" id="t-unsigned" aria-controls="p-unsigned" aria-selected="true">Unsigned <span class="badge badge--warning">{total - signed}</span></button>'
                 f'<button class="tab" role="tab" type="button" id="t-signed" aria-controls="p-signed" aria-selected="false" tabindex="-1">Signed <span class="badge badge--success">{signed}</span></button>'
                 '<button class="tab" role="tab" type="button" id="t-declined" aria-controls="p-declined" aria-selected="false" tabindex="-1">Declined <span class="badge">0</span></button></div>')
        rows = "".join(list_item(n, m, person=p, href=page("child"), end=btn("Resend", "ghost", size="sm", data_href=dialog("send-reminder"))) for n, m, p in unsigned)
        return card(f'<div class="stack" style="gap: var(--space-3);">{progress(signed, total, f"Signed: {signed} of {total}", kind="success")}<p class="text-muted">Due Thu 12 Nov · reminders Tue, Thu 6 pm</p>{tabs_}'
                    f'<div id="p-unsigned" role="tabpanel" aria-labelledby="t-unsigned" tabindex="0"><ul class="list">{rows}</ul></div>'
                    '<div id="p-signed" role="tabpanel" aria-labelledby="t-signed" tabindex="0" hidden><p class="text-muted">41 signed</p></div>'
                    '<div id="p-declined" role="tabpanel" aria-labelledby="t-declined" tabindex="0" hidden><p class="text-muted">None declined</p></div></div>',
                    title="Permission slip", tid="slip", footer=f'<a href="{page("slip-editor", "edit")}">Edit the slip</a> · <a href="{page("slip-sign")}">Preview as a guardian</a>')

    details = card(facts([("When", "Saturday 14 November 2026, 9:00 am–3:00 pm"), ("Where", "Royal Botanical Gardens, Burlington · bus leaves 8:45 am"), ("Program", f'<a href="{page("program")}">After‑School Tutoring</a>'),
                          ("Staff", "Jaylen Okafor (lead), Aisha Bello, 4 volunteers"), ("Bring", "Nut-free lunch, water, rain jacket"), ("Cost", "Free")]), title="Details", tid="details")
    S.add("default", "Field trip ten days out: 41 of 48 slips signed, the unsigned list with one-tap resend, and the event details.", nav="events",
          main=hdr() + f'<div class="split">{slip_card()}<div class="stack">{details}{card(f"<p class=\"text-muted\">Check-in opens trip morning.</p><div class=\"cluster\" style=\"margin-top: var(--space-3);\">{btn("Open check-in", "", icon_name="clipboard", href=page("check-in", "day-of"))}</div>", title="Day of", tid="dayof")}</div></div>')
    S.add("loading", "Event loading.", nav="events", main=breadcrumb([("Events", page("events"))], "Loading") + f'<div class="page-header" aria-busy="true"><div>{skeleton_header()}</div></div><div class="split"><div class="card">{skeleton_header()}<span class="skeleton skeleton--card" aria-hidden="true" style="margin-top: var(--space-4); height: 12rem;"></span></div><div class="card">{skeleton_header()}</div></div><h1 class="visually-hidden">Event</h1>')
    S.add("empty", "An event that doesn’t need a slip yet: explain and offer to create one.", nav="events",
          main=hdr(False).replace(e["name"], "Swim trip: Jimmy Thompson Pool").replace(e["when"], "Sat 28 Nov, 10:00 am–1:00 pm").replace("After‑School Tutoring", "Saturday Sports").replace("48 on roster", "62 on roster") +
          f'<div class="split">{card(empty("No permission slip yet", "A swim trip needs one.", action=btn("Create slip", "primary", icon_name="plus", href=page("slip-editor")) + btn("Use last year’s", "", icon_name="copy", href=page("slip-editor")), icon_name="clipboard"), cls="card--flush")}{details.replace("Royal Botanical Gardens, Burlington · bus leaves 8:45 am", "Jimmy Thompson Memorial Pool · bus leaves 9:30 am")}</div>')
    S.add("error", "Event failed to load.", nav="events", main=breadcrumb([("Events", page("events"))], "Event") + page_header("Fall field trip: Royal Botanical Gardens", "") + card(empty("Couldn’t load this event", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("All events", "ghost", href=page("events")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("partial", "Details loaded but the slip status didn’t; the event stays usable.", nav="events",
          main=hdr() + f'<div class="split">{card(empty("Slip status didn’t load", "Try again.", action=btn("Try again", "", icon_name="refresh"), error=True, icon_name="alert-triangle"), title="Permission slip", tid="slip", cls="card--flush")}<div class="stack">{details}</div></div>')
    S.add("upcoming", "A regular session with no slip: attendance history and the roster link, nothing about slips.", nav="events",
          main=breadcrumb([("Events", page("events"))], "Saturday Sports") + page_header("Saturday Sports", "Sat 7 Nov, 10:00 am–12:00 pm · Saturday Sports · 62 on roster", btn("Edit", "", icon_name="edit", href=page("event-form", "edit")) + icon_btn("more", "More actions", data_href=dialog("event-actions"))) +
          f'<div class="split">{card(f"<p class=\"text-muted\">Season consent covers this session. Check-in opens 9:30 am.</p><div class=\"cluster\" style=\"margin-top: var(--space-3);\">{btn("Open check-in", "primary", icon_name="clipboard", href=page("check-in"))}{btn("Message 62 guardians", "", icon_name="send", href=page("new-message"))}</div>", title="Day of", tid="dayof")}'
          f'{card(facts([("When", "Saturday 7 November 2026, 10:00 am–12:00 pm"), ("Where", "Bennetto School gym, 47 Simcoe St E"), ("Staff", "Priya Raman (lead), 6 volunteers"), ("Last week", "58 of 62 present")]), title="Details", tid="details")}</div>')
    S.add("cancelled", "A cancelled event: read-only, who cancelled, guardians already told.", nav="events",
          main=breadcrumb([("Events", page("events"))], "Saturday Sports") + page_header("Saturday Sports <span class=\"badge badge--danger\">Cancelled</span>", "Sat 31 Oct · cancelled by Priya Raman on Fri 30 Oct, 2:14 pm") +
          alert("info", "62 guardians told by text and email", "Delivered to 61 · 1 bounced (Bola Adeyemi)", actions=f'<a class="btn btn--sm" href="{page("message")}">See delivery</a>') +
          f'<div class="split">{card(facts([("When", "Saturday 31 October 2026, 10:00 am–12:00 pm"), ("Where", "Bennetto School gym"), ("Reason", "Gym closed for voting")]), title="Details", tid="details")}</div>')

    # RSVPs (prompt 70, L2-094): the youth on the roster who sign in answer Going, Maybe or Can't make it, with an optional note for staff.
    def rsvp_card(rows, counts):
        stats = '<div class="kpis">' + "".join(stat(l, str(v), card=False) for l, v in counts) + "</div>"
        body = stats + (ul_list(rows, card=False, label="RSVPs, newest first") if rows else
                        '<p class="text-muted">Nobody has replied yet. Youth on the roster who sign in can RSVP from their schedule.</p>')
        return card(f'<div class="stack">{body}</div>', title="RSVPs", tid="rsvps")

    def rsvp_row(child, answer, kind, note_, when):
        text = f'<p class="list__text">{esc(note_)}</p>' if note_ else ""
        return (f'<li class="list__item">{avatar(child)}<div class="list__body"><div class="list__title">{esc(child["name"])}</div>'
                f'<div class="list__meta">{esc(when)}</div>{text}</div>{badge(answer, kind)}</li>')

    tutoring_hdr = (breadcrumb([("Events", page("events"))], "Tutoring night") +
                    page_header("Tutoring night", "Thu 12 Nov, 4:00–6:00 pm · After‑School Tutoring · 48 on roster",
                                btn("Edit", "", icon_name="edit", href=page("event-form", "edit")) + icon_btn("more", "More actions", data_href=dialog("event-actions"))))
    tutoring_details = card(facts([("When", "Thursday 12 November 2026, 4:00–6:00 pm"), ("Where", "Harbourview Community Centre, Room 2"),
                                   ("Program", f'<a href="{page("program")}">After‑School Tutoring</a>'), ("Repeats", "Weekly · 33 sessions, through Thu 24 Jun 2027")]),
                            title="Details", tid="details")
    rows = [rsvp_row(CHILD["sofia"], "Going", "success", "I’ll bring my reflection notes.", "Answered today, 3:58 pm"),
            rsvp_row(dict(name="Nadia Haddad", initials="NH", color="sage"), "Maybe", "info", "I might have a shift at work.", "Answered Wed 4 Nov")]
    S.add("rsvps", "A weekly Tutoring night: the RSVP counts (Going, Maybe, Can’t make it, No reply) and each reply with its note, beside the details that say it repeats weekly.", nav="events", user=STAFF["marisol"],
          main=tutoring_hdr + f'<div class="split">{rsvp_card(rows, [("Going", 1), ("Maybe", 1), ("Can’t make it", 0), ("No reply", 0)])}{tutoring_details}</div>')
    S.add("no-rsvps", "Nobody has replied yet: the counts are zero and the card says who can RSVP.", nav="events", user=STAFF["marisol"],
          main=tutoring_hdr.replace("Thu 12 Nov", "Thu 3 Dec") + f'<div class="split">{rsvp_card([], [("Going", 0), ("Maybe", 0), ("Can’t make it", 0), ("No reply", 2)])}{tutoring_details.replace("Thursday 12 November", "Thursday 3 December")}</div>')


# ------------------------------------------------------------------ Families
def family_row(name: str, meta: str, g: dict, kind="page", end="") -> str:
    return list_item(name, meta, person=g, href=rel(kind, "page", "household"), end=end)


def families_toolbar(q=""):
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="fam-q">Search families and children</label>'
            f'<input class="input" id="fam-q" type="search" placeholder="Search by child, guardian or phone" value="{esc(q)}"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            + chips([("All 112", True), ("Needs review 3", False), ("Missing info 6", False), ("Spanish 21", False), ("French 9", False)], "Filter families") + "</div>")


@screen("families", "page", "Families", route="/families", reqs=[R_ENROLL, R_PRIVACY], na={})
def families(S):
    hdr = page_header("Families", "112 households · 184 children · 3 enrollments to review", btn("Import CSV", "", icon_name="upload", href=page("import-roster")) + btn("Add family", "primary", icon_name="plus", data_href=dialog("add-family")))
    rows = [
        family_row("Rivera", "Carmen Rivera · Mateo (9), Sofía (12) · Spanish", GUARDIANS["carmen"], end=flag("2 medical")),
        family_row("Thompson", "Dana Thompson · Jordan (11)", GUARDIANS["dana"]),
        family_row("Tran", "Linh Tran · Kevin (8), Emily (10)", GUARDIANS["linh"], end=badge("Slip unsigned", "warning")),
        family_row("Haddad", "Nour Haddad · Yusuf (13) · French", GUARDIANS["nour"], end=flag("Medication")),
        family_row("Okonkwo", "Chidi Okonkwo · Amara (7)", GUARDIANS["chidi"]),
        family_row("Petrov", "Elena Petrova · Nikolai (10) · waitlisted", GUARDIANS["elena"], end=badge("Review", "info")),
    ]
    S.add("default", "All households with guardians, children, language and what needs attention.", nav="families", main=hdr + families_toolbar() + ul_list(rows, label="Households") + f'<div class="list-more">{btn("Show 106 more", "ghost")}</div>')
    S.add("loading", "Families loading.", nav="families", main=page_header("Families", "") + skeleton_list(7, "Loading families"))
    S.add("empty", "No families yet: import from Sheets or share the enrollment link.", nav="families",
          main=page_header("Families", "No households yet") + card(empty("No families yet", "Import a roster or open enrollment.",
                                                                            action=btn("Import CSV", "primary", icon_name="upload", href=page("import-roster")) + btn("Open enrollment", "", icon_name="link", data_href=dialog("open-enrollment")), icon_name="users"), cls="card--flush"))
    S.add("error", "Families failed to load.", nav="families", main=page_header("Families", "") + card(empty("Couldn’t load families", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Search for a phone number nobody has.", nav="families", main=hdr + families_toolbar("416-555-0000") + card(empty("No family matches “416-555-0000”", "Try a name instead.", action=btn("Clear search", "") + btn("Add family", "primary", icon_name="plus", data_href=dialog("add-family")), icon_name="search"), cls="card--flush"))
    S.add("long", "All 112 households as a sortable table on a laptop; 25 per page.", nav="families", user=T,
          main=hdr + families_toolbar() + table("Households", ["Household", "Guardians", "Children", "Language", "Programs", "Attention", "Actions"], [
              [f'<a href="{page("household")}">Rivera</a>', "Carmen Rivera", "Mateo (9), Sofía (12)", "Spanish", "Tutoring, Sports", flag("2 medical"), f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
              [f'<a href="{page("household")}">Thompson</a>', "Dana Thompson", "Jordan (11)", "English", "Tutoring", "", f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
              [f'<a href="{page("household")}">Tran</a>', "Linh Tran", "Kevin (8), Emily (10)", "English", "Tutoring", badge("Slip unsigned", "warning"), f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
              [f'<a href="{page("household")}">Haddad</a>', "Nour Haddad, Sami Haddad", "Yusuf (13)", "French", "Tutoring, Mentoring", flag("Medication"), f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
              [f'<a href="{page("household")}">Fitzgerald-Vanderbroucke</a>', LONG_GUARDIAN, LONG_CHILD + " (9)", "English", "Sports", "", f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
              [f'<a href="{page("household")}">Okonkwo</a>', "Chidi Okonkwo", "Amara (7)", "English", "Sports", "", f'<div class="row-actions">{btn("Open", "ghost", size="sm", href=page("household"))}</div>'],
          ]) + f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–25 of 112</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')
    S.add("edge", "Longest names, a household with two guardians and five children, missing phone.", nav="families",
          main=hdr + families_toolbar() + ul_list([
              family_row("Fitzgerald-Vanderbroucke", f"{LONG_GUARDIAN}, Bartholomew Fitzgerald-Vanderbroucke · {LONG_CHILD} (9), Anastasia-Wilhelmina (7), Maximilian (11), Theodora (6), Sebastian (12)", dict(initials="MF", color="sun"), end=badge("No phone", "danger")),
              family_row("Rivera", "Carmen Rivera · Mateo (9), Sofía (12) · Spanish", GUARDIANS["carmen"], end=flag("2 medical")),
              family_row("نور حداد (Nour Haddad)", "Nour Haddad · Yusuf (13) · French, Arabic", GUARDIANS["nour"], end=flag("Medication")),
          ], label="Households"))


@screen("household", "page", "Household", route="/families/:id", reqs=[R_ENROLL, R_PRIVACY, R_DATA], na={})
def household(S):
    g = GUARDIANS["carmen"]

    def hdr(actions=True):
        act = (btn("Message", "", icon_name="send", href=page("new-message")) + btn("Add child", "", icon_name="plus", data_href=dialog("add-child")) + icon_btn("more", "More actions", data_href=dialog("household-actions"))) if actions else ""
        return breadcrumb([("Families", page("families"))], "Rivera") + page_header("Rivera household", "2 guardians · 2 children · Spanish · enrolled since Sep 2024", act)

    guardians_card = card(ul_list([
        list_item("Carmen Rivera", "Mother · 905-555-0142 · carmen.rivera@example.com · Spanish", person=g, end=badge("Primary", "success")),
        list_item("Luis Rivera", "Uncle · 905-555-0199 · approved pickup", lead='<span class="avatar avatar--sm" aria-hidden="true">LR</span>', end=btn("Edit", "ghost", size="sm", data_href=dialog("edit-guardian"))),
    ], card=False), title="Guardians", tid="guardians", cls="card--flush", footer=f'<a href="{dialog("add-guardian")}">Add a guardian</a>')
    children_card = card(ul_list([
        list_item("Mateo Rivera", "9 · Grade 4 · After‑School Tutoring, Saturday Sports", person=CHILD["mateo"], href=page("child"), end=flag("Allergy")),
        list_item("Sofía Rivera", "12 · Grade 7 · After‑School Tutoring", person=CHILD["sofia"], href=page("child"), end=flag("Asthma")),
    ], card=False), title="Children", tid="children", cls="card--flush")
    consent = card(facts([("Season consent", f'Signed by Carmen Rivera · Tue 2 Sep 2026 · <a href="{page("slip-sign", "success")}">View</a>'), ("Photo permission", "Program use only"), ("Language for messages", "Spanish"), ("Preferred channel", "Text"), ("Data residency", "Canada")]), title="Consent and preferences", tid="consent")
    audit = card('<ol class="audit">'
                 '<li class="audit__item"><span class="audit__when">Today, 3:41 pm</span><span>Carmen Rivera signed Mateo’s RBG slip</span></li>'
                 '<li class="audit__item"><span class="audit__when">Mon 2 Nov, 9:10 am</span><span>Tom Nguyen viewed Mateo’s medical card</span></li>'
                 '<li class="audit__item"><span class="audit__when">Tue 2 Sep, 7:55 pm</span><span>Carmen Rivera confirmed household details</span></li>'
                 '<li class="audit__item"><span class="audit__when">Tue 2 Sep, 7:52 pm</span><span>Carmen Rivera added Rosa Alvarez as approved pickup</span></li>'
                 f'</ol>', title="Audit trail", tid="audit", footer=f'<a href="{page("audit-log")}">Full log</a>')
    S.add("default", "The Rivera household: guardians, children with medical flags, consent on file and the audit trail.", nav="families", user=T,
          main=hdr() + f'<div class="split"><div class="stack">{children_card}{guardians_card}</div><div class="stack">{consent}{audit}</div></div>')
    S.add("loading", "Household loading.", nav="families", main=breadcrumb([("Families", page("families"))], "Loading") + f'<div class="page-header" aria-busy="true"><div>{skeleton_header()}</div></div><div class="split">{skeleton_list(2, "Loading children")}{skeleton_list(3, "Loading consent")}</div><h1 class="visually-hidden">Household</h1>')
    S.add("empty", "A new household with a guardian but no children yet.", nav="families", user=T,
          main=hdr().replace("2 guardians · 2 children · Spanish · enrolled since Sep 2024", "1 guardian · no children yet · created today by Tom Nguyen") +
          f'<div class="split"><div class="stack">{card(empty("No children yet", "Add a child or send the enrollment link.", action=btn("Add child", "primary", icon_name="plus", data_href=dialog("add-child")) + btn("Send enrollment link", "", icon_name="send", data_href=dialog("send-reminder")), icon_name="users"), title="Children", tid="children", cls="card--flush")}{guardians_card}</div><div class="stack">{card("<p class=\"text-muted\">Collected at first enrollment.</p>", title="Consent and preferences", tid="consent")}</div></div>')
    S.add("error", "Household failed to load.", nav="families", main=breadcrumb([("Families", page("families"))], "Rivera") + page_header("Rivera household", "") + card(empty("Couldn’t load this household", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("All families", "ghost", href=page("families")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A volunteer opening a household: contacts are visible, medical flags and audit trail are not.", nav="families", user=STAFF["aisha"],
          main=hdr(False) + alert("info", "Some details are hidden for your role", "Medical details and dates of birth need a staff role.") +
          f'<div class="split"><div class="stack">{children_card.replace(flag("Allergy"), "").replace(flag("Asthma"), "")}{guardians_card.replace(f"<p class=\"card__footer\"><a href=\"{dialog("add-guardian")}\">Add a guardian</a></p>", "")}</div></div>')
    S.add("edge", "Two guardians with very long names, five children, one missing phone number, Arabic script.", nav="families", user=T,
          main=hdr().replace("Rivera household", "Fitzgerald-Vanderbroucke household").replace("2 guardians · 2 children · Spanish · enrolled since Sep 2024", "2 guardians · 5 children · English · enrolled since Jan 2023") +
          f'<div class="split"><div class="stack">' + card(ul_list([
              list_item(LONG_CHILD, "9 · Grade 4 · Saturday Sports", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">AF</span>', href=page("child"), end=flag("Allergy")),
              list_item("Anastasia-Wilhelmina Fitzgerald-Vanderbroucke", "7 · Grade 2 · Saturday Sports", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">AF</span>', href=page("child")),
              list_item("Maximilian Fitzgerald-Vanderbroucke", "11 · Grade 6 · After‑School Tutoring", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">MF</span>', href=page("child")),
              list_item("Theodora Fitzgerald-Vanderbroucke", "6 · Grade 1 · Saturday Sports", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">TF</span>', href=page("child")),
              list_item("Sebastian Fitzgerald-Vanderbroucke", "12 · Grade 7 · Mentoring", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">SF</span>', href=page("child")),
          ], card=False), title="Children", tid="children", cls="card--flush") + card(ul_list([
              list_item(LONG_GUARDIAN, "Mother · no phone on file · mk.fitzgerald.vanderbroucke@example.com", lead='<span class="avatar avatar--sm avatar--sun" aria-hidden="true">MF</span>', end=badge("No phone", "danger")),
              list_item("Bartholomew Fitzgerald-Vanderbroucke", "Father · 905-555-0122", lead='<span class="avatar avatar--sm" aria-hidden="true">BF</span>'),
          ], card=False), title="Guardians", tid="guardians", cls="card--flush") + f'</div><div class="stack">{consent.replace("Carmen Rivera", LONG_GUARDIAN).replace("Spanish", "English")}</div></div>')


@screen("child", "page", "Child", route="/children/:id", reqs=[R_ENROLL, R_QC, R_PICKUP, R_PRIVACY, R_DATA], na={})
def child(S):
    c = CHILD["mateo"]

    def hdr(actions=True):
        act = (btn("Quick Card", "primary", icon_name="heart-pulse", href=page("quick-card")) + btn("Edit", "", icon_name="edit", data_href=dialog("edit-child")) + icon_btn("more", "More actions", data_href=dialog("child-actions"))) if actions else ""
        return breadcrumb([("Families", page("families")), ("Rivera", page("household"))], "Mateo Rivera") + \
            f'<div class="page-header"><div class="cluster">{avatar(c, "lg")}<div><h1>Mateo Rivera</h1><p class="subtitle">9 years (born 14 Mar 2017) · Grade 4, Bennetto Elementary · Rivera household</p></div></div><div class="cluster">{act}</div></div>'

    medical = card(facts([("Allergies", f'{flag("Severe")} Peanuts (anaphylaxis); tree nuts (hives)'), ("Medication", "EpiPen 0.3 mg · carried"), ("Conditions", "None"), ("Doctor", "Dr. Amrita Sethi · 905-555-0100"), ("Health card", "Ontario ···· 4471"), ("Updated", "By Carmen Rivera · Tue 2 Sep 2026")]),
                   title="Medical and emergency", tid="med", footer=f'<a href="{dialog("edit-medical")}">Edit medical</a> · views logged')
    pickups = card(ul_list([
        list_item("Carmen Rivera", "Mother · photo ID on file", person=GUARDIANS["carmen"], end=badge("Primary", "success")),
        list_item("Luis Rivera", "Uncle · ask for ID", lead='<span class="avatar avatar--sm" aria-hidden="true">LR</span>', end=btn("Remove", "ghost", size="sm", data_href=dialog("remove-pickup"))),
        list_item("Rosa Alvarez", "Grandmother · ask for ID", lead='<span class="avatar avatar--sm" aria-hidden="true">RA</span>', end=btn("Remove", "ghost", size="sm", data_href=dialog("remove-pickup"))),
    ], card=False), title="Approved pickups", tid="pick", cls="card--flush", footer=f'<a href="{dialog("add-pickup")}">Add an approved adult</a>')
    programs_card = card(ul_list([
        list_item("After‑School Tutoring", "Mon–Thu · enrolled Sep 2026 · 31 of 34 sessions", lead=f'<span class="icon-tile" aria-hidden="true">{icon("list")}</span>', href=page("program"), end=badge("Enrolled", "success")),
        list_item("Saturday Sports", "Sat · enrolled Sep 2026 · 8 of 9 sessions", lead=f'<span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>', href=page("program"), end=badge("Enrolled", "success")),
    ], card=False), title="Programs", tid="prog", cls="card--flush")
    att = card(f'<div class="stack" style="gap: var(--space-3);"><p class="text-muted">39 of 43 sessions this season · 91%</p><div class="dots" role="img" aria-label="Last 30 sessions: 27 present, 2 absent, 1 excused">'
               + "".join(f'<span class="dots__dot dots__dot--{k}"></span>' for k in ["present"] * 9 + ["absent"] + ["present"] * 8 + ["excused"] + ["present"] * 6 + ["absent"] + ["present"] * 4)
               + f'</div><div class="cluster cluster--snug">{status("Present", "success")}{status("Absent", "danger")}{status("Excused", "warning")}</div></div>', title="Attendance", tid="att", footer=f'<a href="{page("attendance-history", "by-youth")}">Attendance history</a>')
    slips = card(ul_list([
        list_item("Fall field trip: Royal Botanical Gardens", "Signed by Carmen Rivera · Today, 3:41 pm", lead=f'<span class="icon-tile" aria-hidden="true">{icon("bus")}</span>', href=page("event"), end=badge("Signed", "success")),
        list_item("Season consent 2026–27", "Signed by Carmen Rivera · Tue 2 Sep", lead=f'<span class="icon-tile" aria-hidden="true">{icon("clipboard")}</span>', href=page("slip-sign", "success"), end=badge("Signed", "success")),
    ], card=False), title="Slips", tid="slips", cls="card--flush")
    S.add("default", "Mateo’s profile: medical, approved pickups, programs, attendance and slips, with the audit note on medical views.", nav="families", user=T,
          main=hdr() + f'<div class="split"><div class="stack">{medical}{pickups}{slips}</div><div class="stack">{programs_card}{att}</div></div>')
    S.add("loading", "Child profile loading.", nav="families", main=breadcrumb([("Families", page("families")), ("Rivera", page("household"))], "Loading") + f'<div class="page-header" aria-busy="true"><div class="cluster"><span class="skeleton avatar avatar--lg" aria-hidden="true"></span><div>{skeleton_header()}</div></div></div><div class="split">{skeleton_list(4, "Loading medical")}{skeleton_list(2, "Loading programs")}</div><h1 class="visually-hidden">Child</h1>')
    S.add("empty", "A newly added child with nothing recorded yet: each section says what to add.", nav="families", user=T,
          main=hdr().replace("9 years (born 14 Mar 2017) · Grade 4, Bennetto Elementary · Rivera household", "Added today by Tom Nguyen · Rivera household") +
          f'<div class="split"><div class="stack">{card(empty("No medical information", "Add allergies and medication.", action=btn("Add medical", "primary", icon_name="plus", data_href=dialog("edit-medical")), icon_name="heart-pulse"), title="Medical and emergency", tid="med", cls="card--flush")}'
          f'{card(empty("No approved pickups", "Add adults who may sign Mateo out.", action=btn("Add an approved adult", "", icon_name="plus", data_href=dialog("add-pickup")), icon_name="users"), title="Approved pickups", tid="pick", cls="card--flush")}</div>'
          f'<div class="stack">{card(empty("Not enrolled yet", "Add Mateo to a program.", action=btn("Enroll in a program", "", icon_name="plus", data_href=dialog("enroll-in-program")), icon_name="list"), title="Programs", tid="prog", cls="card--flush")}</div></div>')
    S.add("error", "Child profile failed to load.", nav="families", main=breadcrumb([("Families", page("families")), ("Rivera", page("household"))], "Mateo Rivera") + page_header("Mateo Rivera", "") + card(empty("Couldn’t load this profile", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Quick Card", "", href=page("quick-card", "offline")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "Volunteer view: age without date of birth, medical card locked with who to ask; pickups and programs visible.", nav="families", user=STAFF["aisha"],
          main=hdr(False).replace("9 years (born 14 Mar 2017)", "9 years") + f'<div class="split"><div class="stack">{card(empty("Medical card restricted", "Ask Jaylen Okafor if you need it.", action=f"<a class=\"btn\" href=\"tel:+19055550181\">{icon("phone")}Call Jaylen</a>", icon_name="lock"), title="Medical and emergency", tid="med", cls="card--flush")}{pickups.replace(f"<p class=\"card__footer\"><a href=\"{dialog("add-pickup")}\">Add an approved adult</a></p>", "").replace(btn("Remove", "ghost", size="sm", data_href=dialog("remove-pickup")), "")}</div><div class="stack">{programs_card}</div></div>')
    S.add("outside-sessions", "A youth worker following a link to a child who is in none of her sessions: the server answers 403 and nothing about the child is shown.", nav="families", user=STAFF["aisha"],
          main=card(empty("This child isn’t in your sessions", "Youth workers see the children in the sessions they work. Ask a site lead if you need more.", action=btn("Back to Families", "primary", href=page("families")), icon_name="lock"), cls="card--flush").replace("<h2", "<h1").replace("</h2>", "</h1>"))
    # Youth accounts (L2-051): an admin invites a child of 12 or older from the child record while Learning is on.
    y = CHILD["yusuf"]
    yhdr = breadcrumb([("Families", page("families")), ("Haddad", page("household"))], "Yusuf Haddad") + \
        f'<div class="page-header"><div class="cluster">{avatar(y, "lg")}<div><h1>Yusuf Haddad</h1><p class="subtitle">13 years (born 4 Sep 2013) · Grade 8, École Pavillon de la jeunesse · Haddad household</p></div></div><div class="cluster">{btn("Edit", "", icon_name="edit", data_href=dialog("edit-child"))}</div></div>'
    ymed = card(facts([("Allergies", "None"), ("Medication", "Methylphenidate at noon"), ("Conditions", "None"), ("Doctor", "Not given"), ("Updated", "By Nour Haddad · Mon 7 Sep 2026")]), title="Medical and emergency", tid="med")
    no_account = card(empty("No youth account yet", "Invite Yusuf to sign in to Learning with their own email. The account links to this record.", action=btn("Invite to PromiseHub", "primary", icon_name="mail", data_href=dialog("invite-youth")), icon_name="user"), title="Youth account", tid="youth", cls="card--flush")
    S.add("youth-account", "Tom (Admin) on Yusuf’s record with Learning on: Yusuf is 13 and has no youth account, so the card offers one invitation.", nav="families", user=T,
          main=yhdr + f'<div class="split"><div class="stack">{ymed}</div><div class="stack">{no_account}</div></div>',
          notes=note("Shown only to admins, only while Learning is on and only for children aged 12 to 18. With Learning off the card is not rendered and the endpoint answers 404.", "top: 5rem; right: 1rem;"))
    invited = card(ul_list([list_item("yusuf.haddad@example.com", "Expires 19 Nov 2026 · resend or withdraw it in Staff and roles", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("mail", "icon--sm")}</span>', end=badge("Invited", "info"))], card=False), title="Youth account", tid="youth", cls="card--flush")
    S.add("youth-invited", "After the invitation: the card shows the waiting invitation and where to resend or withdraw it.", nav="families", user=T,
          main=yhdr + f'<div class="split"><div class="stack">{ymed}</div><div class="stack">{invited}</div></div>', toast_html=toast_region(toast("success", "Invitation sent", "Yusuf’s link lasts 14 days.")))
    active = card(ul_list([list_item("Yusuf Haddad", "yusuf.haddad@example.com · signs in to Learning", person=y, end=badge("Active", "success"))], card=False), title="Youth account", tid="youth", cls="card--flush")
    S.add("youth-active", "Once Yusuf accepted: the card names his account; a second invitation is not offered.", nav="families", user=T,
          main=yhdr + f'<div class="split"><div class="stack">{ymed}</div><div class="stack">{active}</div></div>')
    # Guardian consent (L2-055 to L2-058): a youth under the consent age needs a guardian's consent before Learning.
    so = CHILD["sofia"]
    shdr = breadcrumb([("Families", page("families")), ("Rivera", page("household"))], "Sofía Rivera") + \
        f'<div class="page-header"><div class="cluster">{avatar(so, "lg")}<div><h1>Sofía Rivera</h1><p class="subtitle">12 years (born 2 Jun 2014) · Grade 7, Bennetto Elementary · Rivera household</p></div></div><div class="cluster">{btn("Edit", "", icon_name="edit", data_href=dialog("edit-child"))}</div></div>'
    smed = card(facts([("Allergies", "None"), ("Medication", "Blue inhaler in her bag"), ("Conditions", "Asthma"), ("Updated", "By Carmen Rivera · Tue 2 Sep 2026")]), title="Medical and emergency", tid="med")
    saccount = card(ul_list([list_item("Sofía Rivera", "sofia@harbourview.example · signs in to Learning", person=so, end=badge("Active", "success"))], card=False), title="Youth account", tid="youth", cls="card--flush")
    def consent_card(meta, status_badge, action=""):
        return card(ul_list([list_item("Guardian consent", meta, lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("shield", "icon--sm")}</span>', end=status_badge)], card=False)
                    + (f'<div class="card__footer">{action}</div>' if action else ""), title="Guardian consent", tid="consent", cls="card--flush")
    send = btn("Send consent link", "", icon_name="send")
    needed = consent_card("Needed before Sofía can use Learning · under 18", badge("Needed", "warning"), send)
    S.add("consent-needed", "Tom on Sofía’s record: she is 12 with a youth account and no consent yet; he can text the household a consent link.", nav="families", user=T,
          main=shdr + f'<div class="split"><div class="stack">{smed}</div><div class="stack">{saccount}{needed}</div></div>',
          notes=note("Shown while Roster is on, for a child under the consent age with a youth account. Only admins and program directors send the link.", "top: 5rem; right: 1rem;"))
    sent = consent_card("Link sent · 5 Nov 2026, 15:30", badge("Needed", "warning"), send)
    S.add("consent-sent", "After sending: who got the link; the status stays Needed until a guardian signs.", nav="families", user=T,
          main=shdr + f'<div class="split"><div class="stack">{smed}</div><div class="stack">{saccount}{sent}</div></div>', toast_html=toast_region(toast("success", "Consent link sent", "Sent to •••-•••-0142.")))
    given = consent_card("Given by Carmen Rivera (Parent) · 5 Nov 2026, 15:41 · GC-4F7A2C", badge("Given", "success"))
    S.add("consent-given", "Once Carmen signed: who, when and the reference.", nav="families", user=T,
          main=shdr + f'<div class="split"><div class="stack">{smed}</div><div class="stack">{saccount}{given}</div></div>')
    withdrawn = consent_card("Withdrawn by Carmen Rivera · 5 Nov 2026, 15:52", badge("Withdrawn", "danger"), send)
    S.add("consent-withdrawn", "After a withdrawal: Sofía is gated again and staff can send a new link.", nav="families", user=T,
          main=shdr + f'<div class="split"><div class="stack">{smed}</div><div class="stack">{saccount}{withdrawn}</div></div>')
    S.add("edge", "Longest name, four allergies, six pickups and 120 sessions of attendance.", nav="families", user=T,
          main=hdr().replace("Mateo Rivera", LONG_CHILD).replace("Rivera household", "Fitzgerald-Vanderbroucke household") +
          f'<div class="split"><div class="stack">{medical.replace("Peanuts (anaphylaxis); tree nuts (hives)", "Peanuts, tree nuts, sesame, shellfish (anaphylaxis); latex (contact rash); grass pollen (seasonal)").replace("Carmen Rivera", LONG_GUARDIAN)}{pickups.replace("Carmen Rivera", LONG_GUARDIAN)}</div><div class="stack">{att.replace("39 of 43 sessions this season · 91%", "1,104 of 1,180 sessions since 2023 · 93.6%")}</div></div>')


# ------------------------------------------------------------------ Programs
@screen("programs", "page", "Programs", route="/programs", reqs=[R_ENROLL], na={})
def programs(S):
    hdr = page_header("Programs", "4 active · 164 enrolled · 3 on waitlists", btn("New program", "primary", icon_name="plus", href=page("program-form")))

    def row(p):
        b = badge(p["status"], {"Enrolling": "success", "Open": "info", "Archived": ""}[p["status"]])
        wl = f' · {p["waitlist"]} waitlisted' if p["waitlist"] else ""
        term = f' · {p["term"]}' if p.get("term") else ""
        return list_item(esc(p["name"]), f'{p["when"]}{term} · {p["enrolled"]} of {p["capacity"]} enrolled{wl}', lead=f'<span class="icon-tile" aria-hidden="true">{icon("list")}</span>', href=page("program"), end=b)
    S.add("default", "All programs with enrollment against capacity.", nav="programs", user=M, main=hdr + chips([("Active", True), ("Archived", False)], "Filter programs") + ul_list([row(p) for p in PROGRAMS[:4]], label="Programs"))
    S.add("loading", "Programs loading.", nav="programs", main=page_header("Programs", "") + skeleton_list(4, "Loading programs"))
    S.add("empty", "No programs yet.", nav="programs", user=M, main=page_header("Programs", "") + card(empty("No programs yet", "Create one to start.", action=btn("New program", "primary", icon_name="plus", href=page("program-form")), icon_name="list"), cls="card--flush"))
    S.add("error", "Programs failed to load.", nav="programs", main=page_header("Programs", "") + card(empty("Couldn’t load programs", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Archived filter with nothing archived.", nav="programs", user=M, main=hdr + chips([("Active", False), ("Archived", True)], "Filter programs") + card(empty("Nothing archived", "Archived programs appear here.", action=btn("Show active", ""), icon_name="inbox"), cls="card--flush"))


@screen("program", "page", "Program", route="/programs/:id", reqs=[R_ENROLL, R_REPORTS, "L1-024"], na={})
def program(S):
    p = PROGRAMS[0]

    def hdr(actions=True):
        act = (btn("Open enrollment", "primary", icon_name="link", data_href=dialog("open-enrollment")) + btn("Edit", "", icon_name="edit", href=page("program-form", "edit")) + icon_btn("more", "More actions", data_href=dialog("program-actions"))) if actions else ""
        return breadcrumb([("Programs", page("programs"))], p["name"]) + page_header(esc(p["name"]), f'{p["when"]} · 2026–27 term · Sep 2026–Jun 2027', act)
    stats = kpis([("Enrolled", "48 <span class=\"text-caption\">/ 50</span>", "3 waitlisted"), ("Attendance", "89%", "this season"), ("Slips signed", "41 / 48", "RBG trip"), ("Sessions", "34", "9 remaining")])

    def mentor_btn(name):
        return btn("Mentor", "ghost", size="sm", attrs=f' aria-label="Assign a mentor to {name}" aria-haspopup="dialog"', data_href=dialog("assign-mentor"))

    def roster_card(mentors=True, assigned=None):
        assigned = assigned or {"Sofía Rivera": "Daniel Osei"}
        rows = [("Mateo Rivera", "9 · Rivera", "mateo"), ("Sofía Rivera", "12 · Rivera", "sofia"), ("Jordan Thompson", "11 · Thompson", "jordan"), ("Yusuf Haddad", "13 · Haddad", "yusuf")]
        items = [list_item(n, m + ((" · Mentor: " + assigned[n]) if n in assigned else " · No mentor") if mentors else m, person=CHILD[c], href=page("child"),
                           end=mentor_btn(n) if mentors else "") for n, m, c in rows]
        return card(ul_list(items, card=False, label="Roster"), title="Roster · 48", tid="roster", cls="card--flush", footer=f'<a href="{page("roster")}">Full roster and 3 waiting review</a>')

    def mentors_card(team=True):
        if not team:
            return card(empty("No mentors yet", "Choose a lead mentor and any supporting mentors for this cohort.", action=btn("Assign mentors", "primary", icon_name="users", data_href=dialog("cohort-mentors")), icon_name="users"), title="Mentors", tid="mentors", cls="card--flush")
        return card(ul_list([list_item("Daniel Osei", "Lead mentor", person=STAFF["daniel"]), list_item("Hana Kim", "Supporting mentor", person=STAFF["hana"])], card=False, label="Mentors"),
                    title="Mentors", tid="mentors", cls="card--flush", footer=btn("Edit mentors", "ghost", size="sm", attrs=' aria-haspopup="dialog"', data_href=dialog("cohort-mentors")))
    roster = roster_card()
    events_c = card(ul_list([event_row(EVENTS[0]), event_row(EVENTS[1])], card=False), title="Events", tid="events", cls="card--flush", footer=f'<a href="{page("events")}">All events</a> · <a href="{page("event-form")}">New event</a>')
    enroll = card(f'<div class="stack" style="gap: var(--space-3);"><p>Enrollment is open.</p>'
                  f'<div class="input-group"><label class="visually-hidden" for="enroll-link">Enrollment link</label><input class="input" id="enroll-link" type="url" readonly value="https://harbourview.promisehub.app/enroll/tutoring"><button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-label="Copy enrollment link">{icon("copy")}</button></div>'
                  f'<div class="cluster">{btn("Show QR", "", icon_name="qr", data_href=dialog("open-enrollment", "success"))}{btn("Text to families", "", icon_name="send", href=page("new-message"))}{btn("Close enrollment", "ghost", data_href=dialog("close-enrollment"))}</div></div>', title="Enrollment", tid="enroll")
    S.add("default", "After‑School Tutoring as a cohort: its term, the placed youth with each one’s mentor, the cohort’s mentors, events and the enrollment link.", nav="programs", user=M,
          main=hdr() + stats + f'<div class="split"><div class="stack">{roster}{events_c}</div><div class="stack">{mentors_card()}{enroll}</div></div>',
          notes=note("Mentors and the Mentor buttons render only while Mentoring is on; the server answers 404 for the assignment endpoints when it is off.", "top: 5rem; right: 1rem;"))
    no_mentor_roster = roster_card(assigned={"_": ""})
    assigned_roster = roster_card(assigned={"Mateo Rivera": "Daniel Osei", "Sofía Rivera": "Daniel Osei"})
    S.add("no-mentors", "Mentoring is on but nobody mentors this cohort yet: the Mentors card offers Assign mentors.", nav="programs", user=M,
          main=hdr() + stats + f'<div class="split"><div class="stack">{no_mentor_roster}{events_c}</div><div class="stack">{mentors_card(False)}{enroll}</div></div>')
    S.add("mentor-assigned", "Daniel Osei was just assigned to Mateo: the row names him and a toast confirms.", nav="programs", user=M,
          main=hdr() + stats + f'<div class="split"><div class="stack">{assigned_roster}{events_c}</div><div class="stack">{mentors_card()}{enroll}</div></div>',
          toast_html=toast_region(toast("success", "Mentor assigned", "Daniel Osei now mentors Mateo Rivera.")))
    S.add("mentoring-off", "Mentoring is off for the organization: no Mentors card and no mentor on the roster rows.", nav="programs", user=M,
          main=hdr() + stats + f'<div class="split"><div class="stack">{roster_card(mentors=False)}{events_c}</div><div class="stack">{enroll}</div></div>')
    S.add("loading", "Program loading.", nav="programs", main=breadcrumb([("Programs", page("programs"))], "Loading") + f'<div class="page-header" aria-busy="true"><div>{skeleton_header()}</div></div>{skeleton_kpis()}<div class="split">{skeleton_list(4, "Loading roster")}{skeleton_list(2, "Loading events")}</div><h1 class="visually-hidden">Program</h1>')
    S.add("empty", "A new program with no roster: open enrollment or import.", nav="programs", user=M,
          main=hdr().replace(p["name"], "Winter Camp 2026").replace(p["when"], "21–23 Dec, 8 am–5 pm").replace("Sep 2026–Jun 2027", "3 days") +
          f'<div class="split">{card(empty("Nobody enrolled yet", "Open enrollment or import a roster.", action=btn("Open enrollment", "primary", icon_name="link", data_href=dialog("open-enrollment")) + btn("Import CSV", "", icon_name="upload", href=page("import-roster")), icon_name="users"), title="Roster", tid="roster", cls="card--flush")}{card("<p class=\"text-muted\">Enrollment is closed.</p>", title="Enrollment", tid="enroll")}</div>')
    S.add("error", "Program failed to load.", nav="programs", main=breadcrumb([("Programs", page("programs"))], p["name"]) + page_header(esc(p["name"]), "") + card(empty("Couldn’t load this program", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("All programs", "ghost", href=page("programs")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("archived", "Summer Camp 2026, archived: read-only with reports still available.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs"))], "Summer Camp 2026") + page_header("Summer Camp 2026 <span class=\"badge\">Archived</span>", "Jul–Aug 2026 · archived by Marisol Delgado on Fri 4 Sep", btn("Export report", "", icon_name="download", data_href=dialog("export-data")) + btn("Restore", "ghost", data_href=dialog("program-actions"))) +
          alert("info", "This program is archived", "Read-only. Restore to edit.") +
          kpis([("Enrolled", "112", "final"), ("Attendance", "92%", "8 weeks"), ("Slips signed", "100%", "6 trips"), ("Incidents", "3", "all closed")]))


@screen("roster", "page", "Program roster", route="/programs/:id/roster", reqs=[R_ENROLL], na={})
def roster(S):
    hdr = breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Roster") + page_header("Roster · After‑School Tutoring", "48 enrolled · 3 waiting review · 3 waitlisted · 50 places", btn("Add child", "", icon_name="plus", data_href=dialog("enroll-in-program")) + btn("Export", "", icon_name="download", data_href=dialog("export-data")))
    tabs_ = ('<div class="tabs" role="tablist" aria-label="Roster sections"><button class="tab" role="tab" type="button" id="t-review" aria-controls="p-review" aria-selected="true">Waiting review <span class="badge badge--info">3</span></button>'
             '<button class="tab" role="tab" type="button" id="t-enrolled" aria-controls="p-enrolled" aria-selected="false" tabindex="-1">Enrolled <span class="badge">48</span></button>'
             '<button class="tab" role="tab" type="button" id="t-wait" aria-controls="p-wait" aria-selected="false" tabindex="-1">Waitlist <span class="badge">3</span></button></div>')

    def review_rows(selected: set | None = None):
        selected = selected or set()
        items = [("Nikolai Petrov", "10 · Elena Petrova · applied Mon 2 Nov · returning", GUARDIANS["elena"]), ("Grace Adeyemi", "11 · Bola Adeyemi · applied Tue 3 Nov · medical missing", dict(initials="GA", color="rose")), ("Omar Siddiqui", "12 · Farah Siddiqui · applied Today · new", dict(initials="OS", color="sage"))]
        out = []
        for i, (n, m, p) in enumerate(items):
            chk = f'<label class="choice"><input type="checkbox" name="sel-{i}"{" checked" if i in selected else ""}><span class="visually-hidden">Select {esc(n)}</span></label>'
            out.append(f'<li class="list__item{" list__item--selected" if i in selected else ""}">{chk}{avatar(p)}<div class="list__body"><a class="list__title" href="{page("child")}">{esc(n)}</a><div class="list__meta">{m}</div></div><div class="row-actions">{btn("Accept", "primary", size="sm", data_href=dialog("review-enrollment"))}{btn("Waitlist", "", size="sm", data_href=dialog("review-enrollment"))}</div></li>')
        return out
    panels = (f'<div id="p-review" role="tabpanel" aria-labelledby="t-review" tabindex="0">{ul_list(review_rows(), label="Waiting review")}</div>'
              '<div id="p-enrolled" role="tabpanel" aria-labelledby="t-enrolled" tabindex="0" hidden><p class="text-muted">48 enrolled</p></div>'
              '<div id="p-wait" role="tabpanel" aria-labelledby="t-wait" tabindex="0" hidden><p class="text-muted">3 waitlisted</p></div>')
    S.add("default", "Three enrollments waiting review with accept and waitlist on each row; enrolled and waitlist tabs.", nav="programs", user=T, main=hdr + tabs_ + panels)
    S.add("loading", "Roster loading.", nav="programs", main=breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Roster") + page_header("Roster · After‑School Tutoring", "") + skeleton_list(6, "Loading roster"))
    S.add("empty", "Nothing waiting review and nobody enrolled yet.", nav="programs", user=T, main=hdr.replace("48 enrolled · 3 waiting review · 3 waitlisted · 50 places", "Nobody enrolled yet · 50 places") + card(empty("No enrollments yet", "Share the enrollment link.", action=btn("Share enrollment link", "primary", icon_name="link", data_href=dialog("open-enrollment")), icon_name="inbox"), cls="card--flush"))
    S.add("error", "Roster failed to load.", nav="programs", main=breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Roster") + page_header("Roster · After‑School Tutoring", "") + card(empty("Couldn’t load the roster", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Filter on the enrolled tab with no match.", nav="programs", user=T, main=hdr + tabs_.replace('aria-selected="true">Waiting review', 'aria-selected="false" tabindex="-1">Waiting review').replace('aria-selected="false" tabindex="-1">Enrolled', 'aria-selected="true">Enrolled') +
          f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="ro-q">Search roster</label><input class="input" id="ro-q" type="search" value="Garcia"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form></div>' +
          card(empty("No “Garcia” enrolled", "Clear the search.", action=btn("Clear search", "") + btn("Search families", "ghost", href=page("families", "no-results")), icon_name="search"), cls="card--flush"))
    wait_rows = [f'<li class="list__item">{avatar(dict(initials="SR", color="peach"))}<div class="list__body"><span class="list__title">#{i + 1} · {esc(n)}</span><div class="list__meta">{m}</div></div><div class="row-actions">{btn("Move in", "primary", size="sm", data_href=dialog("move-in"))}</div></li>'
                 for i, (n, m) in enumerate([("Sofía Rivera", "Carmen Rivera · applied Mon 2 Nov"), ("Leo Park", "Min-ji Park · applied Tue 3 Nov"), ("Ava Singh", "Raj Singh · applied Wed 4 Nov")])]
    S.add("waitlist", "The waitlist in order with Move in on each row while places are free (48 of 50); when full, Move in is disabled with the reason.", nav="programs", user=T,
          main=hdr + tabs_.replace('aria-selected="true">Waiting review', 'aria-selected="false" tabindex="-1">Waiting review').replace('aria-selected="false" tabindex="-1">Waitlist', 'aria-selected="true">Waitlist')
          + '<div id="p-wait" role="tabpanel" aria-labelledby="t-wait" tabindex="0"><p class="text-muted">2 places free. Moving a child in texts the guardian; the others move up.</p>' + ul_list(wait_rows, label="Waitlist") + '</div>')
    S.add("selected", "Two applications selected: the bulk bar offers Accept 2 and Waitlist 2.", nav="programs", user=T,
          main=hdr + tabs_ + panels.replace(ul_list(review_rows(), label="Waiting review"), ul_list(review_rows({0, 2}), label="Waiting review")) +
          f'<div class="bulk-bar" role="region" aria-label="Bulk actions"><span class="bulk-bar__count">2 selected</span>{btn("Accept 2", "primary", data_href=dialog("bulk-review"))}{btn("Waitlist 2", "", data_href=dialog("bulk-review"))}{btn("Clear", "ghost")}</div>')
    S.add("long", "A camp roster of 212 enrolled as a table with pagination.", nav="programs", user=T,
          main=hdr.replace("After‑School Tutoring", "Summer Camp 2026").replace("48 enrolled · 3 waiting review · 3 waitlisted · 50 places", "212 enrolled · 120 places · 2 sites") +
          table("Enrolled children", ["Child", "Age", "Household", "Medical", "Slips", "Attendance", "Actions"],
                [[f'<a href="{page("child")}">{esc(c["name"])}</a>', str(c["age"]), c["hh"], flag(c["flag"]) if c["flag"] else "", badge("Signed", "success"), f'{90 + i}%', f'<div class="row-actions">{btn("Remove", "ghost", size="sm", data_href=dialog("remove-from-roster"))}</div>'] for i, c in enumerate(CHILDREN[:8])])
          + f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–25 of 212</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')
