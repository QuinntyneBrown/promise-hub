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
        for st, (d, html, *on) in (extra_states or {}).items():
            S.add(st, d, **over(opens_from, on[0] if on else base_state, overlays=html, **kw))
    return _d


# ------------------------------------------------------------------ Check-in and pickup
simple("check-in-sheet", "Check in Kevin Tran", "check-in", [R_ROLL, "L1-008", "L2-095", "L2-100"], "Grade 3 · not yet here · no medical notes",
       lambda e: f'<div class="cluster">{avatar(CHILD["kevin"], "lg")}<div><div class="section-title">Kevin Tran</div><div class="text-muted">8 · Tran household · Linh Tran 289-555-0119</div></div></div>'
                 + fieldset("Arrived", choice("arr", "Now, 4:14 pm", checked=True) + choice("arr", "Earlier", small="Pick a time") + choice("arr", "Late", small="Arrived after the start; counts as here") + choice("arr", "Excused", small="Not coming, and the reason is accepted") + choice("arr", "Mark absent instead", small="Guardian is texted"))
                 + f'<p class="hint"><a href="{page("quick-card", "empty")}">Open Kevin’s Quick Card</a></p>',
       "Check in", icon_name="clipboard", na={"invalid": "Arrival is a radio group with a default; nothing can be invalid."},
       extra_states={"volunteer": ("A volunteer checks Yusuf in on his assigned session: Now, Earlier or Mark absent instead. Late and Excused are for staff and mentors (L2-100), and there is no Quick Card link.",
                                   dialog_box("Check in Yusuf Haddad", "Grade 8 · not yet here",
                                              f'<div class="cluster">{avatar(CHILD["yusuf"], "lg")}<div><div class="section-title">Yusuf Haddad</div><div class="text-muted">Grade 8</div></div></div>'
                                              + fieldset("Arrived", choice("arr", "Now, 4:14 pm", checked=True) + choice("arr", "Earlier", small="Pick a time") + choice("arr", "Mark absent instead")),
                                              footer("Check in"), icon_name="clipboard", form=True), "volunteer")})

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
    out = fieldset("Cohort", radios, error=e.get("cohort", ""), fid="cohort")
    if learning:
        out += switch("invite", "Invite Zoe to PromiseHub as a youth", checked=invite, desc="They set a password and start Learning once a guardian consents.")
        if invite:
            out += field("invite-email", "Zoe’s email", type_="email", value="" if e.get("email") else "zoe.campbell@example.ca", error=e.get("email", ""), autocomplete="off")
    out += textarea("place-note", "Note to the family", rows=2, optional=True, placeholder="Welcome! Tutoring is Monday to Thursday, 4 to 6 pm.")
    return out


simple("place-applicant", "Place Zoe Campbell", "application", ["L2-072", R_ENROLL, R_NOTIFY], "Choose the cohort. Tanya Campbell is texted.",
       lambda e: _place_body(e), "Place and text Tanya", icon_name="check",
       invalid_err={"cohort": "Choose a cohort.", "email": "Enter an email like name@example.org."},
       extra_states={
           "no-invite": ("Placing without a youth invitation: the email field goes away.", dialog_box("Place Zoe Campbell", "Choose the cohort. Tanya Campbell is texted.", _place_body(invite=False), footer("Place and text Tanya"), icon_name="check", form=True)),
           "full": ("The cohort filled while the dialog was open: the server answers 422 and nothing changes.", dialog_box("Place Zoe Campbell", "Choose the cohort. Tanya Campbell is texted.", _place_body(), footer("Place and text Tanya"), icon_name="check", form=True, alert_html=alert("danger", "After‑School Tutoring is full (50 of 50). Waitlist instead."))),
           "learning-off": ("Learning is off, or a program director is placing: no youth invitation is offered.", dialog_box("Place Zoe Campbell", "Choose the cohort. Tanya Campbell is texted.", _place_body(learning=False), footer("Place and text Tanya"), icon_name="check", form=True)),
           "invite-failed": ("Placed, but the invitation was refused (Zoe already has access): the placement stands and the dialog says so.", dialog_box("Zoe is placed", "", alert("warning", "Zoe is in After‑School Tutoring, but the invitation wasn’t sent", "Jaylen Okafor already has access.") , btn("Done", "primary", attrs=" autofocus"), icon_name="check-circle")),
       })

simple("decide-application", "Review Zoe Campbell", "application", ["L2-072", R_ENROLL, R_NOTIFY], "New family · After‑School Tutoring",
       lambda e: '<p>Tanya Campbell · 905-555-0320 · English · medical: none</p>'
                 + fieldset("Decision", choice("dec", "Waitlist", small="Next place on the waitlist", checked=True) + choice("dec", "Decline", small="Say why below"))
                 + textarea("why", "Note to the guardian", rows=2, optional=True, placeholder="We’ll text you as soon as a place opens."),
       "Waitlist and text Tanya", icon_name="clock", na={"invalid": "Waitlist has a default and its note is optional; see decline for the required reason."},
       extra_states={"decline": ("Declining with the reason the family reads; without one the server answers 422. A waitlisted application offers only Decline.", dialog_box("Review Zoe Campbell", "New family · After‑School Tutoring", '<p>Tanya Campbell · 905-555-0320 · English · medical: none</p>' + fieldset("Decision", choice("dec", "Waitlist", small="Next place on the waitlist") + choice("dec", "Decline", small="Say why below", checked=True)) + textarea("why", "Reason the guardian will read", rows=3, error="Write a reason the guardian will read.", value=""), footer("Decline and text Tanya", danger=True, autofocus_cancel=True), icon_name="x-circle", danger=True, form=True))})

simple("add-application-note", "Add a note", "application", ["L2-072", R_ENROLL], "Only staff see notes. The family never does.",
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
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("attendance-history", "by-youth")}">{icon("chart")}Attendance history</a></li>'
                  f'<li role="none"><button class="menu__item" role="menuitem" type="button" data-href="{dialog("export-data")}">{icon("download")}Export record</button></li>'
                  '<li role="none" class="menu__divider" aria-hidden="true"></li>'
                  f'<li role="none"><button class="menu__item menu__item--danger" role="menuitem" type="button" data-href="{dialog("remove-from-roster")}">{icon("x-circle")}Remove from a roster…</button></li></ul>'),
       "Close", form=False, cancel="Close", na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs.", "failed": "A menu makes no server call."})

simple("program-actions", "More actions for After‑School Tutoring", "program", [R_ENROLL, R_REPORTS], "",
       lambda e: ('<ul class="menu menu--static" role="menu" aria-label="Program actions">'
                  f'<li role="none"><a class="menu__item" role="menuitem" href="{page("attendance-history")}">{icon("chart")}Attendance</a></li>'
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

simple("export-report", "Export cohort report", "report-cohort", ["L2-129", "L2-025", "L2-032"], "After‑School Tutoring",
       lambda e: '<p>A CSV with one row per youth and the columns on screen: learning, attendance, check-ins and status. Sections whose module is off are left out.</p>'
                 + alert("info", "Names are included", "The export is recorded in the audit log, and the link lasts 7 days.", role="status"),
       "Export CSV", icon_name="download",
       success_body=f'<p>harbourview-youth-collective-cohort-after-school-tutoring-2026-11-05.csv is ready: 48 rows.</p><div class="cluster">{btn("Download", "primary", icon_name="download")}</div>')

simple("invite-staff", "Invite staff", "staff", [R_SEC, R_PRIVACY], "Email link, valid 14 days.",
       lambda e: field("em", "Work email", type_="email", value="" if e else "sam.lee@example.org", required=True, autofocus=True, error=(e or {}).get("em", "")) + select("role", "Role", ["Youth worker", "Site lead", "Volunteer coordinator", "Admin", "Program director", "Mentor", "Volunteer"], selected="Youth worker", help_="Youth workers see medical cards and report incidents. Mentor shows while Mentoring is on.", error=(e or {}).get("role", "")) + fieldset("Programs", choice("p", "After‑School Tutoring", type_="checkbox", checked=True, attrs=' name="p1"') + choice("p", "Saturday Sports", type_="checkbox", attrs=' name="p2"') + choice("p", "Winter Camp 2026", type_="checkbox", attrs=' name="p3"')),
       "Send invitation", icon_name="mail", invalid_err={"em": "Enter a work email."},
       success_body="<p>Sent to sam.lee@example.org. Valid 14 days.</p>")

simple("invite-youth", "Invite Yusuf to PromiseHub", "child", [R_SEC, "L1-023"], "His own email. The account links to Yusuf’s record and signs in to Learning. The link lasts 14 days.",
       lambda e: field("em", "Yusuf’s email", type_="email", value="" if e else "yusuf.haddad@example.com", required=True, autofocus=True, autocomplete="off", error=(e or {}).get("em", ""), help_="Not a guardian’s email: this is Yusuf’s own sign-in."),
       "Send invitation", icon_name="mail", invalid_err={"em": "Enter an email like name@example.org."}, base_state="youth-account",
       success_body="<p>Sent to yusuf.haddad@example.com. Valid 14 days. You can resend or withdraw it from Staff and roles.</p>")

@screen("change-role", "dialog", "Change role", opens_from="staff", reqs=[R_SEC, R_PRIVACY, "L2-113", "L2-114"],
        na={"invalid": "A radio group with the current role chosen; the server's refusals (own role, a youth account, Mentor while Mentoring is off) show as the failed alert."})
def change_role(S):
    staff_roles = [("Youth worker", "Runs the sessions they’re assigned"), ("Site lead", "Adds check-in for any session, Quick Cards and medical"),
                   ("Volunteer coordinator", "Reads rosters and slips"), ("Program director", "Programs, enrollment, incident review"),
                   ("Admin", "Everything, including people and billing; MFA required")]

    def radios(current: str, chosen: str, mentoring: bool = True) -> str:
        roles = staff_roles + ([("Mentor", "Sees only the youth assigned to them")] if mentoring else []) + [("Volunteer", "Runs the sessions they’re assigned")]
        return fieldset("Role", "".join(choice("role", f"{r} <small>{h}{' · current' if r == current else ''}</small>", checked=r == chosen) for r, h in roles))

    def box(name, current, chosen, *, busy=False, alert_html="", warn=False, mentoring=True):
        body = radios(current, chosen, mentoring) + (alert("warning", "This gives access to every family’s records", "Staff roles see children, guardians and attendance across the organization.") if warn else "")
        return dialog_box(f"Change role for {name}", "It applies the next time they do anything. The change is recorded in the audit log.", body,
                          footer("Change role", busy=busy), icon_name="user", alert_html=alert_html, form=True)
    S.add("default", "From Staff and roles: Priya Raman’s role, Volunteer coordinator now; the staff and participant roles a person can hold. Youth is never offered: a youth account follows its child record.", **over("staff", overlays=box("Priya Raman", "Volunteer coordinator", "Volunteer coordinator")))
    S.add("person", "From Leo Martins’s record: moving a volunteer to a staff role warns that it opens every family’s records.", **over("person", "staff", overlays=box("Leo Martins", "Volunteer", "Youth worker", warn=True)))
    S.add("busy", "Changing the role: the button is busy.", **over("person", "staff", overlays=box("Leo Martins", "Volunteer", "Youth worker", busy=True, warn=True)))
    S.add("failed", "The change failed; the choice is kept and nothing changed.", **over("person", "staff", overlays=box("Leo Martins", "Volunteer", "Youth worker", warn=True, alert_html=failed_alert("That didn’t go through", "The role didn’t change. Try again."))))
    S.add("mentoring-off", "Mentoring is off: Mentor is not offered.", **over("person", "staff", overlays=box("Leo Martins", "Volunteer", "Volunteer", mentoring=False)))


@screen("deactivate-person", "dialog", "Deactivate a person", opens_from="person", reqs=["L2-113", "L2-114", "L2-032", R_SEC], na={"invalid": "Confirming needs no input."})
def deactivate_person(S):
    def box(title, desc, body, *, busy=False, alert_html="", base="staff"):
        return over("person", base, overlays=dialog_box(title, desc, body, footer("Deactivate", busy=busy, danger=True, autofocus_cancel=True), icon_name="lock", danger=True, alert_html=alert_html, form=True))
    leo_t, leo_d = "Deactivate Leo Martins?", "They’re signed out everywhere and can’t sign in. Their attendance, sessions and history stay, and you can reactivate them any time."
    leo_b = "<p>Turn off an account when someone leaves. To end access for good, remove them in Staff and roles.</p>"
    S.add("default", "Confirm before turning Leo’s account off; Cancel has focus.", **box(leo_t, leo_d, leo_b))
    S.add("youth", "Sofía’s youth account: her child record, progress and consents stay.", **box("Deactivate Sofía Rivera?",
          "They’re signed out everywhere and can’t sign in. Their child record, Learning progress and consents stay, and you can reactivate them while the child record exists.", "", base="default"))
    S.add("busy", "Deactivating: the button is busy.", **box(leo_t, leo_d, leo_b, busy=True))
    S.add("failed", "It failed: nothing changed.", **box(leo_t, leo_d, leo_b, alert_html=failed_alert("That didn’t go through", "Leo’s account is still on. Try again.")))


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

@screen("change-password", "dialog", "Change password", opens_from="account", reqs=["L2-118", "L2-053", "L2-031", "L2-032", "L2-035"],
        na={"success": "Saving closes the dialog: Your account shows the toast (`account/password-changed`)."})
def change_password(S):
    def box(err=None, busy=False, alert_html=""):
        e = err or {}
        body = (field("current", "Current password", type_="password", autocomplete="current-password", autofocus=not e, error=e.get("current", ""))
                + field("new", "New password", type_="password", autocomplete="new-password", error=e.get("new", ""),
                        help_="At least 12 characters, and not your email.")
                + field("repeat", "Repeat it", type_="password", autocomplete="new-password", error=e.get("repeat", "")))
        return dialog_box("Change your password", "Your other devices are signed out. You stay signed in here.", body,
                          footer("Change password", busy=busy), icon_name="lock", alert_html=alert_html, form=True)
    S.add("default", "From Your account: the current password, then the new one twice; focus on Current password.", **over("account", overlays=box()))
    S.add("invalid", "The current password is wrong and the repeat doesn’t match: inline errors, nothing changed.",
          **over("account", overlays=box(err={"current": "That isn’t your current password.", "repeat": "The two passwords don’t match."})))
    S.add("weak", "The new password contains his email name: the shared policy refuses it.",
          **over("account", overlays=box(err={"new": "Don’t use your email in your password."})))
    S.add("busy", "Changing: the button is busy, no second submit.", **over("account", overlays=box(busy=True)))
    S.add("failed", "The change failed: the fields are kept and the password is unchanged.",
          **over("account", overlays=box(alert_html=failed_alert("That didn’t go through", "Your password is unchanged. Try again."))))
    S.add("saved", "Saved: the dialog has closed, a toast says the other devices were signed out.",
          **(base("account", "password-changed") | {"toast_html": toast_region(toast("success", "Password changed", "Your other devices were signed out."))}))


# ------------------------------------------------------------------ Shell: main menu, account menu, session expired, offline queue
@screen("main-menu", "dialog", "Main menu", opens_from="today", reqs=["L1-014"], na={"busy": "A menu has no submit.", "invalid": "A menu has no inputs."})
def main_menu(S):
    staff_links = [("today", "Today", "home"), ("check-in", "Check-in", "clipboard"), ("quick-card", "Quick Cards", "heart-pulse"), ("families", "Families", "users"), ("events", "Events", "calendar"), ("slips", "Slips", "clipboard"), ("programs", "Programs", "list"), ("messages", "Messages", "message"), ("reports", "Reports", "chart"), ("incidents", "Incidents", "flag"), ("attendance-history", "Attendance", "table"), ("learning-bond-families", "Learning Bond", "sprout"), ("settings-organization", "Settings", "settings"), ("notifications", "Notifications", "bell"), ("account", "Your account", "user")]
    director_links = staff_links[:10] + [("applications", "Applications", "inbox"), ("curriculum-tracks", "Curriculum", "star")] + [(("learning-bond-dashboard" if s == "learning-bond-families" else s), t, i) for s, t, i in staff_links[10:]]
    tail = [("notifications", "Notifications", "bell"), ("account", "Your account", "user")]

    def drawer(user=STAFF["jaylen"], current="today", links=staff_links):
        items = "".join(f'<a class="nav-drawer__link" href="{page(s)}"{" aria-current=\"page\"" if s == current else ""}>{icon(i)}{t}</a>' for s, t, i in links)
        return (f'<div class="backdrop"></div><nav class="nav-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" style="display: flex;" data-dismiss-on-escape>'
                f'<div class="nav-drawer__header"><span class="nav-drawer__title" id="menu-title">Menu</span><button class="btn btn--ghost btn--icon" type="button" aria-label="Close menu" autofocus>{icon("x")}</button></div>'
                f'<div class="nav-drawer__nav">{items}<div class="menu__divider" aria-hidden="true"></div><a class="nav-drawer__link" href="{page("signed-out")}">{icon("log-out")}Sign out</a></div>'
                f'<div style="padding: var(--space-3) var(--space-4); border-top: var(--border-width-hairline) solid var(--color-border-default);" class="cluster cluster--snug">{avatar(user)}<div><div style="font: var(--text-label);">{esc(user["name"])}</div><div class="text-caption">{esc(user["role"])} · {ORG_SHORT}</div></div></div></nav>')
    S.add("default", "The More menu on a phone: every section, current one marked, sign out at the end; Learning Bond shows while the module is on and the role is in its status roles.", **over("today", overlays=drawer()))
    S.add("director", "The same menu for the program director, from Programs; Applications shows while Roster is on and Curriculum while Learning is on.", **over("programs", overlays=drawer(STAFF["marisol"], "programs", director_links)))
    S.add("admin", "Tom’s menu (Admin): People sits beside Settings; only admins see it.", **over("today", overlays=drawer(STAFF["tom"], "today", director_links[:-3] + [("people", "People", "users")] + director_links[-3:])))
    S.add("youth", "A youth’s menu: Today, Learning, Schedule (while Roster is on), Messages and Announcements (while Messages is on), notifications and account only; no staff sections, no Settings.",
          **over("today", "youth", overlays=drawer(YOUTH["sofia"], "today", [("today", "Today", "home"), ("learn-home", "Learning", "star"), ("youth-schedule", "Schedule", "calendar"), ("conversations", "Messages", "message"), ("youth-announcements", "Announcements", "bell")] + tail)))
    S.add("mentor", "A mentor’s menu: Today, Mentoring, Check-in, Messages and Announcements (while Messages is on), notifications and account.",
          **over("today", "mentor", overlays=drawer(STAFF["daniel"], "today", [("today", "Today", "home"), ("mentor-dashboard", "Mentoring", "users"), ("check-in", "Check-in", "clipboard"), ("conversations", "Messages", "message"), ("youth-announcements", "Announcements", "bell")] + tail)))
    S.add("volunteer", "A volunteer’s menu: Today, Check-in for their assigned sessions, Schedule (while Roll Call is on), notifications and account.",
          **over("today", "volunteer", overlays=drawer(STAFF["leo"], "today", [("today", "Today", "home"), ("check-in", "Check-in", "clipboard"), ("my-schedule", "Schedule", "calendar")] + tail)))


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


@screen("offline-queue", "dialog", "Waiting to sync", opens_from="check-in", reqs=["L1-014", R_ROLL, "L2-096", "L2-098", "L2-099"], na={"invalid": "No inputs."})
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
ASSESSMENT_COHORTS = facts([("Visible to", "After‑School Tutoring and Saturday Sports, once Leading by Serving and Leadership Foundations are published")])
simple("curriculum-status", "Status of Leading by Serving", "curriculum-module", ["L2-066", "L2-067", "L2-073", "L2-074", R_CURRIC],
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
           "quiz": ("The same dialog for a quiz: Draft or Published; publishing needs a question.",
                    dialog_box("Status of Leading by Serving quiz", "Publishing makes it visible to youth in the cohorts that follow the track, once the track and module are published.",
                               fieldset("Status", choice("status", "Draft", small="Only authors see it", checked=True) + choice("status", "Published", small="Youth in the cohorts below see it"))
                               + ASSESSMENT_COHORTS, footer("Save status"), icon_name="eye", form=True)),
           "quiz-invalid": ("Publishing a quiz with no questions is refused.",
                            dialog_box("Status of Leading by Serving quiz", "Publishing makes it visible to youth in the cohorts that follow the track, once the track and module are published.",
                                       fieldset("Status", choice("status", "Draft", small="Only authors see it") + choice("status", "Published", small="Youth in the cohorts below see it", checked=True, invalid=True),
                                                fid="status", error="Add a question before publishing the quiz.")
                                       + ASSESSMENT_COHORTS, footer("Save status"), icon_name="eye", form=True)),
           "assignment": ("The same dialog for an assignment: publishing assigns it to youth in the cohorts that follow the track; it needs a task, a way to submit and a rubric.",
                          dialog_box("Status of Serve someone this week", "Publishing assigns it to youth in the cohorts that follow the track, once the track and module are published.",
                                     fieldset("Status", choice("status", "Draft", small="Only authors see it", checked=True) + choice("status", "Published", small="Youth in the cohorts below are assigned it"))
                                     + ASSESSMENT_COHORTS, footer("Save status"), icon_name="eye", form=True)),
           "track": ("The same dialog for a track: Draft or Published; nothing in a draft track reaches youth.",
                     dialog_box("Status of Digital Skills", "Nothing in a draft track reaches youth, whatever its modules say.",
                                fieldset("Status", choice("status", "Draft", small="Only authors see it", checked=True) + choice("status", "Published", small="Published modules reach the cohorts that follow it"))
                                + facts([("Followed by", "No cohort yet")]), footer("Save status"), icon_name="eye", form=True)),
       })

simple("delete-lesson", "Delete Pick Up the Towel?", "curriculum-lesson", ["L2-067", R_CURRIC],
       "Youth stop seeing it at once. Their progress is kept in the archive, and the lesson can be restored by support.",
       lambda e: "", "Delete lesson", icon_name="trash", danger=True, failed_text="The lesson was not deleted. Try again.")

# ------------------------------------------------------------------ Quizzes and assignments (prompt 60, L2-073, L2-074)
ATTACH_TO = ["The whole module", "Lesson 1 · Pick Up the Towel", "Lesson 2 · Last in Line", "Lesson 3 · Leading Like a Coach"]


def new_assessment_body(kind):
    def body(e):
        e = e or {}
        return (field("title", f"{kind} title", value="" if e else ("Leading by Serving quiz" if kind == "Quiz" else "Serve someone this week"),
                      required=True, autofocus=True, error=e.get("title", ""))
                + select("attach", "Attached to", ATTACH_TO, selected=ATTACH_TO[0] if kind == "Quiz" else ATTACH_TO[1],
                         help_="The whole module, or one of its lessons."))
    return body


simple("new-assessment", "New quiz", "curriculum-module", ["L2-073", "L2-074", R_CURRIC], "Added to Leading by Serving as a draft; you build it next.",
       new_assessment_body("Quiz"), "Create and build", icon_name="clipboard", invalid_err={"title": "Give the quiz a title."},
       failed_text="The quiz was not created. Try again.",
       extra_states={"assignment": ("The same dialog for an assignment.",
                                    dialog_box("New assignment", "Added to Leading by Serving as a draft; you write the task and rubric next.",
                                               new_assessment_body("Assignment")(None), footer("Create and build"), icon_name="clipboard", form=True))})


def options_body(texts, correct, *, multiple=False, err=None):
    err = err or {}
    letters = "ABCDEF"
    fields_ = "".join(field(f"option-{letters[i].lower()}", f"Option {letters[i]}", value=t, error=err.get("options", "") if i == 0 else "") for i, t in enumerate(texts))
    fields_ += btn("Add option", "ghost", size="sm", icon_name="plus")
    marks = "".join(choice("correct", f"{letters[i]} · {esc(t)}", type_="checkbox" if multiple else "radio", checked=i in correct, invalid="correct" in err)
                    for i, t in enumerate(texts))
    return (fields_ + fieldset("Correct answers" if multiple else "Correct answer", marks, fid="correct", error=err.get("correct", "")))


MC = ["Packed the kit bags for everyone", "Went home early", "Asked the coach for help", "Chose the starting team"]


def question_body(e):
    e = e or {}
    return (textarea("text", "Question", value="" if "text" in e else "In Pick Up the Towel, what did the captain do before the big game?", rows=2, error=e.get("text", ""))
            + select("type", "Question type", ["Multiple choice", "True / false", "Multiple answer", "Short answer"], selected="Multiple choice")
            + options_body(MC, set() if e else {0}, err=e))


def question_box(title, body, primary="Add question"):
    return dialog_box(title, "Write the question, pick its type and mark the correct answer.", body, footer(primary), icon_name="list", form=True, scroll=True)


simple("quiz-question", "Add question", "curriculum-quiz", ["L2-073", R_CURRIC], "Write the question, pick its type and mark the correct answer.",
       question_body, "Add question", icon_name="list", invalid_err={"text": "Write the question.", "correct": "Mark the correct answer."},
       failed_text="The question was not saved. Try again.",
       extra_states={
           "true-false": ("A true or false question: no options to write, one correct answer.",
                          question_box("Add question", textarea("text", "Question", value="Leading is a title someone gives you.", rows=2)
                                       + select("type", "Question type", ["Multiple choice", "True / false", "Multiple answer", "Short answer"], selected="True / false")
                                       + fieldset("Correct answer", choice("correct", "True") + choice("correct", "False", checked=True), fid="correct"))),
           "multiple-answer": ("A multiple-answer question: every correct option is ticked.",
                               question_box("Add question", textarea("text", "Question", value="Which of these are ways to “pick up the towel” this week?", rows=2)
                                            + select("type", "Question type", ["Multiple choice", "True / false", "Multiple answer", "Short answer"], selected="Multiple answer")
                                            + options_body(["Help clear up after group", "Wait to be asked", "Check on someone who is new"], {0, 2}, multiple=True))),
           "short-answer": ("A short-answer question: the answers it accepts, one per line, matched ignoring case.",
                            question_box("Add question", textarea("text", "Question", value="In one word, who does a servant leader put first?", rows=2)
                                         + select("type", "Question type", ["Multiple choice", "True / false", "Multiple answer", "Short answer"], selected="Short answer")
                                         + textarea("answers", "Accepted answers", value="others\nother people", rows=3, help_="One per line, up to 10. Matched ignoring capitals and spaces at either end."))),
           "edit": ("Editing question 1: the same dialog filled in, saved in place.",
                    question_box("Edit question 1", question_body(None), "Save question")),
       })

simple("delete-question", "Delete question 1?", "curriculum-quiz", ["L2-073", R_CURRIC],
       "“In Pick Up the Towel, what did the captain do before the big game?” is removed and the questions after it move up.",
       lambda e: "", "Delete question", icon_name="trash", danger=True, failed_text="The question was not deleted. Try again.")

simple("rubric-criterion", "Add criterion", "curriculum-assignment", ["L2-074", R_CURRIC], "Mentors award up to these points for it. Saved with the assignment.",
       lambda e: (field("criterion", "Criterion", value="" if e else "Named one thing they noticed", required=True, autofocus=True, error=(e or {}).get("criterion", ""))
                  + field("points", "Points", type_="number", inputmode="numeric", value="0" if e else "5", error=(e or {}).get("points", ""), help_="1 to 100.")),
       "Add criterion", icon_name="list", invalid_err={"criterion": "Describe the criterion.", "points": "Give it 1 to 100 points."},
       na={"busy": "Nothing is sent until the assignment is saved.", "failed": "Nothing is sent until the assignment is saved."},
       extra_states={"edit": ("Editing criterion 1.", dialog_box("Edit criterion 1", "Mentors award up to these points for it. Saved with the assignment.",
                                                               field("criterion", "Criterion", value="Chose someone and served without being asked", required=True, autofocus=True)
                                                               + field("points", "Points", type_="number", inputmode="numeric", value="10", help_="1 to 100."),
                                                               footer("Save criterion"), icon_name="list", form=True))})

# ------------------------------------------------------------------ Complete lessons (prompt 57)
simple("submit-project", "Submit “Build Your Event Page”?", "learn-coding-project", ["L2-070", "L1-023"],
       "Your mentor will review it. You can’t change it while it’s under review.",
       lambda e: textarea("note", "Note to your mentor", value="I used my first bit of CSS for the colours." if not e else "x" * 40 + "…", rows=3, optional=True,
                          help_="Up to 1,000 characters.", error=(e or {}).get("note", "")),
       "Submit for review", icon_name="send", invalid_err={"note": "Keep the note under 1,000 characters."},
       failed_text="Your project was not sent. Try again.")

# ------------------------------------------------------------------ Take quizzes (prompt 61)
simple("submit-quiz", "Submit your answers?", "learn-quiz", ["L2-075", "L1-023"],
       "Leading by Serving quiz · Attempt 1 of 2",
       lambda e: alert("warning", "You can’t change them after this", "You’ve answered all 4 questions. Once you submit, this attempt is scored and locked."),
       "Submit answers", icon_name="check", base_state="short-answer", form=False, cancel="Keep reviewing",
       failed_text="Your quiz was not submitted. Your answers are saved; try again.",
       extra_states={"unanswered": ("Two questions left blank: the dialog says which, and she can still submit.",
                                    dialog_box("Submit your answers?", "Leading by Serving quiz · Attempt 1 of 2",
                                               alert("warning", "2 questions have no answer", "Questions 2 and 3 are blank and will count as wrong. Once you submit, this attempt is scored and locked."),
                                               footer("Submit anyway", cancel="Go back"), icon_name="check"))})

# ------------------------------------------------------------------ Submit assignments (prompt 62)
simple("submit-assignment", "Send it to Daniel?", "learn-submit", ["L2-077", "L2-078", "L1-023"],
       "Serve someone this week · your reflection and 1 photo",
       lambda e: alert("info", "You can’t change it while it’s being reviewed", "Daniel Osei reviews your work. If something needs another look, they can ask for a revision."),
       "Submit for review", icon_name="send", form=False, cancel="Keep editing",
       failed_text="Your work was not sent. Everything is still on the page; try again.",
       extra_states={"resubmit": ("Resubmitting after a revision: the same check, sending the revised work.",
                                  dialog_box("Send it to Daniel again?", "Serve someone this week · your revised reflection and 1 photo",
                                             alert("info", "It goes back to Daniel Osei for review", "You can’t change it again unless they ask for another revision."),
                                             footer("Resubmit", cancel="Keep editing"), icon_name="send"))})

@screen("unsaved-changes", "dialog", "Leave without submitting?", opens_from="learn-submit", reqs=["L2-079", "L1-014"],
        na={"busy": "Saving a draft on the device is instant; there is no server call to wait for.",
            "invalid": "The dialog has no inputs to validate.",
            "failed": "Saving a draft on the device does not call the server."})
def unsaved_changes(S):
    body = '<p>Save a draft on this device to pick up where you left off, or leave and lose what you wrote. Your photo isn’t kept in a draft.</p>'
    S.add("default", "Leaving learn-submit with unsent changes: Keep editing, Save draft and leave, or the quiet Leave without saving. Escape keeps editing.",
          **over("learn-submit", "default", overlays=dialog_box("Leave without submitting?", "Your reflection hasn’t been sent or saved.", body,
                                                              btn("Leave without saving", "ghost") + footer("Save draft and leave", cancel="Keep editing"), icon_name="alert-triangle")))


@screen("leave-reflection", "dialog", "Leave without saving?", opens_from="learn-reflection", reqs=["L2-089", "L2-079", "L1-023"],
        na={"busy": "Saving a draft on the device is instant; there is no server call to wait for.",
            "invalid": "The dialog has no inputs to validate.",
            "failed": "Saving a draft on the device does not call the server."})
def leave_reflection(S):
    body = '<p>Save a draft on this device to finish it later, or leave and lose what you wrote. Nobody else can see a draft, even with sharing on.</p>'
    S.add("default", "Leaving learn-reflection with unsaved words: Keep editing, Save draft and leave, or the quiet Leave without saving. Escape keeps editing.",
          **over("learn-reflection", "default", overlays=dialog_box("Leave without saving?", "Your reflection hasn’t been saved.", body,
                                                                  btn("Leave without saving", "ghost") + footer("Save draft and leave", cancel="Keep editing"), icon_name="alert-triangle")))


# ------------------------------------------------------------------ Grade and assess (prompt 63)
G_NOTE = "Great story, Sofía! Can you add a line about one thing you noticed? Then this is a full pass."


def revision_body(err):
    err = err or {}
    return (textarea("revision-note", "What should they change?", value="" if "revision-note" in err else G_NOTE, rows=4, error=err.get("revision-note", ""),
                     help_="Sofía sees this note on their submission and in their notifications, and can resubmit.", attrs=" required autofocus"))


simple("request-revision", "Request a revision", "mentor-grade", ["L2-080", "L2-065", "L1-024"], "Sofía gets your note and can resubmit.",
       revision_body, "Send request", icon_name="edit", invalid_err={"revision-note": "Write what they should change."},
       failed_text="Nothing was sent. Your note is still here; try again.")

simple("approve-submission", "Approve Sofía’s submission?", "mentor-grade", ["L2-080", "L2-065", "L1-024"], "Serve someone this week · 25 of 25 points",
       lambda e: '<p>Sofía sees the points and your comment, and the assignment counts as done.</p>', "Approve", icon_name="check-circle", form=False,
       failed_text="It wasn’t approved. Your scores and comment are still on the page; try again.")


def approve_quiz_body(err):
    err = err or {}
    return (facts([("Youth", "Nadia Haddad"), ("Quiz", "Knowing Yourself quiz · attempt 1"), ("Auto-score", "75% · 3 of 4 right"), ("Pass mark", "70%")])
            + field("override", "Override score (optional)", type_="number", value="150" if "override" in err else "", inputmode="numeric", attrs=' min="0" max="100" step="1"',
                    help_="A percentage from 0 to 100. Leave it blank to approve the 75% auto-score.", error=err.get("override", "")))


simple("approve-quiz", "Approve this quiz score?", "mentor-quiz-approvals", ["L2-081", "L2-065", "L1-024"], "Nadia sees only the score you approve.",
       approve_quiz_body, "Approve score", icon_name="check-circle", invalid_err={"override": "Enter a whole number from 0 to 100, or leave it blank."},
       failed_text="The score wasn’t approved. Try again.")

simple("approve-all-quizzes", "Approve all 2 quiz scores?", "mentor-quiz-approvals", ["L2-081", "L2-065", "L1-024"], "Each is approved at its auto-score",
       lambda e: ul_list([list_item("Nadia Haddad", "Knowing Yourself quiz · 75%"), list_item("Sofía Rivera", "Leading by Serving quiz · 50%")], card=False, label="Quiz scores to approve") + '<p class="text-muted">To change a score, approve it on its own instead.</p>',
       "Approve all", icon_name="check", form=False, failed_text="Nothing was approved. Try again.")


@screen("leave-grade", "dialog", "Leave without saving your grade?", opens_from="mentor-grade", reqs=["L2-080", "L1-024"],
        na={"busy": "Leaving or staying is instant; Save draft and leave shows the page's own busy Save draft.",
            "invalid": "The dialog has no inputs to validate.",
            "failed": "A failed draft save keeps the page open with its own failed alert."})
def leave_grade(S):
    body = '<p>Save them as a draft to finish later; the youth still sees In review. Or leave and lose them.</p>'
    S.add("default", "Leaving mentor-grade with unsaved scores or a comment: Keep editing, Save draft and leave, or the quiet Leave without saving. Escape keeps editing.",
          **over("mentor-grade", "default", overlays=dialog_box("Leave without saving your grade?", "Your scores and comment haven’t been saved.", body,
                                                              btn("Leave without saving", "ghost") + footer("Save draft and leave", cancel="Keep editing"), icon_name="alert-triangle")))

# ------------------------------------------------------------------ Badges and progression (prompt 64, L2-084 to L2-086)
simple("award-badge", "Award Speaks Up", "curriculum-badge", ["L2-085", "L2-032", R_CURRIC],
       "Youth get it at once and see it on their journey. It is recorded with your name.",
       lambda e: select("youth", "Youth", ["Choose a youth", "Nadia Haddad"], selected="Choose a youth" if e else "Nadia Haddad", error=(e or {}).get("youth", ""),
                        help_="Youth of your organization who don’t have it yet."),
       "Award badge", icon_name="award", base_state="edit", invalid_err={"youth": "Choose a youth of your organization."},
       failed_text="The badge was not awarded. Try again.",
       extra_states={"already": ("Someone awarded it to Nadia a moment ago: the dialog says so and nothing is added twice.",
                                 dialog_box("Award Speaks Up", "Youth get it at once and see it on their journey. It is recorded with your name.",
                                            select("youth", "Youth", ["Nadia Haddad"], selected="Nadia Haddad", error="Nadia Haddad already has this badge.",
                                                   help_="Youth of your organization who don’t have it yet."),
                                            footer("Award badge"), icon_name="award", form=True))})

simple("delete-badge", "Delete Speaks Up?", "curriculum-badge", ["L2-084", "L2-032", R_CURRIC],
       "Youth who earned it keep it. No one else can earn it from now on.",
       lambda e: "", "Delete badge", icon_name="trash", danger=True, base_state="edit", failed_text="The badge was not deleted. Try again.")

simple("progression-stage", "Add stage", "curriculum-progression", ["L2-086", "L2-032", R_CURRIC], "A stage is a step on a youth’s journey. It is added last.",
       lambda e: (field("name", "Stage name", value="" if e else "Mentor", required=True, autofocus=True, error=(e or {}).get("name", ""), help_="Up to 60 characters.")
                  + field("description", "Short description", value="Helps a newer youth find their feet", optional=True, help_="Up to 200 characters.")),
       "Add stage", icon_name="list", invalid_err={"name": "Give the stage a name."}, failed_text="The stage was not saved. Try again.",
       extra_states={"edit": ("Editing Explorer: its name and description; its place and competencies stay.",
                              dialog_box("Edit Explorer", "A stage is a step on a youth’s journey.",
                                         field("name", "Stage name", value="Explorer", required=True, autofocus=True, help_="Up to 60 characters.")
                                         + field("description", "Short description", value="Finding their place in the group", optional=True, help_="Up to 200 characters."),
                                         footer("Save stage"), icon_name="list", form=True))})

simple("progression-competency", "Add competency to Explorer", "curriculum-progression", ["L2-086", "L2-082", "L2-032", R_CURRIC],
       "A skill or mark of growth youth show to reach this stage. Mentors assess it on each youth’s record.",
       lambda e: (field("name", "Competency", value="" if e else "Welcomes someone new", required=True, autofocus=True, error=(e or {}).get("name", ""), help_="Up to 80 characters.")
                  + textarea("description", "What it looks like", value="Says hello, learns their name and includes them in the group.", rows=2, optional=True, help_="Up to 300 characters. Mentors read this when they assess it.")),
       "Add competency", icon_name="plus", invalid_err={"name": "Name the competency."}, failed_text="The competency was not added. Try again.")

simple("remove-competency", "Remove Works with others?", "curriculum-progression", ["L2-086", "L2-082", "L2-032", R_CURRIC],
       "Mentors stop assessing it. The assessments they already made are kept.",
       lambda e: "", "Remove competency", icon_name="trash", danger=True, failed_text="The competency was not removed. Try again.")


# ------------------------------------------------------------------ Record mentor check-ins (prompt 67, L2-090)
from pages_checkins import KINDS, HOW, R_CHECKIN  # noqa: E402

CI_TOPICS = "Fractions homework and the spelling bee on Friday. He wants to read his word list to Carmen tonight."
CI_ACTIONS = "Practise ten spelling words each night."
CI_PRIVATE = "Carmen mentioned money is tight this month; check whether the program fee waiver applies."


def checkin_body(err=None, *, fixed: bool = False, shared: bool = False, blank: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    youth = (facts([("Youth", "Mateo Rivera")]) if fixed else
             select("youth", "Youth", ["Choose a youth", "Emily Tran", "Jordan Thompson", "Kevin Tran", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"],
                    selected="Choose a youth" if (blank or "youth" in err) else "Mateo Rivera", error=err.get("youth", ""), attrs=" required"))
    when = field("date", "Date", type_="date", value="2026-11-06" if "date" in err else "2026-11-05", required=True, error=err.get("date", ""))
    kind = fieldset("How you met", "".join(choice("kind", k, checked=(k == "1:1" and not blank), invalid="kind" in err) for k in KINDS), error=err.get("kind", ""), fid="kind")
    how = fieldset("How it went", "".join(choice("how", h, small=s, checked=(h == "Engaged" and not blank), invalid="how" in err) for h, s in HOW), error=err.get("how", ""), fid="how")
    topics = textarea("topics", "What you talked about", value="" if blank else CI_TOPICS, rows=3, optional=True, count=f"{0 if blank else len(CI_TOPICS)} / 2,000")
    actions = textarea("actions", "Action items", value="" if blank else CI_ACTIONS, rows=2, optional=True, count=f"{0 if blank else len(CI_ACTIONS)} / 2,000")
    private = textarea("private-notes", "Private notes", value="" if blank else CI_PRIVATE, rows=2, optional=True,
                       help_="Only you can read these, even when the check-in is shared.")
    follow = field("follow-up", "Next follow-up", type_="date", value="2026-11-01" if "follow-up" in err else ("" if blank else "2026-11-12"), optional=True,
                   error=err.get("follow-up", ""), help_="It shows on your Mentoring dashboard.")
    share_desc = ("On: marked shared for the youth and their guardian. Your private notes stay yours." if shared
                  else "Off: a private mentor note. Only you can read it.")
    share = switch("shared", "Share with the youth and guardian", checked=shared, desc=share_desc)
    informed = choice("guardian-informed", "Guardian was informed", type_="checkbox", checked=shared)
    return (summary + youth + when + kind + how + topics + actions + private + follow + share + informed)


def checkin_box(err=None, *, busy=False, alert_html="", fixed=False, shared=False, blank=False) -> str:
    return dialog_box("Log a mentor check-in", "A conversation with one of your youth. Only you can read it unless you share it.",
                      checkin_body(err, fixed=fixed, shared=shared, blank=blank), footer("Save check-in", busy=busy), icon_name="message",
                      alert_html=alert_html, form=True, scroll=True)


@screen("mentor-check-in", "dialog", "Log a mentor check-in", opens_from="mentor-check-in-history", reqs=R_CHECKIN)
def mentor_check_in(S):
    S.add("default", "Log a mentor check-in from the history: youth, date (today), how they met, how it went, what they talked about, action items, private notes, a follow-up date. Sharing is off.",
          **over("mentor-check-in-history", "default", overlays=checkin_box()))
    S.add("empty", "Just opened: nothing chosen yet but today’s date; focus on Youth.", **over("mentor-check-in-history", "default", overlays=checkin_box(blank=True)))
    S.add("from-record", "Opened from Mateo’s record: the youth is fixed, everything else as usual.", **over("mentor-youth-detail", "check-ins", overlays=checkin_box(fixed=True)))
    S.add("shared", "Sharing on: the switch says the private notes stay his; Guardian was informed ticked.", **over("mentor-check-in-history", "default", overlays=checkin_box(shared=True)))
    S.add("invalid", "Save with no youth, a future date and a follow-up before the check-in: errors beside the fields and in a summary.",
          **over("mentor-check-in-history", "default", overlays=checkin_box({"youth": "Choose a youth.", "date": "The date can’t be in the future.",
                                                                            "follow-up": "The follow-up can’t be before the check-in."})))
    S.add("busy", "Saving: Save check-in is busy and cannot be pressed twice; Cancel still works.", **over("mentor-check-in-history", "default", overlays=checkin_box(busy=True)))
    S.add("failed", "The save failed: everything he wrote stays to try again.",
          **over("mentor-check-in-history", "default", overlays=checkin_box(alert_html=failed_alert("That didn’t go through", "The mentor check-in wasn’t saved. Everything is still here; try again."))))


# ---------------------------------------------------------------- at-risk flags (prompt 68, L2-091)
from pages_flags import R_FLAGS, SEVERITY, OUTCOMES  # noqa: E402

FLAG_REASON = "Asked me twice whether he could stay late because nobody is home after school."


def raise_flag_body(err=None, *, blank: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    youth = select("youth", "Youth", ["Choose a youth", "Emily Tran", "Jordan Thompson", "Kevin Tran", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad"],
                   selected="Choose a youth" if (blank or "youth" in err) else "Mateo Rivera", error=err.get("youth", ""), attrs=" required")
    sev = fieldset("How serious is it?", "".join(choice("severity", s, small=d, checked=(s == "Medium" and not blank and "severity" not in err), invalid="severity" in err)
                                                for s, d in SEVERITY), error=err.get("severity", ""), fid="severity")
    reason_value = "" if (blank or "reason" in err) else FLAG_REASON
    reason = textarea("reason", "Why are you worried?", value=reason_value, rows=4, error=err.get("reason", ""), count=f"{len(reason_value)} / 1,000",
                      help_="Program directors can read this.")
    hint = alert("info", "Someone hurt or in danger?", "Don’t wait for a flag: tell your program director now.")
    return summary + youth + sev + reason + hint


def raise_flag_box(err=None, *, busy=False, alert_html="", blank=False) -> str:
    return dialog_box("Raise an at-risk flag", "Your program director is told, and the flag stays open until it’s resolved.",
                      raise_flag_body(err, blank=blank), footer("Raise flag", busy=busy), icon_name="flag", alert_html=alert_html, form=True, scroll=True)


@screen("raise-flag", "dialog", "Raise an at-risk flag", opens_from="mentor-flags", reqs=R_FLAGS)
def raise_flag(S):
    S.add("default", "Raise a flag on Mateo: the youth, how serious it is (Medium) and why. A note says not to wait for a flag when someone is hurt or in danger.",
          **over("mentor-flags", "default", overlays=raise_flag_box()))
    S.add("empty", "Just opened: nothing chosen yet; focus on Youth.", **over("mentor-flags", "default", overlays=raise_flag_box(blank=True)))
    S.add("invalid", "Raise with nothing filled in: errors beside the fields and in a summary.",
          **over("mentor-flags", "default", overlays=raise_flag_box({"youth": "Choose a youth.", "severity": "Choose how serious it is.", "reason": "Say why you’re worried."})))
    S.add("already-flagged", "Yusuf already has an open flag: the server answers 409 and the dialog says to resolve that one first.",
          **over("mentor-flags", "default", overlays=raise_flag_box(alert_html=alert("warning", "Yusuf Haddad already has an open flag", "Resolve it before you raise another."))))
    S.add("busy", "Raising: Raise flag is busy and cannot be pressed twice; Cancel still works.", **over("mentor-flags", "default", overlays=raise_flag_box(busy=True)))
    S.add("failed", "The save failed: everything he wrote stays to try again.",
          **over("mentor-flags", "default", overlays=raise_flag_box(alert_html=failed_alert("That didn’t go through", "The flag wasn’t raised. Everything is still here; try again."))))


def resolve_flag_body(err=None, *, blank: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    who = facts([("Youth", "Yusuf Haddad"), ("Flag", "High · Raised by Daniel Osei · Wed 4 Nov")])
    outcome = fieldset("How was it resolved?", "".join(choice("outcome", o, checked=(i == 0 and not blank and "outcome" not in err), invalid="outcome" in err)
                                                     for i, o in enumerate(OUTCOMES)), error=err.get("outcome", ""), fid="outcome")
    note_value = "" if blank else "Moved to Tuesday nights. Carmen at the front desk set up a ride with the Haddads’ neighbour."
    note_ = textarea("note", "Note", value=note_value, rows=3, optional=True, count=f"{len(note_value)} / 1,000",
                     help_="You can raise a new flag any time if things change.")
    return summary + who + outcome + note_


def resolve_flag_box(err=None, *, busy=False, alert_html="", blank=False) -> str:
    return dialog_box("Resolve this flag?", "Yusuf leaves the open list. The flag and how it was resolved are kept.",
                      resolve_flag_body(err, blank=blank), footer("Resolve flag", busy=busy), icon_name="check", alert_html=alert_html, form=True, scroll=True)


@screen("resolve-flag", "dialog", "Resolve an at-risk flag", opens_from="mentor-flags", reqs=R_FLAGS)
def resolve_flag(S):
    S.add("default", "Resolve Yusuf’s flag: how it was resolved (Reconnected) and an optional note.", **over("mentor-flags", "default", overlays=resolve_flag_box()))
    S.add("invalid", "Resolve with no outcome chosen: the error beside the choices and in a summary.",
          **over("mentor-flags", "default", overlays=resolve_flag_box({"outcome": "Choose how it was resolved."}, blank=True)))
    S.add("already-resolved", "Someone else resolved it a moment ago: the server answers 409; closing the dialog reloads the list.",
          **over("mentor-flags", "default", overlays=resolve_flag_box(alert_html=alert("warning", "This flag is already resolved", "Close to see the latest."))))
    S.add("busy", "Resolving: Resolve flag is busy; Cancel still works.", **over("mentor-flags", "default", overlays=resolve_flag_box(busy=True)))
    S.add("failed", "The save failed: the choice and note stay to try again.",
          **over("mentor-flags", "default", overlays=resolve_flag_box(alert_html=failed_alert("That didn’t go through", "The flag wasn’t resolved. Everything is still here; try again."))))


# ---------------------------------------------------------------- assign work (prompt 69, L2-092)
from pages_assign import R_ASSIGN, KINDS as WORK_KINDS  # noqa: E402

ASSIGN_MESSAGE = "Read this before Tutoring night next week. Come ready to share one way you served someone."
WORK_ITEMS = ["Choose a lesson", "Pick Up the Towel · Leading by Serving", "Last in Line · Leading by Serving", "Leading Like a Coach · Leading by Serving",
              "Who Am I? · Knowing Yourself", "My Strengths · Knowing Yourself"]
ASSIGN_YOUTH = [("Emily Tran", "Saturday Sports", ""), ("Jordan Thompson", "After‑School Tutoring", ""), ("Kevin Tran", "Saturday Sports", ""),
                ("Mateo Rivera", "After‑School Tutoring", ""), ("Sofía Rivera", "After‑School Tutoring", ""), ("Yusuf Haddad", "After‑School Tutoring", "At risk")]


def assign_body(err=None, *, blank: bool = False, chosen: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    kind = fieldset("What are you assigning?", "".join(choice("kind", k, small=d, checked=(k == "Lesson")) for k, d in WORK_KINDS), fid="kind")
    item = select("item", "Lesson", WORK_ITEMS, selected="Choose a lesson" if (blank or "item" in err) else "Last in Line · Leading by Serving",
                  error=err.get("item", ""), help_="Published work of the tracks your youth follow.", attrs=" required")
    who_cohort = not chosen and not blank and "who" not in err
    who = fieldset("Who is it for?", choice("who", "A whole cohort", small="Everyone on its roster today", checked=who_cohort, invalid="who" in err)
                   + choice("who", "Youth I choose", small="One or more of your youth", checked=chosen, invalid="who" in err), error=err.get("who", ""), fid="who")
    if chosen:
        boxes = "".join(choice("youth", n, small=c + (" · " + flag_ if flag_ else ""), type_="checkbox", checked=n in ("Mateo Rivera", "Yusuf Haddad"))
                        for n, c, flag_ in ASSIGN_YOUTH)
        target = fieldset("Your youth", boxes, fid="youth", hint="2 chosen")
    elif who_cohort:
        target = select("cohort", "Cohort", ["After‑School Tutoring · 4 youth", "Saturday Sports · 2 youth"], selected="After‑School Tutoring · 4 youth")
    else:
        target = ""
    due = field("due", "Due date", type_="date", value="" if (blank or "due" in err) else "2026-11-13", error=err.get("due", ""), required=True,
                help_="They see it on their Learning home with this date.")
    msg_value = "" if blank else ASSIGN_MESSAGE
    msg = textarea("message", "Message", value=msg_value, rows=3, optional=True, count=f"{len(msg_value)} / 500", help_="Shown with the work on their Learning home.")
    return summary + kind + item + who + target + due + msg


def assign_box(err=None, *, busy=False, alert_html="", blank=False, chosen=False) -> str:
    return dialog_box("Assign work", "Pick a lesson, quiz or assignment, who it’s for and when it’s due.",
                      assign_body(err, blank=blank, chosen=chosen), footer("Assign", busy=busy), icon_name="plus", alert_html=alert_html, form=True, scroll=True)


@screen("assign-work", "dialog", "Assign work", opens_from="mentor-dashboard", reqs=R_ASSIGN)
def assign_work(S):
    S.add("default", "Assign Last in Line to the whole After‑School Tutoring cohort, due Fri 13 Nov, with a message.",
          **over("mentor-dashboard", "default", overlays=assign_box()),
          notes=note("GET /mentoring/assign-work answers the published lessons, quizzes and assignments of the tracks his cohorts and youth follow, his youth and his cohorts. Choosing Quiz or Assignment swaps the list.", "top: 5rem; right: 1rem;"))
    S.add("chosen-youth", "Youth I choose: a checkbox for each of his youth with their cohort; Yusuf is marked at risk. Mateo and Yusuf are chosen.",
          **over("mentor-dashboard", "default", overlays=assign_box(chosen=True)))
    S.add("empty", "Just opened: Lesson is chosen and nothing else; focus on Lesson.", **over("mentor-dashboard", "default", overlays=assign_box(blank=True)))
    S.add("invalid", "Assign with nothing chosen: errors beside the fields and in a summary.",
          **over("mentor-dashboard", "default", overlays=assign_box({"item": "Choose what to assign.", "who": "Choose who it’s for.", "due": "Choose a due date."})))
    S.add("not-followed", "Kevin is chosen but doesn’t follow Leadership Foundations: the server answers 422 and says who.",
          **over("mentor-dashboard", "default", overlays=assign_box({"youth": "Kevin Tran doesn’t follow the track this lesson is in."}, chosen=True)))
    S.add("busy", "Assigning: Assign is busy and cannot be pressed twice; Cancel still works.", **over("mentor-dashboard", "default", overlays=assign_box(busy=True)))
    S.add("failed", "The save failed: everything he chose stays to try again.",
          **over("mentor-dashboard", "default", overlays=assign_box(alert_html=failed_alert("That didn’t go through", "Nothing was assigned. Everything is still here; try again."))))
    S.add("nothing-to-assign", "None of the tracks his youth follow has published work yet: the dialog says so and offers only Close.",
          **over("mentor-dashboard", "default", overlays=dialog_box("Assign work", "Pick a lesson, quiz or assignment, who it’s for and when it’s due.", card(empty("Nothing to assign yet", "When a track your cohorts follow publishes lessons, quizzes or assignments, you can assign them here.", icon_name="list"), cls="card--flush"),
                                                                    btn("Close", "", attrs=" autofocus"), icon_name="plus")))


# ---------------------------------------------------------------- RSVP (prompt 70, L2-094)
from pages_schedule import R_RSVP  # noqa: E402

RSVP_ANSWERS = [("Yes, I’ll be there", "Going"), ("Maybe", "Not sure yet"), ("Can’t make it", "Staff will know not to wait for you")]
RSVP_NOTE = "Can I bring my inhaler on the bus?"


def rsvp_body(err=None, *, blank: bool = False) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    session = facts([("Session", "Fall field trip: Royal Botanical Gardens"), ("When", "Sat 14 Nov, 9:00 am–3:00 pm"), ("Where", "Royal Botanical Gardens · bus leaves 8:45 am")])
    answer = fieldset("Will you be there?", "".join(choice("response", a, small=hint, checked=(i == 0 and not blank and "response" not in err), invalid="response" in err)
                                                for i, (a, hint) in enumerate(RSVP_ANSWERS)), error=err.get("response", ""), fid="response")
    value = "" if blank else RSVP_NOTE
    note_ = textarea("note", "Note for staff", value=value, rows=3, optional=True, count=f"{len(value)} / 500",
                     help_="Staff running the session can read it.", error=err.get("note", ""))
    return summary + session + answer + note_


def rsvp_box(err=None, *, busy=False, alert_html="", blank=False) -> str:
    return dialog_box("RSVP", "Let staff know if you’ll be there. You can change it until the session starts.",
                      rsvp_body(err, blank=blank), footer("Send RSVP", busy=busy), icon_name="calendar", alert_html=alert_html, form=True, scroll=True)


@screen("rsvp", "dialog", "RSVP", opens_from="youth-schedule", reqs=R_RSVP)
def rsvp(S):
    S.add("default", "Sofía answers for the field trip: Yes, I’ll be there, with a note for staff.", **over("youth-schedule", "default", overlays=rsvp_box()))
    S.add("empty", "Just opened on a session she hasn’t answered: nothing chosen yet; focus on the first answer.", **over("youth-schedule", "default", overlays=rsvp_box(blank=True)))
    S.add("invalid", "Send with no answer: the error beside the choices and in a summary.",
          **over("youth-schedule", "default", overlays=rsvp_box({"response": "Choose whether you’re going."}, blank=True)))
    S.add("busy", "Sending: Send RSVP is busy and cannot be pressed twice; Cancel still works.", **over("youth-schedule", "default", overlays=rsvp_box(busy=True)))
    S.add("failed", "The send failed: her answer and note stay to try again.",
          **over("youth-schedule", "default", overlays=rsvp_box(alert_html=failed_alert("That didn’t go through", "Your RSVP wasn’t sent. Everything is still here; try again."))))
    S.add("closed", "The session started or was cancelled while the dialog was open: the server answers 409 and closing reloads the schedule.",
          **over("youth-schedule", "default", overlays=rsvp_box(alert_html=alert("warning", "RSVPs are closed for this session", "It has started or was cancelled. Close to see your schedule."))))


# ---------------------------------------------------------------- correct attendance (prompt 71, L2-097)
from pages_attendance import R_HISTORY  # noqa: E402

CORRECT_REASON = "Nour Haddad emailed on Wednesday morning that Yusuf had a dentist appointment."


def correct_body(err=None) -> str:
    err = err or {}
    summary = form_summary(list(err.items())) if err else ""
    youth = select("youth", "Youth", ["Jordan Thompson · Present", "Mateo Rivera · Present", "Sofía Rivera · Present", "Yusuf Haddad · Absent"],
                   selected="Yusuf Haddad · Absent", attrs=" required")
    status_ = fieldset("Mark as", "".join(choice("status", s, small=d, checked=(s == "Excused")) for s, d in
                                          [("Present", "Here on time"), ("Late", "Here, after the start"), ("Excused", "Not here, reason accepted"), ("Absent", "Not here")]), fid="status")
    reason_value = "" if "reason" in err else CORRECT_REASON
    reason = textarea("reason", "Why are you correcting it?", value=reason_value, rows=3, error=err.get("reason", ""), count=f"{len(reason_value)} / 500",
                      help_="Kept with the change in the audit log.")
    return summary + youth + status_ + reason


def correct_box(err=None, *, busy=False, alert_html="") -> str:
    return dialog_box("Correct attendance", "Tutoring night · Wed 4 Nov · After‑School Tutoring", correct_body(err), footer("Save correction", busy=busy),
                      icon_name="edit", alert_html=alert_html, form=True, scroll=True)


@screen("correct-attendance", "dialog", "Correct attendance", opens_from="attendance-history", reqs=R_HISTORY)
def correct_attendance(S):
    S.add("default", "Marisol corrects Yusuf on Wed 4 Nov from Absent to Excused, with why. The session has ended; corrections are for admins and program directors and are audited.",
          **over("attendance-history", "default", overlays=correct_box()))
    S.add("invalid", "Saved with no reason: the error sits beside Why and in a summary.",
          **over("attendance-history", "default", overlays=correct_box({"reason": "Say why you’re correcting it."})))
    S.add("busy", "Saving: Save correction is busy and cannot be pressed twice; Cancel still works.", **over("attendance-history", "default", overlays=correct_box(busy=True)))
    S.add("failed", "The save failed: the choice and the reason stay to try again.",
          **over("attendance-history", "default", overlays=correct_box(alert_html=failed_alert("That didn’t go through", "The correction wasn’t saved. Everything is still here; try again."))))


# ------------------------------------------------------------------ Configure the organization (prompt 79, L2-122 to L2-126, ADR 0073)
TIME_ZONES = ["Newfoundland (St. John’s)", "Atlantic (Halifax)", "Eastern (Toronto)", "Central (Winnipeg)", "Saskatchewan (Regina)",
              "Mountain (Edmonton)", "Pacific (Vancouver)", "Yukon (Whitehorse)"]


@screen("organization-profile", "dialog", "Edit organization profile", opens_from="settings-organization", reqs=["L2-122", "L2-001", "L2-032", "L2-035"],
        na={"success": "Saving closes the dialog: the page shows the toast (`settings-organization/profile-saved`)."})
def organization_profile(S):
    def box(err=None, busy=False, alert_html="", name=ORG, email="hello@harbourview.example", phone="905-555-0100"):
        e = err or {}
        summary = form_summary([(k, m) for k, m in e.items()]) if e else ""
        body = (summary
                + field("org-name", "Organization name", value=name, required=True, autofocus=not e, error=e.get("org-name", ""),
                        help_="Shown in the top bar, on guardian pages and in every message.")
                + field("org-city", "City", value="Hamilton, Ontario", required=True, error=e.get("org-city", ""))
                + field("org-email", "Contact email", type_="email", value=email, optional=True, autocomplete="email", error=e.get("org-email", ""),
                        help_="Where families and youth can write to you.")
                + field("org-phone", "Phone", type_="tel", value=phone, optional=True, inputmode="tel", autocomplete="tel", error=e.get("org-phone", ""),
                        help_="Shown on every guardian page.")
                + select("org-tz", "Time zone", TIME_ZONES, selected="Eastern (Toronto)",
                         help_="Today’s sessions, due dates and reminders follow it."))
        return dialog_box("Edit organization profile", "Saving is logged.", body, footer("Save profile", busy=busy), icon_name="edit",
                          alert_html=alert_html, form=True)
    S.add("default", "Tom edits the name, city, contact email, phone and time zone; focus on the name.", **over("settings-organization", overlays=box()))
    S.add("invalid", "An empty name, an email without a domain and a phone without its area code: inline errors and a summary, nothing saved.",
          **over("settings-organization", overlays=box(err={"org-name": "Enter your organization’s name.", "org-email": "Enter an email like hello@example.org.",
                                                            "org-phone": "Include the area code, like 905-555-0100."}, name="", email="hello@harbourview", phone="555-0100")))
    S.add("busy", "Saving: Save profile is busy, no second submit.", **over("settings-organization", overlays=box(busy=True)))
    S.add("failed", "The save failed: what he typed is kept and nothing changed.",
          **over("settings-organization", overlays=box(alert_html=failed_alert("That didn’t go through", "Your organization’s profile is unchanged. Try again."))))


@screen("mentoring-defaults", "dialog", "Edit mentoring defaults", opens_from="settings-organization", reqs=["L2-125", "L1-024", "L2-005", "L2-032", "L2-035"],
        na={"invalid": "The choice is a list of four; any other value is refused by the server and shows the failed state.",
            "success": "Saving closes the dialog: the page shows the toast (`settings-organization/mentoring-saved`)."})
def mentoring_defaults(S):
    def box(busy=False, alert_html=""):
        body = select("checkin-days", "Mentors check in with each youth", ["Every 7 days", "Every 14 days", "Every 21 days", "Every 30 days"], selected="Every 14 days",
                      help_="A youth with no mentor check-in from their mentor in this time shows under Check-ins due on the mentor’s dashboard.")
        return dialog_box("Edit mentoring defaults", "Applies to every mentor at once. Saving is logged.", body, footer("Save defaults", busy=busy),
                          icon_name="users", alert_html=alert_html, form=True)
    S.add("default", "How often mentors check in with each youth, every 14 days until changed.", **over("settings-organization", overlays=box()))
    S.add("busy", "Saving.", **over("settings-organization", overlays=box(busy=True)))
    S.add("failed", "The save failed: the choice is kept and nothing changed.",
          **over("settings-organization", overlays=box(alert_html=failed_alert("That didn’t go through", "Your mentoring defaults are unchanged. Try again."))))


@screen("website-profile", "dialog", "Edit website profile", opens_from="settings-organization", reqs=["L2-126", "L1-025", "L2-005", "L2-001", "L2-032", "L2-035"],
        na={"success": "Saving closes the dialog: the page shows the toast (`settings-organization/website-saved`)."})
def website_profile(S):
    from pages_organization import TAGLINE, ABOUT

    def box(err=None, busy=False, alert_html="", slug="harbourview", tagline=TAGLINE):
        e = err or {}
        summary = form_summary([(k, m) for k, m in e.items()]) if e else ""
        body = (summary
                + field("site-slug", "Website address", value=slug, required=True, autofocus=not e, error=e.get("site-slug", ""),
                        help_="Your site is at /site/ and this name: 3 to 40 lowercase letters, numbers and hyphens. Changing it stops the old address working.")
                + field("site-tagline", "Tagline", value=tagline, required=True, error=e.get("site-tagline", ""), help_="One line under your name, up to 120 characters.")
                + textarea("site-about", "About", value=ABOUT, rows=4, optional=True, help_="Up to 1,000 characters.", count=f"{len(ABOUT)} / 1,000")
                + field("site-email", "Public email", type_="email", value="hello@harbourview.example", optional=True, error=e.get("site-email", ""),
                        help_="Shown to visitors. Leave it empty to show none."))
        return dialog_box("Edit website profile", "Visitors see this without signing in. Saving is logged.", body, footer("Save website profile", busy=busy),
                          icon_name="globe", alert_html=alert_html, form=True, scroll=True)
    S.add("default", "Tom edits the address, tagline, about and public email of the public website.", **over("settings-organization", overlays=box()))
    S.add("invalid", "An address with capitals and spaces and an empty tagline: inline errors and a summary.",
          **over("settings-organization", overlays=box(err={"site-slug": "Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.",
                                                            "site-tagline": "Write a tagline of up to 120 characters."}, slug="Harbourview Youth", tagline="")))
    S.add("taken", "The address another organization already uses: refused, nothing changed.",
          **over("settings-organization", overlays=box(err={"site-slug": "Another organization uses this address. Choose another."}, slug="northgate")))
    S.add("busy", "Saving.", **over("settings-organization", overlays=box(busy=True)))
    S.add("failed", "The save failed: what he typed is kept and nothing changed.",
          **over("settings-organization", overlays=box(alert_html=failed_alert("That didn’t go through", "Your website profile is unchanged. Try again."))))


# ---------------------------------------------------------------- Public website (prompt 81, L2-134)
R_SITE_FORMS = ["L2-134", "L1-025", "L2-005", "L2-001", "L2-031", "L2-032"]
VOLUNTEER_AREAS = ["Homework help", "Coaching a sports team", "Camp helper", "Driving and setup", "Wherever I’m needed"]


@screen("volunteer-interest", "dialog", "Sign up to volunteer", opens_from="site-get-involved", reqs=R_SITE_FORMS,
        na={"success": "Sending closes the dialog: the page shows the toast (`site-get-involved/volunteered`)."})
def volunteer_interest(S):
    def box(err=None, busy=False, alert_html="", name="Leo Martins", ack=True):
        e = err or {}
        summary = form_summary(list(e.items())) if e else ""
        body = (summary
                + field("vol-name", "Your name", value=name, required=True, autocomplete="name", autofocus=not e, error=e.get("vol-name", ""))
                + field("vol-email", "Email", type_="email", value="leo.martins@example.com", required=True, autocomplete="email", error=e.get("vol-email", ""))
                + field("vol-phone", "Phone", type_="tel", value="905-555-0120", optional=True, autocomplete="tel")
                + select("vol-area", "How would you like to help?", VOLUNTEER_AREAS, selected="Homework help")
                + textarea("vol-about", "A bit about you", value="I tutor maths at McMaster and I’m free on weekday afternoons.", rows=3, optional=True, count="62 / 1,000")
                + fieldset("Screening", choice("vol-ack", "I understand that volunteers who work with children are screened and reference checked before they start.",
                                               type_="checkbox", checked=ack, invalid=bool(e.get("vol-ack"))), error=e.get("vol-ack", ""), fid="vol-ack-set"))
        return dialog_box("Sign up to volunteer", "We’ll follow up by email about next steps.", body, footer("Sign up", busy=busy),
                          icon_name="heart", alert_html=alert_html, form=True, scroll=True)
    S.add("default", "Leo offers to help with homework: name, email, an optional phone, how he’d like to help and the screening acknowledgement.",
          **over("site-get-involved", overlays=box()))
    S.add("invalid", "Signed up without a name or the screening acknowledgement: inline errors and a summary; nothing is sent.",
          **over("site-get-involved", overlays=box(err={"vol-name": "Enter your name.", "vol-ack-set": "Tick the box to say you understand volunteers are screened."}, name="", ack=False)))
    S.add("busy", "Sending.", **over("site-get-involved", overlays=box(busy=True)))
    S.add("failed", "The send failed: what he typed is kept.", **over("site-get-involved", overlays=box(alert_html=failed_alert("Your sign-up didn’t send", "Nothing was lost. Try again."))))
    S.add("too-many", "Several sign-ups from the same email within an hour: refused kindly.",
          **over("site-get-involved", overlays=box(alert_html=alert("warning", "You’ve signed up already", "We’ve got your details. Please wait an hour before sending again."))))


TIERS = [("20", "Friend", "Lesson supplies for one child for a term."), ("50", "Builder", "A season of weekly mentoring for one young person."),
         ("100", "Champion", "Helps run a whole program for a neighbourhood.")]


@screen("start-donation", "dialog", "Give monthly", opens_from="site-get-involved", reqs=R_SITE_FORMS, na={})
def start_donation(S):
    def box(err=None, busy=False, alert_html="", picked="50", name="Dana Thompson", confirmed=False):
        e = err or {}
        summary = form_summary(list(e.items())) if e else ""
        tiers = "".join(choice("don-tier", f"${amt} a month · {label}", small=desc, checked=amt == picked, invalid=bool(e.get("don-tier-set"))) for amt, label, desc in TIERS)
        body = (summary
                + fieldset("Monthly amount", tiers, error=e.get("don-tier-set", ""), fid="don-tier-set")
                + field("don-name", "Your name", value=name, required=True, autocomplete="name", error=e.get("don-name", ""))
                + field("don-email", "Email for your receipt", type_="email", value="dana.t@example.com", required=True, autocomplete="email", error=e.get("don-email", ""))
                + '<p class="hint">Next, our secure payment provider takes your card details. We never see or store them.</p>')
        foot = footer("Continue to payment", busy=busy)
        if confirmed:
            body = (alert("success", "Thank you, Dana", "You’re giving $50 a month. Finish with our secure payment provider; it opens in a new tab.")
                    + '<p class="hint">Your pledge is saved. If you close the tab you can come back and give again any time.</p>')
            foot = btn("Close", "") + btn("Open secure payment", "primary", href="#", icon_name="arrow-right", attrs='target="_blank" rel="noopener" autofocus')
        return dialog_box("Give monthly", "Every gift keeps programs free for families.", body, foot, icon_name="heart", alert_html=alert_html, form=not confirmed, scroll=True)
    S.add("default", "Dana picks $50 a month and gives her name and email for the receipt.", **over("site-get-involved", overlays=box()))
    S.add("invalid", "Continued without an amount or a name: inline errors and a summary.",
          **over("site-get-involved", overlays=box(err={"don-tier-set": "Choose a monthly amount.", "don-name": "Enter your name."}, picked="", name="")))
    S.add("busy", "Starting the payment.", **over("site-get-involved", overlays=box(busy=True)))
    S.add("confirmed", "The pledge is saved with the provider’s reference: Open secure payment hands over to the provider.", **over("site-get-involved", overlays=box(confirmed=True)))
    S.add("failed", "Starting the payment failed: nothing was charged and her choice is kept.",
          **over("site-get-involved", overlays=box(alert_html=failed_alert("We couldn’t start your payment", "Nothing was charged. Try again."))))
    S.add("unavailable", "Online giving isn’t set up for this organization: no pledge is saved and the visitor is pointed to Contact.",
          **over("site-get-involved", overlays=box(alert_html=alert("info", "Online giving isn’t available yet", "Write to us from the contact page and we’ll help you give."))))


# ------------------------------------------------------------------ Learning Bond (L1-026 to L1-029; pages_learning_bond.py and pages_learning_bond_guardian.py)
from pages_learning_bond import LAUNCH_DATE, SENDER, PROVIDER  # noqa: E402
from pages_learning_bond_guardian import CONSENT_BEN  # noqa: E402
R_SD_X = ["L2-161", "L2-162", "L2-163"]

simple("learning-bond-signer", "Ask someone else to sign", "learning-bond-agreement", ["L2-137", "L1-026"] + R_SD_X, "They get a single-use link by email and need no PromiseHub account. The link works for 14 days.",
       lambda e: field("sname", "Their name", value="" if e else "Rev. Angela Baptiste", required=True, error=(e or {}).get("sname", ""), autofocus=True)
                 + field("stitle", "Their role or title", value="" if e else "Board chair", required=True, error=(e or {}).get("stitle", ""))
                 + field("semail", "Their email", type_="email", value="angela.baptiste" if e else "angela.baptiste@harbourview.example", required=True, error=(e or {}).get("semail", ""), help_=f"Sent from “{ORG} via PromiseHub”."),
       "Send the link", icon_name="mail", invalid_err={"sname": "Enter the signer’s name.", "stitle": "Enter the signer’s role or title.", "semail": "Enter an email like name@example.org."},
       success_body=f'<p><strong>Waiting for Rev. Angela Baptiste to sign.</strong></p><p class="text-muted">Emailed Thu 5 Nov, 4:02 pm. You’ll be told when they accept. A new request replaces this one and cancels its link.</p>')

simple("learning-bond-cancel-launch", "Cancel the launch?", "learning-bond-launch", ["L2-140", "L1-026"] + R_SD_X, f"Scheduled for {LAUNCH_DATE}, 10:00 am. Nothing has been sent.",
       lambda e: '<p>No invitation goes out. You can schedule a new day any time. Cancelling is recorded in the audit log.</p>',
       "Cancel launch", base_state="scheduled", icon_name="x-circle", danger=True, na={"invalid": "Confirming needs no input."})

simple("export-learning-bond", "Export for funders", "learning-bond-dashboard", ["L2-143", "L2-025", "L2-032", "L1-026"] + R_SD_X, "One row per covered program and a total: counts and dollars, never a family. Counts under 5 read “<5” and their dollars are blank.",
       lambda e: f'<div class="two-col">{field("from", "From", type_="date", value="2026-09-01", error=(e or {}).get("from", ""))}{field("to", "To", type_="date", value="2026-11-05")}</div>'
                 + facts([("Columns", "Households invited, started and completed; children with a Learning Bond application; estimated and confirmed dollars split by Learning Bond and benefits; confirmed dollars per completed household"), ("File", "harbourview-youth-collective-learning-bond-2026-09-01-2026-11-05.csv")])
                 + alert("info", "Logged", "Recorded in the audit log with the row count. The link works for 7 days.", role="status"),
       "Export", icon_name="download", invalid_err={"from": "Choose a start date on or before the end date."},
       success_body=f'<p>harbourview-youth-collective-learning-bond-2026-09-01-2026-11-05.csv is ready: 3 programs and a total row. The link works until Thu 12 Nov.</p><div class="cluster">{btn("Download", "primary", icon_name="download")}</div>')

simple("learning-bond-call-outcome", "Mark the call with Linh Tran done", "learning-bond-families", ["L2-142", "L1-026"] + R_SD_X, "289-555-0119 · asked today at 2:10 pm · afternoons.",
       lambda e: fieldset("Outcome", choice("out", "Resumed", small="She’ll carry on from her link.", checked=not e, invalid=bool(e)) + choice("out", "Not interested", small="No more texts about the Learning Bond.", invalid=bool(e)) + choice("out", "No answer", small="Stays as Call requested; try again later.", invalid=bool(e)), error=(e or {}).get("out", ""), fid="out")
                 + f'<p class="hint">{icon("lock", "icon--sm")} You see where she is in the steps, never her SIN or income.</p>',
       "Save outcome", base_state="call-requested", icon_name="phone", invalid_err={"out": "Choose what happened."})

simple("learning-bond-invite-household", "Invite the Petrov household to Learning Bond", "learning-bond-families", ["L2-140", "L2-142", "L1-026"] + R_SD_X, "One text to Elena Petrova now, in English, naming Nikolai.",
       lambda e: sms(f"{SENDER}: Nikolai may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: hbv.ph/sd/9p2m (STOP to opt out)") + '<p class="hint">Counts toward the monthly SMS cap. A household isn’t invited twice within 7 days.</p>',
       "Send invitation", icon_name="send", na={"invalid": "There is nothing to type."},
       extra_states={"already-invited": ("A household invited within the last 7 days: the button is replaced by when.",
                                         dialog_box("Invite the Rivera household to Learning Bond", "", alert("info", "Invited Thu 5 Nov", "Carmen Rivera got the text at 10:00 am. Invite again from Thu 12 Nov if she hasn’t started."), btn("Close", "", attrs=" autofocus"), icon_name="send"))})

simple("learning-bond-callback", "I’d rather talk to someone", "guardian-learning-bond", ["L2-142", "L1-027"] + R_SD_X, f"{ORG} will call you. They will see where you are in the steps, never your SIN.",
       lambda e: field("cb-phone", "Best number", type_="tel", value="905-555" if e else "905-555-0142", inputmode="tel", autocomplete="tel", required=True, error=(e or {}).get("cb-phone", ""), autofocus=True)
                 + fieldset("Best time", choice("cb-when", "Mornings", small="9 am to noon") + choice("cb-when", "Afternoons", small="Noon to 5 pm", checked=True) + choice("cb-when", "Evenings", small="5 to 8 pm")),
       "Ask for a call", base_state="in-progress", icon_name="phone", invalid_err={"cb-phone": "Enter a 10-digit mobile number."},
       success_body=f'<p>{ORG} will call you. They will see where you are in the steps, never your SIN.</p><p class="text-muted">Asked Thu 5 Nov, 4:52 pm · afternoons · 905-555-0142.</p>')

simple("withdraw-learning-bond-consent", "Withdraw consent for Mateo?", "guardian-learning-bond", ["L2-152", "L2-058", "L1-027"] + R_SD_X, f"We’ll stop and delete Mateo’s information here. Anything already sent to {PROVIDER} stays with them; contact them to close the RESP.",
       lambda e: facts([("Stops", "Any unsubmitted application for Mateo is cancelled. His SIN and intake answers are deleted; so is yours if no other child still has consent. No more texts about him."),
                        ("Stays", f"The status, provider and dates of what was already sent, with no SIN, so you and the dashboard can still read them. The RESP at {PROVIDER} is theirs to close: 1-800-555-0199.")]),
       "Withdraw consent", base_state="in-progress", icon_name="shield", danger=True, na={"invalid": "Confirming needs no input."},
       success_body="<p>Consent for Mateo withdrawn, Thu 5 Nov, 4:55 pm. His information here is deleted. If you give consent again later, the questions start from the beginning.</p>")

simple("learning-bond-benefits-offer", "Check your child benefits?", "learning-bond-submitted", ["L2-153", "L1-028"] + R_SD_X, "About 3 questions. Benefit details need a consent of their own, separate from the Learning Bond.",
       lambda e: fieldset("Consent", choice("bconsent", CONSENT_BEN, type_="checkbox", checked=not e, invalid="bconsent" in (e or {})), error=(e or {}).get("bconsent", ""), fid="bconsent")
                 + field("bsig", "Type your full name to sign", value="" if e else "Carmen Rivera", autocomplete="name", required=True, error=(e or {}).get("bsig", "")),
       "Agree and check", cancel="Not now", icon_name="check", invalid_err={"bconsent": "Tick the box to continue, or choose Not now.", "bsig": "Type your full name to sign."},
       success_body=f'<p>Consent recorded with scope Benefits, Thu 5 Nov, 4:30 pm. Three quick questions next.</p><div>{btn("Continue", "primary", icon_name="arrow-right", href=page("learning-bond-benefits-intake"))}</div>')
