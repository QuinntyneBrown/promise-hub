"""Guardian pages: link-based, no account, phone first, English/Spanish/French."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_core import R_ENROLL, R_SLIPS, R_PICKUP, R_NOTIFY, R_PRIVACY

R_ACCESS = "L1-019"
G = GUARDIANS["carmen"]
NA_G = {"empty": "A guardian page is always about one household."}


def g_steps(cur: int, total: int = 4, label: str = "Enrollment steps") -> str:
    dots = "".join(f'<span class="steps__dot{" steps__dot--current" if i == cur else (" steps__dot--done" if i < cur else "")}"></span>' for i in range(total))
    return f'<p class="steps" aria-label="{esc(label)}"><span class="steps__dots" aria-hidden="true">{dots}</span>Step {cur + 1} of {total}</p>'


def g_footer() -> str:
    return f'<p class="hint center">Questions? Text or call <a href="tel:+19055550100">905-555-0100</a>. <a href="{page("guardian-home")}">Privacy</a></p>'


# ------------------------------------------------------------------ Guardian home (what the links land on without a token)
@screen("guardian-home", "page", "Guardian home", route="/g", reqs=[R_ENROLL, R_PRIVACY], shell="guardian", na={"empty": "Static landing page.", "loading": "Static landing page."})
def guardian_home(S):
    body = (f'<h1>Harbourview Youth Collective on PromiseHub</h1>'
            '<p class="text-muted">No account, no app. Links arrive by text or email.</p>'
            + card(ul_list([list_item("Enroll or re-confirm your child", "Open the link you were sent.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("users")}</span>', href=page("enroll")),
                            list_item("Sign a permission slip", "Already filled in from your text.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("clipboard")}</span>', href=page("slip-sign")),
                            list_item("Lost a link?", "We’ll send a new one.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("link")}</span>', href=page("enroll", "code"))], card=False), cls="card--flush")
            + card('<p>Your child’s name, birthday, allergies, medication and approved pickups, plus your phone and email. Never sold or shared. Ask for a copy or deletion any time.</p>', title="Your privacy", tid="priv") + g_footer())
    S.add("default", "What a guardian sees opening the organization’s PromiseHub address directly.", main=body)
    S.add("error", "The organization address is wrong or the organization closed its account.", main='<h1>We can’t find that organization</h1><p class="text-muted">Check the link, or contact the program.</p>' + btn("Try again", "primary", icon_name="refresh", size="lg"))


# ------------------------------------------------------------------ Enroll: identify
@screen("enroll", "page", "Enroll: identify", route="/g/enroll/:program", reqs=[R_ENROLL, R_ACCESS, R_PRIVACY], shell="guardian", na={"empty": "Static form.", "loading": "Static form."})
def enroll(S):
    intro = '<h1>Enroll in After‑School Tutoring</h1><p class="text-muted">Mon–Thu, 4–6 pm · Harbourview Community Centre · Sep 2026 to Jun 2027 · free</p>'

    def identify(err=None, busy=False):
        e = err or {}
        return (f'<form class="card stack" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + '<p>Enter the phone number or email you gave us.</p>'
                + field("contact", "Mobile number or email", type_="text", value="905-555-0142" if not e else "905-555", inputmode="email", autocomplete="tel", autofocus=True, error=e.get("contact", ""), help_="We’ll send a 6-digit code. No password.")
                + btn("Send me a code", "primary", type_="submit", busy=busy, size="lg") + "</form>" + g_footer())
    S.add("default", "Step 0: the guardian identifies with the phone or email on file; a code replaces a password.", main=intro + identify())
    S.add("code", "Enter the 6-digit code that was texted.", main=intro + f'<form class="card stack" action="#" method="post" novalidate><p>Code texted to <strong>905-555-0142</strong>.</p>{field("code", "6-digit code", value="", inputmode="numeric", autocomplete="one-time-code", attrs=" maxlength=\"6\" pattern=\"[0-9]*\"", autofocus=True, help_="Valid for 10 minutes.")}{btn("Continue", "primary", type_="submit", size="lg")}<p class="center"><button class="btn btn--ghost" type="button">Send a new code</button> <a class="btn btn--ghost" href="{page("enroll")}">Use a different number</a></p></form>' + g_footer())
    S.add("invalid", "An incomplete phone number.", main=intro + identify(err={"contact": "Enter a full mobile number or an email."}))
    S.add("submitting", "Sending the code.", main=intro + identify(busy=True))
    S.add("error", "The code couldn’t be sent (SMS provider down): offer email.", main=intro + alert("danger", "We couldn’t text you", "Try your email, or try again in a few minutes.") + identify())
    S.add("closed", "Enrollment is closed or the program is full: offer the waitlist.", main='<h1>After‑School Tutoring is full</h1><p class="text-muted">All 50 places are taken.</p>' + card(f'<div class="stack"><p>We’ll text you if a place opens.</p>{field("wl-contact", "Mobile number or email", value="", inputmode="email")}{btn("Join the waitlist", "primary", type_="submit", size="lg")}</div>', tag="form") + f'<p class="center"><a href="{page("guardian-home")}">See other programs</a></p>' + g_footer())
    S.add("expired", "The code is wrong or expired.", main=intro + f'<form class="card stack" action="#" method="post" novalidate><p>Code texted to <strong>905-555-0142</strong>.</p>{field("code", "6-digit code", value="481 2", inputmode="numeric", autocomplete="one-time-code", attrs=" maxlength=\"6\"", error="Wrong or expired code. Send a new one.")}{btn("Continue", "primary", type_="submit", size="lg")}<p class="center"><button class="btn btn--ghost" type="button">Send a new code</button></p></form>' + g_footer())


# ------------------------------------------------------------------ Enroll: household
@screen("enroll-household", "page", "Enroll: household", route="/g/enroll/:program/household", reqs=[R_ENROLL, R_ACCESS], shell="guardian", na=NA_G)
def enroll_household(S):
    def form(err=None, busy=False, new=False):
        e = err or {}
        v = dict(g1="", ph="", em="", rel="Mother", g2="", ph2="", addr="", lang="English") if new else dict(g1="Carmen Rivera", ph="905-555-0142", em="carmen.rivera@example.com", rel="Mother", g2="Luis Rivera", ph2="905-555-0199", addr="42 Barton St E, Apt 3, Hamilton ON L8L 2V6", lang="Español")
        lead = ('<p>Welcome back, Carmen. Change anything that’s different.</p>' if not new else '<p>One profile covers every child and program.</p>')
        return (f'<form class="stack" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "") + card(lead
                + field("g1", "Your name", value=v["g1"], required=True, error=e.get("g1", ""), autofocus=new) + select("rel", "You are the child’s", ["Mother", "Father", "Grandparent", "Legal guardian", "Other"], selected=v["rel"])
                + field("ph", "Mobile number", type_="tel", value=v["ph"], inputmode="tel", autocomplete="tel", required=True, error=e.get("ph", ""), help_="For slips and same-day updates.")
                + field("em", "Email", type_="email", value=v["em"], autocomplete="email", optional=True, error=e.get("em", ""), help_="For documents.")
                + select("lang", "Language for messages", ["English", "Español", "Français"], selected=v["lang"]), title="You", tid="you")
                + card(field("g2", "Second adult’s name", value=v["g2"], optional=True) + field("ph2", "Their mobile", type_="tel", value=v["ph2"], inputmode="tel", optional=True) + '<p class="hint">Emergency contact and approved pickup.</p>', title="Another adult in the household", tid="adult2")
                + card(field("addr", "Home address", value=v["addr"], required=True, error=e.get("addr", "")), title="Address", tid="addr")
                + f'<div class="cluster" style="justify-content: space-between;">{btn("Back", "ghost", href=page("enroll", "code"))}{btn("Looks right" if not new else "Continue", "primary", type_="submit", busy=busy, size="lg")}</div></form>' + g_footer())
    hdr = '<h1>Your household</h1>' + g_steps(0)
    S.add("default", "A returning guardian confirms last season’s household in one tap.", main=hdr + form(), notes=note("Returning families re-confirm, they don’t retype: every field is pre-filled from last season.", "top: 4rem; right: 1rem;"))
    S.add("new", "A new guardian fills the household once.", main=hdr + form(new=True))
    S.add("loading", "Fetching last season’s details after the code.", main=hdr + '<div class="card stack" aria-busy="true" aria-label="Loading your details"><span class="skeleton skeleton--text" aria-hidden="true" style="width: 80%;"></span>' + '<div class="field" aria-hidden="true"><span class="skeleton skeleton--text" style="width: 6rem;"></span><span class="skeleton skeleton--rect" style="height: var(--control-height-md);"></span></div>' * 4 + "</div>")
    S.add("invalid", "Missing mobile and a malformed email.", main=hdr + form(err={"ph": "Enter a mobile number.", "em": "Enter a valid email, or leave it empty."}).replace('value="905-555-0142"', 'value=""').replace('value="carmen.rivera@example.com"', 'value="carmen.rivera@"'))
    S.add("submitting", "Saving.", main=hdr + form(busy=True))
    S.add("error", "Saving failed; nothing typed is lost.", main=hdr + alert("danger", "We couldn’t save that", "Nothing is lost. Tap Looks right again.") + form())


# ------------------------------------------------------------------ Enroll: children
@screen("enroll-child", "page", "Enroll: children", route="/g/enroll/:program/children", reqs=[R_ENROLL, R_PICKUP, R_PRIVACY, R_ACCESS], shell="guardian", na={})
def enroll_child(S):
    def child_card(c, open_=False, err=None):
        e = err or {}
        pickups = ul_list([list_item("Luis Rivera", "Uncle · 905-555-0199", lead='<span class="avatar avatar--sm" aria-hidden="true">LR</span>', end=btn("Remove", "ghost", size="sm", data_href=dialog("remove-pickup"))), list_item("Rosa Alvarez", "Grandmother · 905-555-0131", lead='<span class="avatar avatar--sm" aria-hidden="true">RA</span>', end=btn("Remove", "ghost", size="sm", data_href=dialog("remove-pickup")))], card=False)
        body = (f'<div class="stack">{field(f"{c["id"]}-name", "Name", value=c["name"], required=True)}<div class="two-col">{field(f"{c["id"]}-dob", "Date of birth", type_="date", value="2017-03-14", required=True)}{field(f"{c["id"]}-school", "School and grade", value="Bennetto Elementary, Grade 4")}</div>'
                f'{textarea(f"{c["id"]}-allergy", "Allergies", value="Peanuts (severe, anaphylaxis). Tree nuts (hives).", rows=2, error=e.get("allergy", ""), help_="Write “none” if there are none.")}'
                f'{textarea(f"{c["id"]}-meds", "Medication and health notes", value="EpiPen 0.3 mg, carried in backpack. Dr. Amrita Sethi 905-555-0100.", rows=2, optional=True)}'
                f'<fieldset class="stack" style="gap: var(--space-2);"><legend class="field__label">Who may pick {c["name"].split()[0]} up, besides you</legend>{pickups}<p><button class="btn btn--sm" type="button" data-href="{dialog("add-pickup")}">{icon("plus")}Add an adult</button></p></fieldset>'
                f'{fieldset("Photos", choice(f"{c["id"]}-photo", "Okay to use photos in program materials", checked=True) + choice(f"{c["id"]}-photo", "No photos"))}</div>')
        return f'<details class="card accordion"{" open" if open_ else ""}><summary>{avatar(c)} {esc(c["name"])}, {c["age"]}{(" " + badge("Needs attention", "warning")) if e else ""}</summary><div class="accordion__body" style="color: inherit;">{body}</div></details>'
    hdr = '<h1>Your children</h1>' + g_steps(1)
    nav_ = lambda busy=False: f'<div class="cluster" style="justify-content: space-between;">{btn("Back", "ghost", href=page("enroll-household"))}{btn("Continue", "primary", type_="submit", busy=busy, size="lg")}</div>'
    S.add("default", "Mateo and Sofía from last season, each with allergies, medication, pickups and photo permission to confirm.", main=hdr + '<p class="text-muted">Check allergies and pickups for each child.</p>' + f'<form class="stack" action="#" method="post" novalidate>{child_card(CHILD["mateo"], True)}{child_card(CHILD["sofia"]).replace("Peanuts (severe, anaphylaxis). Tree nuts (hives).", "None").replace("EpiPen 0.3 mg, carried in backpack. Dr. Amrita Sethi 905-555-0100.", "Asthma; blue inhaler in her bag, two puffs before sports.").replace("2017-03-14", "2014-06-02").replace("Bennetto Elementary, Grade 4", "Bennetto Elementary, Grade 7")}<p><button class="btn" type="button" data-href="{dialog("add-child")}">{icon("plus")}Add another child</button></p>{nav_()}</form>' + g_footer())
    S.add("loading", "Loading the children on file.", main=hdr + skeleton_list(2, "Loading your children"))
    S.add("empty", "A new family with no children added yet.", main=hdr + card(empty("Add your first child", "About two minutes per child, once.", action=btn("Add a child", "primary", icon_name="plus", data_href=dialog("add-child")), icon_name="users"), cls="card--flush") + g_footer())
    S.add("invalid", "Allergies left blank on one child; the section opens with the error.", main=hdr + form_summary([("mateo-allergy", "Mateo: list allergies, or write “none”.")]) + f'<form class="stack" action="#" method="post" novalidate>{child_card(CHILD["mateo"], True, err={"allergy": "List allergies, or write “none”."}).replace("Peanuts (severe, anaphylaxis). Tree nuts (hives).", "")}{child_card(CHILD["sofia"])}{nav_()}</form>' + g_footer())
    S.add("submitting", "Saving both children.", main=hdr + f'<form class="stack" action="#" method="post" novalidate>{child_card(CHILD["mateo"])}{child_card(CHILD["sofia"])}{nav_(True)}</form>' + g_footer())
    S.add("error", "Saving failed; data kept.", main=hdr + alert("danger", "We couldn’t save that", "Nothing is lost. Tap Continue again.") + f'<form class="stack" action="#" method="post" novalidate>{child_card(CHILD["mateo"])}{child_card(CHILD["sofia"])}{nav_()}</form>' + g_footer())
    S.add("edge", "Four allergies, three medications and five approved adults; the longest names.", main=hdr + f'<form class="stack" action="#" method="post" novalidate>{child_card(dict(id="alex", name=LONG_CHILD, initials="AF", color="sun", age=9), True).replace("Peanuts (severe, anaphylaxis). Tree nuts (hives).", "Peanuts, tree nuts, sesame and shellfish (anaphylaxis, two EpiPens in the red pouch). Latex (contact rash). Grass pollen (seasonal, antihistamine at home).").replace("EpiPen 0.3 mg, carried in backpack. Dr. Amrita Sethi 905-555-0100.", "EpiPen 0.3 mg ×2. Cetirizine 5 mg each morning (given at home). Ventolin inhaler as needed before running. Dr. Oyelaran-Whitcombe 905-555-0177.").replace("Luis Rivera", "Bartholomew Fitzgerald-Vanderbroucke").replace("Uncle · 905-555-0199", "Father · 905-555-0122")}{nav_()}</form>' + g_footer())


# ------------------------------------------------------------------ Enroll: review and submit
@screen("enroll-review", "page", "Enroll: review", route="/g/enroll/:program/review", reqs=[R_ENROLL, R_SLIPS, R_PRIVACY], shell="guardian", na={"empty": "A review page always has content.", "loading": "Content comes from the previous steps on the device."})
def enroll_review(S):
    summary = card('<div class="summary">' + "".join(f'<div class="summary__row"><span class="summary__label">{k}</span><span class="summary__value">{v}</span></div>' for k, v in [("Program", "After‑School Tutoring · Mon–Thu, 4–6 pm"), ("You", "Carmen Rivera · 905-555-0142 · Spanish"), ("Second adult", "Luis Rivera · 905-555-0199"), ("Children", "Mateo (9), Sofía (12)"), ("Allergies on file", "Mateo: peanuts, tree nuts · Sofía: none"), ("Approved pickups", "Luis Rivera, Rosa Alvarez"), ("Photos", "Okay for both")]) + "</div>" + f'<p class="hint" style="margin-top: var(--space-3);"><a href="{page("enroll-household")}">Change household</a> · <a href="{page("enroll-child")}">Change children</a></p>', title="Check everything", tid="sum")

    def consent(err="", busy=False, name="Carmen Rivera"):
        return card(f'<div class="stack"><p>By signing the <a href="#sig-name">season consent</a>, staff may give first aid, call emergency services and release your children only to the adults listed.</p>'
                    f'{field("sig-name", "Type your full name to sign", value=name, error=err, autocomplete="name", required=True)}<div class="signature{" signature--empty" if not name else ""}" aria-hidden="true">{esc(name) if name else "Your name appears here"}{"<div class=\"signature__meta\">Signed on this phone · Thu 5 Nov 2026, 7:52 pm</div>" if name else ""}</div>'
                    f'{btn("Sign and submit", "primary", type_="submit", busy=busy, size="lg")}</div>', title="Sign", tid="sign", tag="div")
    hdr = '<h1>Review and sign</h1>' + g_steps(2)
    S.add("default", "Everything on one screen, then a typed-name signature for the season consent.", main=hdr + f'<form class="stack" action="#" method="post" novalidate>{summary}{consent()}<p class="center">{btn("Back", "ghost", href=page("enroll-child"))}</p></form>' + g_footer(),
          notes=note("E-signature is a typed name plus timestamp, device and the text shown; whether insurers accept this is an open question in the README.", "top: 4rem; right: 1rem;"))
    S.add("invalid", "Submitted without typing a name.", main=hdr + f'<form class="stack" action="#" method="post" novalidate>{summary}{consent(err="Type your full name to sign.", name="")}</form>' + g_footer())
    S.add("submitting", "Submitting.", main=hdr + f'<form class="stack" action="#" method="post" novalidate>{summary}{consent(busy=True)}</form>' + g_footer())
    S.add("error", "Submitting failed; kept on the device.", main=hdr + alert("danger", "We couldn’t send your enrollment", "Nothing is lost. Tap Sign and submit again.") + f'<form class="stack" action="#" method="post" novalidate>{summary}{consent()}</form>' + g_footer())
    S.add("success", "Submitted: what happens next, and the one link to keep.", main=g_steps(3) + card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("check-circle", "icon--lg")}</span><h1>Thank you, Carmen</h1><p class="text-muted">Mateo and Sofía are enrolled, pending office review. We’ll text you within two days.</p>'
                                                                                           f'<p><strong>Keep this link:</strong> <a href="{page("guardian-update")}">harbourview.promisehub.app/g/rivera</a></p>{btn("Done", "primary", href=page("guardian-home"), size="lg")}</div>', cls="card--success") + g_footer())
    S.add("waitlisted", "Submitted into a full program: waitlist position and what happens.", main=g_steps(3) + card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("clock", "icon--lg")}</span><h1>You’re 2nd on the waitlist</h1><p class="text-muted">Nikolai is saved. If a place opens, we text you first.</p>{btn("Done", "primary", href=page("guardian-home"), size="lg")}</div>', cls="card--warning") + g_footer())


# ------------------------------------------------------------------ Permission slip (the flow UrbanPromise lost to paper)
@screen("slip-sign", "page", "Permission slip", route="/g/slip/:token", reqs=[R_SLIPS, R_ACCESS, R_PRIVACY], shell="guardian", na={"empty": "A slip link always carries a slip."})
def slip_sign(S):
    def event_block(lang="en"):
        t = {"en": ("Fall field trip: Royal Botanical Gardens", "Saturday 14 November · 9:00 am–3:00 pm", "Bus leaves Harbourview Community Centre at 8:45 am"),
             "es": ("Excursión de otoño: Royal Botanical Gardens", "Sábado 14 de noviembre · 9:00 am–3:00 pm", "El autobús sale del Harbourview Community Centre a las 8:45 am")}[lang]
        return f'<div class="slip-event"><span class="icon-tile" aria-hidden="true">{icon("bus")}</span><div><div class="slip-event__title">{t[0]}</div><div class="slip-event__meta">{t[1]}</div><div class="slip-event__meta">{t[2]}</div></div></div>'

    def body(err=None, busy=False, name="", photo=True):
        e = err or {}
        confirm = card(f'<p>Pack a nut-free lunch, water bottle and rain jacket.</p>'
                       + '<div class="summary" style="margin-top: var(--space-3);">' + "".join(f'<div class="summary__row"><span class="summary__label">{k}</span><span class="summary__value">{v}</span></div>' for k, v in [("Child", "Mateo Rivera, 9"), ("Allergies", "Peanuts (severe), tree nuts"), ("Medication", "EpiPen, carried"), ("Emergency contact", "Carmen Rivera · 905-555-0142")]) + "</div>"
                       + f'<p class="hint" style="margin-top: var(--space-2);"><a href="{page("guardian-update")}">Update Mateo’s details</a></p>', title="Please check", tid="check")
        questions = card(fieldset("Photos on this trip", choice("photo", "Yes, okay to use photos", checked=photo) + choice("photo", "No photos of Mateo")) + fieldset("Lunch", choice("lunch", "We’ll pack one", checked=True) + choice("lunch", "Please provide lunch (free)")), title="Two quick questions", tid="q")
        sign = card(f'<div class="stack"><p>I give permission for Mateo Rivera to attend this trip and for staff to give first aid and call emergency services if needed.</p>{field("sig", "Type your full name to sign", value=name, error=e.get("sig", ""), autocomplete="name", required=True, autofocus=True)}'
                    f'<div class="signature{" signature--empty" if not name else ""}" aria-hidden="true">{esc(name) if name else "Your name appears here"}{"<div class=\"signature__meta\">Thu 5 Nov 2026, 3:41 pm · this phone</div>" if name else ""}</div>'
                    f'{btn("Sign the slip", "primary", type_="submit", busy=busy, size="lg")}<p class="center"><button class="btn btn--ghost" type="button" data-href="{dialog("decline-slip")}">Mateo can’t come</button></p></div>', title="Sign", tid="sign")
        return f'<form class="stack" action="#" method="post" novalidate>{event_block()}{confirm}{questions}{sign}</form>' + g_footer()
    hdr = '<h1>Permission slip for Mateo</h1><p class="text-muted">Hi Carmen. Sign by Thursday 12 November.</p>'
    S.add("default", "Carmen opens the texted link: the trip, Mateo’s pre-filled details, two questions, one tap plus a typed name.", main=hdr + body(name="Carmen Rivera"),
          notes=note("No account, no app: the link is tied to Carmen’s number. Everything is pre-filled from the profile.", "top: 4rem; right: 1rem;"))
    S.add("loading", "Loading the slip.", main='<h1>Permission slip</h1>' + '<div class="card stack" aria-busy="true" aria-label="Loading slip"><span class="skeleton skeleton--card" aria-hidden="true" style="height: 5rem;"></span>' + '<span class="skeleton skeleton--text" aria-hidden="true"></span>' * 4 + "</div>")
    S.add("invalid", "Tapped Sign without a name.", main=hdr + form_summary([("sig", "Type your full name to sign.")]) + body(err={"sig": "Type your full name to sign."}, name=""))
    S.add("submitting", "Signing.", main=hdr + body(name="Carmen Rivera", busy=True))
    S.add("success", "Signed: a receipt with the time, what to bring, and a calendar link.", main=card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("check-circle", "icon--lg")}</span><h1>Signed. Thank you, Carmen</h1><p class="text-muted">Mateo is cleared for Saturday 14 November. Signed 3:41 pm; copy emailed to carmen.rivera@example.com.</p></div>', cls="card--success") +
          event_block() + card('<div class="summary">' + "".join(f'<div class="summary__row"><span class="summary__label">{k}</span><span class="summary__value">{v}</span></div>' for k, v in [("Bring", "Nut-free lunch, water bottle, rain jacket"), ("Photos", "Yes"), ("Lunch", "We’ll pack one"), ("Pickup", "Back at the centre by 3:00 pm")]) + "</div>", title="On the day", tid="day") +
          f'<div class="cluster" style="justify-content: center;">{btn("Add to calendar", "", icon_name="calendar")}{btn("Update Mateo’s details", "ghost", href=page("guardian-update"))}</div>' + g_footer())
    S.add("error", "Signing failed; the slip and answers are kept.", main=hdr + alert("danger", "We couldn’t save your signature", "Your answers are kept. Tap Sign the slip again.") + body(name="Carmen Rivera"))
    S.add("expired", "The event has started; the slip can’t be signed online any more.", main='<h1>This slip has closed</h1>' + event_block() + card('<p>The trip started at 9:00 am. To sign on a staff tablet, call <a href="tel:+19055550181">Jaylen at 905-555-0181</a>.</p>') + g_footer())
    S.add("already-signed", "Opening a link that was already signed.", main='<h1>Already signed</h1>' + event_block() + card('<p>Signed Thursday 5 November at 3:41 pm. Mateo is cleared.</p>' + f'<p class="hint"><a href="{page("guardian-update")}">Update Mateo’s details</a> · <button class="btn btn--ghost btn--sm" type="button" data-href="{dialog("decline-slip")}">Mateo can no longer come</button></p>') + g_footer())
    S.add("es", "The same slip in Spanish, as Carmen’s household language setting shows it.", lang="Español", html_lang="es",
          main='<h1>Autorización para Mateo</h1><p class="text-muted">Hola Carmen. Firme antes del jueves 12 de noviembre.</p>' +
          f'<form class="stack" action="#" method="post" novalidate>{event_block("es")}' + card('<p>Empaque un almuerzo sin nueces, una botella de agua y un impermeable.</p>' + '<div class="summary" style="margin-top: var(--space-3);">' + "".join(f'<div class="summary__row"><span class="summary__label">{k}</span><span class="summary__value">{v}</span></div>' for k, v in [("Niño", "Mateo Rivera, 9"), ("Alergias", "Maní (grave), frutos secos"), ("Medicamento", "EpiPen, lo lleva consigo"), ("Contacto de emergencia", "Carmen Rivera · 905-555-0142")]) + "</div>", title="Por favor verifique", tid="check")
          + card(fieldset("Fotos en esta excursión", choice("photo", "Sí, pueden usar fotos", checked=True) + choice("photo", "Sin fotos de Mateo")) + fieldset("Almuerzo", choice("lunch", "Lo empacamos nosotros", checked=True) + choice("lunch", "Por favor provean almuerzo (gratis)")), title="Dos preguntas rápidas", tid="q")
          + card(f'<div class="stack"><p>Autorizo a Mateo Rivera a asistir a esta excursión y al personal a dar primeros auxilios y llamar a emergencias si es necesario.</p>{field("sig", "Escriba su nombre completo para firmar", value="Carmen Rivera", autocomplete="name", required=True)}<div class="signature" aria-hidden="true">Carmen Rivera<div class="signature__meta">jue 5 nov 2026, 3:41 pm · este teléfono</div></div>{btn("Firmar la autorización", "primary", type_="submit", size="lg")}<p class="center"><button class="btn btn--ghost" type="button" data-href="{dialog("decline-slip")}">Mateo no puede ir</button></p></div>', title="Firmar", tid="sign")
          + '</form><p class="hint center">¿Preguntas? Llame al <a href="tel:+19055550100">905-555-0100</a>. El texto en inglés es el que firma.</p>')


# ------------------------------------------------------------------ Guardian update page (the one link to keep)
@screen("guardian-update", "page", "Family page", route="/g/:household", reqs=[R_ENROLL, R_PICKUP, R_NOTIFY, R_PRIVACY], shell="guardian", na={})
def guardian_update(S):
    hdr = '<h1>The Rivera family</h1><p class="text-muted">Hi Carmen. Changes reach staff right away.</p>'
    todo = card(ul_list([list_item("Sign Sofía’s slip for the RBG trip", "Due Thu 12 Nov", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("clipboard", "icon--sm")}</span>', href=page("slip-sign"), end=badge("To do", "warning"))], card=False), title="To do · 1", tid="todo", cls="card--flush")
    kids = card(ul_list([list_item("Mateo, 9", "Peanut allergy · EpiPen · pickups: Luis, Rosa", person=CHILD["mateo"], end=btn("Edit", "", size="sm", href=page("enroll-child"))), list_item("Sofía, 12", "Asthma · inhaler · pickups: Luis, Rosa", person=CHILD["sofia"], end=btn("Edit", "", size="sm", href=page("enroll-child")))], card=False), title="Children", tid="kids", cls="card--flush", footer=f'<a href="{dialog("add-child")}">Add a child</a>')
    you = card(facts([("You", "Carmen Rivera · 905-555-0142 · carmen.rivera@example.com"), ("Second adult", "Luis Rivera · 905-555-0199"), ("Language", "Español"), ("Messages", "Text first, email for documents")]) + f'<p style="margin-top: var(--space-3);"><a class="btn btn--sm" href="{page("enroll-household")}">{icon("edit")}Edit household</a></p>', title="Household", tid="you")
    recent = card('<ul class="feed">' + f'<li><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("message", "icon--sm")}</span><div class="feed__body">Trip reminder: sign by Thursday<div class="feed__meta">Yesterday, 5:05 pm</div></div></li><li><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("check-circle", "icon--sm")}</span><div class="feed__body">You signed Mateo’s RBG slip<div class="feed__meta">Today, 3:41 pm</div></div></li><li><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("clipboard", "icon--sm")}</span><div class="feed__body">Mateo: in 4:02 pm, out to Rosa Alvarez 5:58 pm<div class="feed__meta">Yesterday</div></div></li>' + '</ul>', title="Recent", tid="recent", cls="stack")
    privacy = card(f'<p>Get a copy of your family’s data, or ask us to delete it.</p><div class="cluster" style="margin-top: var(--space-3);">{btn("Request a copy", "", icon_name="download", data_href=dialog("guardian-data-request"))}{btn("Ask to delete", "ghost", icon_name="trash", data_href=dialog("guardian-data-request"))}</div>', title="Your data", tid="priv")
    S.add("default", "The family page a guardian keeps: to-dos, children, household, recent activity, data requests.", main=hdr + todo + kids + you + recent + privacy + g_footer())
    S.add("loading", "Loading.", main='<h1>Your family</h1>' + skeleton_list(2, "Loading") + skeleton_list(3, "Loading household"))
    S.add("empty", "Nothing to do and no recent activity.", main=hdr.replace("Changes reach staff right away.", "Nothing needs your attention.") + kids + you + card(empty("No recent activity", "Slips, messages and check-ins appear here.", icon_name="inbox"), title="Recent", tid="recent", cls="card--flush") + privacy + g_footer())
    S.add("error", "Failed to load.", main='<h1>Your family</h1>' + card(empty("We couldn’t load your family page", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh") + f'<a class="btn" href="tel:+19055550100">{icon("phone")}Call 905-555-0100</a>', error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("expired", "The link was opened on a new device and needs a fresh code.", main='<h1>Let’s make sure it’s you</h1><p class="text-muted">New device. We’ll text a code to 905-555-••42.</p>' + f'<form class="card stack" action="#" method="post">{btn("Text me a code", "primary", type_="submit", size="lg")}<p class="center"><a href="{page("enroll")}">That’s not my number any more</a></p></form>' + g_footer())


# ------------------------------------------------------------------ Two-question survey after an event
@screen("survey", "page", "Survey", route="/g/survey/:token", reqs=[R_NOTIFY], shell="guardian", na={"empty": "Static form.", "loading": "Static form."})
def survey(S):
    def form(err=None, busy=False):
        e = err or {}
        scale = "".join(f'<label class="choice choice--tile" style="flex: 1; min-width: 2.5rem; justify-content: center;"><input type="radio" name="rate" value="{i}"{" checked" if i == 5 and not e else ""}><span class="choice__text">{i}</span></label>' for i in range(1, 6))
        return (f'<form class="card stack" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + fieldset("How was the trip for Mateo?", f'<div class="choice-tiles" style="display: flex; gap: var(--space-2);">{scale}</div><div class="cluster cluster--between hint"><span>Not good</span><span>Great</span></div>', error=e.get("rate", ""), fid="rate")
                + textarea("why", "Anything we should know?", rows=3, optional=True, placeholder="What went well, what to change")
                + btn("Send", "primary", type_="submit", busy=busy, size="lg") + "</form>" + g_footer())
    hdr = '<h1>Two quick questions, Carmen</h1><p class="text-muted">About Saturday’s Royal Botanical Gardens trip. Answers go to Marisol Delgado.</p>'
    S.add("default", "The two-question survey texted after an event.", main=hdr + form())
    S.add("invalid", "Sent without a rating.", main=hdr + form(err={"rate": "Pick a number from 1 to 5."}))
    S.add("submitting", "Sending.", main=hdr + form(busy=True))
    S.add("success", "Thanks; nothing more to do.", main=card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("check-circle", "icon--lg")}</span><h1>Thank you</h1><p class="text-muted">See you Thursday at tutoring.</p>{btn("Your family page", "", href=page("guardian-update"))}</div>', cls="card--success") + g_footer())
    S.add("error", "Sending failed.", main=hdr + alert("danger", "We couldn’t send that", "Tap Send again.") + form())
    S.add("expired", "The survey closed after a week.", main='<h1>This survey has closed</h1>' + card('<p>Surveys close a week after the event. Call or text Marisol at <a href="tel:+19055550100">905-555-0100</a>.</p>') + g_footer())
