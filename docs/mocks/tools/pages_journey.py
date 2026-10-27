"""View journey and progress (prompt 65, L2-087 and L2-088): a youth's journey through her tracks, the badges she has earned and
the ones still locked, her weekly streak, her progression stage and her overall progress. Ported from Waypoint's youth journey,
badges and progress mocks. Every number comes from one server read per page, so the home, journey, badges and progress agree."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN = "L1-023"
SOFIA = YOUTH["sofia"]
YKW = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning"])
R_JOURNEY = ["L2-087", R_LEARN, "L2-035", "L2-036"]
R_PROGRESS = ["L2-088", R_LEARN, "L2-035", "L2-036"]

# Sofía: 4 of 9 lessons, a lesson in each of the last 3 weeks, 2 of 6 badges, Contributor (stage 2 of 3).
EARNED = [
    ("First Steps", "star", "Finished a first lesson.", "Earned Mon 12 Oct"),
    ("Speaks Up", "flag", "Shared an idea with the whole group.", "Earned Thu 29 Oct · from Marisol Vega"),
]
LOCKED = [
    ("Servant Heart", "heart", "Finish Leading by Serving.", "1 of 3 lessons"),
    ("Quiz Champion", "award", "Pass the Leading by Serving quiz.", "Not yet"),
    ("Served Someone", "check", "Have Serve someone this week accepted.", "Not yet"),
    ("Encourager", "sparkle", "Your program team awards it by hand.", "Awarded by hand"),
]
ROADMAP = [
    ("Leadership Foundations", [
        ("Knowing Yourself", "2 of 2 lessons", "Done", "success"),
        ("Leading by Serving", "1 of 3 lessons · you’re here", "In progress", "info"),
        ("Speaking Up", "Unlocks after Leading by Serving", "Locked", ""),
    ]),
    ("Digital Skills", [
        ("Web Basics", "0 of 2 lessons", "Not started", ""),
    ]),
]
STAGES = [
    ("Explorer", "Finding their place in the group", "Earned", "success"),
    ("Contributor", "1 of 2 competencies proficient · Speaks up, Follows through", "You’re here", "info"),
    ("Leader", "Leads a small group", "Ahead", ""),
]
COMPETENCIES = [
    ("Serves others", "Explorer", "Proficient", "success"),
    ("Works with others", "Explorer", "Mastered", "success"),
    ("Speaks up", "Contributor", "Proficient", "success"),
    ("Follows through", "Contributor", "Developing", "info"),
    ("Leads a small group", "Leader", "Not started", ""),
]
QUIZZES = [
    ["Knowing Yourself quiz", "Knowing Yourself", "100%", badge("Passed", "success")],
    ["Pick Up the Towel check", "Leading by Serving", "70%", badge("Passed", "success")],
    ["Leading by Serving quiz", "Leading by Serving", "—", badge("Waiting", "info")],
]
SESSIONS = [
    ["Thu 29 Oct", "Tutoring night", badge("Present", "success")],
    ["Thu 22 Oct", "Tutoring night", badge("Present", "success")],
    ["Thu 15 Oct", "Tutoring night", badge("Absent", "warning")],
    ["Thu 8 Oct", "Tutoring night", badge("Present", "success")],
]


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def not_open() -> str:
    return card(empty("Learning isn’t open for you yet", "Your journey, badges and progress appear once Learning opens for you. Learning says what’s needed.",
                      action=btn("Back to Learning", "primary", href=page("learn-home")), icon_name="lock"), cls="card--flush")


def medal(name: str, icon_name: str, caption: str, *, locked: bool = False) -> str:
    cls = "achievement-badge" + (" achievement-badge--locked" if locked else "")
    return (f'<li class="{cls}"><span class="achievement-badge__medal" aria-hidden="true">{icon(icon_name)}</span>'
            f'<span class="achievement-badge__name">{esc(name)}</span><span class="achievement-badge__caption">{esc(caption)}</span></li>')


def medals(items, label: str) -> str:
    return f'<ul class="achievement-badges" aria-label="{esc(label)}">{"".join(items)}</ul>'


def small_medal(icon_name: str) -> str:
    return f'<span class="achievement-badge achievement-badge--sm" aria-hidden="true"><span class="achievement-badge__medal">{icon(icon_name)}</span></span>'


def crumbs(cur: str) -> str:
    return breadcrumb([("Learning", page("learn-home"))], cur)


def numbers(streak: str = "3 weeks", badges_: str = "2 of 6") -> str:
    return kpis([("Overall progress", "44%", "4 of 9 lessons"), ("Streak", streak, "A lesson every week"),
                 ("Badges", badges_, "Earned so far"), ("Stage", "Contributor", "Stage 2 of 3")])


def roadmap() -> str:
    out = []
    for n, (track, rows) in enumerate(ROADMAP):
        items = [list_item(f"{i + 1}. {esc(m)}", esc(meta), end=badge(st, kind), href="" if st == "Locked" else page("learn-module"))
                 for i, (m, meta, st, kind) in enumerate(rows)]
        cont = f'<div>{btn("Continue Leading by Serving", "primary", icon_name="arrow-right", href=page("learn-module"))}</div>' if n == 0 else ""
        out.append(card(f'<div class="stack">{ul_list(items, card=False, label=f"{track} modules, in order")}{cont}</div>', title=esc(track), tid=f"track-{n + 1}"))
    return "".join(out)


def stages() -> str:
    items = [list_item(f"{i + 1}. {esc(n)}", esc(d), end=badge(st, kind)) for i, (n, d, st, kind) in enumerate(STAGES)]
    return card(ul_list(items, card=False, label="Stages, in order"), title="Your stage", tid="stages", cls="card--flush")


# ---------------------------------------------------------------- learn-journey
@screen("learn-journey", "page", "Your journey", route="/learning/journey", reqs=R_JOURNEY)
def learn_journey(S):
    sub = "Hi, Sofía. You’re in Leading by Serving now."
    hdr = crumbs("Your journey") + page_header("Your journey", sub)
    strip = card(f'<div class="stack">{progress(2, 6, "Badges earned", show="2 of 6 earned")}'
                 + medals([medal(n, i, c) for n, i, _d, c in EARNED] + [medal(n, i, "Locked", locked=True) for n, i, _d, _c in LOCKED[:2]], "Your badges")
                 + f'<div>{btn("See all badges", "", icon_name="arrow-right", href=page("learn-badges"))}</div></div>', title="Badges", tid="badges")
    more = card(ul_list([list_item("Your progress", "Quizzes, attendance and competencies", href=page("learn-progress"))],
                        card=False, label="More about you"), title="More", tid="more", cls="card--flush")
    S.add("default", "Sofía opens Your journey from Learning: her overall progress, weekly streak, badges and stage, then her roadmap module by module.", **YKW,
          main=hdr + numbers() + f'<div class="split"><div class="stack">{roadmap()}</div><div class="stack">{stages()}{strip}{more}</div></div>',
          notes=note("One read, GET /learning/journey. Lessons and modules count as on Learning; the streak is the weeks in a row with a lesson done; the stage is the first one whose competencies are not all proficient.", "top: 5rem; right: 1rem;"))
    S.add("loading", "The journey loading: skeletons in the same layout.", **YKW,
          main=crumbs("Your journey") + page_header("Your journey") + skeleton_kpis(4) + f'<div class="split">{skeleton_list(4, "Loading your roadmap")}{skeleton_list(3, "Loading your stage")}</div>')
    S.add("empty", "No track is published for her programs yet: the journey says what will appear.", **YKW,
          main=crumbs("Your journey") + page_header("Your journey", "Your path through your program’s lessons.")
          + card(empty("Your journey starts with your first track", "When your program publishes a track, its modules appear here as your roadmap.",
                       action=btn("Back to Learning", "", href=page("learn-home")), icon_name="map-pin"), cls="card--flush"))
    S.add("error", "The journey failed to load; the shell stays.", **YKW,
          main=crumbs("Your journey") + page_header("Your journey") + failed("We couldn’t load your journey"))
    S.add("forbidden", "Learning is not open for her yet (no guardian consent or not placed): the server refuses and the page points to Learning.", **YKW,
          main=crumbs("Your journey") + page_header("Your journey") + not_open())


# ---------------------------------------------------------------- learn-badges
@screen("learn-badges", "page", "Badges", route="/learning/badges", reqs=R_JOURNEY)
def learn_badges(S):
    hdr = lambda sub: crumbs("Badges") + page_header("Badges", sub)
    collection = card(progress(2, 6, "Badges earned", show="2 of 6 earned · 33%"), title="Your collection", tid="collection")
    earned = card(medals([medal(n, i, c) for n, i, _d, c in EARNED], "Earned badges"), title="Earned", tid="earned")
    locked = card(medals([medal(n, i, f"{d} {c}." if c not in ("Not yet", "Awarded by hand") else d, locked=True) for n, i, d, c in LOCKED], "Badges still to unlock"),
                  title="Still to unlock", tid="to-unlock")
    timeline = card(ul_list([
        list_item("Joined After‑School Tutoring", "Mon 14 Sep · Welcome to PromiseHub", lead=small_medal("flag")),
        list_item("First Steps badge", "Mon 12 Oct · Finished a first lesson", lead=small_medal("star")),
        list_item("Speaks Up badge", "Thu 29 Oct · Shared an idea with the whole group", lead=small_medal("flag")),
        list_item("Next up: Servant Heart", "1 of 3 lessons · Finish Leading by Serving", lead=small_medal("heart"), end=badge("Next", "info")),
    ], card=False, label="Your milestones"), title="Your milestones", tid="milestones", cls="card--flush")
    S.add("default", "Sofía opens Badges: 2 of 6 earned with when, the ones still locked with what earns them and how far she is, and her milestones.", **YKW,
          main=hdr("You’ve earned 2 of 6 badges. Keep going, Sofía.") + f'<div class="split"><div class="stack">{collection}{earned}{locked}</div><div class="stack">{timeline}</div></div>',
          notes=note("Only badges she can earn: by-hand badges and automatic badges whose lesson, module, quiz or assignment is in a track she follows. Deleted badges she earned stay earned.", "top: 5rem; right: 1rem;"))
    S.add("empty", "None earned yet: the locked badges say how to earn each, with one action to start a lesson.", **YKW,
          main=hdr("You’ve earned 0 of 6 badges.") + '<div class="stack">'
          + card(empty("No badges yet", "Finish your first lesson to earn First Steps.", action=btn("Start a lesson", "primary", href=page("learn-home")), icon_name="star"), cls="card--flush")
          + card(medals([medal("First Steps", "star", "Finished a first lesson. 0 of 1 lessons.", locked=True)]
                        + [medal(n, i, d, locked=True) for n, i, d, _c in LOCKED], "Badges still to unlock"), title="Still to unlock", tid="to-unlock") + '</div>')
    S.add("none", "Her organization has no badges yet: the page says so.", **YKW,
          main=hdr("Badges you earn as you learn.") + card(empty("No badges to earn yet", "Your program team hasn’t made any badges. They’ll appear here when they do.",
                                                               action=btn("Back to Learning", "", href=page("learn-home")), icon_name="award"), cls="card--flush"))
    S.add("loading", "Badges loading.", **YKW, main=crumbs("Badges") + page_header("Badges") + f'<div class="split">{skeleton_list(3, "Loading your badges")}{skeleton_list(3, "Loading your milestones")}</div>')
    S.add("error", "Badges failed to load.", **YKW, main=crumbs("Badges") + page_header("Badges") + failed("We couldn’t load your badges"))
    S.add("forbidden", "Learning is not open for her yet: the page points to Learning.", **YKW, main=crumbs("Badges") + page_header("Badges") + not_open())


# ---------------------------------------------------------------- learn-progress
def progress_tabs(cur: str, attendance: bool = True) -> str:
    tabs = [("overview", "Overview"), ("quizzes", "Quizzes")] + ([("attendance", "Attendance")] if attendance else [])
    out = "".join(f'<button class="tab" role="tab" type="button" id="tab-{v}" aria-controls="panel-{v}" aria-selected="{"true" if v == cur else "false"}"'
                  f'{"" if v == cur else " tabindex=\"-1\""} data-href="{page("learn-progress", v if v != "overview" else "default")}">{t}</button>' for v, t in tabs)
    return f'<div class="tabs" role="tablist" aria-label="Your progress">{out}</div>'


def panel(v: str, body: str) -> str:
    return f'<div role="tabpanel" id="panel-{v}" aria-labelledby="tab-{v}" class="stack">{body}</div>'


@screen("learn-progress", "page", "Your progress", route="/learning/progress", reqs=R_PROGRESS)
def learn_progress(S):
    hdr = crumbs("Your progress") + page_header("Your progress", "Sofía Rivera · After‑School Tutoring")
    overview_numbers = kpis([("Overall progress", "44%", "4 of 9 lessons"), ("Quiz average", "85%", "2 quizzes scored"),
                             ("Streak", "3 weeks", "A lesson every week"), ("Attendance", "92%", "11 of 12 sessions")])
    comps = card(ul_list([list_item(esc(n), f"{esc(stage)} stage", end=badge(lvl, kind)) for n, stage, lvl, kind in COMPETENCIES], card=False, label="Your competencies"),
                 title="Your competencies", tid="competencies", cls="card--flush", footer="Levels come from your mentor’s assessments.")
    overview = panel("overview", overview_numbers + comps)
    quizzes = panel("quizzes", kpis([("Quiz average", "85%", "2 quizzes scored")]) + table("Quiz history", ["Quiz", "Module", "#Score", "Result"], QUIZZES, hide_sm={1}))
    attendance = panel("attendance", kpis([("Attendance", "92%", "11 of 12 sessions")]) + table("Session attendance", ["Date", "Session", "Status"], SESSIONS))
    S.add("default", "Sofía opens Your progress on Overview: overall progress, quiz average, streak, attendance and her competencies with their levels.", **YKW,
          main=hdr + progress_tabs("overview") + overview,
          notes=note("One read, GET /learning/progress. Tabs move with the arrow keys. The quiz average is of each quiz’s best scored attempt; a result waiting for her mentor does not count yet.", "top: 5rem; right: 1rem;"))
    S.add("quizzes", "The Quizzes tab: each quiz she has taken once, with its best score and whether she passed.", **YKW, main=hdr + progress_tabs("quizzes") + quizzes)
    S.add("attendance", "The Attendance tab: the sessions of her programs, newest first, present or absent.", **YKW, main=hdr + progress_tabs("attendance") + attendance)
    S.add("roll-call-off", "Roll Call is off for Harbourview: no Attendance tab and no attendance number; nothing mentions it.", **YKW,
          main=hdr + progress_tabs("overview", attendance=False)
          + panel("overview", kpis([("Overall progress", "44%", "4 of 9 lessons"), ("Quiz average", "85%", "2 quizzes scored"), ("Streak", "3 weeks", "A lesson every week")]) + comps))
    S.add("empty", "Nothing done yet: zeros say so in words and the tabs show their own empty states.", **YKW,
          main=hdr + progress_tabs("overview")
          + panel("overview", kpis([("Overall progress", "0%", "0 of 9 lessons"), ("Quiz average", "—", "No quizzes scored yet"), ("Streak", "0 weeks", "Do a lesson this week to start one"), ("Attendance", "—", "No sessions yet")])
                  + card(empty("Your progress starts with your first lesson", "Finish a lesson and it shows here, with your quizzes and sessions.",
                               action=btn("Start a lesson", "primary", href=page("learn-home")), icon_name="chart"), cls="card--flush")))
    S.add("loading", "Your progress loading.", **YKW, main=crumbs("Your progress") + page_header("Your progress") + skeleton_kpis(4) + skeleton_list(4, "Loading your competencies"))
    S.add("error", "Your progress failed to load.", **YKW, main=crumbs("Your progress") + page_header("Your progress") + failed("We couldn’t load your progress"))
    S.add("forbidden", "Learning is not open for her yet: the page points to Learning.", **YKW, main=crumbs("Your progress") + page_header("Your progress") + not_open())
