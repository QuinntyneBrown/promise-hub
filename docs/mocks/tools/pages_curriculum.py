"""Curriculum authoring (prompt 56, L2-066 and L2-067): tracks, their ordered modules and lessons, draft and publish, a lesson
video through PromiseHub file storage, and the cohorts (programs) that follow a track. Ported from Waypoint's curriculum
builder, module editor and lesson editor mocks. Only admins and program directors author; the Learning module gates it all.
Nothing here is ever shown to youth: they read published lessons only (prompt 57)."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN = "L1-023"
MARISOL = STAFF["marisol"]
KW = dict(nav="curriculum-tracks", user=MARISOL)

STATUS_KIND = {"Published": "success", "In review": "info", "Draft": ""}

# Leadership Foundations is followed by After‑School Tutoring and Saturday Sports; Digital Skills is still a draft.
LEADERSHIP = [
    ("Knowing Yourself", 3, "Published"),
    ("Leading by Serving", 3, "In review"),
    ("Speaking Up", 2, "Draft"),
]
DIGITAL = [("Staying Safe Online", 0, "Draft")]
LESSONS = [
    ("Pick Up the Towel", "12 min", "Published"),
    ("Last in Line", "15 min", "Draft"),
    ("Leading Like a Coach", "18 min", "Draft"),
]
BODY = ("The night before the big game, the team captain stayed behind to pack the kit bags while everyone else went home. "
        "Nobody asked her to. Nobody saw it, either, until the coach found the bags lined up at the door the next morning.\n\n"
        "Leading isn’t a title. It’s noticing what needs doing and doing it, especially when nobody is watching.\n\n"
        "Talk it through: where in your week could you “pick up the towel” for someone, at home, at school or in your cohort?")
NOTES = ("Open with the story, then ask who has done something like this. Watch for youth who find it hard to accept help. "
         "Close with each person naming one act of service before next week; mentors follow up at check-in.")


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def forbidden() -> str:
    return card(empty("Program directors write the curriculum", "Ask Marisol Delgado or Tom Nguyen.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush")


def move_btns(name: str, first: bool, last: bool) -> str:
    up = icon_btn("arrow-up", f"Move {name} up", attrs=" disabled" if first else "")
    down = icon_btn("arrow-down", f"Move {name} down", attrs=" disabled" if last else "")
    return f'<span class="cluster cluster--snug">{up}{down}</span>'


def module_rows(rows, *, link: bool = True) -> str:
    items = []
    for i, (name, lessons, st) in enumerate(rows):
        meta = f'{lessons} lesson{"" if lessons == 1 else "s"}' if lessons else "No lessons yet"
        items.append(list_item(f"{i + 1}. {esc(name)}", meta, href=page("curriculum-module") if link else "",
                               end=badge(st, STATUS_KIND[st]) + move_btns(name, i == 0, i == len(rows) - 1)))
    return ul_list(items, card=False, label="Modules, in order")


def track_card(name: str, key: str, desc: str, st: str, rows, cohorts: str) -> str:
    head = (f'<div class="cluster cluster--between"><div><h2 class="card__title" id="t-{key}">{esc(name)} {badge(st, STATUS_KIND[st])}</h2>'
            f'<p class="text-muted">{esc(desc)}</p><p class="text-caption">Key: {key}</p><p class="text-caption">Followed by {cohorts}</p></div>'
            f'<div class="cluster cluster--snug">{btn("Cohorts", "", size="sm", icon_name="users", attrs=" aria-haspopup=\"dialog\"", aria_label=f"Cohorts following {name}", data_href=dialog("track-cohorts"))}'
            f'{btn("Publish" if st == "Draft" else "Status", "", size="sm", attrs=" aria-haspopup=\"dialog\"", aria_label=("Publish " if st == "Draft" else "Status of ") + name, data_href=dialog("curriculum-status", "track"))}</div></div>')
    body = module_rows(rows) if rows else '<p class="text-muted">No modules yet.</p>'
    foot = btn("New module", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', aria_label=f"New module in {name}", data_href=dialog("new-module"))
    return f'<section class="card stack" aria-labelledby="t-{key}">{head}{body}<p class="card__footer">{foot}</p></section>'


# ---------------------------------------------------------------- curriculum-tracks
@screen("curriculum-tracks", "page", "Curriculum", route="/curriculum", reqs=["L2-066", "L2-007", R_LEARN])
def curriculum_tracks(S):
    hdr = page_header("Curriculum", "Tracks, modules and lessons your youth work through.",
                      btn("Badges", "", icon_name="award", href=page("curriculum-badge")) + btn("Progression", "", icon_name="list", href=page("curriculum-progression"))
                      + btn("New track", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-track")))
    numbers = kpis([("Tracks", "2", "1 published"), ("Modules", "4", "1 published"), ("Lessons", "8", "")])
    tracks = (track_card("Leadership Foundations", "leadership", "Growing as a leader at home, at school and in the cohort.", "Published", LEADERSHIP, "After‑School Tutoring and Saturday Sports")
              + track_card("Digital Skills", "digital", "Using technology safely and creatively.", "Draft", DIGITAL, "no cohort yet"))
    S.add("default", "Marisol opens Curriculum: each track with its modules in youth-facing order, their status, and the cohorts that follow it.", **KW,
          main=hdr + numbers + f'<div class="stack">{tracks}</div>',
          notes=note("Up and down buttons reorder modules; the order is saved on the server and is the order youth see. Youth never see a draft or a module in review.", "top: 5rem; right: 1rem;"))
    S.add("created", "Marisol created Digital Skills: it appears as a draft with no modules and a toast confirms.", **KW,
          main=hdr + numbers.replace(">2<", ">2<") + f'<div class="stack">{tracks}</div>',
          toast_html=toast_region(toast("success", "Track created", "Digital Skills is a draft until you publish it.")))
    S.add("loading", "Curriculum loading: skeletons in the same layout.", **KW, main=hdr + skeleton_kpis(3) + skeleton_list(3, "Loading tracks"))
    S.add("empty", "No tracks yet: one action, New track.", **KW,
          main=page_header("Curriculum", "Tracks, modules and lessons your youth work through.")
          + card(empty("No tracks yet", "A track is a pathway youth follow, such as Leadership Foundations. Create one, add modules and lessons, then link it to a cohort.",
                       action=btn("New track", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-track")), icon_name="list"), cls="card--flush"))
    S.add("error", "Curriculum failed to load; the shell stays.", **KW, main=hdr + failed("We couldn’t load the curriculum"))
    S.add("forbidden", "A site lead opening Curriculum: only admins and program directors author; the server answers 403.", nav="today", user=STAFF["jaylen"],
          main=page_header("Curriculum", "") + forbidden())


# ---------------------------------------------------------------- curriculum-module
@screen("curriculum-module", "page", "Module editor", route="/curriculum/modules/:id", reqs=["L2-066", "L2-067", "L2-073", "L2-074", R_LEARN])
def curriculum_module(S):
    crumbs = lambda cur: breadcrumb([("Curriculum", page("curriculum-tracks")), ("Leadership Foundations", page("curriculum-tracks"))], cur)
    hdr = lambda st="In review": crumbs("Leading by Serving") + page_header(f'Leading by Serving {badge(st, STATUS_KIND[st])}', "Module 2 of 3 in Leadership Foundations",
                                                                             btn("Status", "", attrs=' aria-haspopup="dialog"', data_href=dialog("curriculum-status")))

    def details(err=None, failed_=False, busy=False):
        err = err or {}
        summary = form_summary([("name", err["name"])]) if err else ""
        fail = alert("danger", "We couldn’t save the module", "Your changes are still here. Try again.") if failed_ else ""
        body = (summary + fail
                + field("name", "Module name", value="" if err else "Leading by Serving", required=True, error=err.get("name", ""))
                + textarea("description", "Description", value="Leading isn’t a title. In this module youth explore what it means to put others first and use their influence to build people up.",
                           rows=3, optional=True, help_="Shown to youth on the module cover.")
                + select("prerequisite", "Prerequisite", ["None", "Knowing Yourself"], selected="Knowing Yourself", help_="Youth finish this module first.")
                + textarea("anchor", "Anchor passage", value="“The best leaders are the ones who carry the bags.”", rows=2, optional=True, help_="A quote or reading the module keeps coming back to."))
        actions = f'<div class="form-actions">{btn("Cancel", "ghost", href=page("curriculum-tracks"))}{btn("Save module", "primary", type_="submit", busy=busy)}</div>'
        return f'<form class="stack" action="#" method="post" novalidate>{card(f"<div class=\"stack\">{body}</div>", title="Details", tid="details")}{actions}</form>'

    def lessons(rows=LESSONS):
        if not rows:
            return card(empty("No lessons yet", "Add the first lesson youth will read in this module.", action=btn("Add lesson", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-lesson")), icon_name="list"),
                        title="Lessons", tid="lessons", cls="card--flush")
        items = [list_item(f"{i + 1}. {esc(t)}", f"{m} · {st}", href=page("curriculum-lesson"), end=badge(st, STATUS_KIND[st]) + move_btns(t, i == 0, i == len(rows) - 1))
                 for i, (t, m, st) in enumerate(rows)]
        return card(ul_list(items, card=False, label="Lessons, in order"), title="Lessons", tid="lessons", cls="card--flush",
                    footer=btn("Add lesson", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-lesson")))

    visibility = card(facts([("Status", "In review"), ("Track", "Leadership Foundations"), ("Cohorts", "After‑School Tutoring, Saturday Sports")]), title="Visibility", tid="visibility")

    def assessments(empty_=False):
        foot = (btn("New quiz", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-assessment"))
                + btn("New assignment", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-assessment", "assignment")))
        if empty_:
            return card(empty("No quizzes or assignments yet", "Check what youth learned with a quiz, or set them a task to do and submit.", icon_name="clipboard"),
                        title="Quizzes and assignments", tid="assessments", cls="card--flush", footer=foot)
        items = [list_item("Leading by Serving quiz", "Quiz · The whole module · 4 questions", href=page("curriculum-quiz"), end=badge("Draft")),
                 list_item("Serve someone this week", "Assignment · After Pick Up the Towel · 25 points", href=page("curriculum-assignment"), end=badge("Published", "success"))]
        return card(ul_list(items, card=False, label="Quizzes and assignments"), title="Quizzes and assignments", tid="assessments", cls="card--flush", footer=foot)

    def layout(form, rows=LESSONS, st="In review"):
        return hdr(st) + f'<div class="split"><div class="stack">{form}</div><div class="stack">{lessons(rows)}{assessments(not rows)}{visibility}</div></div>'

    S.add("default", "Marisol opens Leading by Serving: its details, its three lessons in order with their status, and who will see it once published.", **KW, main=layout(details()))
    S.add("empty", "A new module with no lessons yet: the lessons card offers Add lesson.", **KW,
          main=crumbs("Speaking Up") + page_header(f'Speaking Up {badge("Draft")}', "Module 3 of 3 in Leadership Foundations", btn("Status", "", attrs=' aria-haspopup="dialog"', data_href=dialog("curriculum-status")))
          + f'<div class="split"><div class="stack">{details().replace("Leading by Serving", "Speaking Up")}</div><div class="stack">{lessons([])}{assessments(True)}{visibility}</div></div>')
    S.add("invalid", "Saving with no name: the error beside the field and in the summary, focus on the summary.", **KW, main=layout(details({"name": "Give the module a name."})))
    S.add("busy", "Saving: the button is busy and the form cannot be sent twice.", **KW, main=layout(details(busy=True)))
    S.add("saved", "Saved: a toast confirms and the page stays.", **KW, main=layout(details()), toast_html=toast_region(toast("success", "Module saved", "Leading by Serving")))
    S.add("failed", "The save failed: the inputs are kept and an alert offers a retry.", **KW, main=layout(details(failed_=True)))
    S.add("loading", "The module loading.", **KW, main=crumbs("Module") + page_header("Module") + f'<div class="split">{skeleton_list(4, "Loading the module")}{skeleton_list(3, "Loading lessons")}</div>')
    S.add("error", "The module failed to load.", **KW, main=crumbs("Module") + page_header("Module") + failed("We couldn’t load this module"))
    S.add("not-found", "A module of another organization, or an unknown address: not found.", **KW,
          main=crumbs("Module") + page_header("Module") + card(empty("We can’t find that module", "It may have been removed, or belong to another organization.", action=btn("Back to Curriculum", "", href=page("curriculum-tracks")), icon_name="search"), cls="card--flush"))
    S.add("forbidden", "A site lead opening a module directly: 403.", nav="today", user=STAFF["jaylen"], main=page_header("Module") + forbidden())


# ---------------------------------------------------------------- curriculum-lesson
VIDEO_HELP = "MP4, MOV or WebM, up to 1 GB. Youth can watch it once the lesson is published."


@screen("curriculum-lesson", "page", "Lesson editor", route="/curriculum/lessons/:id", reqs=["L2-067", "L2-031", R_LEARN],
        na={"empty": "A lesson always has a title; empty fields read as empty in place."})
def curriculum_lesson(S):
    crumbs = lambda cur: breadcrumb([("Curriculum", page("curriculum-tracks")), ("Leading by Serving", page("curriculum-module"))], cur)
    hdr = lambda st="Published": crumbs("Pick Up the Towel") + page_header(f'Pick Up the Towel {badge(st, STATUS_KIND[st])}', "Leading by Serving · Lesson 1 of 3",
                                                                            btn("Status", "", attrs=' aria-haspopup="dialog"', data_href=dialog("curriculum-status", "lesson")) + btn("Delete", "ghost", icon_name="trash", attrs=' aria-haspopup="dialog"', data_href=dialog("delete-lesson")))

    def form(err=None, failed_=False, busy=False):
        err = err or {}
        summary = form_summary([(k, v) for k, v in err.items()]) if err else ""
        fail = alert("danger", "We couldn’t save the lesson", "Your changes are still here. Try again.") if failed_ else ""
        content = (summary + fail
                   + field("title", "Lesson title", value="" if "title" in err else "Pick Up the Towel", required=True, error=err.get("title", ""))
                   + f'<div class="two-col">{field("reading", "Reading", value="The captain and the kit bags", optional=True, help_="The story or passage the lesson is built on.")}'
                   f'{field("minutes", "Estimated minutes", type_="number", inputmode="numeric", value="900" if "minutes" in err else "12", error=err.get("minutes", ""))}</div>'
                   + textarea("objectives", "Learning objectives", value="Notice what needs doing\nServe without being asked", rows=2, optional=True, help_="One per line.")
                   + textarea("body", "Teaching content", value=BODY, rows=8, help_="Plain text. Youth read this as the main lesson.")
                   + textarea("prompts", "Reflection prompts", value="Who picked up the towel for you this week?\nWhat stopped you from helping last time?", rows=2, optional=True, help_="One per line.")
                   + textarea("notes", "Leader guide notes", value=NOTES, rows=3, optional=True, help_="For staff and mentors only. Never shown to youth."))
        actions = f'<div class="form-actions">{btn("Cancel", "ghost", href=page("curriculum-module"))}{btn("Save lesson", "primary", type_="submit", busy=busy)}</div>'
        return f'<form class="stack" action="#" method="post" novalidate>{card(f"<div class=\"stack\">{content}</div>", title="Content", tid="content")}{actions}</form>'

    dropzone = (f'<div class="dropzone" role="group" aria-labelledby="dz-title"><span class="icon-tile" aria-hidden="true">{icon("upload")}</span>'
                f'<h3 class="dropzone__title" id="dz-title">Attach a lesson video</h3><p class="dropzone__text">{VIDEO_HELP}</p>'
                f'<label class="btn btn--primary" for="video">{icon("file")}Choose video<input class="visually-hidden" id="video" type="file" accept="video/mp4,video/quicktime,video/webm"></label></div>')

    def video(state="none"):
        if state == "uploading":
            inner = (list_item("pick-up-the-towel.mp4", "Uploading · 184 MB", lead=f'<span class="icon-tile" aria-hidden="true">{icon("upload")}</span>')
                     .replace('<li class="list__item">', '<li class="list__item" aria-busy="true">'))
            return card(ul_list([inner], card=False, label="Lesson video"), title="Video", tid="video", cls="card--flush")
        if state == "ready":
            row = list_item("pick-up-the-towel.mp4", "Video · 184 MB · uploaded Thu 5 Nov by Marisol Delgado",
                            lead=f'<span class="icon-tile" aria-hidden="true">{icon("file")}</span>', end=btn("Remove", "ghost", size="sm", aria_label="Remove the video pick-up-the-towel.mp4"))
            return card(ul_list([row], card=False, label="Lesson video"), title="Video", tid="video", cls="card--flush")
        if state == "invalid":
            return card(alert("danger", "That file isn’t a video we can use", "“weekly-schedule.pdf” was not attached. Choose an MP4, MOV or WebM video of up to 1 GB.") + dropzone, title="Video", tid="video")
        if state == "failed":
            return card(alert("danger", "The upload didn’t finish", "Nothing was attached. Check your connection and choose the video again.") + dropzone, title="Video", tid="video")
        return card(dropzone, title="Video", tid="video")

    belongs = card(facts([("Module", "Leading by Serving"), ("Track", "Leadership Foundations"), ("Cohorts", "After‑School Tutoring, Saturday Sports")]), title="Belongs to", tid="belongs")

    def layout(f, v="ready", st="Published"):
        return hdr(st) + f'<div class="split"><div class="stack">{f}</div><div class="stack">{video(v)}{belongs}</div></div>'

    S.add("default", "Marisol opens Pick Up the Towel: its content, the leader notes youth never see, its video and where it belongs.", **KW, main=layout(form()),
          notes=note("Leader guide notes are sent only to authors; youth endpoints never return them. Youth see the lesson only while it, its module and its track are published.", "top: 5rem; right: 1rem;"))
    S.add("no-video", "A lesson without a video: the drop zone offers Choose video.", **KW, main=layout(form(), "none", "Draft"))
    S.add("video-uploading", "The video uploading: its name and size with Uploading; the rest of the page stays usable. A percentage waits for chunked upload (ADR 0050).", **KW, main=layout(form(), "uploading", "Draft"))
    S.add("video-invalid", "Marisol chose a PDF: refused with the reason, nothing attached, the drop zone stays.", **KW, main=layout(form(), "invalid", "Draft"))
    S.add("video-failed", "The upload failed partway: nothing attached, try again.", **KW, main=layout(form(), "failed", "Draft"))
    S.add("invalid", "Saving with no title and 900 minutes: errors beside the fields and in the summary.", **KW,
          main=layout(form({"title": "Give the lesson a title.", "minutes": "Estimate between 1 and 600 minutes."})))
    S.add("busy", "Saving the lesson.", **KW, main=layout(form(busy=True)))
    S.add("saved", "Saved: a toast confirms.", **KW, main=layout(form()), toast_html=toast_region(toast("success", "Lesson saved", "Pick Up the Towel")))
    S.add("failed", "The save failed: inputs kept, retry.", **KW, main=layout(form(failed_=True)))
    S.add("loading", "The lesson loading.", **KW, main=crumbs("Lesson") + page_header("Lesson") + f'<div class="split">{skeleton_list(5, "Loading the lesson")}{skeleton_list(2, "Loading the video")}</div>')
    S.add("error", "The lesson failed to load.", **KW, main=crumbs("Lesson") + page_header("Lesson") + failed("We couldn’t load this lesson"))
    S.add("not-found", "A deleted lesson, one of another organization, or an unknown address.", **KW,
          main=crumbs("Lesson") + page_header("Lesson") + card(empty("We can’t find that lesson", "It may have been deleted, or belong to another organization.", action=btn("Back to Curriculum", "", href=page("curriculum-tracks")), icon_name="search"), cls="card--flush"))
    S.add("forbidden", "A youth worker opening a lesson editor directly: 403.", nav="today", user=STAFF["aisha"], main=page_header("Lesson") + forbidden())


# ---------------------------------------------------------------- Quizzes and assignments (prompt 60, L2-073, L2-074)
# Ported from Waypoint's quiz builder and assignment builder. A quiz or assignment belongs to a module and may be attached to
# one of its lessons; youth see it only once it is published inside a published module and track their program follows.
QUIZ = "Leading by Serving quiz"
QUESTIONS = [
    ("In Pick Up the Towel, what did the captain do before the big game?", "Multiple choice · 4 options", "Answer: Packed the kit bags for everyone"),
    ("Leading is a title someone gives you.", "True / false", "Answer: False"),
    ("Which of these are ways to “pick up the towel” this week?", "Multiple answer · 3 options", "Answers: Help clear up after group; Check on someone who is new"),
    ("In one word, who does a servant leader put first?", "Short answer", "Accepts: others, other people"),
]
ATTACH = ["The whole module", "Lesson 1 · Pick Up the Towel", "Lesson 2 · Last in Line", "Lesson 3 · Leading Like a Coach"]


def assessment_crumbs(cur: str) -> str:
    return breadcrumb([("Curriculum", page("curriculum-tracks")), ("Leading by Serving", page("curriculum-module"))], cur)


def not_found(what: str) -> str:
    return card(empty(f"We can’t find that {what}", "It may have been removed, or belong to another organization.",
                      action=btn("Back to Curriculum", "", href=page("curriculum-tracks")), icon_name="search"), cls="card--flush")


@screen("curriculum-quiz", "page", "Quiz builder", route="/curriculum/quizzes/:id", reqs=["L2-073", "L2-066", R_LEARN])
def curriculum_quiz(S):
    def hdr(st="Draft", title=QUIZ):
        return assessment_crumbs(title) + page_header(f'{esc(title)} {badge(st, STATUS_KIND[st])}', "Quiz · Leading by Serving",
                                                      btn("Status", "", attrs=' aria-haspopup="dialog"', aria_label=f"Status of {title}", data_href=dialog("curriculum-status", "quiz")))

    def questions(rows=QUESTIONS):
        add = btn("Add question", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("quiz-question"))
        if not rows:
            return card(empty("No questions yet", "Add the questions youth answer. Mark the correct answer for each one.",
                              action=btn("Add question", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("quiz-question")), icon_name="list"),
                        title="Questions", tid="questions", cls="card--flush")
        items = []
        for i, (text, kind, answer) in enumerate(rows):
            short = f"question {i + 1}"
            end = (f'<span class="cluster cluster--snug">{icon_btn("edit", f"Edit {short}", data_href=dialog("quiz-question", "edit"))}'
                   f'{icon_btn("arrow-up", f"Move {short} up", attrs=" disabled" if i == 0 else "")}'
                   f'{icon_btn("arrow-down", f"Move {short} down", attrs=" disabled" if i == len(rows) - 1 else "")}'
                   f'{icon_btn("trash", f"Delete {short}", data_href=dialog("delete-question"))}</span>')
            items.append(list_item(f"{i + 1}. {esc(text)}", f"{kind} · {esc(answer)}", end=end))
        return card(ul_list(items, card=False, label="Questions, in order"), title=f"Questions ({len(rows)})", tid="questions", cls="card--flush", footer=add)

    def settings(err=None, failed_=False, busy=False):
        err = err or {}
        summary = form_summary(list(err.items())) if err else ""
        fail = alert("danger", "We couldn’t save the settings", "Your changes are still here. Try again.") if failed_ else ""
        body = (summary + fail
                + field("title", "Quiz title", value="" if "title" in err else QUIZ, required=True, error=err.get("title", ""))
                + select("attach", "Attached to", ATTACH, selected=ATTACH[0], help_="Youth meet it at the end of the module or after the lesson.")
                + f'<div class="two-col">{select("passMark", "Pass mark", ["50%", "60%", "70%", "80%", "90%", "100%"], selected="70%")}'
                f'{select("attempts", "Attempts allowed", ["Unlimited", "1", "2", "3", "5"], selected="2", help_="The best attempt counts.")}</div>'
                + fieldset("Feedback", choice("feedback", "Show correct answers after each attempt", checked=True)
                           + choice("feedback", "Show the score only")
                           + choice("feedback", "Show correct answers after the last attempt"))
                + switch("shuffle", "Shuffle question order", desc="Each attempt shows the questions in a new order.")
                + switch("required", "Required to complete the module", checked=True, desc="Youth must pass it before the module counts as done.")
                + switch("requireApproval", "Mentor approves each score", desc="A youth’s score counts once their mentor approves it or sets another."))
        actions = f'<div class="form-actions">{btn("Cancel", "ghost", href=page("curriculum-module"))}{btn("Save settings", "primary", type_="submit", busy=busy)}</div>'
        return f'<form class="stack" action="#" method="post" novalidate>{card(f"<div class=\"stack\">{body}</div>", title="Settings", tid="settings")}{actions}</form>'

    def layout(form, rows=QUESTIONS, st="Draft"):
        return hdr(st) + f'<div class="split"><div class="stack">{questions(rows)}</div><div class="stack">{form}</div></div>'

    S.add("default", "Marisol builds the Leading by Serving quiz: four questions of each type with their correct answers, and the rules youth take it under.", **KW,
          main=layout(settings()),
          notes=note("Move up and Move down save the order on the server; shuffle changes only what youth see. Correct answers are sent only to authors.", "top: 5rem; right: 1rem;"))
    S.add("empty", "A new quiz with no questions: Add question is the one action; it cannot be published yet.", **KW, main=layout(settings(), []))
    S.add("invalid", "Saving settings with no title: the error beside the field and in the focused summary.", **KW, main=layout(settings({"title": "Give the quiz a title."})))
    S.add("busy", "Saving the settings: the button is busy and the form cannot be sent twice.", **KW, main=layout(settings(busy=True)))
    S.add("saved", "Settings saved: a toast confirms and the page stays.", **KW, main=layout(settings()), toast_html=toast_region(toast("success", "Quiz saved", QUIZ)))
    S.add("published", "Published: the badge says so; youth in the cohorts that follow the track meet it once the module is published.", **KW,
          main=layout(settings(), st="Published"), toast_html=toast_region(toast("success", "Status saved", f"{QUIZ} is published.")))
    S.add("failed", "The save failed: inputs kept, an alert offers a retry.", **KW, main=layout(settings(failed_=True)))
    S.add("loading", "The quiz loading.", **KW, main=assessment_crumbs("Quiz") + page_header("Quiz") + f'<div class="split">{skeleton_list(4, "Loading the questions")}{skeleton_list(4, "Loading the settings")}</div>')
    S.add("error", "The quiz failed to load.", **KW, main=assessment_crumbs("Quiz") + page_header("Quiz") + failed("We couldn’t load this quiz"))
    S.add("not-found", "A quiz of another organization, or an unknown address.", **KW, main=assessment_crumbs("Quiz") + page_header("Quiz") + not_found("quiz"))
    S.add("forbidden", "A site lead opening a quiz directly: 403.", nav="today", user=STAFF["jaylen"], main=page_header("Quiz") + forbidden())


ASSIGNMENT = "Serve someone this week"
BRIEF = ("This week, put Pick Up the Towel into practice. Choose one person to serve without being asked, at home, at school or in your cohort. "
         "Afterwards, tell us what you did, how it felt and what you noticed. A photo or a short note is enough.")
RUBRIC = [("Chose someone and served without being asked", 10), ("Described what they did and how it felt", 10), ("Named one thing they noticed", 5)]


@screen("curriculum-assignment", "page", "Assignment builder", route="/curriculum/assignments/:id", reqs=["L2-074", "L2-066", R_LEARN])
def curriculum_assignment(S):
    def hdr(st="Draft"):
        return assessment_crumbs(ASSIGNMENT) + page_header(f'{ASSIGNMENT} {badge(st, STATUS_KIND[st])}', "Assignment · Leading by Serving",
                                                           btn("Status", "", attrs=' aria-haspopup="dialog"', aria_label=f"Status of {ASSIGNMENT}", data_href=dialog("curriculum-status", "assignment")))

    def rubric(rows=RUBRIC, err=""):
        add = btn("Add criterion", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("rubric-criterion"))
        e = f'<div class="field__error" id="rubric-error">{esc(err)}</div>' if err else ""
        if not rows:
            foot = f'<span class="cluster cluster--between"><span class="text-muted">Total possible: <strong>0 points</strong></span>{add}</span>'
            return card(empty("No criteria yet", "Mentors grade against the rubric. Add at least one criterion with its points before publishing.", icon_name="list") + e,
                        title="Rubric", tid="rubric", cls="card--flush", footer=foot)
        items = [list_item(esc(d), f"{p} points", end=f'<span class="cluster cluster--snug">{icon_btn("edit", f"Edit criterion {i + 1}", data_href=dialog("rubric-criterion", "edit"))}'
                                                        f'{icon_btn("trash", f"Remove criterion {i + 1}")}</span>') for i, (d, p) in enumerate(rows)]
        total = sum(p for _, p in rows)
        foot = f'<span class="cluster cluster--between"><span class="text-muted">Total possible: <strong>{total} points</strong></span>{add}</span>'
        return card(ul_list(items, card=False, label="Rubric criteria") + e, title="Rubric", tid="rubric", cls="card--flush", footer=foot)

    def form(err=None, failed_=False, busy=False, new=False):
        err = err or {}
        summary = form_summary(list(err.items())) if err else ""
        fail = alert("danger", "We couldn’t save the assignment", "Your changes are still here. Try again.") if failed_ else ""
        bad = "types" in err
        types = fieldset("Ways to submit", choice("types", "Text reflection", type_="checkbox", checked=not bad, invalid=bad)
                         + choice("types", "Photo", type_="checkbox", checked=not bad and not new, invalid=bad)
                         + choice("types", "Link", type_="checkbox", invalid=bad)
                         + choice("types", "File upload", type_="checkbox", invalid=bad),
                         fid="types", error=err.get("types", ""), hint="Pick at least one.")
        details = (summary + fail
                   + field("title", "Assignment title", value="" if "title" in err else ASSIGNMENT, required=True, error=err.get("title", ""))
                   + select("attach", "Attached to", ATTACH, selected=ATTACH[1])
                   + textarea("brief", "Task", value="" if ("brief" in err or new) else BRIEF, rows=5, error=err.get("brief", ""), help_="Plain text. Youth read this before they submit.")
                   + types)
        due = (f'<div class="two-col">{field("due", "Due date", type_="date", value="" if new else "2026-11-19", optional=True)}'
               f'{select("grace", "Grace period", ["None", "1 day", "2 days", "1 week"], selected="None" if new else "2 days")}</div>'
               + switch("late", "Allow late submissions", checked=not new, desc="Late work is flagged for the mentor.")
               + switch("approval", "Mentor approves before it counts as complete", checked=not new))
        actions = f'<div class="form-actions">{btn("Cancel", "ghost", href=page("curriculum-module"))}{btn("Save assignment", "primary", type_="submit", busy=busy)}</div>'
        return (f'<form class="stack" action="#" method="post" novalidate>{card(f"<div class=\"stack\">{details}</div>", title="Details", tid="details")}'
                f'RUBRIC_SLOT{card(f"<div class=\"stack\">{due}</div>", title="Due rules", tid="due")}{actions}</form>')

    belongs = card(facts([("Module", "Leading by Serving"), ("Track", "Leadership Foundations"), ("Cohorts", "After‑School Tutoring, Saturday Sports")]), title="Belongs to", tid="belongs")

    def layout(f, rows=RUBRIC, st="Draft", err=""):
        return hdr(st) + f'<div class="split"><div class="stack">{f.replace("RUBRIC_SLOT", rubric(rows, err))}</div><div class="stack">{belongs}</div></div>'

    S.add("default", "Marisol defines Serve someone this week: the task, the ways to submit, a 25-point rubric and its due rules.", **KW, main=layout(form()),
          notes=note("The rubric is saved with the assignment; its total is computed on the server. Publishing assigns it to youth in the cohorts that follow the track.", "top: 5rem; right: 1rem;"))
    S.add("empty", "A new assignment: only its title; the rubric is empty and nothing is due yet.", **KW, main=layout(form(new=True), []))
    S.add("invalid", "Saving with no task and no way to submit: errors beside the fields and in the summary.", **KW,
          main=layout(form({"brief": "Describe the task.", "types": "Choose at least one way to submit."})))
    S.add("busy", "Saving the assignment.", **KW, main=layout(form(busy=True)))
    S.add("saved", "Saved: a toast confirms with the total.", **KW, main=layout(form()), toast_html=toast_region(toast("success", "Assignment saved", f"{ASSIGNMENT} · 25 points")))
    S.add("published", "Published: assigned to youth in the cohorts that follow Leadership Foundations once the module is published.", **KW,
          main=layout(form(), st="Published"), toast_html=toast_region(toast("success", "Status saved", f"{ASSIGNMENT} is published.")))
    S.add("failed", "The save failed: inputs kept, retry.", **KW, main=layout(form(failed_=True)))
    S.add("loading", "The assignment loading.", **KW, main=assessment_crumbs("Assignment") + page_header("Assignment") + f'<div class="split">{skeleton_list(5, "Loading the assignment")}{skeleton_list(3, "Loading the rubric")}</div>')
    S.add("error", "The assignment failed to load.", **KW, main=assessment_crumbs("Assignment") + page_header("Assignment") + failed("We couldn’t load this assignment"))
    S.add("not-found", "An assignment of another organization, or an unknown address.", **KW, main=assessment_crumbs("Assignment") + page_header("Assignment") + not_found("assignment"))
    S.add("forbidden", "A youth worker opening an assignment directly: 403.", nav="today", user=STAFF["aisha"], main=page_header("Assignment") + forbidden())


# ---------------------------------------------------------------- Badges and progression (prompt 64, L2-084 to L2-086)
# Ported from Waypoint's badge builder and progression editor. Badges belong to the organization: an automatic badge names one rule
# and the lesson, module, quiz or assignment it watches, and the server awards it once when a youth meets it; a badge by hand is
# awarded by a program director. The progression framework is ordered stages, each earned through its competencies.
BADGE_ICONS = [("Star", "star"), ("Medal", "award"), ("Heart", "heart"), ("Flag", "flag"), ("Book", "book"), ("Sparkle", "sparkle"), ("People", "users"), ("Tick", "check-circle")]
BADGE_RULES = ["Completes a lesson", "Completes a module", "Passes a quiz", "Has an assignment accepted"]
BADGES = [
    ("First Steps", "star", "Finished a first lesson.", "Automatic", "Completes a lesson · Pick Up the Towel", "", 2),
    ("Servant Heart", "heart", "Finished Leading by Serving.", "Automatic", "Completes a module · Leading by Serving", "Serves others", 1),
    ("Quiz Champion", "award", "Passed the Leading by Serving quiz.", "Automatic", "Passes a quiz · Leading by Serving quiz", "", 0),
    ("Served Someone", "check-circle", "Had Serve someone this week accepted.", "Automatic", "Has an assignment accepted · Serve someone this week", "Serves others", 1),
    ("Speaks Up", "flag", "Shared an idea with the whole group.", "By hand", "A program director awards it", "Speaks up", 1),
    ("Encourager", "sparkle", "Lifted someone up in the group.", "By hand", "A program director awards it", "", 0),
]
COMPETENCY_OPTIONS = ["None", "Serves others", "Works with others", "Speaks up", "Follows through", "Leads a small group"]


def medal(name: str, icon_name: str, caption: str, *, locked: bool = False, small: bool = False) -> str:
    cls = "achievement-badge" + (" achievement-badge--locked" if locked else "") + (" achievement-badge--sm" if small else "")
    return (f'<div class="{cls}"><span class="achievement-badge__medal" aria-hidden="true">{icon(icon_name)}</span>'
            f'<span class="achievement-badge__name">{esc(name)}</span><span class="achievement-badge__caption">{esc(caption)}</span></div>')


def badges_crumbs(cur: str) -> str:
    return breadcrumb([("Curriculum", page("curriculum-tracks")), ("Badges", page("curriculum-badge"))], cur)


@screen("curriculum-badge", "page", "Badges", route="/curriculum/badges", reqs=["L2-084", "L2-085", "L2-032", R_LEARN])
def curriculum_badge(S):
    new_btn = btn("New badge", "primary", icon_name="plus", href=page("curriculum-badge", "new"))
    hdr = breadcrumb([("Curriculum", page("curriculum-tracks"))], "Badges") + page_header("Badges", "What youth earn as they learn, and how they earn it.", new_btn)
    numbers = kpis([("Badges", "6", "4 automatic · 2 by hand"), ("Awarded", "5", "to 2 youth"), ("Most earned", "First Steps", "2 youth")])

    def rows(items=BADGES):
        out = []
        for name, ic, _desc, kind, rule, comp, n in items:
            meta = f'{esc(rule)}{" · " + esc(comp) if comp else ""} · earned by {n} youth'
            out.append(list_item(esc(name), meta, href=page("curriculum-badge", "edit" if kind == "By hand" else "automatic"),
                                 lead=f'<span class="achievement-badge achievement-badge--sm" aria-hidden="true"><span class="achievement-badge__medal">{icon(ic)}</span></span>', end=badge(kind, "info" if kind == "Automatic" else "")))
        return ul_list(out, card=False, label="Badges")

    listing = card(rows(), title="All badges", tid="all-badges", cls="card--flush")
    S.add("default", "Marisol opens Badges from Curriculum: each badge with how it is earned, the competency it counts toward and how many youth hold it.", **KW,
          main=hdr + numbers + listing,
          notes=note("Automatic badges are awarded by the server when a youth completes the lesson or module, passes the quiz or has the assignment accepted; once each.", "top: 5rem; right: 1rem;"))
    S.add("deleted", "Marisol deleted Encourager: it leaves the list and a toast says youth who earned it keep it.", **KW,
          main=hdr + kpis([("Badges", "5", "4 automatic · 1 by hand"), ("Awarded", "5", "to 2 youth"), ("Most earned", "First Steps", "2 youth")])
          + card(rows(BADGES[:5]), title="All badges", tid="all-badges", cls="card--flush"),
          toast_html=toast_region(toast("success", "Badge deleted", "Youth who earned Encourager keep it.")))
    S.add("loading", "Badges loading: skeletons in the same layout.", **KW, main=hdr + skeleton_kpis(3) + skeleton_list(4, "Loading badges"))
    S.add("empty", "No badges yet: one action, New badge.", **KW,
          main=breadcrumb([("Curriculum", page("curriculum-tracks"))], "Badges") + page_header("Badges", "What youth earn as they learn, and how they earn it.")
          + card(empty("No badges yet", "Celebrate what youth reach: award a badge automatically when they finish a lesson, a module, a quiz or an assignment, or by hand.",
                       action=new_btn, icon_name="award"), cls="card--flush"))
    S.add("error", "Badges failed to load; the shell stays.", **KW, main=hdr + failed("We couldn’t load the badges"))

    def form(name="Speaks Up", ic="flag", desc="Shared an idea with the whole group.", automatic=False, rule="Completes a module", target="Leadership Foundations · Leading by Serving",
             comp="Speaks up", err=None, failed_=False, busy=False):
        err = err or {}
        summary = form_summary(list(err.items())) if err else ""
        fail = alert("danger", "We couldn’t save the badge", "Your changes are still here. Try again.") if failed_ else ""
        details = (summary + fail
                   + field("name", "Badge name", value="" if "name" in err else name, required=True, error=err.get("name", ""), help_="Up to 60 characters. Youth see it on their journey.")
                   + textarea("description", "What it celebrates", value=desc, rows=2, optional=True, help_="Up to 200 characters.")
                   + select("icon", "Icon", [label for label, _ in BADGE_ICONS], selected=next(label for label, key in BADGE_ICONS if key == ic)))
        earned = fieldset("How it’s earned", choice("kind", "Automatically, by a rule", small="The server awards it once when a youth meets the rule.", checked=automatic)
                          + choice("kind", "By hand", small="A program director awards it to a youth.", checked=not automatic))
        if automatic:
            targets = {"Completes a module": ["Leadership Foundations · Knowing Yourself", "Leadership Foundations · Leading by Serving"],
                       "Completes a lesson": ["Leading by Serving · Pick Up the Towel", "Leading by Serving · Last in Line"]}.get(rule, [target])
            earned += (f'<div class="two-col">{select("rule", "Rule", BADGE_RULES, selected=rule)}'
                       f'{select("target", "Which one", [""] + targets if "target" in err else targets, selected="" if "target" in err else target, error=err.get("target", ""))}</div>')
        earned += select("competency", "Counts toward", COMPETENCY_OPTIONS, selected=comp or "None", optional=True, help_="Links the badge to a competency of the progression framework.")
        actions = f'<div class="form-actions">{btn("Cancel", "ghost", href=page("curriculum-badge"))}{btn("Save badge", "primary", type_="submit", busy=busy)}</div>'
        return (f'<form class="stack" action="#" method="post" novalidate>{card(f"<div class=\"stack\">{details}</div>", title="Badge", tid="badge")}'
                f'{card(f"<div class=\"stack\">{earned}</div>", title="Earning it", tid="earning")}{actions}</form>')

    def side(name="Speaks Up", ic="flag", caption="Shared an idea with the whole group.", holders=None, manual=True, new=False):
        preview = card(medal(name, ic, caption), title="Preview", tid="preview")
        if new:
            return preview
        holders = holders if holders is not None else [(YOUTH["sofia"], "Awarded by Marisol Delgado · Wed 4 Nov")]
        foot = btn("Award badge", "", size="sm", icon_name="award", attrs=' aria-haspopup="dialog"', data_href=dialog("award-badge")) if manual else ""
        if holders:
            body = ul_list([list_item(esc(p["name"]), esc(how), person=p) for p, how in holders], card=False, label="Youth who earned it")
        else:
            body = f'<p class="text-muted">No youth has earned it yet.</p>'
        return preview + card(body, title=f"Earned by ({len(holders)})", tid="earned", cls="card--flush", footer=foot)

    def edit_hdr(name="Speaks Up", kind="By hand"):
        return badges_crumbs(name) + page_header(f'{esc(name)} {badge(kind, "info" if kind == "Automatic" else "")}', "Badge · counts toward Speaks up" if kind == "By hand" else "Badge · counts toward Serves others",
                                                 btn("Delete", "ghost", icon_name="trash", attrs=' aria-haspopup="dialog"', aria_label=f"Delete {name}", data_href=dialog("delete-badge")))

    def edit(f, s, name="Speaks Up", kind="By hand"):
        return edit_hdr(name, kind) + f'<div class="split"><div class="stack">{f}</div><div class="stack">{s}</div></div>'

    new_layout = (badges_crumbs("New badge") + page_header("New badge", "Name it, pick its icon and choose how youth earn it.")
                  + f'<div class="split"><div class="stack">{form(name="", ic="star", desc="", comp="")}</div><div class="stack">{side("New badge", "star", "How youth earn it shows here.", new=True)}</div></div>')
    S.add("new", "New badge: an empty builder with a live preview; nothing is saved until Save badge.", **KW, main=new_layout)
    S.add("edit", "Marisol opens Speaks Up, a badge by hand: its details, the competency it counts toward, who holds it and Award badge.", **KW, main=edit(form(), side()))
    servant = form("Servant Heart", "heart", "Finished Leading by Serving.", automatic=True, comp="Serves others")
    S.add("automatic", "Servant Heart, an automatic badge: the rule Completes a module and the module it watches; no Award badge, the server awards it.", **KW,
          main=edit(servant, side("Servant Heart", "heart", "Finished Leading by Serving.", [(YOUTH["sofia"], "Automatically · Thu 5 Nov")], manual=False), "Servant Heart", "Automatic"),
          notes=note("Changing the rule does not take a badge away from youth who already earned it.", "top: 5rem; right: 1rem;"))
    S.add("invalid", "Saving an automatic badge with no name and no module chosen: errors beside the fields and in the focused summary.", **KW,
          main=edit(form("Servant Heart", "heart", "Finished Leading by Serving.", automatic=True, comp="Serves others", err={"name": "Give the badge a name.", "target": "Choose the module that earns it."}),
                    side("Servant Heart", "heart", "Finished Leading by Serving.", [], manual=False), "Servant Heart", "Automatic"))
    S.add("busy", "Saving: the button is busy and the form cannot be sent twice.", **KW, main=edit(form(busy=True), side()))
    S.add("saved", "Saved: a toast confirms and the page stays.", **KW, main=edit(form(), side()), toast_html=toast_region(toast("success", "Badge saved", "Speaks Up")))
    S.add("failed", "The save failed: inputs kept, an alert offers a retry.", **KW, main=edit(form(failed_=True), side()))
    S.add("awarded", "Marisol awarded Speaks Up to Nadia: she joins Earned by with Marisol’s name, and a toast confirms.", **KW,
          main=edit(form(), side(holders=[(YOUTH["nadia"], "Awarded by Marisol Delgado · Thu 5 Nov"), (YOUTH["sofia"], "Awarded by Marisol Delgado · Wed 4 Nov")])),
          toast_html=toast_region(toast("success", "Badge awarded", "Nadia Haddad earned Speaks Up.")))
    S.add("not-found", "A deleted badge, one of another organization, or an unknown address.", **KW,
          main=badges_crumbs("Badge") + page_header("Badge") + card(empty("We can’t find that badge", "It may have been deleted, or belong to another organization.",
                                                                          action=btn("Back to Badges", "", href=page("curriculum-badge")), icon_name="search"), cls="card--flush"))
    S.add("forbidden", "A site lead opening Badges directly: only admins and program directors author; the server answers 403.", nav="today", user=STAFF["jaylen"],
          main=page_header("Badges") + forbidden())


STAGES = [
    ("Explorer", "Finding their place in the group", [("Serves others", "Notices what needs doing and helps without being asked."), ("Works with others", "Listens, takes turns and helps the group decide.")]),
    ("Contributor", "Takes part and helps others take part", [("Speaks up", "Shares ideas in the group and says when something is wrong."), ("Follows through", "Finishes what they start and keeps their promises.")]),
    ("Leader", "Leads others in the cohort", [("Leads a small group", "Guides a discussion and keeps a small group on track.")]),
]


@screen("curriculum-progression", "page", "Progression framework", route="/curriculum/progression", reqs=["L2-086", "L2-082", "L2-032", R_LEARN])
def curriculum_progression(S):
    add = btn("Add stage", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("progression-stage"))
    hdr = (breadcrumb([("Curriculum", page("curriculum-tracks"))], "Progression")
           + page_header("Progression framework", "The stages youth grow through, and the competencies that earn each one.", add))

    def stage_card(i, name, desc, comps, n):
        key = f"stage-{i + 1}"
        actions = (f'<span class="cluster cluster--snug">{icon_btn("edit", f"Edit {name}", data_href=dialog("progression-stage", "edit"))}'
                   f'{icon_btn("arrow-up", f"Move {name} up", attrs=" disabled" if i == 0 else "")}'
                   f'{icon_btn("arrow-down", f"Move {name} down", attrs=" disabled" if i == n - 1 else "")}</span>')
        head = (f'<div class="cluster cluster--between"><div><h2 class="card__title" id="{key}">{i + 1}. {esc(name)}</h2>'
                f'<p class="text-muted">{esc(desc)}</p></div>{actions}</div>')
        if comps:
            items = [list_item(esc(c), esc(d), end=icon_btn("trash", f"Remove {c}", data_href=dialog("remove-competency"))) for c, d in comps]
            body = ul_list(items, card=False, label=f"Competencies of {name}")
        else:
            body = '<p class="text-muted">No competencies yet. Add what a youth shows to reach this stage.</p>'
        foot = btn("Add competency", "ghost", size="sm", icon_name="plus", attrs=' aria-haspopup="dialog"', aria_label=f"Add competency to {name}", data_href=dialog("progression-competency"))
        return f'<section class="card stack" aria-labelledby="{key}">{head}{body}<p class="card__footer">{foot}</p></section>'

    def how(stages):
        steps = "".join(f"<li>{esc(n)}</li>" for n, _, _ in stages)
        return card(f'<p>A youth reaches a stage once their mentor marks every competency in it, and in the stages before it, Proficient or Mastered.</p>'
                    f'<ol class="stack stack--snug">{steps}</ol><p class="text-caption">Mentors assess these competencies on each youth’s record. A badge can count toward one.</p>',
                    title="How youth advance", tid="how")

    def layout(stages=STAGES):
        n = len(stages)
        cards = "".join(stage_card(i, nm, d, c, n) for i, (nm, d, c) in enumerate(stages))
        return hdr + f'<div class="split"><div class="stack">{cards}</div><div class="stack">{how(stages)}</div></div>'

    S.add("default", "Marisol opens the progression framework: three stages in order, each with the competencies that earn it, and how youth advance.", **KW, main=layout(),
          notes=note("Move up and Move down save the whole stage order on the server. Removing a competency keeps the assessments mentors already made.", "top: 5rem; right: 1rem;"))
    S.add("added", "Marisol added the stage Mentor: it is last, with no competencies yet, and a toast confirms.", **KW,
          main=layout(STAGES + [("Mentor", "Helps a newer youth find their feet", [])]), toast_html=toast_region(toast("success", "Stage added", "Mentor")))
    S.add("removed", "Marisol removed Works with others from Explorer: mentors stop assessing it and a toast confirms.", **KW,
          main=layout([(STAGES[0][0], STAGES[0][1], STAGES[0][2][:1])] + STAGES[1:]), toast_html=toast_region(toast("success", "Competency removed", "Works with others. Earlier assessments are kept.")))
    S.add("loading", "The framework loading.", **KW, main=hdr + f'<div class="split">{skeleton_list(4, "Loading stages")}{skeleton_list(2, "Loading how youth advance")}</div>')
    S.add("empty", "No stages yet: one action, Add stage.", **KW,
          main=breadcrumb([("Curriculum", page("curriculum-tracks"))], "Progression") + page_header("Progression framework", "The stages youth grow through, and the competencies that earn each one.")
          + card(empty("No stages yet", "A stage is a step on a youth’s journey, such as Explorer or Leader. Add one, then the competencies that earn it.",
                       action=add, icon_name="list"), cls="card--flush"))
    S.add("error", "The framework failed to load; the shell stays.", **KW, main=hdr + failed("We couldn’t load the progression framework"))
    S.add("forbidden", "A youth worker opening the framework directly: 403.", nav="today", user=STAFF["aisha"], main=page_header("Progression framework") + forbidden())
