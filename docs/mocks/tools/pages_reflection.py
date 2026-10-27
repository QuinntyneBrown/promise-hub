"""Write reflections (prompt 66, L2-089 and L2-079): a youth writes a reflection on a lesson, says how she feels and chooses whether
it stays private or is shared with her mentor. Ported from Waypoint's youth reflection mock. Mentors read only the reflections a youth
shared (mentor-youth-detail/reflections); nobody else reads them. Leaving with unsaved words asks first (leave-reflection)."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN = "L1-023"
SOFIA = YOUTH["sofia"]
YKW = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning"])
R_REFLECT = ["L2-089", "L2-079", R_LEARN, "L2-035", "L2-036"]

LESSON = "Pick Up the Towel"
PROMPT = "Who picked up the towel for you this week?"
TEXT = ("My little brother Mateo cleared the table after dinner on Tuesday without anyone asking, so Mom could sit down. "
        "I noticed I usually wait to be asked. I want to be the one who notices first.")
ACTION = "Pack my own lunch on Thursday so Mom has one less thing to do."
MOODS = [("Hopeful", "Ready to try it"), ("Thoughtful", "Still thinking it over"), ("Unsure", "Not sure what it means for me"), ("Challenged", "It pushed me")]
MENTOR = "Daniel Osei"


def crumbs() -> str:
    return breadcrumb([("Learning", page("learn-home")), ("Leading by Serving", page("learn-module")), (LESSON, page("learn-lesson"))], "Your reflection")


def hdr(sub: str = "Take your time. Only you see it unless you choose to share it.") -> str:
    return crumbs() + page_header(f"Reflect on {LESSON}", sub)


def mood_field(selected: str = "Thoughtful", err: str = "") -> str:
    opts = "".join(choice("mood", m, small=hint, checked=m == selected, invalid=bool(err)) for m, hint in MOODS)
    return fieldset("How are you feeling about this lesson?", opts, error=err, fid="mood")


def reflection_form(*, text: str = TEXT, action: str = ACTION, mood: str = "Thoughtful", shared: bool = False, err=None, busy: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    think = card(f'<p class="text-caption">From the lesson</p><ul class="stack" style="margin: 0; padding-left: var(--space-5);"><li>{esc(PROMPT)}</li></ul>',
                 title="Think about it", tid="think")
    words = textarea("reflection", "Your reflection", value=text, rows=6, error=err.get("reflection", ""), count=f"{len(text):,} / 5,000",
                     help_="A few honest sentences is plenty. A draft can be unfinished.")
    act = textarea("action", "One thing I’ll do this week", value=action, rows=2, optional=True, count=f"{len(action):,} / 1,000")
    share_desc = (f"{MENTOR} can read it once you save it, and talk about it with you in check-ins." if shared
                  else f"Off: only you can see it. Turn it on to let your mentor, {MENTOR}, read it.")
    share = card(switch("shared", f"Share with my mentor, {MENTOR}", checked=shared, desc=share_desc), title="Who can see it", tid="share")
    actions = (f'<div class="form-actions">{btn("Save draft", "ghost", icon_name="check")}'
               f'{btn("Save reflection", "primary", icon_name="check-circle", type_="submit", busy=busy)}</div>')
    return (f'<form class="stack" action="#" method="post" novalidate>{summary}{think}'
            + card(f'<div class="stack">{mood_field(mood, err.get("mood", ""))}{words}{act}</div>', title="Your words", tid="words")
            + f'{share}{actions}</form>')


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


@screen("learn-reflection", "page", "Your reflection", route="/learning/lessons/:id/reflection", reqs=R_REFLECT)
def learn_reflection(S):
    S.add("default", "Sofía writes her reflection on Pick Up the Towel: how she feels, her words and one thing she’ll do. Sharing is off, so it stays private.", **YKW,
          main=hdr() + reflection_form(),
          notes=note("Leaving with unsaved words asks first (leave-reflection); closing the tab, the browser asks. Save draft keeps her words on this device only.", "top: 5rem; right: 1rem;"))
    S.add("empty", "Her first visit: nothing written yet, no mood chosen, sharing off.", **YKW, main=hdr() + reflection_form(text="", action="", mood=""))
    S.add("private", "Saved privately: the server keeps it, only she can see it, and she can edit it any time.", **YKW,
          main=hdr() + alert("success", "Reflection saved", "Only you can see it. Saved Thu 5 Nov, 4:12 pm.") + reflection_form(),
          toast_html=toast_region(toast("success", "Reflection saved", "Only you can see it.")))
    S.add("shared", "Saved and shared: Daniel can read it on her record. Turning sharing off and saving hides it from him again.", **YKW,
          main=hdr() + alert("success", "Reflection saved and shared", f"{MENTOR} can read it. Saved Thu 5 Nov, 4:12 pm.") + reflection_form(shared=True),
          toast_html=toast_region(toast("success", "Reflection saved", f"Shared with {MENTOR}.")))
    S.add("draft-saved", "Save draft: a toast confirms her words are kept on this device; nothing reaches the server or her mentor.", **YKW,
          main=hdr() + reflection_form(shared=True), toast_html=toast_region(toast("success", "Draft saved", "On this device. Nobody else can see a draft.")))
    S.add("restored", "She comes back to a draft: it is restored and Start over clears it.", **YKW,
          main=hdr() + alert("info", "We restored your draft", "Saved on this device on Thu 5 Nov, 3:40 pm.", actions=btn("Start over", "ghost", size="sm"))
          + reflection_form(text=TEXT[:96], action=""))
    S.add("invalid", "Save with no words and no mood: errors beside the fields and in a summary, focus on the summary.", **YKW,
          main=hdr() + reflection_form(text="", action="", mood="", err={"mood": "Choose how you’re feeling.", "reflection": "Write your reflection."}))
    S.add("busy", "Saving: the button is busy and cannot be pressed twice.", **YKW, main=hdr() + reflection_form(shared=True, busy=True))
    S.add("failed", "The save failed: her words stay on screen to try again.", **YKW,
          main=hdr() + alert("danger", "We couldn’t save your reflection", "Everything is still here. Check your connection and try again.") + reflection_form())
    S.add("locked", "A lesson she hasn’t reached: 403 and what unlocks it.", **YKW,
          main=crumbs() + page_header("Your reflection") + card(empty("Finish Your Strengths first", "You can reflect on a lesson once it’s open for you.",
                                                                     action=btn("Back to Learning", "", href=page("learn-home")), icon_name="lock"), cls="card--flush"))
    S.add("forbidden", "Learning is not open for her yet (no guardian consent or not placed): the page points to Learning.", **YKW,
          main=crumbs() + page_header("Your reflection") + card(empty("Learning isn’t open for you yet", "Your reflections appear once Learning opens for you. Learning says what’s needed.",
                                                                     action=btn("Back to Learning", "primary", href=page("learn-home")), icon_name="lock"), cls="card--flush"))
    S.add("not-found", "A draft, deleted or another organization’s lesson.", **YKW,
          main=crumbs() + page_header("Your reflection") + card(empty("We can’t find that lesson", "It may not be published yet, or your program doesn’t follow it.",
                                                                     action=btn("Back to Learning", "", href=page("learn-home")), icon_name="search"), cls="card--flush"))
    S.add("loading", "The reflection loading.", **YKW, main=crumbs() + page_header("Your reflection") + skeleton_list(4, "Loading your reflection"))
    S.add("error", "The reflection failed to load.", **YKW, main=crumbs() + page_header("Your reflection") + failed("We couldn’t load your reflection"))
