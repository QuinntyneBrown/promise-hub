"""Complete lessons (prompt 57, L2-068 to L2-070): a youth's Learning home, their tracks, a module, reading and scripture
lessons, coding lessons and coding projects. Ported from Waypoint's youth home, curriculum, module, lesson, Bible lesson,
coding lesson and coding project mocks. Youth see only published content of the tracks their programs follow; a module
unlocks when its prerequisite is done and a lesson when the one before it is done, and the server enforces both."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN = "L1-023"
SOFIA = YOUTH["sofia"]
YKW = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning", "schedule", "conversations"])
SUB = "Your lessons, quizzes, assignments and badges."

PASSAGE = "“For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.”"
TOWEL_BODY = ("The night before the big game, the team captain stayed behind to pack the kit bags while everyone else went home. "
              "Nobody asked her to. Nobody saw it, either, until the coach found the bags lined up at the door the next morning.\n\n"
              "Leading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.")
LINE_BODY = ("James and John wanted the best seats, one on each side of Jesus. It’s an honest ask: most of us want to be seen, to matter, to lead.\n\n"
             "In the world, greatness flows downhill: the more important you are, the more people serve you. Here it flips. "
             "“Whoever wants to become great among you must be your servant.”\n\n"
             "This week, watch for one person you can quietly serve without being asked.")

# Leadership Foundations, as Sofía sees it: Knowing Yourself done, Leading by Serving in progress, Speaking Up locked.
MODULES = [
    ("Knowing Yourself", "2 lessons", "Done", 100),
    ("Leading by Serving", "3 lessons · “The best leaders are the ones who carry the bags.”", "In progress", 33),
    ("Speaking Up", "2 lessons", "Locked", 0),
]
LESSONS = [
    ("Pick Up the Towel", "Reading · 12 min", "Done", "learn-lesson"),
    ("Last in Line", "Scripture · Mark 10:35–45 · 15 min", "Up next", "learn-lesson-scripture"),
    ("Leading Like a Coach", "Reading · 18 min", "Locked", ""),
]
STATUS_KIND = {"Done": "success", "In progress": "info", "Up next": "info", "Locked": "", "Submitted": "info", "Not started": ""}

HELLO = "Good afternoon, Sofía"


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def locked_card(title: str, text: str, back: str, back_href: str) -> str:
    return card(empty(title, text, action=btn(back, "", href=back_href), icon_name="lock"), cls="card--flush")


def not_found(what: str) -> str:
    return card(empty(f"We can’t find that {what}", "It may not be published yet, or your program doesn’t follow it.",
                      action=btn("Back to Learning", "", href=page("learn-home")), icon_name="search"), cls="card--flush")


def lead_icon(name: str) -> str:
    return f'<span class="icon-tile" aria-hidden="true">{icon(name)}</span>'


def track_switch(current: str = "Leadership Foundations") -> str:
    names = ["Leadership Foundations", "Digital Skills"]
    items = "".join(f'<button class="btn" type="button" aria-pressed="{"true" if n == current else "false"}">{n}</button>' for n in names)
    return f'<div class="button-group" role="group" aria-label="Your tracks">{items}</div>'


def video(state: str = "ready") -> str:
    head = '<div class="cluster cluster--between"><h2 class="card__title" id="watch">Watch</h2>' + badge("Optional") + '</div>'
    if state == "failed":
        frame = (f'<div class="video-player__frame"><div class="video-player__failed">'
                 f'{alert("warning", "The video couldn’t load", "The lesson text is all still here.", actions=btn("Retry video", "", size="sm", icon_name="refresh"))}</div></div>')
    else:
        frame = ('<div class="video-player__frame"><video controls preload="metadata" aria-label="Pick Up the Towel, lesson video">'
                 '</video></div>')
    cap = '<figcaption class="video-player__caption"><span>Pick Up the Towel</span><span>Lesson video</span></figcaption>'
    return f'<section class="card stack" aria-labelledby="watch">{head}<figure class="video-player">{frame}{cap}</figure></section>'


# ---------------------------------------------------------------- learn-home
@screen("learn-home", "page", "Learning", route="/learning", reqs=["L2-068", "L2-069", "L2-092", R_LEARN, "L1-002"])
def learn_home(S):
    from pages_assign import assigned_card
    hdr = page_header("Learning", "Hi, Sofía. You’re 4 of 9 lessons in.")

    def body(extra: str = "", *, assigned: bool = True) -> str:
        cont = card(f'<div class="stack"><div><p class="text-body-lg"><strong>Last in Line</strong></p><p class="text-muted">Leading by Serving · Mark 10:35–45 · 15 min</p></div>'
                    f'{progress(1, 3, "Leading by Serving", show="1 of 3 lessons")}'
                    f'<div>{btn("Continue lesson", "primary", icon_name="arrow-right", href=page("learn-lesson-scripture"))}</div></div>', title="Continue where you left off", tid="continue")
        overall = card(progress(4, 9, "Your lessons", show="4 of 9 lessons"), title="Your progress", tid="progress")
        tracks = card(ul_list([
            list_item("Leadership Foundations", "4 of 7 lessons · After‑School Tutoring", href=page("learn-track"), end=badge("In progress", "info")),
            list_item("Digital Skills", "0 of 2 lessons · Saturday Sports", href=page("learn-track", "coding"), end=badge("Not started")),
        ], card=False, label="Your tracks"), title="Your tracks", tid="tracks", cls="card--flush")
        journey = card(ul_list([
            list_item("Your journey", "Roadmap, streak and stage", href=page("learn-journey")),
            list_item("Badges", "What you’ve earned and what’s next", href=page("learn-badges")),
            list_item("Your progress", "Quizzes, attendance and competencies", href=page("learn-progress")),
        ], card=False, label="Your journey"), title="Your journey", tid="journey", cls="card--flush")
        work = assigned_card() if assigned else ""
        return hdr + extra + f'<div class="split"><div class="stack">{work}{cont}{overall}</div><div class="stack">{tracks}{journey}</div></div>'

    S.add("default", "Sofía opens Learning: the work her mentor assigned her, soonest due first, then where she left off, her overall progress and the two tracks her programs follow.", **YKW, main=body(),
          notes=note("Everything here comes from the server: only published lessons of tracks her programs follow, with progress saved on the server. Assigned to you lists work a mentor assigned her that she hasn’t finished; done work drops off.", "top: 5rem; right: 1rem;"))
    S.add("nothing-assigned", "No mentor has assigned her anything, or she finished it all: no Assigned to you card, nothing else changes.", **YKW, main=body(assigned=False))
    S.add("mentoring-off", "Mentoring is off for Harbourview: no Assigned to you card and nothing mentions a mentor; the assigned work is kept for when it comes back.", **YKW, main=body(assigned=False))
    S.add("loading", "Learning loading: skeletons in the same layout.", **YKW,
          main=page_header("Learning", SUB) + f'<div class="split">{skeleton_list(2, "Loading your next lesson")}{skeleton_list(2, "Loading your tracks")}</div>')
    S.add("empty", "No track is published for her programs yet: the page says what will appear.", **YKW,
          main=page_header("Learning", SUB) + card(empty("No lessons yet", "When your program publishes a track, its lessons appear here.",
                                                         action=btn("Back to Today", "", href=page("today", "youth")), icon_name="star"), cls="card--flush"))
    S.add("error", "Learning failed to load; the shell stays.", **YKW, main=page_header("Learning", SUB) + failed("We couldn’t load your lessons"))
    S.add("completed", "Every published lesson done: a celebration and her tracks to revisit.", **YKW,
          main=page_header("Learning", "Hi, Sofía. You finished every lesson that’s out so far.")
          + card(empty("You’re all caught up", "New lessons appear here the moment your program publishes them.", action=btn("Review Leadership Foundations", "", href=page("learn-track")), icon_name="check-circle"), cls="card--flush"))
    S.add("resume", "Sofía chose Finish later on step 2 of setup: Learning offers to pick up where she stopped, above her lessons.", **YKW,
          main=body(alert("info", "Finish setting up", "You stopped at step 2 of 3.", actions=btn("Pick up where I left off", "primary", href=page("youth-welcome", "preferences")))))


# ---------------------------------------------------------------- learn-track
@screen("learn-track", "page", "Track", route="/learning/tracks/:id", reqs=["L2-068", R_LEARN])
def learn_track(S):
    crumbs = breadcrumb([("Learning", page("learn-home"))], "Leadership Foundations")
    hdr = crumbs + page_header("Leadership Foundations", "Growing as a leader at home, at school and in the cohort.")

    def modules(rows=MODULES) -> str:
        items = []
        for i, (name, meta, st, pct) in enumerate(rows):
            if st == "Locked":
                prev = rows[i - 1][0]
                items.append(list_item(f"{i + 1}. {esc(name)}", f"{meta} · Unlocks after {esc(prev)}", end=badge(st)))
            else:
                items.append(list_item(f"{i + 1}. {esc(name)}", f"{meta} · {pct}%", href=page("learn-module"), end=badge(st, STATUS_KIND[st])))
        return card(ul_list(items, card=False, label="Modules, in order"), title="Modules", tid="modules", cls="card--flush")

    overall = card(progress(4, 7, "Leadership Foundations", show="4 of 7 lessons"), title="Track progress", tid="track-progress")
    S.add("default", "Sofía opens Leadership Foundations: its modules in order, done, in progress and locked with what unlocks each.", **YKW,
          main=hdr + f'<div class="stack">{track_switch()}{overall}{modules()}</div>',
          notes=note("Tracks switch with a button group; each is a published track one of her programs follows. A locked module cannot be opened: the server answers 403.", "top: 5rem; right: 1rem;"))
    coding = [("Web Basics", "2 lessons", "In progress", 0)]
    S.add("coding", "Her second track, Digital Skills, followed by Saturday Sports: one module of coding lessons.", **YKW,
          main=breadcrumb([("Learning", page("learn-home"))], "Digital Skills") + page_header("Digital Skills", "Using technology safely and creatively.")
          + f'<div class="stack">{track_switch("Digital Skills")}{card(progress(0, 2, "Digital Skills", show="0 of 2 lessons"), title="Track progress", tid="track-progress")}'
          + card(ul_list([list_item("1. Web Basics", "2 lessons · 0%", href=page("learn-module", "coding"), end=badge("Not started"))], card=False, label="Modules, in order"), title="Modules", tid="modules", cls="card--flush") + '</div>')
    S.add("loading", "The track loading.", **YKW, main=breadcrumb([("Learning", page("learn-home"))], "Track") + page_header("Track") + skeleton_list(3, "Loading modules"))
    S.add("empty", "A track with no published module yet.", **YKW,
          main=hdr + card(empty("No modules published yet", "Your program team is still setting up this track. Check back soon.", action=btn("Back to Learning", "", href=page("learn-home")), icon_name="list"), cls="card--flush"))
    S.add("error", "The track failed to load.", **YKW, main=breadcrumb([("Learning", page("learn-home"))], "Track") + page_header("Track") + failed("We couldn’t load this track"))
    S.add("not-found", "A track her programs don’t follow, a draft, or another organization’s: not found.", **YKW,
          main=breadcrumb([("Learning", page("learn-home"))], "Track") + page_header("Track") + not_found("track"))


# ---------------------------------------------------------------- learn-module
@screen("learn-module", "page", "Module", route="/learning/modules/:id", reqs=["L2-068", R_LEARN],
        na={"empty": "A module is published only with a lesson (L2-066 criterion 6), so youth never meet an empty one."})
def learn_module(S):
    crumbs = lambda cur, track="Leadership Foundations": breadcrumb([("Learning", page("learn-home")), (track, page("learn-track"))], cur)
    hdr = crumbs("Leading by Serving") + page_header("Leading by Serving", "Module 2 of 3 · Putting others first and using influence to build people up.")
    anchor = f'<blockquote class="scripture"><p class="scripture__text">“The best leaders are the ones who carry the bags.”</p></blockquote>'

    def lessons(rows=LESSONS) -> str:
        items = []
        for i, (t, meta, st, target) in enumerate(rows):
            if st == "Locked":
                items.append(list_item(f"{i + 1}. {esc(t)}", f"{meta} · Unlocks after {esc(rows[i - 1][0])}", end=badge(st)))
            else:
                items.append(list_item(f"{i + 1}. {esc(t)}", meta, href=page(target), end=badge(st, STATUS_KIND[st])))
        return card(ul_list(items, card=False, label="Lessons, in order"), title="Lessons", tid="lessons", cls="card--flush")

    def quizzes(st="Locked") -> str:
        if st == "Locked":
            item = list_item("Leading by Serving quiz", "Quiz · 4 questions · Unlocks after Leading Like a Coach", end=badge("Locked"))
        elif st == "Passed":
            item = list_item("Leading by Serving quiz", "Quiz · 4 questions · Best score 75%", href=page("learn-quiz-intro", "passed"), end=badge("Passed", "success"))
        else:
            item = list_item("Leading by Serving quiz", "Quiz · 4 questions · 70% to pass", href=page("learn-quiz-intro"), end=badge("Up next", "info"))
        return card(ul_list([item], card=False, label="Quizzes"), title="Quizzes", tid="quizzes", cls="card--flush")

    def assignments(st="Not started") -> str:
        kinds = {"Not started": "info", "Locked": "", "Submitted": "info", "Needs revision": "warning", "Accepted": "success"}
        meta = "Assignment · 25 points · Due Thu 19 Nov"
        if st == "Locked":
            item = list_item("Serve someone this week", "Assignment · 25 points · Unlocks after Pick Up the Towel", end=badge(st))
        else:
            target = {"Not started": page("learn-assignment"), "Needs revision": page("learn-submission", "needs-revision")}.get(st, page("learn-submission", "accepted" if st == "Accepted" else "default"))
            item = list_item("Serve someone this week", meta, href=target, end=badge("Up next" if st == "Not started" else st, kinds[st]))
        return card(ul_list([item], card=False, label="Assignments"), title="Assignments", tid="assignments", cls="card--flush")

    prog = card(f'<div class="stack">{progress(1, 3, "Leading by Serving", show="1 of 3 lessons")}{anchor}'
                f'<div>{btn("Continue: Last in Line", "primary", icon_name="arrow-right", href=page("learn-lesson-scripture"))}</div></div>', title="Module progress", tid="module-progress")
    S.add("default", "Sofía opens Leading by Serving: one lesson done, the next ready, the last locked until the one before it is done; the module’s quiz unlocks after the last lesson.", **YKW,
          main=hdr + f'<div class="split"><div class="stack">{prog}</div><div class="stack">{lessons()}{quizzes()}{assignments()}</div></div>')
    S.add("assignment", "Pick Up the Towel is done, so its assignment is open: Serve someone this week, due Thu 19 Nov, with its status.", **YKW,
          main=hdr + f'<div class="split"><div class="stack">{prog}</div><div class="stack">{lessons()}{assignments()}</div></div>')
    S.add("assignment-revision", "Daniel asked for a revision: the assignment says Needs revision and opens her submission.", **YKW,
          main=hdr + f'<div class="split"><div class="stack">{prog}</div><div class="stack">{lessons()}{assignments("Needs revision")}</div></div>')
    done_rows = [(t, m, "Done", tg or "learn-lesson") for t, m, _s, tg in LESSONS]
    S.add("quiz", "Every lesson done and the quiz required to complete the module: the quiz is open and the module waits for a pass.", **YKW,
          main=hdr + f'<div class="split"><div class="stack">{card(progress(3, 3, "Leading by Serving", kind="complete", show="3 of 3 lessons") + "<p class=\"text-muted\">Pass the quiz to finish this module.</p><div>" + btn("Start: Leading by Serving quiz", "primary", icon_name="arrow-right", href=page("learn-quiz-intro")) + "</div>", title="Module progress", tid="module-progress")}</div>'
          f'<div class="stack">{lessons(done_rows)}{quizzes("Open")}</div></div>')
    S.add("quiz-passed", "The quiz passed: the module is complete and the next module is unlocked.", **YKW,
          main=hdr + alert("success", "Module complete", "Every lesson is done and you passed the quiz.")
          + f'<div class="split"><div class="stack">{card(progress(3, 3, "Leading by Serving", kind="complete", show="3 of 3 lessons"), title="Module progress", tid="module-progress")}</div><div class="stack">{lessons(done_rows)}{quizzes("Passed")}</div></div>')
    S.add("completed", "Every lesson of the module done: the next module is unlocked.", **YKW,
          main=hdr + alert("success", "Module complete", "Every lesson of this module is done.")
          + f'<div class="split"><div class="stack">{card(progress(3, 3, "Leading by Serving", kind="complete", show="3 of 3 lessons"), title="Module progress", tid="module-progress")}</div><div class="stack">{lessons(done_rows)}</div></div>')
    S.add("coding", "Web Basics in Digital Skills: a coding lesson, then the project it builds to.", **YKW,
          main=crumbs("Web Basics", "Digital Skills") + page_header("Web Basics", "Module 1 of 1 · Every website is just text with tags.")
          + f'<div class="split"><div class="stack">{card(progress(0, 2, "Web Basics", show="0 of 2 lessons") + "<div>" + btn("Start: Your First Webpage", "primary", icon_name="arrow-right", href=page("learn-coding-lesson")) + "</div>", title="Module progress", tid="module-progress")}</div>'
          + '<div class="stack">' + card(ul_list([
              list_item("1. Your First Webpage", "Coding · 20 min", href=page("learn-coding-lesson"), end=badge("Up next", "info")),
              list_item("2. Build Your Event Page", "Project · 40 min · Unlocks after Your First Webpage", end=badge("Locked")),
          ], card=False, label="Lessons, in order"), title="Lessons", tid="lessons", cls="card--flush") + '</div></div>')
    S.add("locked", "Speaking Up opened before Leading by Serving is done: the server answers 403 and the page says what unlocks it.", **YKW,
          main=crumbs("Speaking Up") + page_header("Speaking Up") + locked_card("Finish Leading by Serving first", "This module unlocks when every lesson of Leading by Serving is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The module loading.", **YKW, main=crumbs("Module") + page_header("Module") + f'<div class="split">{skeleton_list(2, "Loading the module")}{skeleton_list(3, "Loading lessons")}</div>')
    S.add("error", "The module failed to load.", **YKW, main=crumbs("Module") + page_header("Module") + failed("We couldn’t load this module"))
    S.add("not-found", "A draft module, one of a track she doesn’t follow, or another organization’s.", **YKW, main=crumbs("Module") + page_header("Module") + not_found("module"))


# ---------------------------------------------------------------- learn-lesson
def lesson_crumbs(cur: str, module: str = "Leading by Serving") -> str:
    return breadcrumb([("Learning", page("learn-home")), (module, page("learn-module"))], cur)


def complete_bar(busy: bool = False, done: bool = False, nxt: str = "Last in Line", nxt_href: str = "") -> str:
    if done:
        return (alert("success", "Lesson complete", f"Nice work. {nxt} is unlocked.",
                      actions=btn(f"Next: {nxt}", "primary", icon_name="arrow-right", href=nxt_href or page("learn-lesson-scripture"))))
    return f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module"))}{btn("Mark complete", "primary", icon_name="check", busy=busy)}</div>'


@screen("learn-lesson", "page", "Lesson", route="/learning/lessons/:id", reqs=["L2-069", "L2-068", R_LEARN],
        na={"empty": "A lesson is published only with teaching content (L2-067 criterion 4)."})
def learn_lesson(S):
    hdr = lesson_crumbs("Pick Up the Towel") + page_header("Pick Up the Towel", "Leading by Serving · Lesson 1 of 3 · 12 min")

    def body(vstate="ready", bar=None, done=False) -> str:
        learn = card(ul_list([f'<li class="list__item"><div class="list__body"><div class="list__title">{o}</div></div></li>' for o in ["Notice what needs doing", "Serve without being asked"]], card=False, label="What you’ll learn"), title="What you’ll learn", tid="objectives", cls="card--flush")
        teach = card(f'<p class="text-caption">Reading: The captain and the kit bags</p><div class="reading">{esc(TOWEL_BODY)}</div>', title="The lesson", tid="teaching")
        reflect = card('<div class="stack"><p class="text-muted">Who picked up the towel for you this week? Hold that thought for your reflection.</p>'
                       + f'<div>{btn("Write your reflection", "", icon_name="edit", href=page("learn-reflection"))}</div></div>', title="Think it over", tid="reflect")
        return (hdr + f'<div class="split"><div class="stack">{teach}{reflect}{bar if bar is not None else complete_bar(done=done)}</div>'
                f'<div class="stack">{video(vstate)}{learn}</div></div>')

    S.add("default", "Sofía opens Pick Up the Towel: what she’ll learn, the lesson text, the optional video and Mark complete. Leader notes are never sent to her.", **YKW, main=body(),
          notes=note("The video streams from the server only to youth of a program that follows the track; it supports seeking (range requests).", "top: 5rem; right: 1rem;"))
    S.add("video-failed", "The video couldn’t load: the lesson text stays readable and Retry video reloads it.", **YKW, main=body("failed"))
    S.add("busy", "Marking complete: the button is busy and cannot be pressed twice.", **YKW, main=body(bar=complete_bar(busy=True)))
    S.add("completed", "Completed: the lesson is saved as done on the server and the next lesson is unlocked.", **YKW, main=body(done=True),
          toast_html=toast_region(toast("success", "Lesson complete", "Pick Up the Towel")))
    S.add("locked", "Leading Like a Coach opened before Last in Line is done: 403, and what unlocks it.", **YKW,
          main=lesson_crumbs("Leading Like a Coach") + page_header("Leading Like a Coach") + locked_card("Finish Last in Line first", "Lessons open in order. This one unlocks when Last in Line is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The lesson loading.", **YKW, main=lesson_crumbs("Lesson") + page_header("Lesson") + f'<div class="split">{skeleton_list(4, "Loading the lesson")}{skeleton_list(2, "Loading the video")}</div>')
    S.add("error", "The lesson failed to load.", **YKW, main=lesson_crumbs("Lesson") + page_header("Lesson") + failed("We couldn’t load this lesson"))
    S.add("not-found", "A draft, deleted or another organization’s lesson.", **YKW, main=lesson_crumbs("Lesson") + page_header("Lesson") + not_found("lesson"))


# ---------------------------------------------------------------- learn-lesson-scripture
@screen("learn-lesson-scripture", "page", "Scripture lesson", route="/learning/lessons/:id", reqs=["L2-069", "L2-068", R_LEARN],
        na={"empty": "A lesson is published only with teaching content (L2-067 criterion 4)."})
def learn_lesson_scripture(S):
    hdr = lesson_crumbs("Last in Line") + page_header("Last in Line", "Leading by Serving · Lesson 2 of 3 · 15 min")
    size_ctl = lambda size: (f'<div class="text-size" role="group" aria-label="Text size">{btn("A−", "", size="sm", aria_label="A− smaller text", disabled=size == "")}'
                             f'{btn("A+", "", size="sm", aria_label="A+ larger text", disabled=size == "xl")}</div>')

    def body(size="", bar=None, done=False) -> str:
        cls = f"reading stack{' reading--' + size if size else ''}"
        passage = f'<blockquote class="scripture"><p class="scripture__text">{PASSAGE}</p><cite class="scripture__reference">Mark 10:45</cite></blockquote>'
        read = (f'<section class="card stack" aria-labelledby="passage"><div class="cluster cluster--between"><h2 class="card__title" id="passage">Read</h2>{size_ctl(size)}</div>'
                f'<p class="text-caption">Mark 10:35–45</p><div class="{cls}">{passage}<div>{esc(LINE_BODY)}</div></div></section>')
        reflect = card('<p class="text-muted">Where in your week are you being asked to serve when you’d rather be served?</p>', title="Reflect before you move on", tid="reflect")
        return hdr + f'<div class="stack" style="max-width: var(--layout-reading-width, 48rem);">{read}{reflect}{bar if bar is not None else complete_bar(done=done, nxt="Leading Like a Coach", nxt_href=page("learn-lesson"))}</div>'

    S.add("default", "Sofía opens Last in Line, a scripture lesson: the passage in a scripture block, the teaching, text size controls and Mark complete.", **YKW, main=body(),
          notes=note("A− and A+ change the reading size on this device; the passage and teaching grow together.", "top: 5rem; right: 1rem;"))
    S.add("large-text", "Larger text: the passage and teaching grow; the layout reflows with no sideways scroll.", **YKW, main=body("lg"))
    S.add("busy", "Marking complete.", **YKW, main=body(bar=complete_bar(busy=True)))
    S.add("completed", "Completed: Leading Like a Coach is unlocked.", **YKW, main=body(done=True), toast_html=toast_region(toast("success", "Lesson complete", "Last in Line")))
    S.add("locked", "Opened before Pick Up the Towel is done: 403.", **YKW,
          main=lesson_crumbs("Last in Line") + page_header("Last in Line") + locked_card("Finish Pick Up the Towel first", "Lessons open in order. This one unlocks when Pick Up the Towel is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The lesson loading.", **YKW, main=lesson_crumbs("Lesson") + page_header("Lesson") + skeleton_list(4, "Loading the lesson"))
    S.add("error", "The lesson failed to load.", **YKW, main=lesson_crumbs("Lesson") + page_header("Lesson") + failed("We couldn’t load this lesson"))


# ---------------------------------------------------------------- learn-coding-lesson
STEPS = [
    ("Every page has a skeleton", "HTML uses tags in angle brackets. A tag that opens must also close. Here’s the smallest real page:",
     "<!doctype html>\n<html>\n  <head><title>My Page</title></head>\n  <body>\n    <h1>Hello!</h1>\n  </body>\n</html>"),
    ("Add a heading and a paragraph", "Put content inside <body>. Use <h1> for a title and <p> for a paragraph.",
     "<body>\n  <h1>Harbourview Youth Night</h1>\n  <p>Come build, belong and grow.</p>\n</body>"),
]
CHECKS = ["I know what an HTML tag is", "I added a heading and a paragraph", "I edited the page and ran it"]
STARTER = "<h1>Change me</h1>\n<p>Write your own line here.</p>"


def code_crumbs(cur: str) -> str:
    return breadcrumb([("Learning", page("learn-home")), ("Web Basics", page("learn-module", "coding"))], cur)


def playground(code: str = STARTER, ran: bool = False, label: str = "Try it yourself") -> str:
    preview = ('<iframe title="Preview of your page" sandbox="allow-scripts" srcdoc="&lt;h1&gt;Harbourview Youth Night&lt;/h1&gt;&lt;p&gt;Fridays at 7.&lt;/p&gt;"></iframe>'
               if ran else "Your preview appears here when you run your code.")
    return (f'<div class="field"><label class="field__label" for="code">{label}</label>'
            f'<div class="code-playground"><textarea class="code-playground__editor" id="code" name="code" spellcheck="false" rows="8" aria-label="{label}" aria-describedby="code-help">{esc(code)}</textarea>'
            f'<div class="code-playground__preview" role="region" aria-label="Preview">{preview}</div></div>'
            f'<div class="field__help" id="code-help">Runs only in this preview; nothing leaves the page until you save.</div>'
            f'<div>{btn("Run", "", icon_name="play")}</div></div>')


@screen("learn-coding-lesson", "page", "Coding lesson", route="/learning/coding/:id", reqs=["L2-070", "L2-068", R_LEARN],
        na={"empty": "A coding lesson is published with its steps; a lesson without steps shows its teaching content only."})
def learn_coding_lesson(S):
    hdr = code_crumbs("Your First Webpage") + page_header("Your First Webpage", "Web Basics · Lesson 1 of 2 · Coding · 20 min")

    def steps_html() -> str:
        out = []
        for i, (t, text, sample) in enumerate(STEPS, 1):
            out.append(card(f'<p>{esc(text)}</p><pre class="code-block" tabindex="0" aria-label="Example: {esc(t)}"><code>{esc(sample)}</code></pre>', title=f"{i}. {esc(t)}", tid=f"step-{i}"))
        return "".join(out)

    def checklist(checked=(True, False, False), err: str = "") -> str:
        boxes = "".join(choice("check", c, type_="checkbox", checked=on) for c, on in zip(CHECKS, checked))
        done = sum(checked)
        return card(fieldset("Before you finish", f'<div class="stack" style="gap: var(--space-2);">{boxes}</div>', fid="checklist", error=err)
                    + progress(done, len(CHECKS), "Checklist", kind="complete" if done == len(CHECKS) else "", show=f"{done} of {len(CHECKS)}"),
                    title="Checklist", tid="checklist-title")

    def body(checked=(True, False, False), ran=False, code=STARTER, busy=False, extra="", done=False) -> str:
        actions = (alert("success", "Lesson complete", "Build Your Event Page is unlocked.", actions=btn("Next: Build Your Event Page", "primary", icon_name="arrow-right", href=page("learn-coding-project")))
                   if done else f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "coding"))}{btn("Save progress", "primary", icon_name="check", busy=busy)}</div>')
        return hdr + extra + f'<div class="stack"><p class="text-muted">Every website is just text with tags. Let’s build one from scratch.</p>{steps_html()}{card(playground(code, ran), title="Your turn", tid="your-turn")}{checklist(checked)}{actions}</div>'

    S.add("default", "Sofía opens Your First Webpage: two steps with code samples, a playground to edit and run, and a checklist. Her code and ticks come back from the server.", **YKW, main=body(),
          notes=note("Run renders the code in a sandboxed iframe of its own origin under a policy that blocks every script and request. Save progress stores the code and ticks; ticking every item completes the lesson.", "top: 5rem; right: 1rem;"))
    S.add("ran", "She edited the page and ran it: the preview shows her heading.", **YKW,
          main=body(checked=(True, True, False), ran=True, code="<h1>Harbourview Youth Night</h1>\n<p>Fridays at 7.</p>"))
    S.add("busy", "Saving progress.", **YKW, main=body(checked=(True, True, True), ran=True, busy=True))
    S.add("saved", "Progress saved with two of three ticked: a toast confirms and the lesson stays in progress.", **YKW,
          main=body(checked=(True, True, False), ran=True), toast_html=toast_region(toast("success", "Progress saved", "2 of 3 checked")))
    S.add("completed", "Every item ticked and saved: the lesson is complete and the project unlocks.", **YKW,
          main=body(checked=(True, True, True), ran=True, done=True), toast_html=toast_region(toast("success", "Lesson complete", "Your First Webpage")))
    S.add("failed", "The save failed: her code and ticks stay on screen to try again.", **YKW,
          main=body(checked=(True, True, False), extra=alert("danger", "We couldn’t save your progress", "Your code is still here. Try again.")))
    S.add("locked", "Opened before the lesson before it is done: 403.", **YKW,
          main=code_crumbs("Coding lesson") + page_header("Your First Webpage") + locked_card("Finish Staying Safe Online first", "This module unlocks when Staying Safe Online is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The coding lesson loading.", **YKW, main=code_crumbs("Coding lesson") + page_header("Coding lesson") + skeleton_list(4, "Loading the coding lesson"))
    S.add("error", "The coding lesson failed to load.", **YKW, main=code_crumbs("Coding lesson") + page_header("Coding lesson") + failed("We couldn’t load this coding lesson"))


# ---------------------------------------------------------------- learn-coding-project
PROJECT = "<h1>Harbourview Youth Night</h1>\n<p>Friday 13 November, 7 pm · Community Centre</p>\n<a href=\"#\">Come through</a>"


@screen("learn-coding-project", "page", "Coding project", route="/learning/coding/:id", reqs=["L2-070", "L2-068", R_LEARN],
        na={"empty": "A project always starts from its starter code."})
def learn_coding_project(S):
    hdr = lambda st="Draft", kind="": code_crumbs("Build Your Event Page") + page_header(f'Build Your Event Page {badge(st, kind)}', "Web Basics · Project · 40 min")
    brief = card('<p>Make a one-page invite for a Harbourview youth night: a big heading, the date and place, and a “Come through” link. '
                 'When it’s ready, send it to your mentor for review.</p>', title="The brief", tid="brief")

    def body(st="Draft", kind="", extra="", submitted=False, busy=False) -> str:
        if submitted:
            act = alert("info", "Sent for review", "Your mentor will look at it. You’ll see their feedback here.")
        else:
            act = (f'<div class="form-actions">{btn("Save draft", "ghost", busy=busy)}'
                   f'{btn("Submit for review", "primary", icon_name="send", attrs=" aria-haspopup=\"dialog\"", data_href=dialog("submit-project"))}</div>')
        return hdr(st, kind) + extra + f'<div class="stack">{brief}{card(playground(PROJECT, True, "Your page"), title="Build it", tid="build")}{act}</div>'

    S.add("default", "Sofía opens Build Your Event Page: the brief, her saved draft in the playground and Submit for review.", **YKW, main=body(),
          notes=note("Submit opens submit-project with an optional note to her mentor. Reviewing projects belongs to the mentor journeys (deferred).", "top: 5rem; right: 1rem;"))
    S.add("saved", "Draft saved: a toast confirms.", **YKW, main=body(), toast_html=toast_region(toast("success", "Draft saved", "Build Your Event Page")))
    S.add("submitted", "Submitted: the project is Submitted, read only, and waits for her mentor.", **YKW, main=body("Submitted", "info", submitted=True),
          toast_html=toast_region(toast("success", "Sent for review", "Build Your Event Page")))
    S.add("locked", "Opened before Your First Webpage is done: 403.", **YKW,
          main=code_crumbs("Build Your Event Page") + page_header("Build Your Event Page") + locked_card("Finish Your First Webpage first", "Lessons open in order. The project unlocks when Your First Webpage is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The project loading.", **YKW, main=code_crumbs("Project") + page_header("Project") + skeleton_list(3, "Loading the project"))
    S.add("error", "The project failed to load.", **YKW, main=code_crumbs("Project") + page_header("Project") + failed("We couldn’t load this project"))


# ================================================================ Take quizzes (prompt 61, L2-075, L2-076)
# Ported from Waypoint's quiz intro, quiz and quiz result mocks. The quiz is the one Marisol built in prompt 60: Leading by
# Serving quiz, attached to the whole module, four questions, 70% to pass, 2 attempts, correct answers after each attempt.
R_QUIZ = ["L2-075", "L2-076", "L2-068", R_LEARN]
QUIZ = "Leading by Serving quiz"
Q_ITEMS = [
    ("In Pick Up the Towel, what did the captain do before the big game?", "MultipleChoice",
     ["Gave the team talk", "Packed the kit bags for everyone", "Went home early", "Picked the starting line‑up"]),
    ("Leading is a title someone gives you.", "TrueFalse", ["True", "False"]),
    ("Which of these are ways to “pick up the towel” this week?", "MultipleAnswer",
     ["Help clear up after group", "Wait until someone asks you", "Check on someone who is new"]),
    ("In one word, who does a servant leader put first?", "ShortAnswer", []),
]
KEYS = "ABCDEF"


def quiz_crumbs(cur: str = QUIZ) -> str:
    return breadcrumb([("Learning", page("learn-home")), ("Leading by Serving", page("learn-module", "quiz"))], cur)


def quiz_option(label: str, key: str, *, name: str = "", multi: bool = False, selected: bool = False, review: str = "", note_: str = "") -> str:
    """One answer choice (the quiz-option component): a label wrapping a native radio or checkbox while taking the quiz, or a
    list item in the review marked correct or wrong in words as well as colour."""
    k = f'<span class="quiz-option__key" aria-hidden="true">{key}</span>'
    n = f'<span class="quiz-option__note">{note_}</span>' if note_ else ""
    if review:
        return f'<li class="quiz-option quiz-option--{review}">{k}<span class="quiz-option__text">{esc(label)}</span>{n}</li>'
    typ = "checkbox" if multi else "radio"
    return (f'<label class="quiz-option{" quiz-option--selected" if selected else ""}"><input class="quiz-option__input" type="{typ}" name="{name}"{" checked" if selected else ""}>'
            f'{k}<span class="quiz-option__text">{esc(label)}</span></label>')


def quiz_question(n: int, answer=None, *, error: str = "") -> str:
    text, kind, opts = Q_ITEMS[n - 1]
    legend = f'<legend class="quiz-question__text">{esc(text)}</legend>'
    hint = {"MultipleAnswer": "Choose every answer that fits.", "TrueFalse": "Choose one.", "MultipleChoice": "Choose one.", "ShortAnswer": ""}[kind]
    if kind == "ShortAnswer":
        return (f'<fieldset class="quiz-question stack">{legend}'
                + field("answer", "Your answer", value=answer or "", help_="Capitals and spaces at the ends don’t matter.", error=error) + '</fieldset>')
    chosen = answer if isinstance(answer, (list, tuple, set)) else ([answer] if answer is not None else [])
    items = "".join(quiz_option(o, KEYS[i], name=f"q{n}", multi=kind == "MultipleAnswer", selected=i in chosen) for i, o in enumerate(opts))
    return (f'<fieldset class="quiz-question stack">{legend}<p class="text-caption">{hint}</p>'
            f'<div class="stack" style="gap: var(--space-2);">{items}</div></fieldset>')


def saved_chip(state: str = "saved") -> str:
    if not state:
        return ""
    if state == "saving":
        return f'<span class="sync-chip" role="status">{icon("refresh")}Saving…</span>'
    if state == "offline":
        return f'<span class="sync-chip" role="status">{icon("wifi-off")}Not saved · you’re offline</span>'
    return f'<span class="sync-chip sync-chip--ok" role="status">{icon("check")}Answers saved</span>'


# ---------------------------------------------------------------- learn-quiz-intro
@screen("learn-quiz-intro", "page", "Quiz", route="/learning/quizzes/:id", reqs=R_QUIZ,
        na={"empty": "A quiz is published only with a question (L2-073 criterion 6), so youth never meet an empty one."})
def learn_quiz_intro(S):
    hdr = quiz_crumbs() + page_header(QUIZ, "Leading by Serving · Quiz · 4 questions")

    def facts_(attempt="1 of 2") -> str:
        return kpis([("Questions", "4", "One at a time"), ("Pass mark", "70%", "3 of 4 correct"),
                     ("Attempts", "2", "Your best one counts"), ("This attempt", attempt, "Not started yet")])

    rules = card(ul_list([f'<li class="list__item"><div class="list__body"><div class="list__title">{t}</div></div></li>' for t in [
        "Answer one question at a time. Use Back and Next to move around.",
        "Your answers save as you go, so you can stop and come back.",
        "Once you submit, you can’t change your answers for that attempt.",
        "You’ll see your score and the correct answers when you submit.",
    ]], card=False, label="Before you start"), title="Before you start", tid="rules", cls="card--flush")

    def body(attempt="1 of 2", action="", extra="") -> str:
        act = action or f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "quiz"))}{btn("Start quiz", "primary", icon_name="arrow-right", href=page("learn-quiz"))}</div>'
        return hdr + extra + f'<div class="stack" style="max-width: var(--layout-reading-width, 48rem);">{facts_(attempt)}{rules}{act}</div>'

    S.add("default", "Sofía opens the Leading by Serving quiz: its questions, pass mark, attempts and which attempt this is, then Start quiz.", **YKW, main=body(),
          notes=note("Every number comes from the quiz’s rules on the server. Correct answers are never sent before an attempt is submitted.", "top: 5rem; right: 1rem;"))
    S.add("in-progress", "She started earlier and stopped at question 3: Resume quiz picks up where she left off.", **YKW,
          main=body(action=f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "quiz"))}{btn("Resume quiz", "primary", icon_name="arrow-right", href=page("learn-quiz"))}</div>',
                    extra=alert("info", "You’re part way through", "Attempt 1 · 2 of 4 answered. Your answers are saved.")))
    S.add("retake", "Her first attempt scored 50%: attempt 2 of 2 is her last, and her best score so far is shown.", **YKW,
          main=body("2 of 2", extra=alert("warning", "Last attempt", "Your best score so far is 50%. You need 70% to pass.",
                                          actions=btn("See attempt 1", "", size="sm", href=page("learn-quiz-result", "failed")))))
    S.add("exhausted", "Both attempts used: Start is gone, the server refuses another attempt (409) and her best score counts.", **YKW,
          main=body("—", action=f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "quiz"))}{btn("See your best attempt", "primary", href=page("learn-quiz-result", "last-attempt"))}</div>',
                    extra=alert("info", "No attempts left", "You’ve used both attempts. Your best score, 75%, is the one that counts.")))
    S.add("passed", "She passed on attempt 1 and has one attempt left: she can see her result or try again for a better score.", **YKW,
          main=body("2 of 2", action=f'<div class="form-actions">{btn("See your result", "", href=page("learn-quiz-result"))}{btn("Try again", "primary", icon_name="refresh", href=page("learn-quiz"))}</div>',
                    extra=alert("success", "You passed with 75%", "Your best score counts. Trying again can only raise it.")))
    S.add("locked", "Opened before every lesson of the module is done: 403, and what unlocks it.", **YKW,
          main=quiz_crumbs() + page_header(QUIZ) + locked_card("Finish Leading Like a Coach first", "The quiz unlocks when the lessons before it are done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The quiz loading.", **YKW, main=quiz_crumbs("Quiz") + page_header("Quiz") + skeleton_kpis(4) + skeleton_list(4, "Loading the quiz"))
    S.add("error", "The quiz failed to load.", **YKW, main=quiz_crumbs("Quiz") + page_header("Quiz") + failed("We couldn’t load this quiz"))
    S.add("not-found", "A draft quiz, one of a track she doesn’t follow, or another organization’s.", **YKW, main=quiz_crumbs("Quiz") + page_header("Quiz") + not_found("quiz"))


# ---------------------------------------------------------------- learn-quiz
@screen("learn-quiz", "page", "Taking a quiz", route="/learning/quizzes/:id/take", reqs=R_QUIZ,
        na={"empty": "A quiz is published only with a question (L2-073 criterion 6)."})
def learn_quiz(S):
    def body(n=2, answer=1, chip="saved", extra="", submit_busy=False, last=False, error="") -> str:
        head_ = (quiz_crumbs(f"Question {n}") + page_header(QUIZ, f"Attempt 1 of 2 · Question {n} of 4", actions=saved_chip(chip)))
        bar = progress(n, 4, "Quiz progress", show=f"Question {n} of 4")
        nav_ = btn("Back", "ghost", icon_name="arrow-left", disabled=n == 1)
        nxt = (btn("Submit answers", "primary", icon_name="check", busy=submit_busy, attrs=' aria-haspopup="dialog"', data_href=dialog("submit-quiz"))
               if last else btn("Next", "primary", icon_name="arrow-right"))
        q = card(quiz_question(n, answer, error=error), tid=f"q{n}")
        return head_ + extra + f'<div class="stack" style="max-width: var(--layout-reading-width, 48rem);">{bar}{q}<div class="form-actions">{nav_}{nxt}</div></div>'

    S.add("default", "Question 2 of 4, True / false: Sofía chose False and it saved. Back and Next move between questions.", **YKW, main=body(),
          notes=note("Every choice saves on the server with her place in the quiz; reloading or coming back later opens the same question with her answers.", "top: 5rem; right: 1rem;"))
    S.add("saving", "Question 3, multiple answer: she ticked two answers and the save is on its way.", **YKW, main=body(3, [0, 2], "saving"))
    S.add("saved", "Question 1, multiple choice, with her answer saved.", **YKW, main=body(1, 1, "saved"))
    S.add("offline", "The connection dropped: her answer stays on screen, the chip says it isn’t saved and it saves again when she’s back online.", **YKW,
          main=body(3, [0, 2], "offline", extra=alert("warning", "You’re offline", "Your answers are still here. We’ll save them when you’re back online. You can’t submit until then.")))
    S.add("short-answer", "Question 4, short answer: the last question, with Submit answers.", **YKW, main=body(4, "others", last=True))
    S.add("submitting", "Submit answers confirmed: the attempt is being scored and the button can’t be pressed twice.", **YKW, main=body(4, "others", last=True, submit_busy=True))
    S.add("submitted", "The attempt was already submitted (another tab): answers can’t change; she goes to her result.", **YKW,
          main=quiz_crumbs("Submitted") + page_header(QUIZ) + card(empty("This attempt is already submitted", "Answers can’t change once an attempt is submitted.",
                                                                          action=btn("Back to the quiz", "primary", href=page("learn-quiz-intro", "passed")), icon_name="lock"), cls="card--flush"))
    S.add("failed", "A save failed for a reason other than the connection: her answer stays on screen and the next change tries again. A failed submit shows in submit-quiz/failed.", **YKW,
          main=body(2, 1, "", extra=alert("danger", "We couldn’t save your answer", "Your answer is still here. Change it or move on to try again.")))
    S.add("loading", "The attempt loading.", **YKW, main=quiz_crumbs("Quiz") + page_header("Quiz") + skeleton_list(4, "Loading the question"))
    S.add("error", "The attempt failed to start.", **YKW, main=quiz_crumbs("Quiz") + page_header("Quiz") + failed("We couldn’t open the quiz"))
    S.add("exhausted", "Starting another attempt with none left: 409, and her best attempt.", **YKW,
          main=quiz_crumbs("Quiz") + page_header(QUIZ) + card(empty("No attempts left", "You’ve used every attempt. Your best score is the one that counts.",
                                                                     action=btn("Back to the quiz", "primary", href=page("learn-quiz-intro", "exhausted")), icon_name="lock"), cls="card--flush"))


# ---------------------------------------------------------------- learn-quiz-result
REVIEW_PASS = [  # (question, rows of (key, text, kind, note))
    (1, [("B", "Packed the kit bags for everyone", "correct", "Your answer · correct")]),
    (2, [("B", "False", "correct", "Your answer · correct")]),
    (3, [("A", "Help clear up after group", "correct", "Your answer · correct"), ("C", "Check on someone who is new", "missed", "Correct answer · you didn’t choose it")]),
    (4, [("", "others", "correct", "Your answer · correct")]),
]
REVIEW_FAIL = [
    (1, [("A", "Gave the team talk", "wrong", "Your answer · wrong"), ("B", "Packed the kit bags for everyone", "missed", "Correct answer")]),
    (2, [("B", "False", "correct", "Your answer · correct")]),
    (3, [("A", "Help clear up after group", "correct", "Your answer · correct"), ("B", "Wait until someone asks you", "wrong", "Your answer · wrong"), ("C", "Check on someone who is new", "missed", "Correct answer · you didn’t choose it")]),
    (4, [("", "others", "correct", "Your answer · correct")]),
]


def review(rows) -> str:
    out = []
    for n, opts in rows:
        text = Q_ITEMS[n - 1][0]
        right = all(k in ("correct",) for _k, _t, k, _n in opts)
        items = "".join(quiz_option(t, key or "✎", review=kind, note_=nt) for key, t, kind, nt in opts)
        out.append(f'<li class="quiz-review__item"><div class="cluster cluster--between"><h3 class="quiz-review__question">{n}. {esc(text)}</h3>'
                   f'{badge("Correct", "success") if right else badge("Not quite", "warning")}</div><ul class="stack quiz-review__options" style="gap: var(--space-2);">{items}</ul></li>')
    return card(f'<ol class="stack quiz-review">{"".join(out)}</ol>', title="Review your answers", tid="review")


@screen("learn-quiz-result", "page", "Quiz result", route="/learning/attempts/:id", reqs=R_QUIZ,
        na={"empty": "A result exists only for a submitted attempt."})
def learn_quiz_result(S):
    hdr = lambda sub="Attempt 1 of 2 · submitted Tue 27 Oct, 4:12 pm": quiz_crumbs("Result") + page_header(QUIZ, sub)

    def scores(score, passed, attempt="1 of 2", best="") -> str:
        return kpis([("Your score", score, "3 of 4 correct" if score == "75%" else "2 of 4 correct"),
                     ("Pass mark", "70%", "Passed" if passed else "Not passed yet"),
                     ("Attempt", attempt, best or f"Best score {score}")])

    def actions(retake=True, label="Try again") -> str:
        r = btn(label, "", icon_name="refresh", href=page("learn-quiz-intro", "retake")) if retake else ""
        return f'<div class="form-actions">{r}{btn("Back to the module", "primary", icon_name="arrow-right", href=page("learn-module", "quiz-passed"))}</div>'

    S.add("default", "Passed: 75% against a 70% pass mark, and the review marks each correct answer and the one she missed.", **YKW,
          main=hdr() + alert("success", "You passed, Sofía", "75% on your first attempt. Your best score counts, so trying again can only raise it.")
          + f'<div class="stack">{scores("75%", True)}{review(REVIEW_PASS)}{actions(label="Try for a better score")}</div>',
          toast_html=toast_region(toast("success", "Quiz submitted", "75% · passed")),
          notes=note("Scored on the server against the quiz’s answers; the attempt is locked once submitted.", "top: 5rem; right: 1rem;"))
    S.add("failed", "Not passed: 50%, one attempt left; the review shows what to look at again and Try again starts attempt 2.", **YKW,
          main=hdr() + alert("warning", "Not this time", "You got 50%. You need 70% to pass and you have 1 attempt left.")
          + f'<div class="stack">{scores("50%", False)}{review(REVIEW_FAIL)}{actions()}</div>')
    S.add("last-attempt", "Both attempts used: no Try again; her best attempt (75%) counts.", **YKW,
          main=hdr("Attempt 2 of 2 · submitted Tue 27 Oct, 4:30 pm") + alert("info", "No attempts left", "You’ve used both attempts. Your best score, 75%, is the one that counts.")
          + f'<div class="stack">{scores("75%", True, "2 of 2", "Best score 75%")}{review(REVIEW_PASS)}{actions(retake=False)}</div>')
    S.add("score-only", "A quiz set to show the score only: the score and pass, no answers.", **YKW,
          main=hdr() + alert("success", "You passed, Sofía", "75% on your first attempt.")
          + f'<div class="stack">{scores("75%", True)}{card("<p class=\"text-muted\">This quiz shows your score only. Your mentor can talk the answers through with you.</p>", title="Review your answers", tid="review")}{actions(label="Try for a better score")}</div>')
    S.add("awaiting-approval", "A quiz whose scores a mentor approves before they count: submitted, the score held back until Daniel approves it.", **YKW,
          main=hdr() + f'<div class="stack">{card(empty("Waiting for your mentor", "Your answers are in. Your mentor checks this quiz before the score counts. You’ll see it here when they have.", icon_name="clock"), cls="card--flush")}{actions(retake=False)}</div>',
          toast_html=toast_region(toast("success", "Quiz submitted", "Waiting for your mentor")))
    S.add("loading", "The result loading.", **YKW, main=quiz_crumbs("Result") + page_header("Quiz result") + skeleton_kpis(3) + skeleton_list(4, "Loading your answers"))
    S.add("error", "The result failed to load.", **YKW, main=quiz_crumbs("Result") + page_header("Quiz result") + failed("We couldn’t load your result"))
    S.add("not-found", "Another youth’s attempt, one still in progress, or another organization’s: not found.", **YKW,
          main=quiz_crumbs("Result") + page_header("Quiz result") + card(empty("We can’t find that result", "It may still be in progress, or it isn’t yours.",
                                                                           action=btn("Back to Learning", "", href=page("learn-home")), icon_name="search"), cls="card--flush"))


# ================================================================ Submit assignments (prompt 62, L2-077 to L2-079)
# Ported from Waypoint's assignment, submit work and submission status mocks. The assignment is the one Marisol built in prompt 60:
# Serve someone this week, after Pick Up the Towel, a text reflection and a photo, a 25-point rubric, due Thu 19 Nov with a 2-day
# grace period and late work allowed. Daniel Osei is Sofía’s mentor and reviews it; his review itself is prompt 63.
R_SUBMIT = ["L2-077", "L2-078", "L2-079", "L2-068", R_LEARN]
ASSIGN = "Serve someone this week"
A_BRIEF = ("This week, put Pick Up the Towel into practice. Choose one person to serve without being asked, at home, at school or in your cohort. "
           "Afterwards, tell us what you did, how it felt and what you noticed. A photo or a short note is enough.")
A_RUBRIC = [("Chose someone and served without being asked", 10), ("Described what they did and how it felt", 10), ("Named one thing they noticed", 5)]
REFLECTION = ("On Tuesday I stayed after tutoring to stack the chairs and wipe the tables so Jaylen could lock up on time. Nobody asked me. "
              "It felt small, but he noticed and said thanks.")
REVISED = REFLECTION + " What I noticed: the room is always tidy because someone stays behind, and I never saw who it was before."
NOTE_REVISE = "“Great story, Sofía! Can you add a line about one thing you noticed? Then this is a full pass.”"
NOTE_ACCEPT = "“This is exactly it, Sofía. Serving is noticing what needs doing. Proud of you.”"
DANIEL = STAFF["daniel"]


def assign_crumbs(cur: str = ASSIGN) -> str:
    return breadcrumb([("Learning", page("learn-home")), ("Leading by Serving", page("learn-module", "assignment"))], cur)


def rubric_preview() -> str:
    rows = [[esc(d), f"{p} points"] for d, p in A_RUBRIC]
    return card(table("How it’s graded", ["Criterion", "Points"], rows) + '<p class="text-muted">Total possible: <strong>25 points</strong></p>',
                title="How it’s graded", tid="rubric")


def due_facts(due: str = "Thu 19 Nov · 14 days left", types: str = "Text + photo") -> str:
    return kpis([("Due", due.split(" · ")[0], due.split(" · ")[1] if " · " in due else ""), ("Submit", types, "A reflection and a JPG or PNG photo"),
                 ("Points", "25", "Reviewed by Daniel Osei")])


# ---------------------------------------------------------------- learn-assignment
@screen("learn-assignment", "page", "Assignment", route="/learning/assignments/:id", reqs=R_SUBMIT,
        na={"empty": "An assignment is published only with a task and a rubric criterion (L2-074 criterion 5), so youth never meet an empty one."})
def learn_assignment(S):
    hdr = lambda st="Not started", kind="": assign_crumbs() + page_header(f'{ASSIGN} {badge(st, kind)}', "Leading by Serving · Assignment · after Pick Up the Towel")
    task = card(f'<p>{esc(A_BRIEF)}</p>', title="The task", tid="task")
    mentor = card(f'<div class="cluster">{avatar(DANIEL, "md")}<div><strong>Daniel Osei</strong><div class="text-muted">Your mentor reviews what you send and may ask for a revision.</div></div></div>',
                  title="Who reviews it", tid="mentor")

    def body(st="Not started", kind="", extra="", act=None, due="Thu 19 Nov · 14 days left") -> str:
        a = act if act is not None else f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "assignment"))}{btn("Start submission", "primary", icon_name="arrow-right", href=page("learn-submit"))}</div>'
        return hdr(st, kind) + extra + f'<div class="split"><div class="stack">{due_facts(due)}{task}{a}</div><div class="stack">{rubric_preview()}{mentor}</div></div>'

    S.add("default", "Sofía opens Serve someone this week: the task, when it’s due, how to submit, the rubric with its points and who reviews it.", **YKW, main=body(),
          notes=note("The brief, due rules, ways to submit and rubric come from the server. Mentor-only notes are never sent.", "top: 5rem; right: 1rem;"))
    S.add("draft", "She started earlier and left: a draft saved on this device waits, and Continue your draft opens it.", **YKW,
          main=body(extra=alert("info", "You have a draft", "Saved on this device on Thu 5 Nov, 3:40 pm."),
                    act=f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "assignment"))}{btn("Continue your draft", "primary", icon_name="arrow-right", href=page("learn-submit", "restored"))}</div>'))
    S.add("submitted", "Already submitted: the status shows and See your submission replaces Start.", **YKW,
          main=body("In review", "info", act=f'<div class="form-actions">{btn("Back to the module", "ghost", href=page("learn-module", "assignment"))}{btn("See your submission", "primary", icon_name="arrow-right", href=page("learn-submission", "in-review"))}</div>'))
    S.add("needs-revision", "Daniel asked for a revision: the page says so and Revise your submission opens it.", **YKW,
          main=body("Needs revision", "warning", extra=alert("warning", "Daniel Osei asked for a revision", "Read the note, then update your work and send it again."),
                    act=f'<div class="form-actions">{btn("See the note", "ghost", href=page("learn-submission", "needs-revision"))}{btn("Revise your submission", "primary", icon_name="edit", href=page("learn-submit", "revise"))}</div>'))
    S.add("late", "Past the due date but inside what late work allows: she can still submit and it is marked late for Daniel.", **YKW,
          main=body(due="Thu 19 Nov · 1 day late", extra=alert("warning", "This is past its due date", "You can still submit. Daniel Osei will see it was late.")))
    S.add("closed", "Past the due date and the grace period, and late work isn’t accepted: Start is gone and the server refuses a submission (409).", **YKW,
          main=body("Closed", "", due="Thu 19 Nov · closed", extra=alert("info", "Submissions are closed", "The due date and grace period have passed. Talk to Daniel Osei if you need more time."),
                    act=f'<div class="form-actions">{btn("Back to the module", "primary", href=page("learn-module", "assignment"))}</div>'))
    S.add("locked", "Opened before Pick Up the Towel is done: 403, and what unlocks it.", **YKW,
          main=assign_crumbs() + page_header(ASSIGN) + locked_card("Finish Pick Up the Towel first", "This assignment unlocks when Pick Up the Towel is done.", "Back to Learning", page("learn-home")))
    S.add("loading", "The assignment loading.", **YKW, main=assign_crumbs("Assignment") + page_header("Assignment") + skeleton_kpis(3) + f'<div class="split">{skeleton_list(3, "Loading the task")}{skeleton_list(3, "Loading the rubric")}</div>')
    S.add("error", "The assignment failed to load.", **YKW, main=assign_crumbs("Assignment") + page_header("Assignment") + failed("We couldn’t load this assignment"))
    S.add("not-found", "A draft assignment, one of a track she doesn’t follow, or another organization’s.", **YKW, main=assign_crumbs("Assignment") + page_header("Assignment") + not_found("assignment"))


# ---------------------------------------------------------------- learn-submit
def photo_zone(err: str = "", busy: bool = False) -> str:
    inv = ' aria-invalid="true" aria-describedby="photo-error"' if err else ""
    zone = (f'<div class="dropzone" role="group" aria-labelledby="dz-title"{inv}{" aria-busy=\"true\"" if busy else ""}><span class="icon-tile" aria-hidden="true">{icon("upload")}</span>'
            f'<h3 class="dropzone__title" id="dz-title">Add your photo</h3><p class="dropzone__text">JPG or PNG · up to 10 MB. No faces needed: the moment or the result is perfect.</p>'
            f'<label class="btn btn--primary" for="photo">{icon("file")}Choose photo<input class="visually-hidden" id="photo" type="file" accept="image/jpeg,image/png"></label></div>')
    e = f'<div class="field__error" id="photo-error">{esc(err)}</div>' if err else ""
    return f'<div class="field"><span class="field__label">Your photo</span>{zone}{e}</div>'


def photo_chosen(name: str = "stacked-chairs.jpg", size: str = "1.2 MB", kept: bool = False) -> str:
    row = list_item(name, f"Photo · {size}{' · from your last submission' if kept else ''}", lead=f'<span class="icon-tile" aria-hidden="true">{icon("file")}</span>',
                    end=btn("Remove", "ghost", size="sm", aria_label=f"Remove the photo {name}"))
    return f'<div class="field"><span class="field__label">Your photo</span>{ul_list([row], card=False, label="Your file")}</div>'


def submit_form(*, text: str = REFLECTION, photo: str = "", err=None, attest: bool = True, busy: bool = False, primary: str = "Submit") -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    reflection = textarea("reflection", "Your reflection", value=text, rows=6, error=err.get("reflection", ""), count=f"{len(text):,} / 5,000",
                          help_="3 to 5 sentences is plenty. Be honest: this is between you and your mentor.")
    att = choice("attest", "This is my own work and it reflects something I really did.", type_="checkbox", checked=attest and "attest" not in err, invalid="attest" in err)
    att_e = f'<div class="field__error" id="attest-error">{esc(err["attest"])}</div>' if "attest" in err else ""
    actions = (f'<div class="form-actions">{btn("Save draft", "ghost", icon_name="check")}'
               f'{btn(primary, "primary", icon_name="send", busy=busy, attrs=" aria-haspopup=\"dialog\"", data_href=dialog("submit-assignment"))}</div>')
    return (f'<form class="stack" action="#" method="post" novalidate>{summary}'
            + card(f'<div class="stack">{reflection}{photo or photo_chosen()}</div>', title="Your work", tid="work")
            + card(f'<div class="stack" id="attest">{att}{att_e}</div>', title="Before you send it", tid="before")
            + f'<p class="text-muted">Once you submit, Daniel Osei reviews it. You can’t change it while it’s being reviewed, but they can ask for a revision.</p>{actions}</form>')


@screen("learn-submit", "page", "Submit an assignment", route="/learning/assignments/:id/submit", reqs=R_SUBMIT,
        na={"empty": "The form always shows the ways this assignment accepts; a blank form is the invalid state when sent."})
def learn_submit(S):
    hdr = lambda sub="Add your reflection and photo, then send it to Daniel Osei.": assign_crumbs("Submit") + page_header(ASSIGN, sub)
    S.add("default", "Sofía writes her reflection, adds a photo and ticks that it is her own work, ready to submit.", **YKW, main=hdr() + submit_form(),
          notes=note("Leaving with unsaved changes asks first (unsaved-changes). Save draft keeps the text on this device; the photo is chosen again.", "top: 5rem; right: 1rem;"))
    S.add("restored", "She comes back: her draft text is restored, and the photo is chosen again.", **YKW,
          main=hdr() + alert("info", "We restored your draft", "Saved on this device on Thu 5 Nov, 3:40 pm. Add your photo again before you submit.", actions=btn("Start over", "ghost", size="sm"))
          + submit_form(photo=photo_zone()))
    S.add("draft-saved", "Save draft: a toast confirms the draft is on this device.", **YKW, main=hdr() + submit_form(),
          toast_html=toast_region(toast("success", "Draft saved", "On this device. Your photo isn’t saved in a draft.")))
    S.add("invalid", "Submit with no reflection and the box unticked: errors beside the fields and in a summary, focus on the summary.", **YKW,
          main=hdr() + submit_form(text="", photo=photo_zone(), err={"reflection": "Write your reflection.", "attest": "Confirm this is your own work."}))
    S.add("file-invalid", "She chose a PDF where a photo is asked for: it isn’t attached and the field says what fits.", **YKW,
          main=hdr() + alert("danger", "That file can’t be used", "“weekly-schedule.pdf” was not attached. Choose a JPG or PNG photo of up to 10 MB.")
          + submit_form(photo=photo_zone("Choose a JPG or PNG photo of up to 10 MB.")))
    S.add("busy", "Submitting: the photo uploads with her work and the button cannot be pressed twice.", **YKW, main=hdr() + submit_form(busy=True))
    S.add("failed", "The submit failed: her work stays on screen to try again.", **YKW,
          main=hdr() + alert("danger", "We couldn’t send your work", "Everything is still here. Check your connection and try again.") + submit_form())
    S.add("revise", "Revising after Daniel’s note: his note above the form, her last reflection to edit and her photo kept unless she replaces it.", **YKW,
          main=hdr("Update your work and send it to Daniel Osei again.")
          + alert("warning", "Note from Daniel Osei", NOTE_REVISE)
          + submit_form(text=REVISED, photo=photo_chosen(kept=True), primary="Resubmit"))
    S.add("already-submitted", "Submitting again from another tab: 409; her work is already with Daniel.", **YKW,
          main=assign_crumbs("Submit") + page_header(ASSIGN) + card(empty("You’ve already submitted this", "Your work is with Daniel Osei. You can change it only if they ask for a revision.",
                                                                          action=btn("See your submission", "primary", href=page("learn-submission", "in-review")), icon_name="lock"), cls="card--flush"))
    S.add("closed", "Submissions closed while she was writing: 409, and nothing was sent.", **YKW,
          main=assign_crumbs("Submit") + page_header(ASSIGN) + card(empty("Submissions are closed", "The due date and grace period have passed. Talk to Daniel Osei if you need more time.",
                                                                          action=btn("Back to the assignment", "primary", href=page("learn-assignment", "closed")), icon_name="clock"), cls="card--flush"))
    S.add("loading", "The form loading.", **YKW, main=assign_crumbs("Submit") + page_header("Submit") + skeleton_list(4, "Loading the form"))
    S.add("error", "The form failed to load.", **YKW, main=assign_crumbs("Submit") + page_header("Submit") + failed("We couldn’t load this assignment"))


# ---------------------------------------------------------------- learn-submission
def history(rows) -> str:
    items = "".join(f'<li>{avatar(who)}<div class="feed__body"><strong>{esc(who["name"])}</strong> {esc(text)}<div class="feed__meta">{esc(when)}</div></div></li>' for who, text, when in rows)
    return card(f'<ul class="feed" aria-label="What happened">{items}</ul>', title="What happened", tid="history")


def what_you_sent(text: str = REFLECTION, late: bool = False) -> str:
    photo = list_item("stacked-chairs.jpg", "Photo · 1.2 MB", lead=f'<span class="icon-tile" aria-hidden="true">{icon("file")}</span>',
                      end=btn("Open", "ghost", size="sm", aria_label="Open the photo stacked-chairs.jpg"))
    lt = badge("Late", "warning") if late else ""
    return card(f'<div class="stack">{lt}<div class="reading">{esc(text)}</div>{ul_list([photo], card=False, label="Attached")}</div>', title="What you sent", tid="sent")


SENT = (SOFIA, "submitted it", "Tue 3 Nov, 4:12 pm")
REVIEWING = (DANIEL, "started reviewing", "Wed 4 Nov, 9:30 am")
ASKED = (DANIEL, "asked for a revision", "Wed 4 Nov, 9:45 am")
RESENT = (SOFIA, "resubmitted it", "Wed 4 Nov, 6:05 pm")
ACCEPTED = (DANIEL, "accepted it · 25 of 25 points", "Thu 5 Nov, 10:20 am")


@screen("learn-submission", "page", "Your submission", route="/learning/submissions/:id", reqs=R_SUBMIT,
        na={"empty": "A submission page exists only once she has submitted."})
def learn_submission(S):
    hdr = lambda st, kind="", sub="Submitted Tue 3 Nov, 4:12 pm": assign_crumbs("Your submission") + page_header(f'{ASSIGN} {badge(st, kind)}', sub)
    back = btn("Back to the module", "ghost", href=page("learn-module", "assignment"))

    def layout(rows, sent=REFLECTION, extra="", act="", late=False) -> str:
        return extra + f'<div class="split"><div class="stack">{what_you_sent(sent, late)}{act}</div><div class="stack">{history(rows)}</div></div>'

    S.add("default", "Just submitted: Submitted, a copy of what she sent and what happens next.", **YKW,
          main=hdr("Submitted", "info") + layout([SENT], extra=alert("success", "It’s in", "Daniel Osei reviews it next. You’ll see the feedback here."), act=f'<div class="form-actions">{back}</div>'),
          toast_html=toast_region(toast("success", "Submitted", ASSIGN)),
          notes=note("Read only: she can’t change it while it’s with Daniel. The status changes when he reviews it (prompt 63).", "top: 5rem; right: 1rem;"))
    S.add("in-review", "Daniel has started reviewing: In review, still read only.", **YKW,
          main=hdr("In review", "info") + layout([SENT, REVIEWING], extra=alert("info", "Daniel Osei is reviewing your work", "Mentors usually reply within a day or two."), act=f'<div class="form-actions">{back}</div>'))
    S.add("needs-revision", "Daniel asked for a revision: his note, what she sent and Revise your submission.", **YKW,
          main=hdr("Needs revision", "warning") + layout([SENT, REVIEWING, ASKED], extra=alert("warning", "Note from Daniel Osei", NOTE_REVISE),
                                                        act=f'<div class="form-actions">{back}{btn("Revise your submission", "primary", icon_name="edit", href=page("learn-submit", "revise"))}</div>'))
    S.add("resubmitted", "Resubmitted: back to Submitted with her revised work, and the history keeps every step.", **YKW,
          main=hdr("Submitted", "info", "Resubmitted Wed 4 Nov, 6:05 pm") + layout([SENT, REVIEWING, ASKED, RESENT], sent=REVISED,
                                                                                    extra=alert("success", "Sent again", "Daniel reviews your revised work next."), act=f'<div class="form-actions">{back}</div>'),
          toast_html=toast_region(toast("success", "Resubmitted", ASSIGN)))
    S.add("accepted", "Accepted: the points awarded, Daniel’s comment and the full history.", **YKW,
          main=hdr("Accepted", "success", "Resubmitted Wed 4 Nov, 6:05 pm") + layout([SENT, REVIEWING, ASKED, RESENT, ACCEPTED], sent=REVISED,
                                                                                      extra=alert("success", "Accepted by Daniel Osei", NOTE_ACCEPT) + kpis([("Points", "25 / 25", "Every criterion met")]),
                                                                                      act=f'<div class="form-actions">{btn("Back to the module", "primary", href=page("learn-module", "assignment"))}</div>'))
    S.add("late", "Submitted after the due date: marked Late, as Daniel sees it.", **YKW,
          main=hdr("Submitted", "info", "Submitted Fri 20 Nov, 8:15 pm · 1 day late") + layout([(SOFIA, "submitted it late", "Fri 20 Nov, 8:15 pm")], late=True, act=f'<div class="form-actions">{back}</div>'))
    S.add("loading", "The submission loading.", **YKW, main=assign_crumbs("Your submission") + page_header("Your submission") + f'<div class="split">{skeleton_list(3, "Loading what you sent")}{skeleton_list(3, "Loading the history")}</div>')
    S.add("error", "The submission failed to load.", **YKW, main=assign_crumbs("Your submission") + page_header("Your submission") + failed("We couldn’t load your submission"))
    S.add("not-found", "Another youth’s submission or another organization’s: not found.", **YKW,
          main=assign_crumbs("Your submission") + page_header("Your submission") + card(empty("We can’t find that submission", "It may not be yours, or it was never sent.",
                                                                                         action=btn("Back to Learning", "", href=page("learn-home")), icon_name="search"), cls="card--flush"))
