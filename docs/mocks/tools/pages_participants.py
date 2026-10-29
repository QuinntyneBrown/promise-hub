"""Participant pages (ADR 0043). Learning (youth) moved to pages_learning.py (prompt 57), Curriculum to pages_curriculum.py (prompt 56) and the
public website to pages_website.py (prompt 81)."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN, R_MENTOR, R_SITE = "L1-023", "L1-024", "L1-025"
SOFIA = YOUTH["sofia"]
DANIEL = STAFF["daniel"]
MARISOL = STAFF["marisol"]
NA_PLACEHOLDER = "Until the journeys add content, the default state is the empty state."


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


# ---------------------------------------------------------------- First-run onboarding (prompt 53, L2-059, L2-060)
NADIA = YOUTH["nadia"]
PRONOUNS = ["Prefer not to say", "She / her", "He / him", "They / them"]
WELCOME_STEPS = ["You", "Preferences", "Your program"]
YKW = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning", "schedule", "conversations"])


def steps(cur: int, total: int = 3) -> str:
    dots = "".join(f'<span class="steps__dot{" steps__dot--current" if i == cur else (" steps__dot--done" if i < cur else "")}"></span>' for i in range(1, total + 1))
    return f'<p class="steps"><span class="steps__dots" aria-hidden="true">{dots}</span><span>Step {cur} of {total}</span></p>'


def welcome_card(cur: int, title: str, lead: str, body: str, *, primary: str, back: bool = True, alert_html: str = "") -> str:
    footer = (f'<div class="cluster cluster--between">{btn("Back", "ghost", icon_name="arrow-left") if back else "<span></span>"}'
              f'<div class="cluster">{btn("Finish later", "ghost")}{primary}</div></div>')
    return (page_header("Welcome, Sofía", "A few quick steps and you’re ready to learn.")
            + f'<form class="card stack" style="max-width: var(--layout-breakpoint-sm);" action="#" method="post" novalidate aria-labelledby="step-title">{steps(cur)}{alert_html}'
              f'<div><h2 class="card__title" id="step-title">{title}</h2><p class="text-muted">{lead}</p></div>{body}{footer}</form>')


def you_step(err: str = "", name: str = "Sofía", pron: str = "She / her", busy: bool = False, alert_html: str = "") -> str:
    body = (field("preferred", "What should we call you?", value=name, required=True, autocomplete="nickname", error=err,
                  help_="Mentors and staff see this name. Your record keeps your legal name.")
            + select("pronouns", "Pronouns", PRONOUNS, selected=pron, optional=True))
    if err:
        body = form_summary([("preferred", err)]) + body
    return welcome_card(1, "About you", "This is how you show up across Learning.", body, back=False,
                        primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), alert_html=alert_html)


def prefs_step(busy: bool = False) -> str:
    body = ('<div class="stack">'
            + switch("lessons", "Lesson reminders", checked=True, desc="A nudge when a lesson is waiting for you.")
            + switch("mentor", "Mentor messages", checked=True, desc="When your mentor writes to you.")
            + switch("news", "Announcements", checked=False, desc="News from your organization.")
            + "</div>")
    return welcome_card(2, "What should we tell you about?", "You can change these any time in your account.", body,
                        primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy))


def track_step(placed: bool = True, busy: bool = False, alert_html: str = "") -> str:
    if placed:
        body = (card(facts([("When", "Mon–Thu, 4–6 pm"), ("Runs", "8 Sep 2026 – 24 Jun 2027")]),
                     title="After‑School Tutoring", tid="program")
                + '<p class="hint">Your program team placed you here. Lessons appear on Learning as soon as they publish a track.</p>')
        lead = "This is where you learn with your program team."
    else:
        body = alert("info", "You’re not in a program yet", "Program staff add you to one. Learning opens fully the moment they do; it’s usually quick.")
        lead = "Your program team chooses your program; you don’t pick one."
    return welcome_card(3, "Meet your program", lead, body,
                        primary=btn("Finish", "primary", type_="submit", icon_name="check", busy=busy), alert_html=alert_html)


@screen("youth-welcome", "page", "Youth welcome", route="/learning/welcome", reqs=[R_LEARN, "L1-002"],
        na={"empty": "A wizard has no collection to be empty of; the no-cohort state is the program step’s waiting variant.",
            "forbidden": "Only a youth reaches it; Learning answers 403 to other roles and the shell never links it for them."})
def youth_welcome(S):
    S.add("default", "Sofía signs in for the first time after her guardian consented: step 1, the name she goes by and her pronouns, prefilled from her record.", **YKW,
          main=you_step(), notes=note("Each Continue saves the step on the server; Finish later saves what is on screen at this step and opens Learning, which offers to resume here (learning/resume).", "top: 5rem; right: 1rem;"))
    S.add("loading", "Loading where Sofía left off.", **YKW,
          main=page_header("Welcome, Sofía", "A few quick steps and you’re ready to learn.") + '<div class="card stack" aria-busy="true" aria-label="Loading your setup">'
          + '<span class="skeleton skeleton--title" aria-hidden="true"></span>' + '<span class="skeleton skeleton--text" aria-hidden="true"></span>' * 4 + "</div>")
    S.add("invalid", "Continue with the name cleared: an inline error and a summary; nothing is saved.", **YKW, main=you_step(err="Tell us what to call you.", name=""))
    S.add("busy", "Saving step 1.", **YKW, main=you_step(busy=True))
    S.add("error", "Saving failed: the answers stay and she can try again.", **YKW,
          main=you_step(alert_html=alert("danger", "We couldn’t save that", "Your answers are kept. Try again.")))
    S.add("preferences", "Step 2: what to be told about; lesson reminders and mentor messages on, announcements off.", **YKW, main=prefs_step())
    S.add("track", "Step 3: the program her team placed her in, read only.", **YKW, main=track_step())
    S.add("waiting", "Step 3 for Nadia, who is not in a program yet: the friendly waiting note; she can still finish.", **(YKW | {"user": NADIA}),
          main=track_step(placed=False).replace("Welcome, Sofía", "Welcome, Nadia"))
    S.add("finishing", "Finishing: the setup is marked complete and audited.", **YKW, main=track_step(busy=True))
    S.add("success", "Finished: Learning opens with a welcome toast.", **YKW,
          main=page_header("Learning", "Your lessons, quizzes, assignments and badges.")
          + card(empty("No lessons yet", "When your program publishes a track, its lessons appear here.",
                       action=btn("Back to Today", "", href=page("today", "youth")), icon_name="star"), cls="card--flush"),
          toast_html=toast_region(toast("success", "You’re all set, Sofía", "Welcome to Learning.")))


@screen("no-cohort", "page", "Not in a program yet", route="/learning", reqs=[R_LEARN],
        na={"empty": "The state itself is the empty Learning page for a youth with no program.",
            "forbidden": "Only a youth reaches Learning; other roles get 403 from the server."})
def no_cohort(S):
    hdr = page_header("Learning", "Your lessons, quizzes, assignments and badges.")
    kw = YKW | {"user": NADIA}

    def wait(action, extra=""):
        return hdr + extra + card(empty("You’re not in a program yet",
                                        "Welcome, Nadia! Lessons, badges and your journey open the moment program staff add you to a program. Hang tight, it’s usually quick.",
                                        action=action, icon_name="sparkle",
                                        extra=f'<p class="hint">Waiting to be added</p>'), cls="card--flush")
    S.add("default", "Nadia (18) finished setup but no program has her yet: a friendly waiting state instead of an empty Learning page.", **kw,
          main=wait(btn("Check again", "", icon_name="refresh")),
          notes=note("The server answers 403 no-cohort for lessons until the youth has an active enrollment; hiding the page is not the lock.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Checking again.", **kw, main=hdr + skeleton_list(3, "Loading your lessons"))
    S.add("error", "The check failed; the shell stays.", **kw, main=hdr + failed("We couldn’t load your lessons"))
