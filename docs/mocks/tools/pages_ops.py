"""Operations pages: program/event/slip forms, slips list, messaging, incidents, reports, attendance, import."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_core import R_ENROLL, R_SLIPS, R_ROLL, R_NOTIFY, R_INC, R_REPORTS, R_PRIVACY, R_DATA, event_row

M = STAFF["marisol"]
T = STAFF["tom"]
J = STAFF["jaylen"]
R_INTEG, R_TTV, R_COST = "L1-004", "L1-004", "L1-020"


def form_actions(primary: str, cancel_href: str, *, busy=False, extra="") -> str:
    return f'<div class="form-actions cluster">{extra}{btn("Cancel", "ghost", href=cancel_href)}{btn(primary, "primary", type_="submit", busy=busy)}</div>'


def skeleton_form(n=5) -> str:
    f = '<div class="field" aria-hidden="true"><span class="skeleton skeleton--text" style="width: 8rem;"></span><span class="skeleton skeleton--rect" style="height: var(--control-height-md);"></span></div>'
    return f'<div class="card stack form-width--md" aria-busy="true" aria-label="Loading form">{f * n}</div>'


# ------------------------------------------------------------------ Program form
@screen("program-form", "page", "Program form", route="/programs/new", reqs=[R_ENROLL], na={"empty": "A form has no collection to be empty of."})
def program_form(S):
    def form(err=None, busy=False, values=None, edit=False):
        v = values or dict(name="", when="", cap="", start="", end="", ages="6–13")
        e = err or {}
        return (f'<form class="card stack form-width--md" action="#" method="post" novalidate>'
                + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + field("name", "Program name", value=v["name"], error=e.get("name", ""), required=True, autofocus=not edit, help_="Shown to guardians.")
                + f'<div class="two-col">{field("start", "Starts", type_="date", value=v["start"], required=True, error=e.get("start", ""))}{field("end", "Ends", type_="date", value=v["end"], required=True)}</div>'
                + f'<div class="two-col">{field("when", "Schedule", value=v["when"], placeholder="Mon–Thu, 4–6 pm", help_="Free text.")}{field("term", "Term", value=v.get("term", ""), placeholder="2026–27", optional=True, error=e.get("term", ""), help_="Groups the programs that run together, such as Fall 2026.")}</div>'
                + f'<div class="two-col">{field("cap", "Capacity", type_="number", value=v["cap"], inputmode="numeric", help_="Extra enrollments join the waitlist.", error=e.get("cap", ""))}{field("ages", "Ages", value=v["ages"])}</div>'
                + fieldset("Enrollment", choice("enr", "Open now", small="Guardians can enroll on save", checked=True) + choice("enr", "Closed", small="Open later"))
                + fieldset("Season consent", switch("consent", "Require a season consent form at enrollment", checked=True, desc="Covers regular sessions."))
                + form_actions("Save program" if edit else "Create program", page("programs"), busy=busy) + "</form>")
    S.add("default", "Creating a program: name, dates, schedule, capacity, enrollment and consent options.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs"))], "New program") + page_header("New program") + form())
    S.add("loading", "Editing an existing program: the form loads with skeleton fields.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Edit") + page_header("Edit program") + skeleton_form())
    S.add("error", "The program to edit failed to load.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Edit") + page_header("Edit program") +
          card(empty("We couldn’t load this program", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Back to program", "ghost", href=page("program")), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Submitted with a missing name, a start after the end, and a non-numeric capacity: summary plus inline errors.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs"))], "New program") + page_header("New program") +
          form(err={"name": "Enter a program name.", "start": "Must be before 30 Jun 2027.", "cap": "Enter a whole number.", "term": "Keep the term under 40 characters."}, values=dict(name="", when="Mon–Thu, 4–6 pm", cap="fifty", start="2027-07-01", end="2027-06-30", ages="6–13")),
          notes=note("On submit, focus moves to the error summary; each item links to its field.", "top: 5rem; right: 1rem;"))
    S.add("submitting", "Saving: the primary button is busy, fields stay as typed, nothing shifts.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs"))], "New program") + page_header("New program") + form(busy=True, values=dict(name="Spring Break Camp 2027", when="Mon–Fri, 8 am–5 pm", cap="60", start="2027-03-15", end="2027-03-19", ages="6–13")))
    S.add("success", "Program created: what happens next and the enrollment link.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs"))], "Spring Break Camp 2027") +
          card(f'<div class="stack"><h1 class="empty__title">Spring Break Camp 2027 is ready</h1><p class="text-muted measure">Enrollment is open. Share the link.</p>'
               f'<div class="input-group"><label class="visually-hidden" for="new-link">Enrollment link</label><input class="input" id="new-link" type="url" readonly value="https://harbourview.promisehub.app/enroll/spring-break-2027"><button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-label="Copy enrollment link">{icon("copy")}</button></div>'
               f'<div class="cluster">{btn("Open the program", "primary", href=page("program", "empty"))}{btn("Text families the link", "", icon_name="send", href=page("new-message"))}{btn("Add an event", "ghost", href=page("event-form"))}</div></div>', cls="card--success form-width--md page-start"),
          toast_html=toast_region(toast("success", "Program created", "Spring Break Camp 2027 · enrollment open")))
    S.add("edit", "Editing After‑School Tutoring with its current values.", nav="programs", user=M,
          main=breadcrumb([("Programs", page("programs")), ("After‑School Tutoring", page("program"))], "Edit") + page_header("Edit program", "After‑School Tutoring") +
          form(values=dict(name="After‑School Tutoring", when="Mon–Thu, 4–6 pm", cap="50", start="2026-09-08", end="2027-06-24", ages="6–13"), edit=True))


# ------------------------------------------------------------------ Event form
@screen("event-form", "page", "Event form", route="/events/new", reqs=[R_SLIPS, R_ROLL], na={"empty": "A form has no collection to be empty of."})
def event_form(S):
    def form(err=None, busy=False, v=None, edit=False, weekly=False):
        v = v or dict(name="", prog="After‑School Tutoring", start="", end="", place="", notes="")
        repeat_desc = ("Every Thursday at this time, until the program’s last day." if weekly
                       else "Off: one session. Turn it on to repeat it every week until the program ends.")
        repeat = "" if edit else switch("weekly", "Repeat weekly", checked=weekly, desc=repeat_desc)
        repeat_err = f'<div class="field__error" id="weekly-error">{esc(e_w)}</div>' if (e_w := (err or {}).get("weekly", "")) else ""
        e = err or {}
        return (f'<form class="card stack form-width--md" action="#" method="post" novalidate>'
                + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + field("name", "Event name", value=v["name"], error=e.get("name", ""), required=True, autofocus=not edit, placeholder="Fall field trip: Royal Botanical Gardens")
                + select("prog", "Program", ["After‑School Tutoring", "Saturday Sports", "One-to-one Mentoring", "Winter Camp 2026"], selected=v["prog"], help_="Roster comes from the program.")
                + f'<div class="two-col">{field("start", "Starts", type_="datetime-local", value=v["start"], required=True, error=e.get("start", ""))}{field("end", "Ends", type_="datetime-local", value=v["end"], required=True)}</div>'
                + repeat + repeat_err
                + field("place", "Where", value=v["place"], help_="For trips, include the bus stop.")
                + fieldset("Permission slip", choice("slip", "Not needed", small="Season consent covers it", checked=not v["name"].lower().startswith("fall")) + choice("slip", "Required", small="Write it next", checked=v["name"].lower().startswith("fall")), error=e.get("slip", ""), fid="slip")
                + fieldset("Attendance", switch("noshow", "Text guardians if not checked in 15 min after start", checked=True, desc="Delay: Settings › Notifications."))
                + textarea("notes", "Notes for staff", value=v["notes"], optional=True, rows=2)
                + form_actions("Save event" if edit else "Create event", page("events"), busy=busy) + "</form>")
    S.add("default", "Creating an event on a program roster.", nav="events", main=breadcrumb([("Events", page("events"))], "New event") + page_header("New event") + form())
    S.add("loading", "Editing an event: loading its values.", nav="events", main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Edit") + page_header("Edit event") + skeleton_form(6))
    S.add("error", "The event to edit failed to load.", nav="events", main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Edit") + page_header("Edit event") +
          card(empty("We couldn’t load this event", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Back to event", "ghost", href=page("event")), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Missing name and an end before the start.", nav="events", main=breadcrumb([("Events", page("events"))], "New event") + page_header("New event") +
          form(err={"name": "Enter an event name.", "start": "Must be before 3:00 pm."}, v=dict(name="", prog="After‑School Tutoring", start="2026-11-14T16:00", end="2026-11-14T15:00", place="Royal Botanical Gardens", notes="")))
    S.add("submitting", "Saving the event.", nav="events", main=breadcrumb([("Events", page("events"))], "New event") + page_header("New event") +
          form(busy=True, v=dict(name="Swim trip: Jimmy Thompson Pool", prog="Saturday Sports", start="2026-11-28T10:00", end="2026-11-28T13:00", place="Jimmy Thompson Memorial Pool · bus leaves the centre 9:30 am", notes="")))
    S.add("success", "Event created; a slip is required so the next step is writing it.", nav="events", main=breadcrumb([("Events", page("events"))], "Swim trip") +
          card(f'<div class="stack"><h1 class="empty__title">Swim trip is on the calendar</h1><p class="text-muted measure">Sat 28 Nov, 10:00 am–1:00 pm · 62 children. Permission slip needed.</p>'
               f'<div class="cluster">{btn("Write the slip", "primary", icon_name="clipboard", href=page("slip-editor"))}{btn("Open the event", "", href=page("event", "empty"))}</div></div>', cls="card--success form-width--md page-start"),
          toast_html=toast_region(toast("success", "Event created", "Swim trip: Jimmy Thompson Pool · Sat 28 Nov")))
    weekly_v = dict(name="Tutoring night", prog="After‑School Tutoring", start="2026-11-12T16:00", end="2026-11-12T18:00", place="Harbourview Community Centre, Room 2", notes="")
    S.add("weekly", "Scheduling Tutoring night every Thursday: Repeat weekly is on and says how many sessions it makes, through the program’s last day.", nav="events", user=STAFF["marisol"],
          main=breadcrumb([("Events", page("events"))], "New event") + page_header("New event") + form(v=weekly_v, weekly=True))
    S.add("weekly-invalid", "Repeat weekly with a start after the program ends: the error says when the program ends.", nav="events", user=STAFF["marisol"],
          main=breadcrumb([("Events", page("events"))], "New event") + page_header("New event") +
          form(err={"start": "Start on or before the program’s last day, Thu 24 Jun 2027."}, v=dict(weekly_v, start="2027-07-01T16:00", end="2027-07-01T18:00"), weekly=True))
    S.add("weekly-created", "33 weekly sessions created: the first one opens and a toast says how many were scheduled.", nav="events", user=STAFF["marisol"],
          main=breadcrumb([("Events", page("events"))], "Tutoring night") + page_header("Tutoring night", "Thu 12 Nov, 4:00–6:00 pm · After‑School Tutoring · 48 on roster") +
          card(facts([("When", "Thursday 12 November 2026, 4:00–6:00 pm"), ("Repeats", "Weekly · 33 sessions, through Thu 24 Jun 2027")]), title="Details", tid="details"),
          toast_html=toast_region(toast("success", "Event created", "Tutoring night · 33 weekly sessions")))
    S.add("edit", "Editing the field trip.", nav="events", main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Edit") + page_header("Edit event", "Fall field trip: Royal Botanical Gardens") +
          form(v=dict(name="Fall field trip: Royal Botanical Gardens", prog="After‑School Tutoring", start="2026-11-14T09:00", end="2026-11-14T15:00", place="Royal Botanical Gardens, Burlington · bus from the centre, leaves 8:45 am sharp", notes="Lunch provided for 6 families on request. 4 volunteers confirmed."), edit=True))


# ------------------------------------------------------------------ Slips list
@screen("slips", "page", "Slips", route="/slips", reqs=[R_SLIPS], na={})
def slips(S):
    hdr = page_header("Permission slips", "2 open · 30 unsigned · median sign time 9 h", btn("New slip", "primary", icon_name="plus", href=page("slip-editor")))

    def row(name, meta, signed, total, state="default"):
        pct = round(100 * signed / total) if total else 0
        return (f'<li class="list__item"><span class="icon-tile" aria-hidden="true">{icon("clipboard")}</span><div class="list__body"><a class="list__title" href="{page("event", state)}">{esc(name)}</a><div class="list__meta">{meta}</div>'
                f'<div style="margin-top: var(--space-2); max-width: 24rem;">{progress(signed, total, f"{name}: {signed} of {total} signed", kind="success" if pct == 100 else "", show=f"{signed} of {total} · {pct}%")}</div></div>'
                f'{badge("All signed", "success") if pct == 100 else badge(f"{total - signed} unsigned", "warning")}</li>')
    rows = [row("Fall field trip: Royal Botanical Gardens", "Due Thu 12 Nov · After‑School Tutoring · reminders Tue & Thu", 41, 48),
            row("Winter Camp · Day 1", "Due Fri 18 Dec · Winter Camp 2026 · sent Mon 2 Nov", 12, 35, "upcoming"),
            row("Season consent 2026–27", "No deadline · all programs · sent Tue 2 Sep", 184, 184, "upcoming"),
            row("Pumpkin patch trip", "Closed Fri 23 Oct · Saturday Sports", 60, 62, "cancelled")]
    S.add("default", "Every slip with its completion and deadline.", nav="events", user=M, main=hdr + chips([("Open", True), ("Closed", False), ("All", False)], "Filter slips") + ul_list(rows, label="Permission slips"))
    S.add("loading", "Slips loading.", nav="events", main=page_header("Permission slips", "") + skeleton_list(4, "Loading slips"))
    S.add("empty", "No slips yet.", nav="events", user=M, main=page_header("Permission slips", "") + card(empty("No slips yet", "Create an event that needs a slip.", action=btn("New event", "primary", icon_name="plus", href=page("event-form")), icon_name="clipboard"), cls="card--flush"))
    S.add("error", "Slips failed to load.", nav="events", main=page_header("Permission slips", "") + card(empty("We couldn’t load slips", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Closed filter with nothing closed yet this season.", nav="events", user=M, main=hdr + chips([("Open", False), ("Closed", True), ("All", False)], "Filter slips") + card(empty("No closed slips this season", "Switch to Open or All.", action=btn("Show open slips", ""), icon_name="inbox"), cls="card--flush"))


# ------------------------------------------------------------------ Slip editor
@screen("slip-editor", "page", "Slip editor", route="/events/:id/slip", reqs=[R_SLIPS, R_NOTIFY, R_COST], na={"empty": "A form has no collection to be empty of."})
def slip_editor(S):
    def form(err=None, busy=False, v=None, edit=False):
        v = v or dict(title="Fall field trip: Royal Botanical Gardens", intro="We’re taking the After‑School Tutoring group to the Royal Botanical Gardens on Saturday 14 November. The bus leaves the centre at 8:45 am and returns by 3:00 pm. Please pack a nut-free lunch, a water bottle and a rain jacket.", due="2026-11-12")
        e = err or {}
        fields_ = ('<ul class="list" style="margin: 0 calc(-1 * var(--space-6));">'
                   + list_item("Child’s name, allergies and medication", "Pre-filled; guardian confirms", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("heart-pulse", "icon--sm")}</span>', end=badge("Always", ""))
                   + list_item("Emergency contact", "Pre-filled", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("phone", "icon--sm")}</span>', end=badge("Always", ""))
                   + list_item("Photo permission for this trip", "Yes / No", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("camera", "icon--sm")}</span>', end=switch("f-photo", '<span class="visually-hidden">Ask for photo permission</span>', checked=True))
                   + list_item("Swimming ability", "Can swim / Needs a flotation device / Can’t swim", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("sun", "icon--sm")}</span>', end=switch("f-swim", '<span class="visually-hidden">Ask about swimming ability</span>'))
                   + list_item("Lunch needed", "Yes / No, we’ll pack one", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("star", "icon--sm")}</span>', end=switch("f-lunch", '<span class="visually-hidden">Ask whether lunch is needed</span>', checked=True))
                   + '</ul>')
        return (f'<form class="stack" action="#" method="post" novalidate><div class="split" style="margin-top: 0;"><div class="stack">'
                + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + card(field("title", "Slip title", value=v["title"], required=True, error=e.get("title", ""))
                       + textarea("intro", "What guardians read before signing", value=v["intro"], rows=5, error=e.get("intro", ""), help_="Translated into Spanish and French; review before sending.", count=f"{len(v['intro'])} / 600")
                       + f'<div class="two-col">{field("due", "Sign by", type_="date", value=v["due"], required=True, error=e.get("due", ""), help_="Unsigned children stay flagged until the event.")}{select("remind", "Reminders", ["Tue and Thu at 6 pm until signed", "Daily at 6 pm until signed", "Once, 2 days before", "None"], selected="Tue and Thu at 6 pm until signed")}</div>', title="The slip", tid="slip")
                + card(fields_ + '<p class="hint" style="margin-top: var(--space-3);">Guardians sign with a typed name.</p>', title="What the guardian confirms", tid="fields")
                + card(fieldset("Send by", choice("ch", "Text and email", small="44 by text, 4 by email · about 48 SMS segments", checked=True) + choice("ch", "Email only", small="Free; slower") + choice("ch", "Don’t send yet", small="Save draft"), error=e.get("ch", ""), fid="ch")
                       + alert("info", "SMS this month: 1,212 of 2,000 segments", "This slip and reminders: about 144 more.", role="status"), title="Delivery", tid="deliver")
                + f'</div><aside class="stack" aria-label="Preview"><div class="card"><h2 class="card__title">Phone preview</h2>{sms(f"Harbourview Youth: Please sign Mateo’s permission slip for “{v["title"]}” by Thu 12 Nov: hbv.ph/s/8k2q (reply STOP to opt out)", segments=2)}<p class="hint" style="margin-top: var(--space-3);"><a href="{page("slip-sign")}">Open the guardian’s page</a></p></div></aside></div>'
                + form_actions("Save and send" if not edit else "Save changes", page("event"), busy=busy, extra=btn("Save draft", "")) + "</form>")
    S.add("default", "Writing the field-trip slip: text, what the guardian confirms, deadline, reminders, channel and a phone preview.", nav="events", user=M,
          main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip", "Fall field trip: Royal Botanical Gardens · 48 households") + form())
    S.add("loading", "Loading an existing slip to edit.", nav="events", main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip") + skeleton_form(4))
    S.add("error", "The slip failed to load.", nav="events", main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip") +
          card(empty("We couldn’t load this slip", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Back to event", "ghost", href=page("event")), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Empty text and a deadline after the event.", nav="events", user=M, main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip", "Fall field trip: Royal Botanical Gardens") +
          form(err={"intro": "Enter the slip text.", "due": "Must be before Sat 14 Nov."}, v=dict(title="Fall field trip: Royal Botanical Gardens", intro="", due="2026-11-20")))
    S.add("submitting", "Sending to 48 households; the button is busy and the form is read-only.", nav="events", user=M, main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip", "Fall field trip: Royal Botanical Gardens") + form(busy=True))
    S.add("success", "Sent: how many went by text and email, and where to watch signatures.", nav="events", user=M, main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") +
          card(f'<div class="stack"><h1 class="empty__title">Slip sent to 48 households</h1><p class="text-muted measure">44 by text, 4 by email. Reminders Tue and Thu, 6 pm.</p>'
               f'<div class="cluster">{btn("Watch signatures", "primary", href=page("event"))}{btn("Back to events", "ghost", href=page("events"))}</div></div>', cls="card--success form-width--md page-start"),
          toast_html=toast_region(toast("success", "Slip sent", "48 households · 44 text, 4 email")))
    S.add("edit", "Editing a slip that already has 41 signatures: changes to the text re-open signing.", nav="events", user=M, main=breadcrumb([("Events", page("events")), ("Fall field trip", page("event"))], "Permission slip") + page_header("Permission slip", "Fall field trip: Royal Botanical Gardens · 41 of 48 signed") +
          alert("warning", "41 guardians have already signed this text", "Changing the terms re-opens signing for everyone.") + form(edit=True))


# ------------------------------------------------------------------ Messages
@screen("messages", "page", "Messages", route="/messages", reqs=[R_NOTIFY, R_COST], na={})
def messages(S):
    hdr = page_header("Messages", "14 sent this month · 1,212 of 2,000 SMS segments used", btn("New message", "primary", icon_name="send", href=page("new-message")))

    def row(title, meta, sender, d=badge("Delivered", "success")):
        return list_item(title, meta, person=sender, href=page("message"), end=d)
    rows = [row("Trip reminder: sign by Thursday", "Yesterday, 5:05 pm · 7 guardians · After‑School Tutoring · text", M),
            row("Saturday Sports is cancelled this week", "Fri 30 Oct, 2:14 pm · 62 guardians · text and email", STAFF["priya"], badge("1 bounced", "warning")),
            row("Recordatorio: la excursión al RBG", "Thu 29 Oct, 6:00 pm · 21 guardians · Spanish households · text", M),
            row("Winter Camp registration is open", "Mon 26 Oct, 9:00 am · 112 guardians · email", T),
            row("Picture day on Thursday", "Tue 20 Oct, 4:30 pm · 48 guardians · ages 6–9 · text", J)]
    S.add("default", "Sent messages with audience, channel and delivery.", nav="messages", user=M, main=hdr + chips([("All", True), ("Text", False), ("Email", False), ("Scheduled", False), ("Drafts 1", False)], "Filter messages") + ul_list(rows, label="Sent messages") + f'<div class="list-more">{btn("Show 9 more", "ghost")}</div>')
    S.add("loading", "Messages loading.", nav="messages", main=page_header("Messages", "") + skeleton_list(5, "Loading messages"))
    S.add("empty", "No messages sent yet.", nav="messages", user=M, main=page_header("Messages", "") + card(empty("No messages yet", "Message guardians by program, age or language.", action=btn("New message", "primary", icon_name="send", href=page("new-message")), icon_name="message"), cls="card--flush"))
    S.add("error", "Messages failed to load.", nav="messages", main=page_header("Messages", "") + card(empty("We couldn’t load messages", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Scheduled filter with nothing scheduled.", nav="messages", user=M, main=hdr + chips([("All", False), ("Text", False), ("Email", False), ("Scheduled", True), ("Drafts 1", False)], "Filter messages") + card(empty("Nothing scheduled", "Scheduled messages appear here.", action=btn("Show all", ""), icon_name="clock"), cls="card--flush"))
    S.add("long", "A year of messages, paged.", nav="messages", user=M, main=hdr.replace("14 sent this month", "168 sent this year") + chips([("All", True), ("Text", False), ("Email", False), ("Scheduled", False), ("Drafts 1", False)], "Filter messages") + ul_list(rows * 3, label="Sent messages") +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–25 of 168</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')


@screen("new-message", "page", "New message", route="/messages/new", reqs=[R_NOTIFY, R_COST, "L1-019"], na={"empty": "A form has no collection to be empty of.", "loading": "The compose form is static; recipient counts load inline."})
def new_message(S):
    def form(err=None, busy=False, body="Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp. Pack a nut-free lunch and a rain jacket.", count=48, none=False, over=False):
        e = err or {}
        n = 0 if none else count
        chars = len(body) + 20
        segs = max(1, -(-chars // 153)) if chars > 160 else 1
        rc = (f'<div class="recipient-count" role="status"><strong>{n}</strong> guardians · {n and n - 4 or 0} by text, {n and 4 or 0} by email · about {n * segs} SMS segments</div>')
        audience = card(select("prog", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"], selected="After‑School Tutoring")
                        + f'<div class="two-col">{select("ages", "Ages", ["All ages", "6–9", "10–13"], selected="All ages")}{select("lang", "Language", ["All languages", "English", "Spanish", "French"], selected="All languages")}</div>'
                        + fieldset("Also narrow to", choice("f", "Guardians who haven’t signed the RBG slip", small="7 households", type_="checkbox", attrs=' name="f1"') + choice("f", "Children absent today", small="2 households", type_="checkbox", attrs=' name="f2"'))
                        + rc, title="Who", tid="who")
        msg = card(textarea("body", "Message", value=body, rows=5, error=e.get("body", ""), help_="Machine-translated per household language.", count=f"{chars} / 480")
                   + fieldset("Send by", choice("ch", "Text, email for households without a mobile", small="Uses SMS segments", checked=True) + choice("ch", "Email only", small="Free") + choice("ch", "Text only", small="Skips 4 households"), fid="ch")
                   + fieldset("When", choice("when", "Now", checked=True) + choice("when", "Schedule", small="Pick a time")), title="What", tid="what")
        prev = f'<aside class="stack" aria-label="Preview"><div class="card"><h2 class="card__title">Carmen Rivera’s view</h2>{sms("Harbourview Youth: " + body, segments=segs, chars=chars, over=over)}<p class="hint" style="margin-top: var(--space-3);">Tap to review the Spanish version.</p></div></aside>'
        return (f'<form class="stack" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "") +
                f'<div class="split" style="margin-top: 0;"><div class="stack">{audience}{msg}</div>{prev}</div>' +
                f'<div class="form-actions cluster">{btn("Save draft", "")}{btn("Cancel", "ghost", href=page("messages"))}{btn(f"Send to {n} guardians", "primary", type_="submit", busy=busy, disabled=none)}</div></form>')
    S.add("default", "Composing a reminder to the tutoring program with a live recipient count, SMS cost and a phone preview.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") + form())
    S.add("error", "Recipient count couldn’t be computed; the form stays editable.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") +
          alert("danger", "We couldn’t count recipients", "Try again; Send stays off until counted.", actions=btn("Try again", "primary", size="sm", icon_name="refresh")) + form(none=True).replace('<strong>0</strong> guardians · 0 by text, 0 by email · about 0 SMS segments', '<strong>—</strong> guardians · count unavailable'))
    S.add("invalid", "Empty message body and no channel chosen.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") + form(err={"body": "Enter a message."}, body=""))
    S.add("submitting", "Sending to 48 guardians.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") + form(busy=True))
    S.add("success", "Sent: delivery is tracked on the message page.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "Sent") +
          card(f'<div class="stack"><h1 class="empty__title">Sent to 48 guardians</h1><p class="text-muted measure">44 by text, 4 by email. Delivery and replies on the message page.</p>'
               f'<div class="cluster">{btn("See delivery", "primary", href=page("message"))}{btn("Back to messages", "ghost", href=page("messages"))}</div></div>', cls="card--success form-width--md page-start"),
          toast_html=toast_region(toast("success", "Message sent", "48 guardians · 44 text, 4 email")))
    S.add("no-results", "Filters that match nobody: the count is zero and Send is disabled with a reason.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") +
          form(none=True).replace('<div class="recipient-count" role="status">', '<div class="recipient-count" role="status" aria-describedby="none-why">').replace('about 0 SMS segments</div>', 'about 0 SMS segments</div><p class="field__error" id="none-why">Nobody matches. Loosen a filter.</p>'))
    S.add("over-cap", "The organization is at its monthly SMS cap: text is disabled, email still works.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "New message") + page_header("New message") +
          alert("warning", "You’ve used all 2,000 SMS segments this month", "Texts resume 1 December. Email still sends.", actions=f'<a class="btn btn--sm" href="{page("billing")}">Raise the cap</a>') +
          form(over=True).replace('<label class="choice"><input type="radio" name="ch" checked>', '<label class="choice"><input type="radio" name="ch" disabled>').replace('<label class="choice"><input type="radio" name="ch"><span class="choice__text">Email only<small>Free</small>', '<label class="choice"><input type="radio" name="ch" checked><span class="choice__text">Email only<small>Free</small>'))


@screen("message", "page", "Message", route="/messages/:id", reqs=[R_NOTIFY], na={"empty": "A sent message always has recipients."})
def message(S):
    hdr = breadcrumb([("Messages", page("messages"))], "Saturday Sports is cancelled this week") + page_header("Saturday Sports is cancelled this week", "Sent by Priya Raman · Fri 30 Oct, 2:14 pm · 62 guardians · text and email", btn("Resend to bounced", "", icon_name="send", data_href=dialog("send-reminder")) + btn("Send again", "", icon_name="copy", href=page("new-message")))
    body = card(f'{sms("Harbourview Youth: Saturday Sports is cancelled this week because the gym is closed for voting. See you 7 Nov. Reply with any questions.", segments=1)}<p class="hint" style="margin-top: var(--space-3);">Also sent in Spanish (21) and French (9).</p>', title="Message", tid="msg")
    delivery = card(kpis([("Delivered", "61", "within 2 minutes"), ("Opened link", "—", "no link"), ("Replied", "4", "see below"), ("Bounced", "1", "email")]).replace('class="kpis"', 'class="kpis"') +
                    table("Delivery by guardian", ["Guardian", "Household", "Channel", "Status", "When"], [
                        ["Carmen Rivera", "Rivera", "Text (Spanish)", badge("Delivered", "success"), "2:14 pm"],
                        ["Dana Thompson", "Thompson", "Text", badge("Delivered", "success"), "2:14 pm"],
                        ["Bola Adeyemi", "Adeyemi", "Email", badge("Bounced", "danger"), "2:15 pm"],
                        ["Nour Haddad", "Haddad", "Text (French)", badge("Delivered", "success"), "2:14 pm"],
                        ["Linh Tran", "Tran", "Text", badge("Replied", "info"), "2:31 pm"],
                    ], cls="table-wrap--flush"), title="Delivery", tid="delivery", cls="card--flush", footer=f'<a href="{page("household")}">Fix Bola Adeyemi’s email</a>')
    replies = card('<ul class="feed">'
                   f'<li>{avatar(GUARDIANS["linh"])}<div class="feed__body"><strong>Linh Tran</strong> “Thanks for letting us know!”<div class="feed__meta">Fri 30 Oct, 2:31 pm</div></div></li>'
                   f'<li>{avatar(GUARDIANS["dana"])}<div class="feed__body"><strong>Dana Thompson</strong> “Is the 7th still on?”<div class="feed__meta">Fri 30 Oct, 3:02 pm · <a href="{page("new-message")}">Reply</a></div></div></li>'
                   '</ul>', title="Replies · 4", tid="replies", cls="stack")
    S.add("default", "A sent message: text, per-guardian delivery with one bounce, and replies.", nav="messages", user=M, main=hdr + f'<div class="split"><div class="stack">{delivery}</div><div class="stack">{body}{replies}</div></div>')
    S.add("loading", "Message loading.", nav="messages", main=breadcrumb([("Messages", page("messages"))], "Loading") + f'<div class="page-header" aria-busy="true"><div>{skeleton_header()}</div></div>{skeleton_kpis()}{skeleton_list(5, "Loading delivery")}<h1 class="visually-hidden">Message</h1>')
    S.add("error", "Message failed to load.", nav="messages", main=breadcrumb([("Messages", page("messages"))], "Message") + page_header("Message") + card(empty("We couldn’t load this message", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("All messages", "ghost", href=page("messages")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("partial", "Delivery loaded but replies didn’t.", nav="messages", user=M, main=hdr + f'<div class="split"><div class="stack">{delivery}</div><div class="stack">{body}{card(empty("Replies didn’t load", "Try again.", action=btn("Try again", "", icon_name="refresh"), error=True, icon_name="alert-triangle"), title="Replies", tid="replies", cls="card--flush")}</div></div>')
    S.add("scheduled", "A message scheduled for later: editable until it sends.", nav="messages", user=M, main=breadcrumb([("Messages", page("messages"))], "Winter Camp: pack list") +
          page_header("Winter Camp: pack list <span class=\"badge badge--info\">Scheduled</span>", "Sends Fri 18 Dec, 6:00 pm · 35 guardians · text and email", btn("Edit", "", icon_name="edit", href=page("new-message")) + btn("Send now", "primary", icon_name="send", data_href=dialog("send-now")) + btn("Cancel send", "ghost", data_href=dialog("cancel-send"))) +
          f'<div class="split">{card(sms("Harbourview Youth: Winter Camp starts Monday! Pack: indoor shoes, lunch, water bottle, warm layers for the outdoor hour. Drop-off from 8 am.", segments=1), title="Message", tid="msg")}</div>')


# ------------------------------------------------------------------ Incidents
@screen("incidents", "page", "Incidents", route="/incidents", reqs=[R_INC, R_PRIVACY], na={})
def incidents(S):
    hdr = page_header("Incident log", "2 open · 11 closed · supervisors only", btn("Report an incident", "primary", icon_name="flag", href=page("new-incident")))
    rows = [list_item("Fall on the stairs · Jordan Thompson", "Today, 5:12 pm · Tutoring night · reported by Jaylen Okafor · guardian called", lead=f'<span class="icon-tile" aria-hidden="true">{icon("flag")}</span>', href=page("incident"), end=badge("Needs review", "warning")),
            list_item("Allergic reaction, mild · Lily Chen", "Sat 31 Oct, 11:20 am · Saturday Sports · reported by Priya Raman", lead=f'<span class="icon-tile" aria-hidden="true">{icon("flag")}</span>', href=page("incident", "reviewed"), end=badge("Open", "info")),
            list_item("Pickup by unapproved adult, refused · Amara Okonkwo", "Thu 22 Oct, 6:05 pm · Tutoring night · reported by Aisha Bello", lead=f'<span class="icon-tile" aria-hidden="true">{icon("flag")}</span>', href=page("incident", "reviewed"), end=badge("Closed", "success")),
            list_item("Behaviour · two children, names restricted", "Mon 19 Oct, 4:40 pm · Tutoring night · reported by Jaylen Okafor", lead=f'<span class="icon-tile" aria-hidden="true">{icon("flag")}</span>', href=page("incident", "reviewed"), end=badge("Closed", "success"))]
    S.add("default", "The incident log a supervisor sees: open items first.", nav="incidents", user=M, main=hdr + chips([("Open 2", True), ("Closed 11", False), ("All", False)], "Filter incidents") + ul_list(rows, label="Incidents"))
    S.add("loading", "Incidents loading.", nav="incidents", main=page_header("Incident log", "") + skeleton_list(4, "Loading incidents"))
    S.add("empty", "No incidents this season.", nav="incidents", user=M, main=page_header("Incident log", "") + card(empty("No incidents reported", "Reports land here and in your email.", action=btn("Report an incident", "", icon_name="flag", href=page("new-incident")), icon_name="shield"), cls="card--flush"))
    S.add("error", "Incidents failed to load.", nav="incidents", main=page_header("Incident log", "") + card(empty("We couldn’t load the incident log", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A youth worker opening the log: they can report, not read.", nav="incidents", user=STAFF["aisha"], main=page_header("Incident log", "") +
          card(empty("Only supervisors can read the log", "You can report one; Marisol Delgado reviews it.", action=btn("Report an incident", "primary", icon_name="flag", href=page("new-incident")) + btn("Your reports", "ghost", href=page("account")), icon_name="lock"), cls="card--flush"))
    S.add("no-results", "Closed filter for a program with none.", nav="incidents", user=M, main=hdr + chips([("Open 2", False), ("Closed 11", True), ("All", False)], "Filter incidents") + select("inc-prog", "Program", ["All programs", "One-to-one Mentoring"], selected="One-to-one Mentoring", visually_hidden_label=True).replace('class="field"', 'class="field" style="margin-top: var(--space-3); max-width: 16rem;"') + card(empty("No closed incidents in Mentoring", "Clear the program filter.", action=btn("Clear filters", ""), icon_name="inbox"), cls="card--flush"))


@screen("new-incident", "page", "Report incident", route="/incidents/new", reqs=[R_INC], na={"empty": "A form has no collection to be empty of.", "loading": "The report form is static and works offline."})
def new_incident(S):
    def form(err=None, busy=False, v=None):
        v = v or dict(what="", action="", child="Jordan Thompson")
        e = err or {}
        return (f'<form class="card stack form-width--md" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + fieldset("Type", choice("type", "Injury", checked=True) + choice("type", "Illness or allergic reaction") + choice("type", "Behaviour") + choice("type", "Pickup or safeguarding concern") + choice("type", "Other"), error=e.get("type", ""), fid="type")
                + field("child", "Child or children involved", value=v["child"], help_="Type a name from tonight’s roster.", error=e.get("child", ""), required=True)
                + f'<div class="two-col">{field("when", "When", type_="datetime-local", value="2026-11-05T17:12", required=True)}{select("where", "Where", ["Room 2", "Stairwell", "Gym", "Outside", "Bus", "Other"], selected="Stairwell")}</div>'
                + textarea("what", "What happened", value=v["what"], rows=4, error=e.get("what", ""), help_="Facts only, in order.")
                + textarea("action", "What you did", value=v["action"], rows=3, error=e.get("action", ""), help_="First aid, who you called, when.")
                + fieldset("Guardian", choice("g", "Called and reached", small="Dana Thompson · 905-555-0177", checked=True) + choice("g", "Left a message") + choice("g", "Not yet contacted", small="Say why below"))
                + fieldset("Severity", choice("sev", "Minor", small="First aid only", checked=True) + choice("sev", "Moderate", small="Went home or saw a doctor") + choice("sev", "Serious", small="911 called or hospital"))
                + alert("info", "Goes to Marisol Delgado", "Emailed at once; only supervisors and you can read it.", role="status")
                + f'<div class="form-actions cluster">{btn("Save draft", "")}{btn("Cancel", "ghost", href=page("check-in", "complete"))}{btn("Submit report", "primary", type_="submit", busy=busy)}</div></form>')
    S.add("default", "A site lead filing a structured incident report from a phone after a fall.", nav="incidents", main=page_header("Report an incident", "Tutoring night · Today") + form())
    S.add("error", "Submitting failed; the report is kept on the device.", nav="incidents", main=page_header("Report an incident", "Tutoring night · Today") +
          alert("danger", "Report not sent", "Saved on this phone; sends when you’re back online.", actions=btn("Try again", "primary", size="sm", icon_name="refresh")) +
          form(v=dict(what="Jordan slipped on the second-floor stairs at 5:12 pm while going down to the washroom. He hit his left knee. No head contact.", action="Ice pack for 10 minutes, checked range of motion, he walked unaided. Called Dana Thompson at 5:20 pm; she picked him up at 5:45 pm.", child="Jordan Thompson")))
    S.add("invalid", "Submitted without what happened or what was done.", nav="incidents", main=page_header("Report an incident", "Tutoring night · Today") + form(err={"what": "Describe what happened.", "action": "Describe what you did."}))
    S.add("submitting", "Submitting the report.", nav="incidents", main=page_header("Report an incident", "Tutoring night · Today") + form(busy=True, v=dict(what="Jordan slipped on the second-floor stairs at 5:12 pm while going down to the washroom. He hit his left knee. No head contact.", action="Ice pack for 10 minutes, checked range of motion, he walked unaided. Called Dana Thompson at 5:20 pm; she picked him up at 5:45 pm.", child="Jordan Thompson")))
    S.add("success", "Filed and routed: who was told and what happens next.", nav="incidents", main=card(f'<div class="stack"><h1 class="empty__title">Report filed</h1><p class="text-muted measure">Sent to Marisol Delgado and attached to Jordan’s record.</p>'
                                                                                                        f'<div class="cluster">{btn("Open the report", "primary", href=page("incident"))}{btn("Back to Today", "ghost", href=page("today"))}</div></div>', cls="card--success form-width--md page-start"),
          toast_html=toast_region(toast("success", "Incident reported", "Sent to Marisol Delgado at 5:52 pm")))


@screen("incident", "page", "Incident", route="/incidents/:id", reqs=[R_INC, R_PRIVACY, R_DATA], na={"empty": "An incident always has a report body."})
def incident(S):
    hdr = breadcrumb([("Incidents", page("incidents"))], "Fall on the stairs") + page_header("Fall on the stairs · Jordan Thompson", "Today, 5:12 pm · Tutoring night · reported by Jaylen Okafor at 5:52 pm", btn("Mark reviewed", "primary", icon_name="check", data_href=dialog("review-incident")) + btn("Export PDF", "", icon_name="download", data_href=dialog("export-data")))
    report = card(facts([("Type", "Injury · minor"), ("Child", f'<a href="{page("child")}">Jordan Thompson</a>, 11'), ("Where", "Stairwell, second floor"), ("What happened", "Jordan slipped on the second-floor stairs at 5:12 pm while going down to the washroom. He hit his left knee. No head contact."), ("What was done", "Ice pack for 10 minutes, checked range of motion, he walked unaided. Called Dana Thompson at 5:20 pm; she picked him up at 5:45 pm."), ("Guardian", "Dana Thompson · called and reached, 5:20 pm"), ("Witnesses", "Aisha Bello")]), title="Report", tid="report")
    follow = card(textarea("fu", "Add a follow-up", rows=3, placeholder="Spoke with Dana this morning; knee is bruised, no doctor visit.") + f'<div class="form-actions cluster">{btn("Add follow-up", "primary", type_="submit")}</div>', title="Follow-up", tid="follow", tag="form")
    trail = card('<ol class="audit"><li class="audit__item"><span class="audit__when">Today, 5:52 pm</span><span>Jaylen Okafor submitted the report</span></li><li class="audit__item"><span class="audit__when">Today, 5:52 pm</span><span>Emailed to Marisol Delgado</span></li><li class="audit__item"><span class="audit__when">Today, 6:30 pm</span><span>Marisol Delgado opened the report</span></li></ol>', title="Trail", tid="trail")
    S.add("default", "A supervisor reviewing tonight’s incident: the structured report, follow-up and trail.", nav="incidents", user=M, main=hdr + f'<div class="split"><div class="stack">{report}{follow}</div><div class="stack">{trail}</div></div>')
    S.add("loading", "Incident loading.", nav="incidents", main=breadcrumb([("Incidents", page("incidents"))], "Loading") + f'<div class="page-header" aria-busy="true"><div>{skeleton_header()}</div></div>{skeleton_list(5, "Loading report")}<h1 class="visually-hidden">Incident</h1>')
    S.add("error", "Incident failed to load.", nav="incidents", main=breadcrumb([("Incidents", page("incidents"))], "Incident") + page_header("Incident") + card(empty("We couldn’t load this report", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Incident log", "ghost", href=page("incidents")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A youth worker following a link to someone else’s report.", nav="incidents", user=STAFF["aisha"], main=breadcrumb([("Incidents", page("incidents", "forbidden"))], "Incident") + page_header("Incident report") +
          card(empty("You can’t open this report", "Only the reporter and supervisors can read it.", action=f'<a class="btn" href="mailto:marisol@harbourview.example">{icon("mail")}Email Marisol</a>' + btn("Back", "ghost", href=page("today")), icon_name="lock"), cls="card--flush"))
    S.add("reviewed", "A closed, reviewed incident: read-only with the supervisor’s note.", nav="incidents", user=M, main=breadcrumb([("Incidents", page("incidents"))], "Pickup refused") +
          page_header("Pickup by unapproved adult, refused · Amara Okonkwo <span class=\"badge badge--success\">Closed</span>", "Thu 22 Oct, 6:05 pm · reviewed by Marisol Delgado on Fri 23 Oct", btn("Export PDF", "", icon_name="download", data_href=dialog("export-data")) + btn("Reopen", "ghost", data_href=dialog("review-incident"))) +
          alert("success", "Reviewed and closed", "Marisol Delgado, Fri 23 Oct: “Aisha followed the pickup policy exactly. Chidi has since added his brother to Amara’s approved list.”") +
          f'<div class="split">{report.replace("Injury · minor", "Pickup or safeguarding concern").replace("Jordan Thompson</a>, 11", "Amara Okonkwo</a>, 7").replace("Stairwell, second floor", "Room 2 door").replace("Jordan slipped on the second-floor stairs at 5:12 pm while going down to the washroom. He hit his left knee. No head contact.", "A man identifying as Amara’s uncle asked to take her home at 6:05 pm. He was not on the approved list and had no ID.").replace("Ice pack for 10 minutes, checked range of motion, he walked unaided. Called Dana Thompson at 5:20 pm; she picked him up at 5:45 pm.", "Declined politely, kept Amara inside, called Chidi Okonkwo at 6:07 pm who confirmed the uncle and came himself at 6:30 pm.").replace("Dana Thompson · called and reached, 5:20 pm", "Chidi Okonkwo · called and reached, 6:07 pm").replace("Aisha Bello", "Jaylen Okafor")}</div>')


# ------------------------------------------------------------------ Reports
@screen("reports", "page", "Reports", route="/reports", reqs=[R_REPORTS, R_PRIVACY], na={})
def reports(S):
    hdr = page_header("Reports", "Sep 2026 to today", btn("Export", "primary", icon_name="download", data_href=dialog("export-data")))
    filters = (f'<div class="toolbar">{select("rp-range", "Period", ["This season (Sep 2026– )", "Last 30 days", "Last season (2025–26)", "Custom…"], visually_hidden_label=True)}{select("rp-prog", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"], visually_hidden_label=True)}{select("rp-funder", "Funder template", ["Standard", "Ontario Trillium Foundation", "United Way Halton & Hamilton", "City of Hamilton"], visually_hidden_label=True)}</div>')
    numbers = kpis([("Children served", "184", "unique, this season"), ("Attendance rate", "89.4%", "across 312 sessions"), ("Sessions delivered", "312", "9 this week"), ("Signed online", "93%", "median 9 h to sign")])
    demo = card(table("Children by age and gender", ["Age", "#Girls", "#Boys", "#Non-binary / not said", "#Total"], [["6‑8", "31", "28", "2", "61"], ["9‑11", "38", "35", "1", "74"], ["12‑13", "24", "22", "3", "49"], ["<strong>Total</strong>", "<strong>93</strong>", "<strong>85</strong>", "<strong>6</strong>", "<strong>184</strong>"]], cls="table-wrap--flush table-wrap--fit") +
                '<p class="hint" style="padding: var(--space-3) var(--space-4);">Exports show counts under 5 as “&lt;5”.</p>', title="Demographics", tid="demo", cls="card--flush")
    att = card('<ul class="progress-chart">' + "".join(f'<li><span class="progress-row__label">{n}</span><div class="progress" role="progressbar" aria-valuenow="{v}" aria-valuemin="0" aria-valuemax="100" aria-label="{n}: {v}% attendance"><div class="progress__bar" style="--value: {v}%;"></div></div><span class="progress-row__label">{v}%</span></li>' for n, v in [("After‑School Tutoring", 91), ("Saturday Sports", 88), ("One-to-one Mentoring", 94), ("Winter Camp 2026", 0)]) + "</ul>" +
              '<p class="hint" style="margin-top: var(--space-3);">Winter Camp hasn’t started.</p>', title="Attendance by program", tid="att")
    lang = card('<ul class="progress-chart">' + "".join(f'<li><span class="progress-row__label">{n}</span><div class="progress" role="progressbar" aria-valuenow="{v}" aria-valuemin="0" aria-valuemax="112" aria-label="{n}: {v} households"><div class="progress__bar" style="--value: {round(100 * v / 112)}%;"></div></div><span class="progress-row__label">{v}</span></li>' for n, v in [("English", 82), ("Spanish", 21), ("French", 9)]) + "</ul>", title="Households by language", tid="lang")
    S.add("default", "The director’s report page: headline numbers, demographics table, attendance and language charts, one-click export.", nav="reports", user=M, main=hdr + filters + numbers + f'<div class="split"><div class="stack">{demo}</div><div class="stack">{att}{lang}</div></div>',
          notes=note("Every number here comes from registration, slips and check-in; nothing is retyped. Export produces CSV or the funder’s spreadsheet template.", "top: 5rem; right: 1rem;"))
    S.add("forbidden", "A youth worker opening Reports.", nav="reports", user=STAFF["aisha"], main=f'<div class="error-page">{empty("Reports are for directors and site leads", "Ask a program director for the numbers you need.", action=btn("Go to Today", "primary", href=page("today")), icon_name="lock", heading="h1")}</div>')
    S.add("loading", "Reports computing.", nav="reports", main=page_header("Reports", "") + skeleton_kpis() + f'<div class="split">{skeleton_list(4, "Loading demographics")}{skeleton_list(3, "Loading attendance")}</div>')
    S.add("empty", "No attendance recorded yet, so there is nothing to report.", nav="reports", user=M, main=page_header("Reports", "") + card(empty("No data to report yet", "Record attendance first.", action=btn("Open check-in", "primary", href=page("check-in", "empty")), icon_name="chart"), cls="card--flush"))
    S.add("error", "Reports failed to compute.", nav="reports", main=page_header("Reports", "") + card(empty("We couldn’t build the report", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Export raw attendance", "", data_href=dialog("export-data")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "A custom range with no sessions in it.", nav="reports", user=M, main=hdr + filters.replace("This season (Sep 2026– )", "Custom…").replace('<option>Custom…</option>', '<option selected>Custom…</option>').replace('<option selected>This season (Sep 2026– )</option>', '<option>This season (Sep 2026– )</option>') +
          f'<div class="two-col form-width--md">{field("rp-from", "From", type_="date", value="2026-08-01")}{field("rp-to", "To", type_="date", value="2026-08-31")}</div>' +
          card(empty("No sessions between 1 and 31 August 2026", "Widen the range.", action=btn("This season", ""), icon_name="calendar"), cls="card--flush"))
    S.add("submitting", "Export running: a determinate progress bar, the page stays usable.", nav="reports", user=M, main=hdr.replace(btn("Export", "primary", icon_name="download", data_href=dialog("export-data")), btn("Exporting…", "primary", busy=True)) + filters +
          alert("info", "Building the Ontario Trillium Foundation export", progress(62, 100, "Export progress", show="62%") + '<p class="hint" style="margin-top: var(--space-2);">About 10 seconds; also emailed to you.</p>', role="status") + numbers + f'<div class="split"><div class="stack">{demo}</div><div class="stack">{att}{lang}</div></div>')
    S.add("success", "Export finished: download and a note that it was emailed.", nav="reports", user=M, main=hdr + filters +
          alert("success", "Export ready", "harbourview-otf-2026-27-season.xlsx · 184 children, 312 sessions · emailed to you.", actions=btn("Download", "primary", size="sm", icon_name="download") + btn("Export again", "ghost", size="sm", data_href=dialog("export-data")), dismiss=True) + numbers + f'<div class="split"><div class="stack">{demo}</div><div class="stack">{att}{lang}</div></div>',
          toast_html=toast_region(toast("success", "Export ready", "harbourview-otf-2026-27-season.xlsx", action="Download")))


# ------------------------------------------------------------------ Import roster
@screen("import-roster", "page", "Import roster", route="/import", reqs=[R_INTEG, R_TTV, R_ENROLL], na={"empty": "The import wizard starts empty by design; the default state is that screen."})
def import_roster(S):
    steps = lambda cur: '<p class="steps"><span class="steps__dots" aria-hidden="true">' + "".join(f'<span class="steps__dot{" steps__dot--current" if i == cur else (" steps__dot--done" if i < cur else "")}"></span>' for i in range(3)) + f'</span>Step {cur + 1} of 3</p>'
    upload = (f'<div class="dropzone" role="group" aria-labelledby="dz-title"><span class="icon-tile" aria-hidden="true">{icon("upload")}</span><h2 class="dropzone__title" id="dz-title">Drop your spreadsheet here</h2><p class="dropzone__text">CSV or XLSX · one row per child · up to 5,000 rows</p>'
              f'<label class="btn btn--primary" for="file">{icon("file")}Choose file<input class="visually-hidden" id="file" type="file" accept=".csv,.xlsx"></label></div>'
              f'<details class="accordion"><summary style="padding: var(--space-3) var(--space-4); cursor: pointer;">Required columns</summary><div class="accordion__body"><p>Child name plus a guardian name with phone or email. Other columns are matched or kept as notes.</p><p><a href="#dz-title">Download the template</a></p></div></details>')
    mapping = ('<div class="mapping" role="table" aria-label="Column mapping"><span class="overline" role="columnheader">Your column</span><span></span><span class="overline" role="columnheader">PromiseHub field</span>'
               + "".join(f'<div role="row" style="display: contents;"><div role="cell"><span class="mapping__source">{src}</span><span class="mapping__sample">e.g. {ex}</span></div>{icon("arrow-right")}<div role="cell">{select(f"map-{i}", f"Map {src}", opts, selected=sel, visually_hidden_label=True)}</div></div>' for i, (src, ex, opts, sel) in enumerate([
                   ("Student", "Mateo Rivera", ["Child name", "Guardian name", "Skip"], "Child name"), ("DOB", "2017-03-14", ["Date of birth", "Skip"], "Date of birth"), ("Parent", "Carmen Rivera", ["Guardian name", "Child name", "Skip"], "Guardian name"),
                   ("Cell", "905-555-0142", ["Guardian phone", "Guardian email", "Skip"], "Guardian phone"), ("Allergies/Meds", "Peanuts – EpiPen", ["Allergies and medication", "Notes", "Skip"], "Allergies and medication"), ("Pick-up OK", "Luis Rivera, Rosa Alvarez", ["Approved pickups", "Notes", "Skip"], "Approved pickups"), ("Lang", "ES", ["Language", "Skip"], "Language"), ("T-shirt", "M", ["Notes", "Skip"], "Notes")]))
               + "</div>")
    S.add("default", "Step 1: drop the Sheets export; what columns are needed.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "Sheets, Excel or CSV · about ten minutes") + steps(0) + f'<div class="card stack form-width--lg">{upload}</div>')
    S.add("mapping", "Step 2: columns matched automatically, each one adjustable; 112 rows previewed.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "roster-fall-2026.csv · 112 rows · 8 columns") + steps(1) +
          f'<form class="card stack form-width--lg" action="#" method="post">{alert("success", "7 of 8 columns matched automatically", "Check Pick-up OK and T-shirt, then choose a program.", role="status")}{mapping}{select("imp-prog", "Enroll everyone in", ["After‑School Tutoring", "Saturday Sports", "Don’t enroll yet, just create families"], selected="After‑School Tutoring", help_="Returning families are matched, not duplicated.")}<div class="form-actions cluster">{btn("Back", "ghost", href=page("import-roster"))}{btn("Import 112 rows", "primary", type_="submit")}</div></form>')
    S.add("invalid", "Step 2 with problems: a required column unmapped and 3 rows missing a guardian contact.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "roster-fall-2026.csv · 112 rows · 8 columns") + steps(1) +
          f'<form class="card stack form-width--lg" action="#" method="post">{form_summary([("map-3", "Map Guardian phone or email; 3 rows have neither."), ("imp-prog", "Choose a program.")])}{mapping.replace(select("map-3", "Map Cell", ["Guardian phone", "Guardian email", "Skip"], selected="Guardian phone", visually_hidden_label=True), select("map-3", "Map Cell", ["Guardian phone", "Guardian email", "Skip"], selected="Skip", visually_hidden_label=True, error="Rows 14, 57 and 91 have no contact."))}{select("imp-prog", "Enroll everyone in", ["Choose…", "After‑School Tutoring", "Saturday Sports", "Don’t enroll yet, just create families"], selected="Choose…", error="Choose a program.")}<div class="form-actions cluster">{btn("Back", "ghost", href=page("import-roster"))}{btn("Import 112 rows", "primary", type_="submit")}</div></form>')
    S.add("submitting", "Step 3: importing with a determinate progress bar.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "roster-fall-2026.csv · 112 rows") + steps(2) +
          f'<div class="card stack form-width--lg" aria-busy="true"><h2 class="card__title" style="margin: 0;">Importing… 68 of 112</h2>{progress(68, 112, "Import progress", show="61%")}<p class="text-muted">About 20 seconds left. Keep this page open.</p></div>')
    S.add("success", "Done: what was created, what was merged, the 3 rows to fix, and the next step: send the first slip.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") +
          card(f'<div class="stack"><h1 class="empty__title">Imported 109 of 112 rows</h1>{kpis([("Families created", "71", ""), ("Families updated", "38", "matched by phone"), ("Children", "184", "47 with medical notes"), ("Enrolled", "184", "After‑School Tutoring")])}'
               f'{alert("warning", "3 rows need a guardian phone or email", "Rows 14, 57 and 91 have no contact.", actions=btn("Fix the 3 families", "primary", size="sm", href=page("families", "edge")))}'
               f'<p class="text-muted measure">Next: open enrollment or send a slip.</p><div class="cluster">{btn("Send the first slip", "primary", icon_name="clipboard", href=page("event-form"))}{btn("See families", "", href=page("families"))}</div></div>', cls="card--success form-width--lg page-start"),
          toast_html=toast_region(toast("success", "Roster imported", "109 of 112 rows · 3 to fix")))
    S.add("error", "The file couldn’t be read.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "") + steps(0) +
          f'<div class="card stack form-width--lg">{alert("danger", "We couldn’t read roster-fall-2026.numbers", "Export as CSV or XLSX and try again. Nothing was imported.")}{upload}</div>')
    S.add("loading", "Reading the uploaded file before mapping.", nav="families", user=T, main=breadcrumb([("Families", page("families"))], "Import") + page_header("Import a roster", "roster-fall-2026.csv") + steps(0) +
          f'<div class="card stack form-width--lg" aria-busy="true" aria-label="Reading file"><span class="skeleton skeleton--title" aria-hidden="true"></span><span class="skeleton skeleton--text" aria-hidden="true"></span><span class="skeleton skeleton--card" aria-hidden="true" style="height: 12rem;"></span><p class="text-muted">Reading 112 rows…</p></div>')
