"""Onboarding wizards: from a name or an email to a configured organization (or a ready staff member).

Two flows, one question per screen, at most three fields, one primary action:
  Organization: welcome -> org -> program -> roster -> staff -> first-event -> done   (Marisol, new organization)
  Staff:        phone -> sessions -> ready                                            (Sam, after accepting an invitation)
"""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_core import R_ENROLL, R_SLIPS, R_ROLL, R_NOTIFY, R_MOBILE
from pages_admin import R_TTV, R_SEC

M = STAFF["marisol"]
SAM = dict(name="Sam Lee", initials="SL", color="sage", role="Youth worker")
NA_FORM = {"loading": "The form is static; nothing is fetched before it shows.", "empty": "A single form has no collection to be empty of."}
HEAD = '<div class="stack" style="gap: var(--space-2);"><h1'

ORG_STEPS = [("onboard-org", "Organization", "Name and country"), ("onboard-modules", "Modules", "What’s on"),
             ("onboard-program", "First program", "When you meet"), ("onboard-roster", "Children", "Import or add"),
             ("onboard-staff", "Staff", "Who runs sessions"), ("onboard-first-event", "First slip", "An event")]
STAFF_STEPS = [("onboard-staff-phone", "Your phone", "Where alerts go"), ("onboard-staff-sessions", "Your sessions", "What you run"),
               ("onboard-staff-ready", "Ready", "First thing to try")]


def step_list(steps, cur: int, label: str) -> str:
    lis = []
    for i, (sid, title, summary) in enumerate(steps):
        done = i < cur
        marker = icon("check") if done else str(i + 1)
        text = (f'<span class="wizard-steps__marker" aria-hidden="true">{marker}</span><span class="wizard-steps__text">'
                f'<span class="wizard-steps__title">{esc(title)}</span><span class="wizard-steps__summary">{esc(summary)}</span></span>')
        if done:
            a = f'<a class="wizard-steps__step" href="{page(sid)}">{text}</a>'
        elif i == cur:
            a = f'<span class="wizard-steps__step" aria-current="step">{text}</span>'
        else:
            a = f'<button class="wizard-steps__step" type="button" disabled>{text}</button>'
        lis.append(f'<li{" data-done=\"\"" if done else ""}>{a}</li>')
    return f'<ol class="wizard-steps" aria-label="{esc(label)}">{"".join(lis)}</ol>'


def wiz(steps, cur: int, title: str, lead: str, body: str, *, primary: str, back: str = "", skip: str = "", label: str = "Setup steps",
        alert_html: str = "", form: bool = True) -> str:
    total = len(steps)
    name = steps[cur][1]
    prog = (f'<div class="wizard-progress"><span class="wizard-progress__label">{esc(name)}<span>Step {cur + 1} of {total}</span></span>'
            f'{progress(cur + 1, total, f"Step {cur + 1} of {total}", show=" ")}</div>')
    tag = "form" if form else "div"
    attrs = ' action="#" method="post" novalidate' if form else ""
    footer_left = (btn("Back", "ghost", icon_name="arrow-left", href=back) if back else "") + (f'<a class="btn btn--ghost" href="{skip}">Skip for now</a>' if skip else "")
    card_ = (f'<{tag} class="card wizard-card"{attrs}><div class="wizard-card__body"><div class="stack">'
             f'{alert_html}{HEAD} class="wizard-card__title">{title}</h1><p class="wizard-card__lead">{lead}</p></div>{body}</div></div>'
             f'<div class="wizard-card__footer">{footer_left}{primary}</div></{tag}>')
    return f'<div class="wizard-layout">{step_list(steps, cur, label)}<div class="stack">{prog}{card_}</div></div>'


def failed(html: str, title: str, text: str) -> str:
    """Insert a danger alert above the heading of a wizard card."""
    return html.replace(HEAD, alert("danger", title, text, role="alert") + HEAD, 1)


def hero(icon_name: str, title: str, text: str, actions: str, extra: str = "", after: str = "") -> str:
    return (f'<div class="card"><div class="onboarding-hero"><span class="icon-tile" aria-hidden="true">{icon(icon_name)}</span><h1>{title}</h1><p class="text-muted">{text}</p>{extra}'
            f'<div class="cluster">{actions}</div>{after}</div></div>')


def tile(name: str, label: str, small: str, *, checked=False, type_="radio", invalid=False) -> str:
    a = (" checked" if checked else "") + (' aria-invalid="true"' if invalid else "")
    return f'<label class="choice choice--tile"><input type="{type_}" name="{name}"{a}><span class="choice__text">{esc(label)}<small>{esc(small)}</small></span></label>'


def receipt(items: list[str]) -> str:
    return '<ul class="onboarding-receipt">' + "".join(f'<li>{icon("check-circle")}<span>{esc(t)}</span></li>' for t in items) + "</ul>"


def day_chips(on=("Mon", "Tue", "Wed", "Thu")) -> str:
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return ('<fieldset class="field"><legend class="field__label">Days</legend><div class="day-chips">'
            + "".join(f'<label class="chip"><input class="visually-hidden" type="checkbox" name="day" value="{d}"{" checked" if d in on else ""}>{d}</label>' for d in days)
            + "</div></fieldset>")


# ---------------------------------------------------------------- Organization flow
@screen("onboard-welcome", "page", "Welcome", route="/welcome", reqs=[R_TTV], shell="wizard",
        na={"loading": "Nothing is fetched; the page is static.", "empty": "No collection on this page.", "error": "Nothing can fail here; failures belong to the steps that save."})
def onboard_welcome(S):
    S.add("default", "Marisol has just confirmed her email and is the first person in a new organization: one sentence, one button.",
          user=M, exit_href="", main=hero("sparkle", "Welcome, Marisol",
                                           "Six short steps. Your first slip can go out within the hour.",
                                           btn("Set up my organization", "primary", size="lg", icon_name="arrow-right", href=page("onboard-org")),
                                           after=f'<p class="text-caption">Already invited? <a href="{page("accept-invite")}">Open your invitation</a>.</p>'),
          notes=note("No navigation, no search, no notifications until setup is done; the only way forward is the button.", "top: 5rem; right: 1rem;"))


@screen("onboard-org", "page", "Set up: organization", route="/welcome/organization", reqs=[R_TTV, R_NOTIFY], shell="wizard", na=NA_FORM)
def onboard_org(S):
    def form(err=None, busy=False, name="Harbourview Youth Collective"):
        e = err or {}
        body = (field("org", "Organization name", value=name, autofocus=True, error=e.get("org", ""), help_="Shown on texts and slips.")
                + select("country", "Country", ["Canada", "United States", "United Kingdom", "Australia"], selected="Canada", help_="Sets data region and phone format."))
        return wiz(ORG_STEPS, 0, "What’s your organization called?", "Both can change later in Settings.", body,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-welcome"))
    S.add("default", "Step 1 of 6: organization name and country.", user=M, exit_href=page("setup"), main=form())
    S.add("invalid", "Submitted with no name.", user=M, exit_href=page("setup"), main=form(err={"org": "Enter your organization’s name."}, name=""))
    S.add("submitting", "Saving the organization.", user=M, exit_href=page("setup"), main=form(busy=True))
    S.add("error", "The save failed; the answers stay in the form.", user=M, exit_href=page("setup"),
          main=failed(form(), "We couldn’t save that", "Try again. Nothing is lost."))


@screen("onboard-modules", "page", "Set up: modules", route="/welcome/modules", reqs=[R_TTV, "PRD-NFR-MODULES"], shell="wizard",
        na={"loading": "The choice is static.", "empty": "The step offers presets; nothing to be empty of."})
def onboard_modules(S):
    def form(choice="suite", invalid=False, busy=False):
        tiles = ('<fieldset class="field"><legend class="field__label">Start with</legend><div class="choice-tiles">'
                 + tile("preset", "The whole suite", "All 8 modules. Recommended.", checked=choice == "suite", invalid=invalid)
                 + tile("preset", "Just check-in", "Roster, Roll Call and Quick Cards.", checked=choice == "checkin", invalid=invalid)
                 + tile("preset", "Just permission slips", "Roster, slips and messages.", checked=choice == "slips", invalid=invalid)
                 + tile("preset", "Let me choose", "Pick modules one by one.", checked=choice == "custom", invalid=invalid)
                 + "</div>" + ('<div class="field__error">Pick one to continue.</div>' if invalid else "") + "</fieldset>")
        return wiz(ORG_STEPS, 1, "What should PromiseHub do for you?", "Switch any module on or off later.", tiles,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-org"), skip=page("onboard-program"))
    S.add("default", "Step 2 of 6: a preset for which modules are on; the whole suite is recommended.", user=M, exit_href=page("setup"), org=ORG, main=form(),
          notes=note("“Let me choose” opens the same module list as Settings › Modules (settings-modules) inside the wizard.", "top: 5rem; right: 1rem;"))
    S.add("invalid", "Continue pressed with nothing chosen.", user=M, exit_href=page("setup"), org=ORG, main=form(choice="", invalid=True))
    S.add("submitting", "Saving the module configuration.", user=M, exit_href=page("setup"), org=ORG, main=form(busy=True))
    S.add("error", "Saving failed.", user=M, exit_href=page("setup"), org=ORG, main=failed(form(), "We couldn’t save that", "Try again."))


@screen("onboard-program", "page", "Set up: first program", route="/welcome/program", reqs=[R_TTV, R_ROLL], shell="wizard", na=NA_FORM)
def onboard_program(S):
    def form(err=None, busy=False, name="After-School Tutoring"):
        e = err or {}
        body = (field("prog", "Program name", value=name, autofocus=True, error=e.get("prog", ""), help_="A club, class or camp.")
                + day_chips()
                + f'<div class="two-col">{field("start", "Starts", type_="time", value="16:00")}{field("end", "Ends", type_="time", value="18:00")}</div>')
        return wiz(ORG_STEPS, 2, "When does your first program meet?", "Check-in opens at these times.", body,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-modules"), skip=page("onboard-roster"))
    S.add("default", "Step 3 of 6: name, days and time of the first program.", user=M, exit_href=page("setup"), org=ORG, main=form())
    S.add("invalid", "No program name.", user=M, exit_href=page("setup"), org=ORG, main=form(err={"prog": "Name the program."}, name=""))
    S.add("submitting", "Saving the program.", user=M, exit_href=page("setup"), org=ORG, main=form(busy=True))
    S.add("error", "The save failed.", user=M, exit_href=page("setup"), org=ORG, main=failed(form(), "We couldn’t save that", "Try again."))


@screen("onboard-roster", "page", "Set up: children", route="/welcome/children", reqs=[R_TTV, R_ENROLL], shell="wizard",
        na={"loading": "The choice is static.", "empty": "The step asks how to fill an empty roster; that is its default."})
def onboard_roster(S):
    def form(choice="import", invalid=False, busy=False):
        tiles = ('<fieldset class="field"><legend class="field__label">How would you like to add children?</legend><div class="choice-tiles">'
                 + tile("how", "Import a spreadsheet", "Google Sheets, Excel or CSV.", checked=choice == "import", invalid=invalid)
                 + tile("how", "Add one family by hand", "For a handful of children.", checked=choice == "manual", invalid=invalid)
                 + tile("how", "Let guardians enroll themselves", "Send a link; families sign up.", checked=choice == "link", invalid=invalid)
                 + "</div>" + ('<div class="field__error">Pick one to continue.</div>' if invalid else "") + "</fieldset>")
        return wiz(ORG_STEPS, 3, "Who comes to After-School Tutoring?", "Pick one way to start.", tiles,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-program"), skip=page("onboard-staff"))
    S.add("default", "Step 4 of 6: three ways to fill the roster, import recommended.", user=M, exit_href=page("setup"), org=ORG, main=form(),
          notes=note("Continue with Import opens the import wizard (import-roster) inside the same shell, then returns here as the success state.", "top: 5rem; right: 1rem;"))
    S.add("invalid", "Continue pressed with nothing chosen.", user=M, exit_href=page("setup"), org=ORG, main=form(choice="", invalid=True))
    S.add("submitting", "The spreadsheet is being read: a determinate bar, the page stays put.", user=M, exit_href=page("setup"), org=ORG,
          main=wiz(ORG_STEPS, 3, "Reading your spreadsheet", "harbourview-roster.xlsx · 112 rows",
                   progress(62, 100, "Import progress", show="62%") + '<p class="hint">About ten seconds.</p>',
                   primary=btn("Importing…", "primary", busy=True), form=False))
    S.add("success", "Imported: the numbers, two things to check, and on to staff.", user=M, exit_href=page("setup"), org=ORG,
          main=wiz(ORG_STEPS, 3, "48 children from 32 households", "From harbourview-roster.xlsx.",
                   receipt(["48 children, 32 households, 61 guardians", "9 allergies and 2 medications flagged", "41 approved pickup adults"])
                   + alert("warning", "2 rows need a look", "Two guardians have no mobile number.", actions=btn("Review the 2", "ghost", size="sm", href=page("families"))),
                   primary=btn("Continue", "primary", icon_name="arrow-right", href=page("onboard-staff")), back=page("onboard-roster"), form=False))
    S.add("error", "The file couldn’t be read.", user=M, exit_href=page("setup"), org=ORG,
          main=failed(form(), "We couldn’t read that file", "Export as .xlsx or .csv and try again."))


@screen("onboard-staff", "page", "Set up: staff", route="/welcome/staff", reqs=[R_TTV, R_SEC], shell="wizard", na=NA_FORM)
def onboard_staff(S):
    def row(i, email="", role="Site lead", err=""):
        return (f'<div class="invite-row">{field(f"inv{i}", f"Email {i}", type_="email", value=email, error=err, placeholder="name@example.org")}'
                f'{select(f"role{i}", f"Role {i}", ["Site lead", "Youth worker", "Volunteer", "Admin"], selected=role)}</div>')

    def form(err=None, busy=False, rows=None):
        e = err or {}
        rows = rows or [("jaylen@harbourview.example", "Site lead"), ("aisha@harbourview.example", "Youth worker"), ("", "Youth worker")]
        body = ('<div class="stack">' + "".join(row(i + 1, em, ro, e.get(f"inv{i + 1}", "")) for i, (em, ro) in enumerate(rows)) + "</div>"
                + '<p class="hint">Add more later in Settings › Staff.</p>')
        return wiz(ORG_STEPS, 4, "Who runs your sessions?", "Each gets an email link. No passwords.", body,
                   primary=btn("Send invitations", "primary", type_="submit", icon_name="send", busy=busy), back=page("onboard-roster"), skip=page("onboard-first-event"))
    S.add("default", "Step 5 of 6: up to three invitations with a role each.", user=M, exit_href=page("setup"), org=ORG, main=form())
    S.add("invalid", "One address isn’t an email.", user=M, exit_href=page("setup"), org=ORG,
          main=form(err={"inv2": "Enter a valid email address."}, rows=[("jaylen@harbourview.example", "Site lead"), ("aisha@harbourview", "Youth worker"), ("", "Youth worker")]))
    S.add("submitting", "Sending.", user=M, exit_href=page("setup"), org=ORG, main=form(busy=True))
    S.add("error", "Sending failed.", user=M, exit_href=page("setup"), org=ORG,
          main=failed(form(), "The invitations didn’t send", "Try again, or skip and invite from Settings › Staff."))


@screen("onboard-first-event", "page", "Set up: first slip", route="/welcome/first-slip", reqs=[R_TTV, R_SLIPS], shell="wizard", na=NA_FORM)
def onboard_first_event(S):
    def form(err=None, busy=False, name="Fall field trip: Royal Botanical Gardens"):
        e = err or {}
        body = (field("ev", "Event name", value=name, autofocus=True, error=e.get("ev", ""))
                + f'<div class="two-col">{field("date", "Date", type_="date", value="2026-11-14")}{field("due", "Sign by", type_="date", value="2026-11-12")}</div>'
                + switch("slip", "Needs a signed permission slip", checked=True, desc="We draft it; you edit before sending."))
        return wiz(ORG_STEPS, 5, "What’s the first thing families need to sign?", "A trip, a swim, a photo release.", body,
                   primary=btn("Write the slip", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-staff"), skip=page("onboard-done"))
    S.add("default", "Step 6 of 6: an event that needs a slip.", user=M, exit_href=page("setup"), org=ORG, main=form(),
          notes=note("“Write the slip” opens the slip editor (slip-editor) pre-filled from this event; sending it completes setup.", "top: 5rem; right: 1rem;"))
    S.add("invalid", "No event name.", user=M, exit_href=page("setup"), org=ORG, main=form(err={"ev": "Name the event."}, name=""))
    S.add("submitting", "Creating the event and drafting the slip.", user=M, exit_href=page("setup"), org=ORG, main=form(busy=True))
    S.add("error", "Creating the event failed.", user=M, exit_href=page("setup"), org=ORG,
          main=failed(form(), "We couldn’t create the event", "Try again, or skip and add it from Events."))


@screen("onboard-done", "page", "Set up: done", route="/welcome/done", reqs=[R_TTV], shell="wizard",
        na={"loading": "Static summary of what the wizard created.", "empty": "Reached only after at least the organization exists.", "error": "Nothing is saved on this screen."})
def onboard_done(S):
    S.add("default", "Everything configured; the first slip is out and signatures will arrive.", user=M, exit_href="", org=ORG,
          main=hero("check-circle", "Harbourview is ready", "The slip is on its way to 48 households.",
                    btn("Open Today", "primary", size="lg", href=page("today")) + btn("Watch signatures arrive", "", href=page("event")),
                    extra=receipt(["Harbourview Youth Collective · Canada", "Whole suite: 8 modules on", "After-School Tutoring · Mon–Thu, 4:00–6:00 pm", "48 children from 32 households", "2 staff invited", "Slip sent to 48 households for the RBG trip"])),
          toast_html=toast_region(toast("success", "Slip sent", "48 households")))


# ---------------------------------------------------------------- Staff flow (after accept-invite)
@screen("onboard-staff-phone", "page", "Get ready: your phone", route="/welcome/phone", reqs=[R_TTV, R_NOTIFY, R_MOBILE], shell="wizard", na=NA_FORM)
def onboard_staff_phone(S):
    def form(err=None, busy=False, phone="289-555-0177"):
        e = err or {}
        body = (field("mobile", "Mobile number", type_="tel", value=phone, autofocus=True, inputmode="tel", autocomplete="tel", error=e.get("mobile", ""), help_="Guardians never see it.")
                + switch("alerts", "Text me when a child on my roster is marked absent", checked=True))
        return wiz(STAFF_STEPS, 0, "Where should alerts reach you?", "Change it any time in your account.", body,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), skip=page("onboard-staff-sessions"), label="Getting ready")
    S.add("default", "Sam, just invited as a youth worker: step 1 of 3, a mobile number.", user=SAM, exit_href=page("today"), org=ORG, main=form())
    S.add("invalid", "Not a phone number.", user=SAM, exit_href=page("today"), org=ORG, main=form(err={"mobile": "Enter a full mobile number."}, phone="289-555"))
    S.add("submitting", "Saving.", user=SAM, exit_href=page("today"), org=ORG, main=form(busy=True))
    S.add("error", "Saving failed.", user=SAM, exit_href=page("today"), org=ORG,
          main=failed(form(), "We couldn’t save that", "Try again, or skip."))


@screen("onboard-staff-sessions", "page", "Get ready: your sessions", route="/welcome/sessions", reqs=[R_TTV, R_ROLL], shell="wizard",
        na={"loading": "Programs are already loaded when the invitation is accepted.", "empty": "An organization with no programs skips this step."})
def onboard_staff_sessions(S):
    def form(invalid=False, busy=False, on=("tutoring", "sports")):
        tiles = ('<fieldset class="field"><legend class="field__label">Programs you help run</legend><div class="choice-tiles">'
                 + tile("prog", "After-School Tutoring", "Mon–Thu, 4:00–6:00 pm · 48 children", checked="tutoring" in on, type_="checkbox", invalid=invalid)
                 + tile("prog", "Saturday Sports", "Sat, 10:00 am–12:00 pm · 62 children", checked="sports" in on, type_="checkbox", invalid=invalid)
                 + tile("prog", "One-to-one Mentoring", "By appointment · 19 children", checked="mentoring" in on, type_="checkbox", invalid=invalid)
                 + "</div>" + ('<div class="field__error">Pick at least one, or skip.</div>' if invalid else "") + "</fieldset>"
                 + '<p class="hint">Saved on your phone; works offline.</p>')
        return wiz(STAFF_STEPS, 1, "Which sessions do you run?", "They appear on your Today page.", tiles,
                   primary=btn("Continue", "primary", type_="submit", icon_name="arrow-right", busy=busy), back=page("onboard-staff-phone"), skip=page("onboard-staff-ready"), label="Getting ready")
    S.add("default", "Step 2 of 3: pick programs from the organization’s list.", user=SAM, exit_href=page("today"), org=ORG, main=form())
    S.add("invalid", "Nothing picked.", user=SAM, exit_href=page("today"), org=ORG, main=form(invalid=True, on=()))
    S.add("submitting", "Saving and caching rosters.", user=SAM, exit_href=page("today"), org=ORG, main=form(busy=True))
    S.add("error", "Saving failed.", user=SAM, exit_href=page("today"), org=ORG,
          main=failed(form(), "We couldn’t save that", "Try again, or skip."))


@screen("onboard-staff-ready", "page", "Get ready: done", route="/welcome/ready", reqs=[R_TTV, R_ROLL, R_MOBILE], shell="wizard",
        na={"loading": "Static.", "empty": "If no session is scheduled the page shows the next one; the organization always has one after setup.", "error": "Nothing is saved on this screen."})
def onboard_staff_ready(S):
    S.add("default", "Step 3 of 3: ready; tonight’s session is one tap away.", user=SAM, exit_href="", org=ORG,
          main=hero("clipboard", "You’re ready, Sam", "Tutoring night starts at 4:00 pm today in Room 2.",
                    btn("Open tonight’s check-in", "primary", size="lg", href=page("check-in")) + btn("Look around first", "", href=page("today")),
                    extra=receipt(["Alerts go to 289-555-0177", "After-School Tutoring and Saturday Sports, saved on this phone", "Incident reports go to Marisol Delgado"])),
          notes=note("On iOS and Android a second card offers “Add PromiseHub to your home screen” so check-in is one tap from the lock screen.", "top: 5rem; right: 1rem;"))
