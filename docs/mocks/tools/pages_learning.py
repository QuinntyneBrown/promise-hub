"""Complete lessons (prompt 57, L2-068 to L2-070): a youth's Learning home, their tracks, a module, reading and scripture
lessons, coding lessons and coding projects. Ported from Waypoint's youth home, curriculum, module, lesson, Bible lesson,
coding lesson and coding project mocks. Youth see only published content of the tracks their programs follow; a module
unlocks when its prerequisite is done and a lesson when the one before it is done, and the server enforces both."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN = "L1-023"
SOFIA = YOUTH["sofia"]
YKW = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning"])
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
@screen("learn-home", "page", "Learning", route="/learning", reqs=["L2-068", "L2-069", R_LEARN, "L1-002"])
def learn_home(S):
    hdr = page_header("Learning", "Hi, Sofía. You’re 4 of 9 lessons in.")

    def body(extra: str = "") -> str:
        cont = card(f'<div class="stack"><div><p class="text-body-lg"><strong>Last in Line</strong></p><p class="text-muted">Leading by Serving · Mark 10:35–45 · 15 min</p></div>'
                    f'{progress(1, 3, "Leading by Serving", show="1 of 3 lessons")}'
                    f'<div>{btn("Continue lesson", "primary", icon_name="arrow-right", href=page("learn-lesson-scripture"))}</div></div>', title="Continue where you left off", tid="continue")
        overall = card(progress(4, 9, "Your lessons", show="4 of 9 lessons"), title="Your progress", tid="progress")
        tracks = card(ul_list([
            list_item("Leadership Foundations", "4 of 7 lessons · After‑School Tutoring", href=page("learn-track"), end=badge("In progress", "info")),
            list_item("Digital Skills", "0 of 2 lessons · Saturday Sports", href=page("learn-track", "coding"), end=badge("Not started")),
        ], card=False, label="Your tracks"), title="Your tracks", tid="tracks", cls="card--flush")
        return hdr + extra + f'<div class="split"><div class="stack">{cont}{overall}</div><div class="stack">{tracks}</div></div>'

    S.add("default", "Sofía opens Learning: where she left off, her overall progress and the two tracks her programs follow.", **YKW, main=body(),
          notes=note("Everything here comes from the server: only published lessons of tracks her programs follow, with progress saved on the server.", "top: 5rem; right: 1rem;"))
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

    prog = card(f'<div class="stack">{progress(1, 3, "Leading by Serving", show="1 of 3 lessons")}{anchor}'
                f'<div>{btn("Continue: Last in Line", "primary", icon_name="arrow-right", href=page("learn-lesson-scripture"))}</div></div>', title="Module progress", tid="module-progress")
    S.add("default", "Sofía opens Leading by Serving: one lesson done, the next ready, the last locked until the one before it is done.", **YKW,
          main=hdr + f'<div class="split"><div class="stack">{prog}</div><div class="stack">{lessons()}</div></div>')
    done_rows = [(t, m, "Done", tg or "learn-lesson") for t, m, _s, tg in LESSONS]
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
        reflect = card('<p class="text-muted">Who picked up the towel for you this week? Hold that thought for your reflection.</p>', title="Think it over", tid="reflect")
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
