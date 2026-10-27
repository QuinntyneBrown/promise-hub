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
                      btn("New track", "primary", icon_name="plus", attrs=' aria-haspopup="dialog"', data_href=dialog("new-track")))
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
@screen("curriculum-module", "page", "Module editor", route="/curriculum/modules/:id", reqs=["L2-066", "L2-067", R_LEARN])
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

    def layout(form, rows=LESSONS, st="In review"):
        return hdr(st) + f'<div class="split"><div class="stack">{form}</div><div class="stack">{lessons(rows)}{visibility}</div></div>'

    S.add("default", "Marisol opens Leading by Serving: its details, its three lessons in order with their status, and who will see it once published.", **KW, main=layout(details()))
    S.add("empty", "A new module with no lessons yet: the lessons card offers Add lesson.", **KW,
          main=crumbs("Speaking Up") + page_header(f'Speaking Up {badge("Draft")}', "Module 3 of 3 in Leadership Foundations", btn("Status", "", attrs=' aria-haspopup="dialog"', data_href=dialog("curriculum-status")))
          + f'<div class="split"><div class="stack">{details().replace("Leading by Serving", "Speaking Up")}</div><div class="stack">{lessons([])}{visibility}</div></div>')
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
