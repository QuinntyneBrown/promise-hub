"""Dialogs, sheets and menus, each shown over the page it opens from (that page is inert)."""
from kit import *  # noqa: F401,F403
from reg import screen, SCREENS, Builder
from pages_core import R_ENROLL, R_SLIPS, R_ROLL, R_PICKUP, R_NOTIFY, R_INC, R_REPORTS, R_PRIVACY, R_DATA
from pages_admin import R_SEC, R_COST

_cache: dict = {}


def base(sid: str, state: str = "default") -> dict:
    """Return the kwargs (main, nav, user, …) of a page state so a dialog can sit over it."""
    key = (sid, state)
    if key not in _cache:
        meta = next(s for s in SCREENS if s["id"] == sid and s["kind"] == "page")
        b = Builder(meta)
        meta["fn"](b)
        for st, _desc, kw in b.states:
            kw = dict(kw)
            kw.pop("notes", None)
            kw.pop("toast_html", None)
            kw.pop("overlays", None)
            kw.setdefault("shell", meta["shell"])
            _cache[(sid, st)] = kw
    return dict(_cache[key])


def over(sid: str, state: str = "default", **extra) -> dict:
    kw = base(sid, state)
    kw["inert"] = True
    kw.update(extra)
    return kw


def footer(primary: str, *, busy=False, cancel="Cancel", danger=False, extra="", disabled=False, autofocus_cancel=False) -> str:
    c = btn(cancel, "", attrs=' autofocus' if autofocus_cancel else "")
    p = btn(primary, "danger" if danger else "primary", type_="submit", busy=busy, disabled=disabled, attrs="" if (autofocus_cancel or busy) else " autofocus")
    return extra + c + p


def failed_alert(title: str, text: str) -> str:
    return alert("danger", title, text)


NA_NO_INPUTS = {"invalid": "The dialog has no inputs to validate."}


def simple(sid, title, opens_from, reqs, desc, body_fn, primary, *, icon_name="", danger=False, na=None, base_state="default", form=True,
           failed_text="", invalid_err=None, confirm_body=None, success_body=None, extra_states=None, cancel="Cancel", opens_kw=None):
    """Register a dialog with the standard state set."""
    na = dict(na or {})
    if invalid_err is None and "invalid" not in na:
        na["invalid"] = "The dialog has no inputs to validate."

    @screen(sid, "dialog", title, opens_from=opens_from, reqs=reqs, na=na)
    def _d(S):
        kw = opens_kw or {}
        def box(state, err=None, busy=False, alert_html="", body_override=None):
            d_title, d_desc = title if isinstance(title, str) else title, desc
            return dialog_box(d_title, d_desc, body_override if body_override is not None else body_fn(err), footer(primary, busy=busy, cancel=cancel, danger=danger, autofocus_cancel=danger), icon_name=icon_name, danger=danger, alert_html=alert_html, form=form)
        S.add("default", f"{title}: just opened, focus on the {'safe action' if danger else 'first field'}.", **over(opens_from, base_state, overlays=box("default"), **kw))
        if "busy" not in na:
            S.add("busy", f"{title}: confirm button busy, cancel still possible, no second submit.", **over(opens_from, base_state, overlays=box("busy", busy=True), **kw))
        if invalid_err is not None:
            S.add("invalid", f"{title}: validation errors inline, focus on the first invalid field.", **over(opens_from, base_state, overlays=box("invalid", err=invalid_err), **kw))
        if "failed" not in na:
            S.add("failed", f"{title}: the server call failed; inputs kept, retry.", **over(opens_from, base_state, overlays=box("failed", alert_html=failed_alert("That didn’t go through", failed_text or "Nothing was changed. Try again.")), **kw))
        if confirm_body is not None:
            S.add("confirm", f"{title}: extra friction before the destructive step.", **over(opens_from, base_state, overlays=box("confirm", body_override=confirm_body), **kw))
        if success_body is not None:
            S.add("success", f"{title}: done, with the next step inside the dialog.", **over(opens_from, base_state, overlays=dialog_box(title, "", success_body, btn("Done", "primary", attrs=" autofocus"), icon_name="check-circle", form=False), **kw))
        for st, (d, html) in (extra_states or {}).items():
            S.add(st, d, **over(opens_from, base_state, overlays=html, **kw))
    return _d


# ------------------------------------------------------------------ Check-in and pickup
simple("check-in-sheet", "Check in Kevin Tran", "check-in", [R_ROLL, "L1-008"], "Grade 3 · not yet here · no medical notes",
       lambda e: f'<div class="cluster">{avatar(CHILD["kevin"], "lg")}<div><div class="section-title">Kevin Tran</div><div class="text-muted">8 · Tran household · Linh Tran 289-555-0119</div></div></div>'
                 + fieldset("Arrived", choice("arr", "Now, 4:14 pm", checked=True) + choice("arr", "Earlier", small="Pick a time") + choice("arr", "Mark absent instead", small="Guardian is texted"))
                 + f'<p class="hint"><a href="{page("quick-card", "empty")}">Open Kevin’s Quick Card</a></p>',
       "Check in", icon_name="clipboard", na={"invalid": "Arrival is a radio group with a default; nothing can be invalid."})

simple("confirm-pickup", "Sign out Mateo Rivera", "check-in", [R_PICKUP, R_ROLL], "Pick from the approved list. Check ID if you don’t know them.",
       lambda e: fieldset("Picked up by", choice("who", f"Carmen Rivera <small>Mother · primary</small>", checked=not e) + choice("who", "Luis Rivera <small>Uncle · ask for ID</small>") + choice("who", "Rosa Alvarez <small>Grandmother · ask for ID</small>") + choice("who", "Someone else <small>Needs Carmen’s okay by phone</small>"), error=(e or {}).get("who", ""), fid="who")
                 + switch("idok", "I checked photo ID or know this person", checked=True) + field("time", "Time", type_="time", value="17:58", attrs=' style="max-width: 10rem;"'),
       "Sign out", icon_name="check", invalid_err={"who": "Choose who is taking Mateo home."},
       confirm_body=fieldset("Picked up by", choice("who", "Someone else <small>Needs Carmen’s okay by phone</small>", checked=True)) + alert("warning", "Not on the approved list", "Call Carmen Rivera before Mateo leaves.", actions=f'<a class="btn btn--primary btn--sm" href="tel:+19055550142">{icon("phone")}Call Carmen 905-555-0142</a>') + field("other", "Their name", value="Daniel Rivera") + switch("ok", "Carmen confirmed by phone at 5:58 pm") + switch("idok2", "I checked photo ID"))

simple("sign-on-tablet", "Sign on this tablet", "check-in", [R_SLIPS], "Hand the tablet to Linh Tran.",
       lambda e: f'<div class="slip-event"><span class="icon-tile" aria-hidden="true">{icon("bus")}</span><div><div class="slip-event__title">Fall field trip: Royal Botanical Gardens</div><div class="slip-event__meta">Kevin Tran and Emily Tran · Sat 14 Nov</div></div></div><p>I give permission for Kevin and Emily to attend this trip and for staff to give first aid and call emergency services if needed.</p>'
                 + field("sig", "Guardian types their full name", value="" if e else "Linh Tran", error=(e or {}).get("sig", ""), autofocus=True) + fieldset("Photos", choice("ph", "Okay", checked=True) + choice("ph", "No photos")),
       "Sign", base_state="day-of", icon_name="edit", invalid_err={"sig": "The guardian needs to type their full name."},
       success_body='<p>Kevin and Emily are cleared. Copy texted to 289-555-0119.</p>')

simple("end-session", "End Tutoring night?", "check-in", [R_ROLL, R_REPORTS], "15 children are not checked in and 31 are not signed out.",
       lambda e: fieldset("The 15 not checked in", choice("ni", "Mark absent", small="Guardians were texted at 4:15 pm", checked=True) + choice("ni", "Leave as not recorded", small="A gap in the report"))
                 + fieldset("The 31 not signed out", choice("so", "Sign out to a guardian at 6:00 pm", small="Everyone left at once", checked=True) + choice("so", "Leave unsigned", small="Sign out each child later")),
       "End session", icon_name="check-circle", na={"invalid": "Both groups have a default choice."})

simple("session-notes", "Session notes", "check-in", [R_ROLL], "For the next site lead or Marisol.",
       lambda e: textarea("notes", "Notes", value="Room 2 projector is broken again. Jordan and Mateo worked well together on fractions.", rows=4) + f'<p class="hint"><a href="{page("new-incident")}">Report an incident</a> instead.</p>',
       "Save notes", icon_name="edit", na={"invalid": "Notes are optional free text."})

simple("add-walk-in", "Add a walk-in to tonight", "check-in", [R_ROLL, R_ENROLL], "Tonight only. The office enrolls them tomorrow.",
       lambda e: field("name", "Child’s name", value="Nikolai Petrov", required=True, error=(e or {}).get("name", "")) + field("g", "Guardian’s name and phone", value="Elena Petrova · 289-555-0150", error=(e or {}).get("g", ""), required=True, help_="Reachable tonight.") + textarea("med", "Allergies or medical, as the guardian told you", rows=2, placeholder="None that we know of"),
       "Check in for tonight", base_state="no-results", icon_name="plus", invalid_err={"g": "Enter a guardian name and phone number."})

# ------------------------------------------------------------------ Enrollment and roster
simple("open-enrollment", "Open enrollment for After‑School Tutoring", "program", [R_ENROLL, "L1-004"], "One link and a QR code for all families.",
       lambda e: f'<div class="two-col">{field("cap", "Places", type_="number", value="50", inputmode="numeric", error=(e or {}).get("cap", ""))}{field("close", "Close on", type_="date", value="2026-09-30", optional=True, help_="Leave empty to keep it open.")}</div>'
                 + fieldset("When full", choice("full", "Waitlist in order of application", checked=True) + choice("full", "Close the link"))
                 + fieldset("Review", choice("rev", "I accept each enrollment", small="Listed under Waiting review", checked=True) + choice("rev", "Accept automatically until full")),
       "Open enrollment", icon_name="link", invalid_err={"cap": "Enter the number of places, at least 1."},
       success_body=f'<p>Share by text, email or paper.</p><div class="input-group"><label class="visually-hidden" for="enr-link">Enrollment link</label><input class="input" id="enr-link" type="url" readonly value="https://harbourview.promisehub.app/enroll/tutoring"><button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-label="Copy link">{icon("copy")}</button></div><div class="center">{qr("QR code for the enrollment link", "sm")}</div><div class="cluster" style="justify-content: center;">{btn("Text to 112 families", "", icon_name="send", href=page("new-message"))}{btn("Print poster", "ghost", icon_name="file")}</div>')

simple("close-enrollment", "Close enrollment?", "program", [R_ENROLL], "3 applications waiting review are kept.",
       lambda e: fieldset("Guardians who open the link will see", choice("msg", "“Enrollment is closed; join the waitlist”", checked=True) + choice("msg", "“Enrollment is closed” with the office number")), "Close enrollment", icon_name="lock", na={"invalid": "A radio group with a default."})

simple("review-enrollment", "Accept Nikolai Petrov?", "roster", [R_ENROLL, R_NOTIFY], "Returning family · applied Mon 2 Nov · 48 of 50 places taken.",
       lambda e: f'<div class="cluster">{avatar(CHILD["nikolai"], "lg")}<div><div class="section-title">Nikolai Petrov, 10</div><div class="text-muted">Elena Petrova · 289-555-0150 · English · medical: none</div></div></div>'
                 + fieldset("Decision", choice("dec", "Accept", small="On the roster tonight", checked=True) + choice("dec", "Waitlist", small="Position 1") + choice("dec", "Decline", small="Say why below"))
                 + textarea("why", "Note to the guardian", rows=2, optional=True, placeholder="Welcome back! Tutoring starts at 4 pm sharp."),
       "Accept and text Elena", icon_name="check", na={"invalid": "Decision has a default; the note is optional."},
       extra_states={"decline": ("Declining with a required reason.", dialog_box("Decline Nikolai Petrov?", "Elena Petrova reads the reason.", fieldset("Decision", choice("dec", "Decline", checked=True)) + textarea("why", "Reason the guardian will read", rows=3, error="Write a reason.", value=""), footer("Decline and text Elena", danger=True, autofocus_cancel=True), icon_name="x-circle", danger=True, form=True))})

# Review and place applicants (prompt 59, L2-072): over the application page.
_COHORTS = [("After‑School Tutoring", "48 of 50 places · applied for", False), ("Saturday Sports", "62 of 80 places", False), ("One-to-one Mentoring", "19 of 25 places", False), ("Winter Camp 2026", "60 of 60 places · full, waitlist instead", True)]


def _place_body(e=None, *, invite=True, learning=True, picked="After‑School Tutoring"):
    e = e or {}
    radios = "".join(choice("cohort", n, small=m, checked=(n == picked and not e.get("cohort")), attrs=" disabled" if full else "", invalid=bool(e.get("cohort"))) for n, m, full in _COHORTS)
    out = fieldset("Cohort", radios, error=e.get("cohort", ""), fid="cohort", hint="Zoe joins its roster now. A full cohort can’t take her; waitlist instead.")
    if learning:
        out += switch("invite", "Invite Zoe to PromiseHub as a youth", checked=invite, desc="She sets a password and starts Learning once Tanya consents.")
        if invite:
            out += field("invite-email", "Zoe’s email", type_="email", value="" if e.get("email") else "zoe.campbell@example.ca", error=e.get("email", ""), autocomplete="off")
    out += textarea("place-note", "Note to the family", rows=2, optional=True, placeholder="Welcome! Tutoring is Monday to Thursday, 4 to 6 pm.")
    return out


simple("place-applicant", "Place Zoe Campbell", "application", ["L2-072", R_ENROLL, R_NOTIFY], "Choose her cohort. Tanya Campbell is texted.",
       lambda e: _place_body(e), "Place and text Tanya", icon_name="check",
       invalid_err={"cohort": "Choose a cohort.", "email": "Enter an email like name@example.org."},
       extra_states={
           "no-invite": ("Placing without a youth invitation: the email field goes away.", dialog_box("Place Zoe Campbell", "Choose her cohort. Tanya Campbell is texted.", _place_body(invite=False), footer("Place and text Tanya"), icon_name="check", form=True)),
           "full": ("The cohort filled while the dialog was open: the server answers 422 and nothing changes.", dialog_box("Place Zoe Campbell", "Choose her cohort. Tanya Campbell is texted.", _place_body(), footer("Place and text Tanya"), icon_name="check", form=True, alert_html=alert("danger", "After‑School Tutoring is full (50 of 50). Waitlist instead."))),
           "learning-off": ("Learning is off, or a program director is placing: no youth invitation is offered.", dialog_box("Place Zoe Campbell", "Choose her cohort. Tanya Campbell is texted.", _place_body(learning=False), footer("Place and text Tanya"), icon_name="check", form=True)),
           "invite-failed": ("Placed, but the invitation was refused (Zoe already has access): the placement stands and the dialog says so.", dialog_box("Zoe is placed", "", alert("warning", "Zoe is in After‑School Tutoring, but the invitation wasn’t sent", "zoe.campbell@example.ca already has access. Invite her from her record.") , btn("Done", "primary", attrs=" autofocus"), icon_name="check-circle")),
       })

simple("decide-application", "Waitlist Zoe Campbell?", "application", ["L2-072", R_ENROLL, R_NOTIFY], "Next place on the After‑School Tutoring waitlist · Tanya Campbell is texted.",
       lambda e: fieldset("Decision", choice("dec", "Waitlist", small="Next place on the waitlist", checked=True) + choice("dec", "Decline", small="Say why below"))
                 + textarea("why", "Note to the family", rows=2, optional=True, placeholder="We’ll text you as soon as a place opens."),
       "Waitlist and text Tanya", icon_name="clock", na={"invalid": "Waitlist has a default and its note is optional; see decline for the required reason."},
       extra_states={"decline": ("Declining with the reason the family reads; without one the server answers 422.", dialog_box("Decline Zoe Campbell?", "Tanya Campbell reads the reason.", fieldset("Decision", choice("dec", "Waitlist", small="Next place on the waitlist") + choice("dec", "Decline", small="Say why below", checked=True)) + textarea("why", "Reason the family will read", rows=3, error="Write a reason the guardian will read.", value=""), footer("Decline and text Tanya", danger=True, autofocus_cancel=True), icon_name="x-circle", danger=True, form=True))})

simple("add-application-note", "Add a note", "application", ["L2-072", R_ENROLL], "Only staff see notes. Tanya and Rachel never do.",
       lambda e: textarea("app-note", "Note", rows=4, value="" if e else "Called Tanya: she knows about the referral and is happy for Zoe to start.", error=(e or {}).get("note", ""), count="76 / 2,000"),
       "Add note", icon_name="edit", invalid_err={"note": "Write a note of up to 2,000 characters."})

simple("move-in", "Move Sofía Rivera in?", "roster", [R_ENROLL, R_NOTIFY], "Number 1 on the waitlist · 48 of 50 places taken.",
       lambda e: textarea("why", "Note to the guardian", rows=2, optional=True, placeholder="A place opened. Camp starts at 8 am."),
       "Move in and text Carmen", icon_name="check", na={"invalid": "The note is optional."})

simple("bulk-review", "Accept 2 enrollments?", "roster", [R_ENROLL, R_NOTIFY], "Both guardians are texted.",
       lambda e: ul_list([list_item("Nikolai Petrov", "Elena Petrova · returning", person=CHILD["nikolai"]), list_item("Omar Siddiqui", "Farah Siddiqui · new family", person=CHILD["omar"])]) + textarea("why", "Note to both guardians", rows=2, optional=True, value="Welcome! Tutoring runs Mon–Thu, 4–6 pm."),
       "Accept 2", base_state="selected", icon_name="check", na={"invalid": "The note is optional."})

simple("enroll-in-program", "Add a child to After‑School Tutoring", "roster", [R_ENROLL], "Search existing children first.",
       lambda e: field("q", "Child’s name", value="Grace Ad", autofocus=True, error=(e or {}).get("q", "")) + ul_list([list_item("Grace Adeyemi, 11", "Adeyemi household · waiting review for this program", person=CHILD["grace"], end=btn("Choose", "", size="sm"))]) + f'<p class="hint">Not them? <a href="{dialog("add-family")}">Create a new family</a>.</p>',
       "Add to roster", icon_name="plus", invalid_err={"q": "Choose a child from the list, or create a new family."})

# ------------------------------------------------------------------ Cohort mentors (prompt 54, ADR 0048)
MENTOR_OPTIONS = ["Choose a mentor", "Daniel Osei", "Hana Kim"]

ASSIGN_DESC = "After‑School Tutoring · a youth has one mentor at a time."
simple("assign-mentor", "Assign a mentor to Mateo Rivera", "program", [R_ENROLL, "L1-024"], ASSIGN_DESC,
       lambda e: select("mentor", "Mentor", MENTOR_OPTIONS, selected="Choose a mentor" if e else "Daniel Osei", error=(e or {}).get("mentor", ""),
                        help_="Only active mentors of your organization are listed."),
       "Assign mentor", icon_name="users", invalid_err={"mentor": "Choose a mentor."},
       failed_text="Mateo’s mentor was not changed. Try again.",
       extra_states={"assigned": ("Sofía already has a mentor: Remove mentor sits beside Cancel.",
                                  dialog_box("Assign a mentor to Sofía Rivera", ASSIGN_DESC,
                                             select("mentor", "Mentor", MENTOR_OPTIONS, selected="Daniel Osei", help_="Only active mentors of your organization are listed."),
                                             footer("Assign mentor", extra=btn("Remove mentor", "ghost")), icon_name="users", form=True))})

simple("cohort-mentors", "Mentors for After‑School Tutoring", "program", [R_ENROLL, "L1-024"], "One lead mentor and any supporting mentors. A mentor can lead one cohort and support another.",
       lambda e: select("lead", "Lead mentor", MENTOR_OPTIONS, selected="Choose a mentor" if e else "Daniel Osei", error=(e or {}).get("lead", ""))
                 + fieldset("Supporting mentors", choice("support", "Daniel Osei", type_="checkbox") + choice("support", "Hana Kim", type_="checkbox", checked=True), hint="Optional."),
       "Save mentors", icon_name="users", invalid_err={"lead": "Choose a lead mentor."},
       failed_text="The cohort’s mentors were not changed. Try again.")

simple("remove-from-roster", "Remove Lily Chen from Summer Camp 2026?", "roster", [R_ENROLL, R_DATA], "Attendance stays in reports.",
       lambda e: fieldset("Why", choice("why", "Family withdrew", checked=True) + choice("why", "Moved to another program") + choice("why", "Added by mistake")) + switch("tell", "Text Wen Chen that Lily was removed"),
       "Remove from roster", base_state="long", icon_name="trash", danger=True, na={"invalid": "A radio group with a default."})

simple("add-family", "Add a family", "families", [R_ENROLL], "The guardian finishes the rest from a link.",
       lambda e: field("g", "Guardian’s name", value="" if e else "Farah Siddiqui", required=True, autofocus=True, error=(e or {}).get("g", "")) + field("ph", "Mobile", type_="tel", value="905-555-0170", inputmode="tel", error=(e or {}).get("ph", ""), help_="Phone or email.") + field("em", "Email", type_="email", value="", optional=True) + select("lang", "Language", ["English", "Spanish", "French"], selected="English") + switch("send", "Text them the enrollment link now", checked=True),
       "Add family", icon_name="users", invalid_err={"g": "Enter the guardian’s name.", "ph": "Enter a mobile number or an email."})

simple("add-child", "Add a child to the Rivera household", "household", [R_ENROLL, "L1-008"], "Carmen can add allergies and pickups from her link.",
       lambda e: field("name", "Child’s name", value="" if e else "Lucía Rivera", required=True, autofocus=True, error=(e or {}).get("name", "")) + f'<div class="two-col">{field("dob", "Date of birth", type_="date", value="2020-01-18", required=True, error=(e or {}).get("dob", ""))}{field("school", "School and grade", value="Bennetto Elementary, Kindergarten", optional=True)}</div>' + textarea("allergy", "Allergies and medical", rows=2, placeholder="Write “none” if there are none", optional=True) + switch("ask", "Text Carmen to confirm allergies and pickups", checked=True),
       "Add child", icon_name="plus", invalid_err={"name": "Enter the child’s name.", "dob": "Enter a date of birth."})

simple("add-guardian", "Add a guardian to the Rivera household", "household", [R_ENROLL, R_PICKUP], "Can sign slips and pick up every child.",
       lambda e: field("name", "Name", value="Rosa Alvarez", required=True, autofocus=True, error=(e or {}).get("name", "")) + select("rel", "Relationship", ["Mother", "Father", "Grandparent", "Legal guardian", "Other"], selected="Grandparent") + field("ph", "Mobile", type_="tel", value="905-555-0131", inputmode="tel", error=(e or {}).get("ph", "")) + select("lang", "Language", ["English", "Spanish", "French"], selected="Spanish") + switch("sign", "Can sign permission slips", checked=True),
       "Add guardian", icon_name="user", invalid_err={"ph": "Enter a mobile number."})

simple("edit-guardian", "Edit Luis Rivera", "household", [R_ENROLL, R_PICKUP], "Updates both Quick Cards.",
       lambda e: field("name", "Name", value="Luis Rivera", required=True) + select("rel", "Relationship", ["Mother", "Father", "Grandparent", "Legal guardian", "Uncle or aunt", "Other"], selected="Uncle or aunt") + field("ph", "Mobile", type_="tel", value="905-555-0199" if not e else "905-555", inputmode="tel", error=(e or {}).get("ph", "")) + switch("pick", "Approved to pick up", checked=True) + switch("sign", "Can sign permission slips"),
       "Save", icon_name="edit", invalid_err={"ph": "Enter a full mobile number."})

simple("edit-child", "Edit Mateo Rivera", "child", [R_ENROLL, R_DATA], "Medical has its own dialog.",
       lambda e: field("name", "Name", value="Mateo Rivera", required=True, error=(e or {}).get("name", "")) + f'<div class="two-col">{field("dob", "Date of birth", type_="date", value="2017-03-14", required=True)}{field("school", "School and grade", value="Bennetto Elementary, Grade 4")}</div>' + textarea("notes", "Notes for staff", value="Quiet first ten minutes; sits with Jordan.", rows=2, optional=True),
       "Save", icon_name="edit", invalid_err={"name": "Enter the child’s name."})

simple("edit-medical", "Edit Mateo’s medical information", "child", ["L1-008", R_PRIVACY, R_DATA], "Carmen Rivera is told. Logged.",
       lambda e: textarea("allergy", "Allergies", value="Peanuts (anaphylaxis); tree nuts (hives)", rows=2, error=(e or {}).get("allergy", "")) + textarea("meds", "Medication", value="EpiPen 0.3 mg, carried in backpack", rows=2) + textarea("cond", "Conditions", value="None", rows=1) + field("doc", "Doctor", value="Dr. Amrita Sethi · 905-555-0100") + fieldset("Quick Card alert", choice("sev", "Red alert on the Quick Card", small="Life-threatening", checked=True) + choice("sev", "List it under Medical only")),
       "Save and notify Carmen", icon_name="heart-pulse", invalid_err={"allergy": "Write the allergies, or “none”."})

simple("add-pickup", "Add an approved adult for Mateo", "child", [R_PICKUP], "Staff ask for photo ID.",
       lambda e: field("name", "Full name", value="" if e else "Daniel Rivera", required=True, autofocus=True, error=(e or {}).get("name", "")) + field("rel", "Relationship to Mateo", value="Cousin") + field("ph", "Mobile", type_="tel", value="905-555-0160", inputmode="tel", optional=True) + fieldset("Applies to", choice("ap", "Mateo only", checked=True) + choice("ap", "Mateo and Sofía")),
       "Add", icon_name="user", invalid_err={"name": "Enter their full name."})

simple("remove-pickup", "Remove Luis Rivera from Mateo’s approved pickups?", "child", [R_PICKUP, R_DATA], "Carmen Rivera is texted.",
       lambda e: switch("both", "Also remove from Sofía’s list") + alert("info", "Recorded", "Kept in the audit log.", role="status"), "Remove", icon_name="trash", danger=True)

simple("household-actions", "More actions for the Rivera household", "household", [R_PRIVACY, R_DATA], "",
       lambda e: ('<ul class="menu menu--static" role="menu" aria-label="Household actions">'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("new-message")}">{icon("send")}Message Carmen</a></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("export-data")}">{icon("download")}Export this household’s data</button></li>'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("audit-log")}">{icon("shield")}Audit trail</a></li>'
                  '<li role="none" class="menu__divider" aria-hidden="true"></li>'
                  f'<li role="none"><button class="menu__item menu__item--danger" role="menuitem" type="button" data-href="{dialog("delete-household")}">{icon("trash")}Delete household…</button></li></ul>'),
       "Close", form=False, cancel="Close", na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs.", "failed": "A menu makes no server call."})

simple("child-actions", "More actions for Mateo Rivera", "child", [R_ENROLL, R_DATA], "",
       lambda e: ('<ul class="menu menu--static" role="menu" aria-label="Child actions">'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("enroll-in-program")}">{icon("plus")}Enroll in another program</button></li>'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("attendance", "long")}">{icon("chart")}Attendance history</a></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("export-data")}">{icon("download")}Export record</button></li>'
                  '<li role="none" class="menu__divider" aria-hidden="true"></li>'
                  f'<li role="none"><button class="menu__item menu__item--danger" role="menuitem" type="button" data-href="{dialog("remove-from-roster")}">{icon("x-circle")}Remove from a roster…</button></li></ul>'),
       "Close", form=False, cancel="Close", na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs.", "failed": "A menu makes no server call."})

simple("program-actions", "More actions for After‑School Tutoring", "program", [R_ENROLL, R_REPORTS], "",
       lambda e: ('<ul class="menu menu--static" role="menu" aria-label="Program actions">'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("attendance")}">{icon("chart")}Attendance</a></li>'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("reports")}">{icon("download")}Report for a funder</a></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("close-enrollment")}">{icon("lock")}Close enrollment</button></li>'
                  '<li role="none" class="menu__divider" aria-hidden="true"></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("archive-program")}">{icon("inbox")}Archive at season end…</button></li></ul>'),
       "Close", form=False, cancel="Close", na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs.", "failed": "A menu makes no server call."})

simple("archive-program", "Archive After‑School Tutoring?", "program", [R_ENROLL, R_REPORTS, R_DATA], "Roster, attendance and slips are kept. No check-in or messages until restored.",
       lambda e: field("confirm", "Type the program name to confirm", value="" if not e else "After School", error=(e or {}).get("confirm", ""), autofocus=True),
       "Archive program", icon_name="inbox", danger=True, invalid_err={"confirm": "Type “After‑School Tutoring” exactly."},
       confirm_body=alert("warning", "48 children are still enrolled", "Their enrollment ends today.") + field("confirm", "Type the program name to confirm", value="After‑School Tutoring"))

# ------------------------------------------------------------------ Events, slips, messages
simple("event-actions", "More actions for the field trip", "event", [R_SLIPS, R_NOTIFY], "",
       lambda e: ('<ul class="menu menu--static" role="menu" aria-label="Event actions">'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("slip-editor", "edit")}">{icon("clipboard")}Edit the slip</a></li>'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("new-message")}">{icon("send")}Message the roster</a></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("export-data")}">{icon("download")}Export cleared list</button></li>'
                  '<li role="none" class="menu__divider" aria-hidden="true"></li>'
                  f'<li role="none"><button class="menu__item menu__item--danger" role="menuitem" type="button" data-href="{dialog("cancel-event")}">{icon("x-circle")}Cancel event…</button></li></ul>'),
       "Close", form=False, cancel="Close", na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs.", "failed": "A menu makes no server call."})

simple("cancel-event", "Cancel the field trip?", "event", [R_SLIPS, R_NOTIFY], "48 guardians are told. Signed slips are kept.",
       lambda e: textarea("why", "Message to guardians", value="The RBG trip on Sat 14 Nov is cancelled (bus strike). New date soon; your slip carries over.", rows=3, error=(e or {}).get("why", "")) + fieldset("Then", choice("then", "Keep the event as cancelled", checked=True) + choice("then", "Delete it entirely", small="Signatures deleted too")),
       "Cancel event and tell 48 guardians", icon_name="x-circle", danger=True, invalid_err={"why": "Tell guardians why."},
       confirm_body=alert("warning", "You chose to delete the event", "41 signatures would be deleted.") + fieldset("Then", choice("then", "Keep the event as cancelled") + choice("then", "Delete it entirely", checked=True)) + field("confirm", "Type DELETE to confirm", value=""))

simple("send-reminder", "Text the 7 unsigned", "event", [R_SLIPS, R_NOTIFY, R_COST], "Each gets their own slip link again.",
       lambda e: ul_list([list_item("Linh Tran", "Kevin, Emily · reminded Tue 3 Nov", person=GUARDIANS["linh"]), list_item("Elena Petrova", "Nikolai · link opened, not signed", person=GUARDIANS["elena"]), list_item("Bola Adeyemi", "Grace · email bounced, no mobile", lead='<span class="avatar avatar--sm avatar--rose" aria-hidden="true">BA</span>', end=badge("Can’t reach", "danger"))]) + f'<div class="list-more" style="margin: 0;"><span class="text-caption">and 3 more</span></div>'
                 + textarea("body", "Message", value="Reminder: sign {child}’s RBG slip by Thursday: {link}", rows=3, error=(e or {}).get("body", ""), help_="{child} and {link} fill in per family.", count="58 / 160")
                 + alert("info", "About 7 SMS segments", "1,212 of 2,000 used.", role="status"),
       "Send to 7", icon_name="send", invalid_err={"body": "Keep {link} in the message."})

simple("send-now", "Send “Winter Camp: pack list” now?", "message", [R_NOTIFY], "Instead of Fri 18 Dec, 6:00 pm. 35 guardians.",
       lambda e: "", "Send now", base_state="scheduled", icon_name="send")

simple("cancel-send", "Cancel the scheduled send?", "message", [R_NOTIFY], "“Winter Camp: pack list” stays as a draft.",
       lambda e: "", "Cancel send", base_state="scheduled", icon_name="x-circle", danger=True)

simple("decline-slip", "Mateo can’t come?", "slip-sign", [R_SLIPS, R_NOTIFY], "You can change your mind until Friday.",
       lambda e: fieldset("Reason", choice("r", "Away that day", checked=True) + choice("r", "Not feeling well") + choice("r", "Prefer not to say")) + textarea("note", "Note for staff", rows=2, optional=True, placeholder="Back at tutoring Thursday."),
       "Tell staff he can’t come", icon_name="x-circle", na={"invalid": "Reason has a default; the note is optional."})

simple("guardian-data-request", "Ask for a copy of your family’s data", "guardian-update", [R_PRIVACY, "L1-015"], "Emailed within 30 days.",
       lambda e: fieldset("Request", choice("req", "A copy of our data", small="PDF and spreadsheet", checked=True) + choice("req", "Delete our data", small="After your children leave")) + field("em", "Send it to", type_="email", value="carmen.rivera@example.com", required=True, error=(e or {}).get("em", "")),
       "Send request", icon_name="shield", invalid_err={"em": "Enter an email."},
       success_body="<p>Received Thu 5 Nov. Tom Nguyen will email you within 30 days.</p>")

# ------------------------------------------------------------------ Incidents, reports, settings
simple("review-incident", "Mark as reviewed", "incident", [R_INC], "Closes the report. Jaylen Okafor is told.",
       lambda e: textarea("note", "Review note", value="Followed first-aid procedure correctly. Stairwell lighting reported to the building manager.", rows=3, error=(e or {}).get("note", "")) + fieldset("Outcome", choice("out", "Closed, no further action", checked=True) + choice("out", "Closed, policy change needed", small="In the board report") + choice("out", "Keep open", small="Follow-up pending")),
       "Mark reviewed", icon_name="check", invalid_err={"note": "Write a review note."})

simple("add-follow-up", "Add a follow-up", "incident", [R_INC], "Kept on the report, even after it is closed.",
       lambda e: textarea("follow", "Follow-up", rows=3, error=(e or {}).get("follow", ""), placeholder="Called Dana the next day; Jordan is fine."),
       "Add follow-up", icon_name="plus", invalid_err={"follow": "Write the follow-up."})

simple("reopen-incident", "Reopen this report?", "incident", [R_INC], "It goes back to open; the review note is kept.",
       lambda e: "", "Reopen", icon_name="refresh", na={"invalid": "No inputs."})

simple("export-data", "Export", "reports", [R_REPORTS, R_PRIVACY], "For the period and programs shown. Counts under 5 are masked.",
       lambda e: fieldset("Format", choice("fmt", "Ontario Trillium Foundation template (.xlsx)", checked=True) + choice("fmt", "United Way template (.xlsx)") + choice("fmt", "Plain spreadsheet (.csv)") + choice("fmt", "PDF summary for the board"))
                 + fieldset("Include", choice("inc", "Attendance by session", type_="checkbox", checked=True, attrs=' name="i1"') + choice("inc", "Demographics (age, gender, language, postal code prefix)", type_="checkbox", checked=True, attrs=' name="i2"') + choice("inc", "Children’s names", small="Internal copies only", type_="checkbox", attrs=' name="i3"'))
                 + alert("info", "Logged", "Recorded in the audit log.", role="status"),
       "Export", icon_name="download", na={"invalid": "Format has a default; includes are optional."},
       success_body=f'<p>harbourview-otf-2026-27-season.xlsx is ready (184 children, 312 sessions). Emailed to marisol@harbourview.example.</p><div class="cluster">{btn("Download", "primary", icon_name="download")}</div>')

simple("invite-staff", "Invite staff", "staff", [R_SEC, R_PRIVACY], "Email link, valid 14 days.",
       lambda e: field("em", "Work email", type_="email", value="" if e else "sam.lee@example.org", required=True, autofocus=True, error=(e or {}).get("em", "")) + select("role", "Role", ["Youth worker", "Site lead", "Volunteer coordinator", "Admin", "Program director", "Mentor", "Volunteer"], selected="Youth worker", help_="Youth workers see medical cards and report incidents. Mentor shows while Mentoring is on.", error=(e or {}).get("role", "")) + fieldset("Programs", choice("p", "After‑School Tutoring", type_="checkbox", checked=True, attrs=' name="p1"') + choice("p", "Saturday Sports", type_="checkbox", attrs=' name="p2"') + choice("p", "Winter Camp 2026", type_="checkbox", attrs=' name="p3"')),
       "Send invitation", icon_name="mail", invalid_err={"em": "Enter a work email."},
       success_body="<p>Sent to sam.lee@example.org. Valid 14 days.</p>")

simple("invite-youth", "Invite Yusuf to PromiseHub", "child", [R_SEC, "L1-023"], "His own email. The account links to Yusuf’s record and signs in to Learning. The link lasts 14 days.",
       lambda e: field("em", "Yusuf’s email", type_="email", value="" if e else "yusuf.haddad@example.com", required=True, autofocus=True, autocomplete="off", error=(e or {}).get("em", ""), help_="Not a guardian’s email: this is Yusuf’s own sign-in."),
       "Send invitation", icon_name="mail", invalid_err={"em": "Enter an email like name@example.org."}, base_state="youth-account",
       success_body="<p>Sent to yusuf.haddad@example.com. Valid 14 days. You can resend or withdraw it from Staff and roles.</p>")

simple("change-role", "Change Priya Raman’s role", "staff", [R_SEC, R_PRIVACY], "Takes effect on her next page load.",
       lambda e: fieldset("Role", choice("role", "Volunteer coordinator <small>Current</small>", checked=True) + choice("role", "Site lead <small>Adds check-in, Quick Cards and medical</small>") + choice("role", "Admin <small>Adds settings and billing; MFA required</small>") + choice("role", "Youth worker")),
       "Change role", icon_name="user", na={"invalid": "A radio group with a default."})

simple("remove-staff", "Remove Aisha Bello?", "staff", [R_SEC, R_PRIVACY], "Signed out everywhere. Her reports and audit entries stay.",
       lambda e: fieldset("Her sessions", choice("s", "Reassign tonight’s Tutoring night to Jaylen Okafor", checked=True) + choice("s", "Leave unassigned")) + field("confirm", "Type her name to confirm", value="", error=(e or {}).get("confirm", ""), autofocus=True),
       "Remove Aisha", icon_name="trash", danger=True, invalid_err={"confirm": "Type “Aisha Bello” exactly."}, confirm_body=field("confirm", "Type her name to confirm", value="Aisha Bello") + alert("warning", "She is on the roster for tonight", "Jaylen alone would have 48 children. Check your ratio."))

simple("delete-household", "Delete the Rivera household?", "household", [R_PRIVACY, "L1-015", R_DATA], "Carmen Rivera asked on Thu 5 Nov. Deleted in 30 days; attendance counts stay without names.",
       lambda e: fieldset("Why", choice("why", "Guardian asked (right to deletion)", checked=True) + choice("why", "Duplicate household") + choice("why", "Created by mistake")) + field("confirm", "Type the household name to confirm", value="" if not e else "Rivera household", error=(e or {}).get("confirm", ""), autofocus=True),
       "Delete in 30 days", icon_name="trash", danger=True, invalid_err={"confirm": "Type “Rivera” exactly."},
       confirm_body=alert("warning", "Mateo and Sofía are enrolled", "Removed from After‑School Tutoring and Saturday Sports today.") + field("confirm", "Type the household name to confirm", value="Rivera") + switch("now", "Delete immediately instead of in 30 days", desc="No undo."))

simple("change-plan", "Move to Standard", "billing", [R_COST], "$89 a month · 500 children · 2,000 SMS segments. Cancel any time.",
       lambda e: field("card", "Card number", value="" if e else "4242 4242 4242 4242", inputmode="numeric", autocomplete="cc-number", error=(e or {}).get("card", "")) + f'<div class="two-col">{field("exp", "Expiry", value="08/28", inputmode="numeric", autocomplete="cc-exp")}{field("cvc", "CVC", value="123", inputmode="numeric", autocomplete="cc-csc", error=(e or {}).get("cvc", ""))}</div>' + field("holder", "Name on card", value="Tom Nguyen", autocomplete="cc-name") + fieldset("Billing", choice("bill", "Monthly, $89", checked=True) + choice("bill", "Yearly, $890 <small>Two months free</small>")),
       "Start Standard plan", base_state="free", icon_name="credit-card", invalid_err={"card": "Enter a 16-digit card number.", "cvc": "Enter the 3-digit code on the back."}, failed_text="Card declined. Nothing was charged.",
       success_body="<p>You’re on Standard. 3 waiting enrollments accepted. First invoice: $89 on 5 December.</p>")

simple("recovery-codes", "Recovery codes", "account", [R_SEC], "Each works once. Keep them off this phone.",
       lambda e: '<pre class="mono" style="margin: 0; padding: var(--space-4); background: var(--color-bg-surface-sunken); border-radius: var(--radius-md);">7fk2-9qmx   p3nd-u8rt\nw5sa-2hgc   k9zb-4lfe\nm2tq-7vyn   r8dj-1xpa\nc4wh-6nbs   g1ue-5zrk</pre>' + f'<div class="cluster">{btn("Copy", "", icon_name="copy")}{btn("Download", "", icon_name="download")}{btn("Make new codes", "ghost", icon_name="refresh")}</div>',
       "Done", icon_name="key", form=False, cancel="Close", na={"busy": "Showing codes makes no call.", "invalid": "No inputs.", "failed": "No call."})

simple("sign-out-all", "Sign out everywhere?", "account", [R_SEC], "Every other device is signed out. You stay signed in here.",
       lambda e: "", "Sign out other devices", icon_name="log-out")

# ------------------------------------------------------------------ Shell: main menu, account menu, session expired, offline queue
@screen("main-menu", "dialog", "Main menu", opens_from="today", reqs=["L1-014"], na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs."})
def main_menu(S):
    staff_links = [("today", "Today", "home"), ("check-in", "Check-in", "clipboard"), ("quick-card", "Quick Cards", "heart-pulse"), ("families", "Families", "users"), ("events", "Events", "calendar"), ("slips", "Slips", "clipboard"), ("programs", "Programs", "list"), ("messages", "Messages", "message"), ("reports", "Reports", "chart"), ("incidents", "Incidents", "flag"), ("attendance", "Attendance", "table"), ("settings", "Settings", "settings"), ("notifications", "Notifications", "bell"), ("account", "Your account", "user")]
    director_links = staff_links[:10] + [("applications", "Applications", "inbox"), ("curriculum-tracks", "Curriculum", "star")] + staff_links[10:]
    tail = [("notifications", "Notifications", "bell"), ("account", "Your account", "user")]

    def drawer(user=STAFF["jaylen"], current="today", links=staff_links):
        items = "".join(f'<a class="nav-drawer__link" href="{page(s)}"{" aria-current=\"page\"" if s == current else ""}>{icon(i)}{t}</a>' for s, t, i in links)
        return (f'<div class="backdrop"></div><nav class="nav-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" style="display: flex;" data-dismiss-on-escape>'
                f'<div class="nav-drawer__header"><span class="nav-drawer__title" id="menu-title">Menu</span><button class="btn btn--ghost btn--icon" type="button" aria-label="Close menu" autofocus>{icon("x")}</button></div>'
                f'<div class="nav-drawer__nav">{items}<div class="menu__divider" aria-hidden="true"></div><a class="nav-drawer__link" href="{page("signed-out")}">{icon("log-out")}Sign out</a></div>'
                f'<div style="padding: var(--space-3) var(--space-4); border-top: var(--border-width-hairline) solid var(--color-border-default);" class="cluster cluster--snug">{avatar(user)}<div><div style="font: var(--text-label);">{esc(user["name"])}</div><div class="text-caption">{esc(user["role"])} · {ORG_SHORT}</div></div></div></nav>')
    S.add("default", "The More menu on a phone: every section, current one marked, sign out at the end.", **over("today", overlays=drawer()))
    S.add("director", "The same menu for the program director, from Programs; Applications shows while Roster is on and Curriculum while Learning is on.", **over("programs", overlays=drawer(STAFF["marisol"], "programs", director_links)))
    S.add("youth", "A youth’s menu: Today, Learning, notifications and account only; no staff sections, no Settings.",
          **over("today", "youth", overlays=drawer(YOUTH["sofia"], "today", [("today", "Today", "home"), ("learn-home", "Learning", "star")] + tail)))
    S.add("mentor", "A mentor’s menu: Today, Mentoring, notifications and account.",
          **over("today", "mentor", overlays=drawer(STAFF["daniel"], "today", [("today", "Today", "home"), ("mentor-dashboard", "Mentoring", "users")] + tail)))
    S.add("volunteer", "A volunteer’s menu: Today, Check-in for their assigned sessions, notifications and account.",
          **over("today", "volunteer", overlays=drawer(STAFF["leo"], "today", [("today", "Today", "home"), ("check-in", "Check-in", "clipboard")] + tail)))


@screen("account-menu", "dialog", "Account menu", opens_from="today", reqs=[R_SEC], na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs."})
def account_menu(S):
    menu = (f'<ul class="menu menu--account" role="menu" aria-label="Account menu for Jaylen Okafor" style="display: block;">'
            '<li role="none" class="menu__header"><span class="menu__title">Jaylen Okafor</span><span class="text-caption">Site lead · Harbourview Youth</span></li>'
            '<li role="none" class="menu__divider" aria-hidden="true"></li>'
            f'<li role="none"><a class="menu__item" role="menuitem" href="{page("account")}" autofocus>{icon("user")}Your account</a></li>'
            f'<li role="none"><a class="menu__item" role="menuitem" href="{page("notifications")}">{icon("bell")}Notifications</a></li>'
            f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-theme-toggle>{icon("sun")}Switch theme<kbd class="menu__shortcut">t</kbd></button></li>'
            '<li role="none" class="menu__divider" aria-hidden="true"></li>'
            f'<li role="none"><a class="menu__item" role="menuitem" href="{page("signed-out")}">{icon("log-out")}Sign out</a></li></ul>')
    S.add("default", "The account menu off the avatar: account, notifications, theme, sign out.", **over("today", overlays=menu, menu_open=True))


@screen("session-expired", "dialog", "Session expired", opens_from="new-incident", reqs=[R_SEC], na={})
def session_expired(S):
    def box(err=None, busy=False, alert_html=""):
        e = err or {}
        return dialog_box("Sign in again to continue", "Signed out after 12 hours. Your report is saved on this device.",
                          field("pw", "Password for jaylen@harbourview.example", type_="password", value="" if e else "harbour-tutoring-2026", autocomplete="current-password", autofocus=True, error=e.get("pw", "")),
                          btn("Use another account", "ghost", href=page("sign-in")) + btn("Sign in", "primary", type_="submit", busy=busy), icon_name="lock", alert_html=alert_html, form=True)
    S.add("default", "Signed out mid-form: sign in without losing the report.", **over("new-incident", "error", overlays=box()))
    S.add("busy", "Signing in.", **over("new-incident", "error", overlays=box(busy=True)))
    S.add("invalid", "Wrong password.", **over("new-incident", "error", overlays=box(err={"pw": "Wrong password."})))
    S.add("failed", "No connection; the report is still safe.", **over("new-incident", "error", overlays=box(alert_html=alert("danger", "Couldn’t reach PromiseHub", "Try again when you have signal."))))


@screen("offline-queue", "dialog", "Waiting to sync", opens_from="check-in", reqs=["L1-014", R_ROLL], na={"invalid": "No inputs."})
def offline_queue(S):
    def box(busy=False, alert_html="", rows=None):
        rows = rows if rows is not None else [list_item("Jordan Thompson checked in", "4:05 pm · waiting", person=CHILD["jordan"], end=badge("Queued", "warning")), list_item("Kevin Tran checked in", "4:16 pm · waiting", person=CHILD["kevin"], end=badge("Queued", "warning"))]
        return dialog_box("2 check-ins waiting to sync", "They send when you have signal.",
                          ul_list(rows), btn("Close", "", attrs=" autofocus") + btn("Try now", "primary", type_="submit", busy=busy, icon_name="refresh"), icon_name="wifi-off", alert_html=alert_html, form=True)
    S.add("default", "What is queued while offline.", **over("check-in", "offline", overlays=box()))
    S.add("busy", "Retrying.", **over("check-in", "offline", overlays=box(busy=True)))
    S.add("failed", "Still offline.", **over("check-in", "offline", overlays=box(alert_html=alert("warning", "Still no signal", "Retrying every 30 seconds."))))
    S.add("success", "Synced.", **over("check-in", "offline", overlays=dialog_box("All synced", "", "<p>2 check-ins sent at 4:19 pm.</p>", btn("Done", "primary", attrs=" autofocus"), icon_name="check-circle", form=False)))


# ------------------------------------------------------------------ Guardian consent (prompt 52)
CONSENT_WORDING = ("I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, "
                   "and to staff contacting them about their program.")

simple("consent-policy", "Edit consent policy", "settings-privacy", [R_PRIVACY, "L1-013", "L1-023"], "Youth under this age need a guardian’s consent before they use Learning. Saving is logged.",
       lambda e: select("age", "Consent needed under", ["13 years", "14 years", "15 years", "16 years", "17 years", "18 years", "19 years"], selected="18 years",
                        help_="Changing it applies from each youth’s next request; consents already given stay valid.")
                 + textarea("wording", "Wording guardians sign", value="" if e else CONSENT_WORDING, rows=4, error=(e or {}).get("wording", ""),
                            help_="20 to 2,000 characters. Each consent keeps the wording the guardian read."),
       "Save policy", icon_name="shield", invalid_err={"wording": "Write the wording guardians sign, at least 20 characters."})

simple("withdraw-consent", "Withdraw consent for Sofía?", "guardian-consent", ["L1-013", "L1-023", "L1-017"], "Sofía can’t use Learning until a guardian consents again. Staff can see it.",
       lambda e: "<p>Your consent record stays; the withdrawal is added to it with the time.</p>",
       "Withdraw consent", icon_name="x-circle", danger=True, base_state="given",
       opens_kw={})


# ------------------------------------------------------------------ Curriculum authoring (prompt 56, L2-066, L2-067)
R_CURRIC = "L1-023"
simple("new-track", "New track", "curriculum-tracks", ["L2-066", R_CURRIC], "A track is a pathway youth follow, such as Leadership Foundations.",
       lambda e: field("name", "Track name", value="" if e else "Digital Skills", required=True, autofocus=True, error=(e or {}).get("name", ""))
                 + field("key", "Track key", value="leadership" if e else "digital", optional=True, error=(e or {}).get("key", ""),
                         help_="Lowercase letters, numbers and hyphens, used in reports. Left blank, it is made from the name.")
                 + textarea("description", "Short description", value="Using technology safely and creatively.", rows=2, optional=True)
                 + switch("publish", "Publish now", desc="Off keeps it a draft. Youth never see a draft."),
       "Create track", icon_name="list", invalid_err={"name": "Give the track a name.", "key": "Another track already uses this key."},
       failed_text="The track was not created. Try again.")

simple("new-module", "New module", "curriculum-tracks", ["L2-066", R_CURRIC], "Added at the end of Leadership Foundations as a draft.",
       lambda e: field("title", "Module name", value="" if e else "Speaking Up", required=True, autofocus=True, error=(e or {}).get("title", ""))
                 + textarea("description", "Description", value="Finding your voice and using it for others.", rows=2, optional=True, help_="Shown to youth on the module cover."),
       "Create and edit", icon_name="list", invalid_err={"title": "Give the module a name."},
       failed_text="The module was not created. Try again.")

simple("new-lesson", "Add a lesson", "curriculum-module", ["L2-067", R_CURRIC], "Added at the end of Leading by Serving as a draft; you write its content next.",
       lambda e: field("title", "Lesson title", value="" if e else "Leading Like a Coach", required=True, autofocus=True, error=(e or {}).get("title", "")),
       "Create and edit", icon_name="plus", invalid_err={"title": "Give the lesson a title."},
       failed_text="The lesson was not created. Try again.")

COHORT_OPTIONS = (choice("cohort", "After‑School Tutoring", small="2026–27 · Mon–Thu, 4–6 pm", type_="checkbox", checked=True)
                  + choice("cohort", "Saturday Sports", small="2026–27 · Sat, 10 am–12 pm", type_="checkbox", checked=True)
                  + choice("cohort", "Winter Camp 2026", small="Follows Digital Skills", type_="checkbox")
                  + choice("cohort", "One-to-one Mentoring", small="No track", type_="checkbox"))
simple("track-cohorts", "Cohorts following Leadership Foundations", "curriculum-tracks", ["L2-066", "L2-012", R_CURRIC],
       "A cohort follows one track. Choosing one that follows another track moves it here.",
       lambda e: fieldset("Cohorts", COHORT_OPTIONS, hint="Active programs of Harbourview only. Archived programs keep the track they had."),
       "Save cohorts", icon_name="users", na={"invalid": "Choosing no cohort is allowed: the track is then followed by none."},
       failed_text="The cohorts were not changed. Try again.")

STATUS_MODULE = fieldset("Status", choice("status", "Draft", small="Only authors see it") + choice("status", "In review", small="Ready for another author to check", checked=False)
                         + choice("status", "Published", small="Youth in the cohorts below see it", checked=True))
STATUS_COHORTS = facts([("Visible to", "After‑School Tutoring and Saturday Sports, once its track is published")])
simple("curriculum-status", "Status of Leading by Serving", "curriculum-module", ["L2-066", "L2-067", R_CURRIC],
       "Publishing makes the module visible to youth in the cohorts that follow Leadership Foundations.",
       lambda e: (fieldset("Status", choice("status", "Draft", small="Only authors see it") + choice("status", "In review", small="Ready for another author to check")
                           + choice("status", "Published", small="Youth in the cohorts below see it", checked=True, invalid=True),
                           fid="status", error=e["status"]) if e else STATUS_MODULE) + STATUS_COHORTS,
       "Save status", icon_name="eye", invalid_err={"status": "Add a lesson before publishing the module."},
       failed_text="The status was not changed. Try again.",
       extra_states={
           "lesson": ("The same dialog for a lesson: Draft or Published.",
                      dialog_box("Status of Pick Up the Towel", "Publishing makes the lesson live for youth in the cohorts that follow Leadership Foundations, once its module is published.",
                                 fieldset("Status", choice("status", "Draft", small="Only authors see it", checked=True) + choice("status", "Published", small="Youth in the cohorts below see it"))
                                 + STATUS_COHORTS, footer("Save status"), icon_name="eye", form=True)),
           "track": ("The same dialog for a track: Draft or Published; nothing in a draft track reaches youth.",
                     dialog_box("Status of Digital Skills", "Nothing in a draft track reaches youth, whatever its modules say.",
                                fieldset("Status", choice("status", "Draft", small="Only authors see it", checked=True) + choice("status", "Published", small="Published modules reach the cohorts that follow it"))
                                + facts([("Followed by", "No cohort yet")]), footer("Save status"), icon_name="eye", form=True)),
       })

simple("delete-lesson", "Delete Pick Up the Towel?", "curriculum-lesson", ["L2-067", R_CURRIC],
       "Youth stop seeing it at once. Their progress is kept in the archive, and the lesson can be restored by support.",
       lambda e: "", "Delete lesson", icon_name="trash", danger=True, failed_text="The lesson was not deleted. Try again.")

# ------------------------------------------------------------------ Complete lessons (prompt 57)
simple("submit-project", "Submit “Build Your Event Page”?", "learn-coding-project", ["L2-070", "L1-023"],
       "Your mentor will review it. You can’t change it while it’s under review.",
       lambda e: textarea("note", "Note to your mentor", value="I used my first bit of CSS for the colours." if not e else "x" * 40 + "…", rows=3, optional=True,
                          help_="Up to 1,000 characters.", error=(e or {}).get("note", "")),
       "Submit for review", icon_name="send", invalid_err={"note": "Keep the note under 1,000 characters."},
       failed_text="Your project was not sent. Try again.")
