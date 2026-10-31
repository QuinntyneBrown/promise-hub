"""Learning Bond, the staff side (L1-026, L2-135 to L2-143): the twelfth module claims the money governments already owe a family's
children, starting with the Canada Learning Bond in a no-fee RESP and a child benefits check. An admin turns it on only after the
organization accepts a versioned data-handling agreement (`learning-bond-agreement`, or a named signer through `learning-bond-signer`), chooses
which programs it covers and which staff roles see completion status (`learning-bond-coverage`), previews the platform-approved invitation in
each of the organization's languages and edits only the sender name (`learning-bond-invitation`), and launches on a chosen day or lets staff
invite at the door (`learning-bond-launch`). Settings › Learning Bond (`settings-learning-bond`) is the hub. Admins and program directors read uptake
and dollars unlocked on `learning-bond-dashboard` and export them for funders (`export-learning-bond`, dialogs.py); staff whose role is in the
status roles help families in person from `learning-bond-families`, seeing completion status only, never a SIN, income or dollar amount.
Adapted from the Learning Bond product mocks; those are guardian-only, so these screens come from the requirements.

Cast: Tom Nguyen (Admin) accepted agreement version 2 on Thu 29 Oct 2026. Coverage: After‑School Tutoring and Saturday Sports, 112
households; status roles Admin, Program director, Site lead and Youth worker. Launch scheduled Mon 9 Nov 2026, 10:00 am: 97 households
with a mobile number, 9 email only, 6 neither. Dashboard: 112 invited, 41 started, 18 completed, 23 children with a Learning Bond
application, $31,900 estimated, $9,400 confirmed. The Rivera household (Carmen, Mateo 9, Sofía 12) is the claim the guardian pages follow.
Northgate has Learning Bond off. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_admin import settings_nav, skeleton_form
from pages_ops import form_actions

T = STAFF["tom"]
M = STAFF["marisol"]
J = STAFF["jaylen"]
P = STAFF["priya"]

R_SD = "L1-026"
R_CROSS = ["L2-161", "L2-162", "L2-163", "L2-005", "L2-001"]
R_HUB = ["L2-135", "L2-136", "L2-138", "L2-139", "L2-140", R_SD] + R_CROSS
R_AGREEMENT = ["L2-136", "L2-137", R_SD] + R_CROSS
R_COVERAGE = ["L2-138", R_SD] + R_CROSS
R_INVITATION = ["L2-139", R_SD] + R_CROSS
R_LAUNCH = ["L2-140", R_SD] + R_CROSS
R_DASHBOARD = ["L2-141", "L2-143", R_SD] + R_CROSS
R_FAMILIES = ["L2-142", "L2-140", R_SD] + R_CROSS

PROVIDER = "Northfield Credit Union"
OTHER_PROVIDERS = ["Maple Trust RESP", "Prairie Co-op Education Savings"]
SENDER = "Harbourview After-School"
AGREEMENT_VERSION = 2
AGREEMENT_DATE = "Thu 29 Oct 2026"
LAUNCH_DATE = "Mon 9 Nov 2026"
SMS_EN = f"{SENDER}: Mateo and Sofía may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: hbv.ph/sd/4r7k (STOP to opt out)"
SMS_ES = f"{SENDER}: Mateo y Sofía podrían tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: hbv.ph/sd/4r7k (STOP para salir)"

COVERED_PROGRAMS = [("After‑School Tutoring", 48, True), ("Saturday Sports", 57, True), ("One-to-one Mentoring", 19, False), ("Winter Camp 2026", 33, False)]
STATUS_KIND = {"Not invited": "", "Invited": "info", "Started": "info", "Paused: needs a SIN": "warning", "Paused: needs a tax return": "warning",
               "Paused: needs a document": "warning", "Submitted": "success", "Deposited": "success", "Call requested": "warning", "Not completed": "", "Not interested": ""}
HOUSEHOLDS = [
    ("Rivera", "Carmen Rivera · Spanish", "After‑School Tutoring, Saturday Sports", "Submitted", "Today, 4:20 pm"),
    ("Tran", "Linh Tran", "Saturday Sports", "Call requested", "Today, 2:10 pm"),
    ("Haddad", "Nour Haddad · French", "After‑School Tutoring", "Paused: needs a SIN", "Tue 3 Nov"),
    ("Thompson", "Dana Thompson", "After‑School Tutoring", "Started", "Mon 2 Nov"),
    ("Chen", "Wei Chen", "Saturday Sports", "Deposited", "Fri 30 Oct"),
    ("Okonkwo", "Chidi Okonkwo", "After‑School Tutoring", "Invited", "Mon 9 Nov"),
    ("Siddiqui", "Farah Siddiqui", "Saturday Sports", "Paused: needs a tax return", "Sun 1 Nov"),
    ("Adeyemi", "Bola Adeyemi · no mobile", "After‑School Tutoring", "Not interested", "Tue 27 Oct"),
    ("Williams", "Keisha Williams", "Saturday Sports", "Not completed", "Fri 23 Oct"),
    ("Petrov", "Elena Petrova", "After‑School Tutoring", "Not invited", "—"),
]


def crumbs(current: str) -> str:
    return breadcrumb([("Settings", page("settings-organization")), ("Learning Bond", page("settings-learning-bond"))], current)


def crumbs_off(current: str) -> str:
    """While Learning Bond is off the hub isn't served, so the agreement sits under Settings › Modules."""
    return breadcrumb([("Settings", page("settings-organization")), ("Modules", page("settings-modules"))], current)


def failed_load(title: str, back: str = "") -> str:
    acts = btn("Try again", "primary", icon_name="refresh") + (btn("Back to Learning Bond", "ghost", href=page("settings-learning-bond")) if back else "")
    return card(empty(title, "Check your connection and try again.", action=acts, error=True, icon_name="alert-triangle"), cls="card--flush")


def forbidden(title: str, text: str, user: dict = J) -> str:
    return card(empty(title, text, action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush")


def privacy_note(pos: str = "top: 5rem; right: 1rem;") -> str:
    return note("Staff screens show completion status and counts only. No Learning Bond staff endpoint answers a SIN, income, marital status, benefit or dollar amount of a family (L2-142).", pos)


# ------------------------------------------------------------------ Settings › Learning Bond (the hub)
@screen("settings-learning-bond", "page", "Learning Bond settings", route="/settings/learning-bond", reqs=R_HUB,
        na={"empty": "The hub always lists the agreement, coverage, invitation and launch."})
def settings_learning_bond(S):
    hdr = page_header("Learning Bond", "Claims the money governments already owe your families’ children. Needs Roster and Messages.") + settings_nav("settings-learning-bond")

    def agreement_card(state="accepted"):
        if state == "accepted":
            body = (f'<p>{icon("check-circle", "icon--sm")} Accepted by Tom Nguyen on {AGREEMENT_DATE}, version {AGREEMENT_VERSION}.</p>'
                    '<p class="text-muted">What Learning Bond collects, where it goes and what your organization sees.</p>')
            foot = f'<a href="{page("learning-bond-agreement", "accepted")}">Read the agreement</a>'
        elif state == "new-version":
            body = alert("warning", "A new version of the agreement needs accepting.", f"Version 3 took effect Sun 1 Nov 2026. Version {AGREEMENT_VERSION} was accepted by Tom Nguyen on {AGREEMENT_DATE}. Families already in progress continue; no new invitation goes out until it is accepted.",
                         actions=btn("Read and accept version 3", "primary", size="sm", href=page("learning-bond-agreement")))
            foot = ""
        return card(body, title="Data-handling agreement", tid="agreement", footer=foot)

    coverage_card = card(facts([("Programs", "After‑School Tutoring, Saturday Sports · 112 households"), ("Who sees each family’s status", "Admin, Program director, Site lead, Youth worker")]),
                         title="Coverage", tid="coverage", footer=f'<a href="{page("learning-bond-coverage")}">Change coverage</a>')
    invitation_card = card(facts([("Sender name", esc(SENDER)), ("Languages", "English, Spanish and French, the languages your households use"), ("Wording", "Platform-approved; only the sender name changes")]),
                           title="Guardian invitation", tid="invitation", footer=f'<a href="{page("learning-bond-invitation")}">Preview and edit</a>')

    def launch_card(state="scheduled", *, disabled_reason=""):
        if disabled_reason:
            body = f'<p class="text-muted">{esc(disabled_reason)}</p><div>{btn("Launch", "primary", disabled=True)}</div>'
        elif state == "scheduled":
            body = (f'<p>Invitations go out <strong>{LAUNCH_DATE}, 10:00 am</strong> to 97 households by text and 9 by email. 6 households have no mobile number or email yet.</p>'
                    f'<div class="cluster">{btn("Change the date", "", href=page("learning-bond-launch", "scheduled"))}{btn("Cancel launch", "ghost", data_href=dialog("learning-bond-cancel-launch"))}</div>')
        elif state == "launched":
            body = (f'<p>{icon("check-circle", "icon--sm")} Invitations went out {LAUNCH_DATE}: 97 texts and 9 emails. Staff invite the remaining 6 households at the door.</p>'
                    f'<div class="cluster">{btn("Open the dashboard", "primary", icon_name="chart", href=page("learning-bond-dashboard"))}{btn("Covered households", "", href=page("learning-bond-families"))}</div>')
        else:
            body = f'<p>Choose a day, or let staff invite families one at a time at check-in.</p><div>{btn("Plan the launch", "primary", href=page("learning-bond-launch"))}</div>'
        return card(body, title="Launch", tid="launch")

    def grid(a, l):
        return f'<div class="split"><div class="stack">{a}{coverage_card}</div><div class="stack">{invitation_card}{l}</div></div>'

    S.add("default", "Settings › Learning Bond for Harbourview: the agreement accepted, coverage, the invitation sender and a launch scheduled for Monday.", nav="settings", user=T,
          main=hdr + grid(agreement_card(), launch_card()),
          notes=note("Learning Bond is in Settings only for admins. Program directors and site leads reach the dashboard and the families list from More.", "top: 5rem; right: 1rem;"))
    S.add("new-version", "The platform published version 3 of the agreement: families in progress continue, no new invitation is sent and Launch is disabled until it is accepted (L2-136).", nav="settings", user=T,
          main=hdr + alert("warning", "A new version of the agreement needs accepting.", "Launch is paused until Tom or a named signer accepts version 3.", banner=True, actions=btn("Read version 3", "primary", size="sm", href=page("learning-bond-agreement")))
          + grid(agreement_card("new-version"), launch_card(disabled_reason="A new version of the agreement needs accepting.")))
    S.add("launched", "After the launch day: how many went out, and the way to the dashboard and the families list.", nav="settings", user=T, main=hdr + grid(agreement_card(), launch_card("launched")))
    S.add("loading", "Learning Bond settings loading.", nav="settings", user=T, main=page_header("Learning Bond", "") + settings_nav("settings-learning-bond") + f'<div class="split">{skeleton_list(2, "Loading agreement and coverage")}{skeleton_list(2, "Loading invitation and launch")}</div>')
    S.add("error", "Learning Bond settings failed to load.", nav="settings", user=T, main=page_header("Learning Bond", "") + settings_nav("settings-learning-bond") + failed_load("We couldn’t load Learning Bond settings"))
    S.add("forbidden", "A site lead opening Settings › Learning Bond: admins configure it.", nav="settings", user=J, main=page_header("Learning Bond", "") + forbidden("Admins configure Learning Bond", "Ask Tom Nguyen. You can still help families from Learning Bond in More."))


# ------------------------------------------------------------------ The data-handling agreement
AGREEMENT_SECTIONS = [
    ("What we collect", "Learning Bond collects, with each guardian’s per-child consent, the guardian’s and each child’s social insurance number, whether the family filed last year’s tax return, and, for the child benefits check, household size, marital status and whether the family receives the Canada Child Benefit. Names, dates of birth, address, phone and email come from your roster."),
    ("Where it goes", "Social insurance numbers, income and benefit details are sent only to the RESP provider the guardian chooses and to the Government of Canada (Employment and Social Development Canada), and to the benefit programs the guardian applies to. They are encrypted with a key your organization never holds, decrypted only to send an application the guardian submitted, and destroyed once the provider or program has received it."),
    ("What your organization sees", "Your staff see each family’s completion status and the organization’s counts and totals. No one in your organization, including platform administrators, can read a social insurance number, income answer, marital status, benefit or dollar amount of a family. Every Learning Bond action is in your audit log without those values."),
]


def agreement_text() -> str:
    secs = "".join(f'<section class="stack" aria-labelledby="ag-{i}"><h2 class="section-title" id="ag-{i}">{esc(t)}</h2><p>{esc(b)}</p></section>' for i, (t, b) in enumerate(AGREEMENT_SECTIONS))
    return f'<p class="text-muted">Version {AGREEMENT_VERSION} · effective Thu 1 Oct 2026 · published by PromiseHub</p>{secs}'


@screen("learning-bond-agreement", "page", "Learning Bond data-handling agreement", route="/settings/learning-bond/agreement", reqs=R_AGREEMENT,
        na={"empty": "The agreement always has a current version."})
def learning_bond_agreement(S):
    hdr = crumbs("Agreement") + page_header("Learning Bond data-handling agreement", "One page. Accept it for Harbourview, or name the person who can.")

    def accept_form(*, err="", busy=False, checked=False):
        box = fieldset("Authority", choice("auth", f"I have authority to accept this agreement for {esc(ORG)}", type_="checkbox", checked=checked, invalid=bool(err)), error=err, fid="auth")
        acts = (f'<div class="form-actions cluster">{btn("Ask someone else to sign", "ghost", icon_name="mail", data_href=dialog("learning-bond-signer"))}'
                f'{btn("Accept", "primary", type_="submit", busy=busy, icon_name="check")}</div>')
        return f'<form class="card stack" action="#" method="post" novalidate>{form_summary([("auth", err)]) if err else ""}{box}{acts}</form>'

    def layout(side):
        return f'<div class="split"><div class="stack">{card(agreement_text(), cls="reading")}</div><div class="stack">{side}</div></div>'

    S.add("default", "Tom (Admin) reads the current agreement in three sections, ticks the authority box and chooses Accept, or asks someone else to sign.", nav="settings", user=T,
          main=hdr + layout(accept_form()), notes=note("The text is versioned by the platform; the organization cannot edit it. Acceptance stores who, which version and when, and is audited (L2-136).", "top: 5rem; right: 1rem;"))
    S.add("invalid", "Accept chosen without the authority box: 422 and the reason beside the box; nothing is stored.", nav="settings", user=T,
          main=hdr + layout(accept_form(err="Confirm you have authority to accept this agreement, or ask someone else to sign.")))
    S.add("submitting", "Recording the acceptance.", nav="settings", user=T, main=hdr + layout(accept_form(checked=True, busy=True)))
    S.add("accepted", "Accepted: who, when and which version; Launch is now possible.", nav="settings", user=T,
          main=hdr + layout(card(alert("success", f"Accepted by Tom Nguyen on {AGREEMENT_DATE}, version {AGREEMENT_VERSION}", "Recorded in the audit log. No family data has been collected yet.",
                                       actions=btn("Choose coverage", "primary", size="sm", href=page("learning-bond-coverage")) + btn("Back to Learning Bond", "ghost", size="sm", href=page("settings-learning-bond"))))))
    S.add("accepted-off", "Accepted while Learning Bond is still off (reached from Read the agreement in Settings › Modules): the next step is to turn it on.", nav="settings", user=T,
          main=crumbs_off("Agreement") + page_header("Learning Bond data-handling agreement", "One page. Accept it for Harbourview, or name the person who can.")
          + layout(card(alert("success", f"Accepted by Tom Nguyen on {AGREEMENT_DATE}, version {AGREEMENT_VERSION}", "Recorded in the audit log. Turn Learning Bond on in Modules to choose coverage and the invitation.",
                                       actions=btn("Turn on Learning Bond", "primary", size="sm", href=page("settings-modules"))))))
    S.add("waiting-signer", "Tom named Rev. Angela Baptiste as the signer: the page waits, with Resend and Cancel.", nav="settings", user=T,
          main=hdr + layout(card(f'<p>{icon("clock", "icon--sm")} <strong>Waiting for Rev. Angela Baptiste to sign.</strong></p><p class="text-muted">Board chair · angela.baptiste@harbourview.example · emailed Thu 5 Nov, 4:02 pm. The link works for 14 days.</p>'
                                 f'<div class="cluster">{btn("Resend", "", icon_name="mail")}{btn("Cancel", "ghost")}</div>', title="Named signer", tid="signer")),
          notes=note("Only one signer request is open at a time; a new one replaces it and cancels its link (L2-137).", "top: 5rem; right: 1rem;"))
    signer_main = (f'<h1>Accept the Learning Bond data-handling agreement for {esc(ORG)}</h1><p class="text-muted">Tom Nguyen (Admin) asked you, as board chair, to accept it. No PromiseHub account is needed.</p>'
                   + card(agreement_text(), cls="reading")
                   + f'<form class="card stack" action="#" method="post" novalidate>{fieldset("Authority", choice("auth", f"I, Angela Baptiste, have authority to accept this agreement for {esc(ORG)}", type_="checkbox"), fid="auth")}'
                   f'{btn("Accept", "primary", type_="submit", size="lg", icon_name="check")}</form>'
                   f'<p class="hint center">Questions? Email Tom Nguyen at tom@harbourview.example.</p>')
    S.add("signer", "The named signer’s own page from the emailed link: the agreement, the authority box and Accept; no account needed (L2-137).", shell="guardian", main=signer_main)
    S.add("signer-accepted", "The signer accepted: the acceptance records their name, title and email; Tom is notified; the link stops working.", shell="guardian",
          main=f'<h1>Thank you, Angela</h1>' + card(alert("success", f"Accepted on Thu 5 Nov 2026, version {AGREEMENT_VERSION}", f"Recorded as Angela Baptiste, Board chair, angela.baptiste@harbourview.example. Tom Nguyen has been told. You can close this page.")))
    S.add("signer-expired", "The link was used, expired after 14 days, cancelled or replaced.", shell="guardian",
          main='<h1>This link has expired</h1>' + card(f'<p>Ask {esc(ORG)} to send a new one.</p>'))
    S.add("loading", "The agreement loading.", nav="settings", user=T, main=crumbs("Agreement") + page_header("Learning Bond data-handling agreement", "") + f'<div class="split">{skeleton_list(3, "Loading the agreement")}{skeleton_form(1)}</div>')
    S.add("error", "The agreement failed to load.", nav="settings", user=T, main=crumbs("Agreement") + page_header("Learning Bond data-handling agreement", "") + failed_load("We couldn’t load the agreement", back="1"))
    S.add("forbidden", "A role without ManageSettings: 403.", nav="settings", user=J, main=crumbs("Agreement") + page_header("Learning Bond data-handling agreement", "") + forbidden("Admins accept the agreement", "Ask Tom Nguyen."))


# ------------------------------------------------------------------ Coverage: programs and status roles
@screen("learning-bond-coverage", "page", "Learning Bond coverage", route="/settings/learning-bond/coverage", reqs=R_COVERAGE, na={"empty": "The roles list is fixed; the page is never empty."})
def learning_bond_coverage(S):
    hdr = crumbs("Coverage") + page_header("Coverage", "Which programs Learning Bond covers, and which staff see each family’s status.")

    def form(*, mode="chosen", err=None, busy=False, saved=False, programs=None):
        e = err or {}
        progs = programs if programs is not None else {n for n, _c, on in COVERED_PROGRAMS if on}
        prog_boxes = "".join(choice("prog", f"{esc(n)} <small>{c} households</small>", type_="checkbox", checked=n in progs, invalid="prog" in e) for n, c, _on in COVERED_PROGRAMS)
        which = fieldset("Programs", choice("mode", "Every program", small="Guardians of every actively enrolled child are invited: 157 households.", checked=mode == "all")
                         + choice("mode", "Chosen programs", small="Only guardians of children enrolled in these.", checked=mode == "chosen"), fid="mode")
        chosen = fieldset("Chosen programs", prog_boxes, error=e.get("prog", ""), fid="prog", hint="Archived programs aren’t listed. Summer Camp 2026 ended in August.")
        roles = fieldset("Who sees each family’s status",
                         choice("role", "Admin <small>Always</small>", type_="checkbox", checked=True, attrs=" disabled")
                         + choice("role", "Program director <small>Always</small>", type_="checkbox", checked=True, attrs=" disabled")
                         + choice("role", "Site lead", type_="checkbox", checked=True)
                         + choice("role", "Youth worker", type_="checkbox", checked=True)
                         + choice("role", "Volunteer coordinator", type_="checkbox"),
                         hint="Mentors, volunteers and youth never see it. Status means where a family is in the steps, never what they entered.")
        summary = form_summary([(k, v) for k, v in e.items()]) if e else ""
        status_ = f'<p class="save-status save-status--saved" role="status">{icon("check")}Saved 4:31 pm</p>' if saved else ""
        return (f'<form class="stack form-width--lg" action="#" method="post" novalidate>{summary}{card(which + chosen, title="Programs", tid="programs")}{card(roles, title="Staff", tid="staff")}'
                + form_actions("Save changes", page("settings-learning-bond"), busy=busy, extra=status_) + "</form>")

    S.add("default", "Chosen programs with the households each reaches; Admin and Program director fixed, Site lead and Youth worker added.", nav="settings", user=T, main=hdr + form(), notes=privacy_note())
    S.add("invalid", "Chosen programs with none ticked: the save is refused.", nav="settings", user=T, main=hdr + form(err={"prog": "Choose at least one program."}, programs=set()))
    S.add("submitting", "Saving coverage.", nav="settings", user=T, main=hdr + form(busy=True))
    S.add("success", "Saved: the toast confirms and the change is audited with the fields that changed.", nav="settings", user=T, main=hdr + form(saved=True),
          toast_html=toast_region(toast("success", "Learning Bond settings saved", "After‑School Tutoring and Saturday Sports · 112 households")))
    S.add("loading", "Coverage loading.", nav="settings", user=T, main=crumbs("Coverage") + page_header("Coverage", "") + skeleton_form(4))
    S.add("error", "Coverage failed to load.", nav="settings", user=T, main=crumbs("Coverage") + page_header("Coverage", "") + failed_load("We couldn’t load coverage", back="1"))
    S.add("forbidden", "A site lead: admins set coverage.", nav="settings", user=J, main=crumbs("Coverage") + page_header("Coverage", "") + forbidden("Admins set coverage", "Ask Tom Nguyen."))


# ------------------------------------------------------------------ The guardian invitation
def email_preview(lang: str, sender: str = SENDER) -> str:
    if lang == "es":
        return (f'<div class="email"><p class="email__title">Mateo y Sofía podrían tener derecho a hasta $2,000 para estudiar</p>'
                f'<p class="email__text">Hola, Carmen. El Gobierno de Canadá deposita el Bono de Estudios Canadiense en un RESP para familias con ingresos más bajos. No cuesta nada y no hace falta aportar dinero. Compruébelo en unos 15 minutos desde su teléfono.</p>'
                f'<p class="email__action"><a class="email__button" href="{page("guardian-learning-bond", "es")}">Comprobar ahora</a></p>'
                f'<p class="email__footer">{esc(sender)} a través de PromiseHub · Harbourview Youth Collective, Hamilton · <a href="{page("guardian-update")}">Dejar de recibir correos</a></p></div>')
    return (f'<div class="email"><p class="email__title">Mateo and Sofía may be owed up to $2,000 for school after high school</p>'
            f'<p class="email__text">Hi Carmen. The Government of Canada puts the Canada Learning Bond into an RESP for families with lower incomes. It costs nothing and you don’t need to put in any money. Check in about 15 minutes on your phone.</p>'
            f'<p class="email__action"><a class="email__button" href="{page("guardian-learning-bond")}">Check now</a></p>'
            f'<p class="email__footer">{esc(sender)} via PromiseHub · Harbourview Youth Collective, Hamilton · <a href="{page("guardian-update")}">Unsubscribe</a></p></div>')


# The admin's preview reads no household (L2-136 criterion 5), so it fills the platform wording with a sample child, guardian and link.
PREVIEW_LINK = "promisehub.ca/lb/4r7k9x"


def preview_sms(lang: str, sender: str = SENDER) -> str:
    if lang == "es":
        return f"{sender}: Maya podría tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: {PREVIEW_LINK} (STOP para salir)"
    if lang == "fr":
        return f"{sender} : Maya pourrait recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : {PREVIEW_LINK} (STOP pour arrêter)"
    return f"{sender}: Maya may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: {PREVIEW_LINK} (STOP to opt out)"


def preview_email(lang: str, sender: str = SENDER) -> str:
    title, text, action, foot = {
        "en": ("Maya may be owed up to $2,000 for school after high school",
               "Hi Alex. The Government of Canada puts the Canada Learning Bond into an RESP for families with lower incomes. It costs nothing and you don’t need to put in any money. Check in about 15 minutes on your phone.",
               "Check now", f"{sender} via PromiseHub · Harbourview Youth Collective, Hamilton · Unsubscribe"),
        "es": ("Maya podría tener derecho a hasta $2,000 para estudiar",
               "Hola, Alex. El Gobierno de Canadá deposita el Bono de Estudios Canadiense en un RESP para familias con ingresos más bajos. No cuesta nada y no hace falta aportar dinero. Compruébelo en unos 15 minutos desde su teléfono.",
               "Comprobar ahora", f"{sender} a través de PromiseHub · Harbourview Youth Collective, Hamilton · Dejar de recibir correos"),
        "fr": ("Maya pourrait recevoir jusqu’à 2 000 $ pour ses études",
               "Bonjour Alex. Le gouvernement du Canada verse le Bon d’études canadien dans un REEE pour les familles à revenu modeste. C’est gratuit et vous n’avez rien à verser. Vérifiez en 15 minutes environ sur votre téléphone.",
               "Vérifier maintenant", f"{sender} via PromiseHub · Harbourview Youth Collective, Hamilton · Se désabonner"),
    }[lang]
    return (f'<div class="email"><p class="email__title">{esc(title)}</p><p class="email__text">{esc(text)}</p>'
            f'<p class="email__action"><span class="email__button">{esc(action)}</span></p><p class="email__footer">{esc(foot)}</p></div>')


def sms_segments(text: str) -> int:
    gsm = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
    single, multi = (160, 153) if all(c in gsm for c in text) else (70, 67)
    return 1 if len(text) <= single else -(-len(text) // multi)


@screen("learning-bond-invitation", "page", "Learning Bond invitation", route="/settings/learning-bond/invitation", reqs=R_INVITATION, na={"empty": "The invitation always has the platform text."})
def learning_bond_invitation(S):
    hdr = crumbs("Invitation") + page_header("Guardian invitation", "Platform-approved wording in English, Spanish and French, the languages your households use. You change only the sender name.")

    def form(*, value=SENDER, err="", busy=False, saved=False):
        f = field("sender", "Sender name", value=value, error=err, help_="1 to 30 letters, numbers and spaces. Starts every text and signs every email.", attrs=' maxlength="30"', required=True)
        status_ = f'<p class="save-status save-status--saved" role="status">{icon("check")}Saved 4:36 pm</p>' if saved else ""
        return f'<form class="stack" action="#" method="post" novalidate>{form_summary([("sender", err)]) if err else ""}{card(f, title="Sender", tid="sender")}{form_actions("Save", page("settings-learning-bond"), busy=busy, extra=status_)}</form>'

    def previews(sender=SENDER):
        out = ""
        for lang, name in (("en", "English"), ("es", "Spanish"), ("fr", "French")):
            text = preview_sms(lang, sender)
            out += card(f'<h3 class="section-title">Text message</h3>{sms(text, segments=sms_segments(text))}<h3 class="section-title">Email</h3>{preview_email(lang, sender)}',
                        title=name, tid=f"preview-{lang}")
        return out

    def layout(f, p):
        return f'<div class="split"><div class="stack form-width--lg">{f}</div><div class="stack">{p}</div></div>'

    S.add("default", "The SMS and email in English, Spanish and French, the languages Harbourview’s households use, with the sender name and the segment count; a sample child, guardian and link fill the wording.", nav="settings", user=T,
          main=hdr + layout(form(), previews()), notes=note("The body is fixed by the platform and sent in each household’s language, falling back to English. Each child’s first name is filled in per household (L2-139).", "top: 5rem; right: 1rem;"))
    S.add("invalid", "A sender name with a link in it: 422 and the single rule.", nav="settings", user=T,
          main=hdr + layout(form(value="Harbourview hbv.ph/join", err="Use 1 to 30 letters, numbers and spaces."), previews("Harbourview hbv.ph/join")))
    S.add("submitting", "Saving the sender name.", nav="settings", user=T, main=hdr + layout(form(busy=True), previews()))
    S.add("success", "Saved: every preview shows the new name; audited.", nav="settings", user=T, main=hdr + layout(form(saved=True), previews()),
          toast_html=toast_region(toast("success", "Sender name saved", f"Invitations come from {SENDER}")))
    S.add("loading", "The invitation loading.", nav="settings", user=T, main=crumbs("Invitation") + page_header("Guardian invitation", "") + f'<div class="split">{skeleton_form(1)}{skeleton_list(2, "Loading previews")}</div>')
    S.add("error", "The invitation failed to load.", nav="settings", user=T, main=crumbs("Invitation") + page_header("Guardian invitation", "") + failed_load("We couldn’t load the invitation", back="1"))
    S.add("forbidden", "A site lead: admins edit the invitation.", nav="settings", user=J, main=crumbs("Invitation") + page_header("Guardian invitation", "") + forbidden("Admins edit the invitation", "Ask Tom Nguyen."))


# ------------------------------------------------------------------ Launch
MISSING_CONTACTS = [("Adeyemi", "Bola Adeyemi · email bounced, no mobile", "After‑School Tutoring"), ("Fitzgerald-Vanderbroucke", "Mary-Katherine Fitzgerald-Vanderbroucke · no phone on file", "Saturday Sports"),
                    ("Mensah", "Kwame Mensah · no phone or email", "Saturday Sports"), ("Lavoie", "Sylvie Lavoie · landline only", "After‑School Tutoring"),
                    ("Nakamura", "Ken Nakamura · no phone or email", "Saturday Sports"), ("Osei", "Abena Osei · landline only", "After‑School Tutoring")]


@screen("learning-bond-launch", "page", "Learning Bond launch", route="/settings/learning-bond/launch", reqs=R_LAUNCH, na={"empty": "The counts always show; six households with no contact is the state to see."})
def learning_bond_launch(S):
    hdr = crumbs("Launch") + page_header("Launch", "One invitation per covered household, naming each eligible child, in the household’s language.")

    def counts(mobile=97, email=9, neither=6):
        return kpis([("Households covered", "112", "After‑School Tutoring and Saturday Sports"), ("With a mobile number", str(mobile), "Invited by text"),
                     ("Email only", str(email), "Invited by email"), ("Neither", str(neither), f'<a href="{page("learning-bond-launch", "missing-contacts")}">View households to collect from</a>')])

    def form(*, mode="day", date="2026-11-09", err="", busy=False, disabled_reason=""):
        when = fieldset("When", choice("when", "Send invitations on a day", small="At 10:00 am Eastern. Texts count toward the monthly SMS cap; opt-outs and email fallback apply.", checked=mode == "day")
                        + field("date", "Day", type_="date", value=date, error=err, help_="From tomorrow to 90 days ahead.", attrs=' style="max-width: 14rem;"')
                        + choice("when", "Staff invite at the door", small="No mass send. Staff tap Invite to Learning Bond on a household at check-in.", checked=mode == "door"), fid="when")
        if disabled_reason:
            acts = f'<div class="form-actions cluster"><p class="field__error" id="launch-error">{esc(disabled_reason)}</p>{btn("Launch", "primary", disabled=True, attrs=" aria-describedby=\"launch-error\"")}</div>'
        else:
            acts = form_actions("Schedule launch" if mode == "day" else "Launch without a mass send", page("settings-learning-bond"), busy=busy)
        return f'<form class="stack form-width--lg" action="#" method="post" novalidate>{form_summary([("date", err)]) if err else ""}{card(when, title="How", tid="how")}{acts}</form>'

    S.add("default", "The households covered and how each can be reached, then a day to send or Staff invite at the door.", nav="settings", user=T, main=hdr + counts() + form(),
          notes=note("Every invitation goes through Messages, so the SMS cap, STOP replies and the email fallback apply. A household is never invited twice within 7 days (L2-140).", "top: 5rem; right: 1rem;"))
    S.add("missing-contacts", "The six households with no mobile number or email: staff collect them at check-in.", nav="settings", user=T,
          main=crumbs("Launch") + page_header("Households to collect from", "6 covered households have no guardian with a mobile number or email. Collect one at check-in; they’re invited on the next run.", btn("Back to launch", "", href=page("learning-bond-launch")))
          + card(ul_list([list_item(n, f"{g} · {p}", lead=f'<span class="avatar avatar--sm" aria-hidden="true">{n[:2].upper()}</span>', href=page("household"), end=badge("No mobile", "danger")) for n, g, p in MISSING_CONTACTS], card=False, label="Households to collect from"), cls="card--flush"))
    S.add("blocked", "No covered household has a guardian with a mobile number: Launch is disabled with the reason; the API answers 422 no-phone-numbers.", nav="settings", user=T,
          main=hdr + counts(mobile=0, email=14, neither=98) + form(disabled_reason="Add guardians’ mobile numbers before launching. Staff can collect them at check-in."))
    S.add("invalid", "A date in the past: 422 and the rule.", nav="settings", user=T, main=hdr + counts() + form(date="2026-11-01", err="Choose a date from tomorrow to 90 days ahead."))
    S.add("submitting", "Scheduling the launch.", nav="settings", user=T, main=hdr + counts() + form(busy=True))
    S.add("scheduled", "Scheduled: the day, what goes out, and Change the date or Cancel until the job starts.", nav="settings", user=T,
          main=hdr + alert("success", f"Scheduled for {LAUNCH_DATE}, 10:00 am", "97 texts and 9 emails. Change the date or cancel any time before then.",
                           actions=btn("Change the date", "", size="sm") + btn("Cancel launch", "ghost", size="sm", data_href=dialog("learning-bond-cancel-launch"))) + counts() + form())
    S.add("at-door", "Staff invite at the door: no mass send; Invite to Learning Bond appears on covered households for roles that see status.", nav="settings", user=T,
          main=hdr + alert("info", "Staff invite at the door", "Nothing is sent in bulk. Site leads and youth workers tap Invite to Learning Bond on a household at check-in.",
                           actions=btn("Covered households", "", size="sm", href=page("learning-bond-families"))) + counts() + form(mode="door"))
    S.add("cancelled", "The scheduled launch was cancelled: nothing was sent; audited.", nav="settings", user=T, main=hdr + counts() + form(),
          toast_html=toast_region(toast("info", "Launch cancelled", "Nothing was sent. Schedule a new day when you’re ready.")))
    S.add("loading", "Launch loading.", nav="settings", user=T, main=crumbs("Launch") + page_header("Launch", "") + skeleton_kpis(4) + skeleton_form(2))
    S.add("error", "Launch failed to load.", nav="settings", user=T, main=crumbs("Launch") + page_header("Launch", "") + failed_load("We couldn’t load the launch", back="1"))
    S.add("forbidden", "A site lead: admins launch.", nav="settings", user=J, main=crumbs("Launch") + page_header("Launch", "") + forbidden("Admins launch Learning Bond", "Ask Tom Nguyen."))


# ------------------------------------------------------------------ Dashboard
DASH_ROWS = [["After‑School Tutoring", "48", "22", "11", "14", "$18,600", "$6,100"], ["Saturday Sports", "57", "19", "7", "9", "$13,300", "$3,300"], ["Winter Camp 2026", "7", "0", "0", "0", "$0", "$0"]]
DASH_FOOT = ["All programs", "112", "41", "18", "23", "$31,900", "$9,400"]


def dash_kpis(z=False):
    if z:
        return kpis([("Households invited", "0", ""), ("Started", "0", ""), ("Completed", "0", "At least one application submitted"), ("Children with a Learning Bond application", "0", ""),
                     ("Estimated dollars unlocked", "$0", ""), ("Confirmed dollars deposited", "$0", "")])
    return kpis([("Households invited", "112", "Since Mon 9 Nov"), ("Started", "41", "37% of invited"), ("Completed", "18", "At least one application submitted"),
                 ("Children with a Learning Bond application", "23", ""), ("Estimated dollars unlocked", "$31,900", "Learning Bond $27,400 · benefits $4,500"),
                 ("Confirmed dollars deposited", "$9,400", "Learning Bond $7,900 · benefits $1,500")])


def dash_filters(program="All programs", period="All time"):
    return (f'<div class="toolbar">{chips([(p, p == program) for p in ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"]], "Program")}'
            f'{chips([(p, p == period) for p in ["Last 30 days", "Last 90 days", "All time"]], "Period")}</div>')


def dash_table(rows=None, foot=None):
    return table("Uptake and dollars by covered program", ["Program", "Invited", "Started", "Completed", "Children with a Learning Bond application", "Estimated", "Confirmed"], rows or DASH_ROWS, foot=foot or DASH_FOOT, hide_sm={1, 2, 4})


@screen("learning-bond-dashboard", "page", "Learning Bond dashboard", route="/learning-bond", reqs=R_DASHBOARD, na={})
def learning_bond_dashboard(S):
    def hdr(actions=True):
        act = (btn("Export for funders", "", icon_name="download", data_href=dialog("export-learning-bond")) + btn("Covered households", "", icon_name="users", href=page("learning-bond-families"))) if actions else ""
        return page_header("Learning Bond", "Uptake and dollars unlocked across Harbourview. Counts and sums, never a family’s details.", act)
    S.add("default", "Marisol (Program director): six figures, each split into Learning Bond and benefits, filters by program and period, and a table by covered program.", nav="learning-bond", user=M,
          main=hdr() + dash_filters() + dash_kpis() + dash_table(), notes=privacy_note())
    S.add("empty", "Just launched: every figure 0 and “Families will appear here as they start.”", nav="learning-bond", user=M,
          main=hdr() + dash_filters() + dash_kpis(z=True) + card(empty("Families will appear here as they start.", f"Invitations went out {LAUNCH_DATE} to 106 households.", icon_name="sparkle"), cls="card--flush"))
    S.add("suppressed", "A program resting on fewer than 5 households shows “Fewer than 5” and its dollars are suppressed (L2-024).", nav="learning-bond", user=M,
          main=hdr() + dash_filters() + dash_kpis() + dash_table([DASH_ROWS[0], DASH_ROWS[1], ["Winter Camp 2026", "Fewer than 5", "Fewer than 5", "Fewer than 5", "Fewer than 5", "—", "—"]]),
          notes=note("Small counts are masked so a figure can’t be traced to a family; the export masks them the same way (L2-143).", "top: 5rem; right: 1rem;"))
    S.add("filtered", "Filtered to Saturday Sports over the last 30 days.", nav="learning-bond", user=M,
          main=hdr() + dash_filters("Saturday Sports", "Last 30 days") + kpis([("Households invited", "57", "Saturday Sports · last 30 days"), ("Started", "19", ""), ("Completed", "7", ""), ("Children with a Learning Bond application", "9", ""),
                                                                                      ("Estimated dollars unlocked", "$13,300", "Learning Bond $11,800 · benefits $1,500"), ("Confirmed dollars deposited", "$3,300", "Learning Bond $3,300 · benefits $0")])
          + dash_table([DASH_ROWS[1]], ["Saturday Sports", "57", "19", "7", "9", "$13,300", "$3,300"]))
    S.add("loading", "The dashboard loading: skeletons in the final layout.", nav="learning-bond", user=M, main=page_header("Learning Bond", "") + skeleton_kpis(6) + skeleton_list(3, "Loading programs"))
    S.add("error", "The dashboard failed to load: Try again.", nav="learning-bond", user=M, main=hdr(False) + failed_load("We couldn’t load the dashboard"))
    S.add("forbidden", "Jaylen (Site lead), no ViewReports: 403; he can still open the families list.", nav="learning-bond", user=J,
          main=page_header("Learning Bond", "") + card(empty("Admins and program directors see the dashboard", "You can help families from the covered households list.", action=btn("Covered households", "primary", href=page("learning-bond-families")) + btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


# ------------------------------------------------------------------ Covered households and their status
def family_row(name, guardian, program, st, when, *, call=False):
    acts = ""
    if st == "Call requested":
        acts = btn("Mark call done", "primary", size="sm", data_href=dialog("learning-bond-call-outcome"))
    elif st == "Not invited":
        acts = btn("Invite to Learning Bond", "", size="sm", data_href=dialog("learning-bond-invite-household"))
    return [f'<a class="list-link" href="{page("household")}"><span class="avatar avatar--sm" aria-hidden="true">{name[:2].upper()}</span><div><div class="list__title">{esc(name)}</div><div class="list__meta">{esc(guardian)}</div></div></a>',
            badge(st, STATUS_KIND[st]), esc(program), esc(when), f'<div class="row-actions">{acts}</div>']


def families_toolbar(q="", status_="All", program="All programs"):
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="fam-q">Find a household</label>'
            f'<input class="input" id="fam-q" type="search" value="{esc(q)}" placeholder="Find a household"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            + chips([(s, s == status_) for s in ["All", "Not invited", "Invited", "Started", "Paused", "Submitted", "Deposited", "Call requested"]], "Status")
            + select("fam-prog", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports"], selected=program, visually_hidden_label=True) + "</div>")


def families_table(rows=None):
    return table("Covered households", ["Household", "Status", "Program", "Last change", "Actions"], rows if rows is not None else [family_row(*h) for h in HOUSEHOLDS], hide_sm={2, 3}, cls="table-wrap--names")


@screen("learning-bond-families", "page", "Learning Bond households", route="/learning-bond/families", reqs=R_FAMILIES, na={})
def learning_bond_families(S):
    hdr = page_header("Learning Bond households", "112 covered · 41 started · 18 completed · 1 call requested")
    S.add("default", "Jaylen (Site lead, in the status roles): each covered household with its status and the date of the last change, a filter by status and program, and nothing else about the claim.", nav="learning-bond", user=J,
          main=hdr + families_toolbar() + families_table(), notes=privacy_note())
    S.add("call-requested", "Linh Tran asked for a call: the notice names the household, the number and the time of day; Mark call done records the outcome.", nav="learning-bond", user=J, unread=3,
          main=hdr + alert("warning", "Linh Tran asked for a call", "289-555-0119 · afternoons · asked today at 2:10 pm. She’ll see where she is in the steps, never her SIN.",
                           actions=f'<a class="btn btn--primary btn--sm" href="tel:+12895550119">{icon("phone")}Call 289-555-0119</a>' + btn("Mark call done", "", size="sm", data_href=dialog("learning-bond-call-outcome")))
          + families_toolbar(status_="Call requested") + families_table([family_row(*HOUSEHOLDS[1])]))
    S.add("no-results", "A search with no match; the filters stay.", nav="learning-bond", user=J, main=hdr + families_toolbar(q="Kowalski", status_="Paused")
          + card(empty("No household matches “Kowalski” with status Paused", "Check the spelling or clear the filters.", action=btn("Clear filters", ""), icon_name="search"), cls="card--flush"))
    S.add("long", "All 112 households, paged.", nav="learning-bond", user=J, main=hdr + families_toolbar() + families_table() +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–10 of 112</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')
    S.add("empty", "Coverage saved but no household is enrolled in a covered program yet.", nav="learning-bond", user=J, main=page_header("Learning Bond households", "0 covered")
          + card(empty("No covered households yet", "Families appear here once a child is enrolled in a covered program.", action=btn("Change coverage", "", href=page("learning-bond-coverage")), icon_name="users"), cls="card--flush"))
    S.add("loading", "Households loading.", nav="learning-bond", user=J, main=page_header("Learning Bond households", "") + skeleton_list(6, "Loading households"))
    S.add("error", "Households failed to load.", nav="learning-bond", user=J, main=page_header("Learning Bond households", "") + failed_load("We couldn’t load households"))
    S.add("forbidden", "Priya (Volunteer coordinator), not in the status roles: 403, and Learning Bond isn’t in her menu.", nav="learning-bond", user=P,
          main=page_header("Learning Bond households", "") + forbidden("Your role doesn’t see Learning Bond status", "Ask Tom Nguyen to add Volunteer coordinator in Settings › Learning Bond › Coverage."))
