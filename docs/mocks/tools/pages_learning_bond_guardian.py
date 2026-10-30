"""Learning Bond, the guardian side (L1-027, L1-028, L2-144 to L2-158): from a text to a submitted RESP and Canada Learning Bond application
for each child in about 15 minutes, on a phone, in the household's language, with no account and no contribution; then a child benefits
check from the same intake plus at most three facts. The invitation link opens `guardian-learning-bond` (after the code step of L2-026 on a new
device); the agent explains in three sentences, takes a per-child financial consent (`learning-bond-consent`), confirms what the enrolment record
holds and asks only for the SINs and the tax-filing answer (`learning-bond-intake`), shows the estimate as one number (`learning-bond-estimate`),
recommends a no-fee provider and pre-fills its application for review (`learning-bond-review`), and sends nothing until the guardian taps Submit.
`learning-bond-submitted` says what was sent, to whom and when to expect the deposit, and offers the benefits check (`learning-bond-benefits-offer`,
dialogs.py), whose intake (`learning-bond-benefits-intake`) leads to each benefit's state (`learning-bond-benefits`) and a deliberate application per
benefit (`learning-bond-benefit-review`). Paused claims (`learning-bond-paused`), reminders (`learning-bond-reminders`) and the running total
(`learning-bond-total`) complete the set. The guardian-side flow and copy are adapted from the Learning Bond product mocks (wizard, intake, provider,
form review, approve, submitted, case) into PromiseHub's guardian shell and the requirements' exact wording.

Cast: Carmen Rivera (Spanish, 905-555-0142, 42 Barton St E, Apt 3, Hamilton) claims for Mateo (9, born 14 Mar 2017, up to $1,400) and
Sofía (12, born 2 Jun 2014, up to $1,700). The platform recommends Northfield Credit Union (no fees, administers the bond, serves Ontario).
Mateo's application is sent Thu 5 Nov 2026 at 4:20 pm; deposit expected Jan 15 – Feb 28, 2027. Benefits for Hamilton: Canada Child Benefit
(already received), Ontario Child Benefit (apply now, about $1,680 a year), Child Disability Benefit (not eligible), Hamilton Recreation
Assistance (needs proof of address). SINs end in 286 (Carmen), 417 (Mateo), 903 (Sofía); nothing else of them is ever shown. English is the
`default` state so reviewers can read it; `es` is Carmen's real language. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_guardian import g_steps, g_footer
from pages_learning_bond import PROVIDER, OTHER_PROVIDERS

R_LB = "L1-027"
R_BEN = "L1-028"
R_CROSS = ["L2-159", "L2-160", "L2-161", "L2-162", "L2-163", "L2-026", "L2-027"]
R_HOME = ["L2-144", "L2-152", "L2-153", "L2-158", R_LB, R_BEN] + R_CROSS
R_CONSENT = ["L2-145", R_LB] + R_CROSS
R_INTAKE = ["L2-146", "L2-151", R_LB] + R_CROSS
R_ESTIMATE = ["L2-147", R_LB] + R_CROSS
R_REVIEW = ["L2-148", "L2-149", R_LB] + R_CROSS
R_SUBMITTED = ["L2-150", "L2-153", R_LB, R_BEN] + R_CROSS
R_PAUSED = ["L2-151", R_LB] + R_CROSS
R_BINTAKE = ["L2-154", R_BEN] + R_CROSS
R_BENEFITS = ["L2-155", "L2-156", R_BEN] + R_CROSS
R_BREVIEW = ["L2-156", "L2-149", R_BEN] + R_CROSS
R_REMINDERS = ["L2-157", R_BEN] + R_CROSS
R_TOTAL = ["L2-158", R_BEN] + R_CROSS

NA_G = {"empty": "A Learning Bond page is always about one household’s children."}
STEPS = ["Consent", "Your details", "Estimate", "Review and submit", "Sent"]
BSTEPS = ["Consent", "Three questions", "Your benefits"]
ADDRESS = "42 Barton St E, Apt 3, Hamilton ON L8L 2V6"
EXPECTED = "Expected Jan 15 – Feb 28, 2027"
SIN_HINT = "9 digits, like 123 456 782. Hidden as you type; only the last 3 digits show once saved."
SIN_ERR = "Check the number. A SIN has 9 digits, like 123 456 782."
CONSENT_LB = "I agree that Learning Bond may collect {name}’s and my social insurance numbers and tax-filing status and send them to the RESP provider I choose and the Government of Canada to apply for the Canada Learning Bond."
CONSENT_BEN = "I agree that Learning Bond may use what I’ve already given, plus my household size, marital status and whether I get the Canada Child Benefit, to check and apply for child benefits I choose."
TALK = "I’d rather talk to someone"


def steps(cur: int, names=STEPS) -> str:
    return g_steps(cur, len(names), "Learning Bond steps" if names is STEPS else "Benefits steps") + f'<p class="visually-hidden">{esc(names[cur])}</p>'


def agent(text: str, *, hint: str = "") -> str:
    h = f'<p class="chat__hint">{esc(hint)}</p>' if hint else ""
    return (f'<div class="chat" aria-label="Learning Bond"><div class="bubble"><span class="bubble__face icon-tile" aria-hidden="true">{icon("sprout")}</span>'
            f'<p class="bubble__text"><span class="visually-hidden">Learning Bond: </span>{text}</p></div>{h}</div>')


AGENT_NOTE = note("The agent’s line is the approved fixed wording for this step; the language model may rephrase it within 60 words in the household’s language, and never states an amount the rules didn’t compute. If the model is slow or down, this wording shows as is (L2-160).", "top: 4rem; right: 1rem;")


def sin_field(fid: str, label: str, *, value: str = "", masked: str = "", error: str = "", change: bool = False) -> str:
    if masked:
        return (f'<div class="field"><span class="field__label" id="{fid}-label">{esc(label)}</span><div class="cluster cluster--between"><span class="mono" aria-labelledby="{fid}-label">••• ••• {masked}</span>'
                f'{btn("Change", "ghost", size="sm", aria_label=f"Change {label}") if change else ""}</div><div class="field__help">Saved. Only the last 3 digits are shown.</div></div>')
    describe = f"{fid}-help" + (f" {fid}-error" if error else "")
    err = f'<div class="field__error" id="{fid}-error">{esc(error)}</div>' if error else ""
    return (f'<div class="field"><label class="field__label" for="{fid}">{esc(label)}</label><div class="input-group">'
            f'<input class="input mono" id="{fid}" name="{fid}" type="password" value="{esc(value)}" inputmode="numeric" autocomplete="off" aria-describedby="{describe}"{" aria-invalid=\"true\"" if error else ""} maxlength="11">'
            f'<button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-pressed="false" aria-label="Show {esc(label)}">{icon("eye")}</button></div>'
            f'<div class="field__help" id="{fid}-help">{SIN_HINT}</div>{err}</div>')


def talk_link() -> str:
    return f'<p class="center"><button class="btn btn--ghost" type="button" data-href="{dialog("learning-bond-callback")}">{icon("phone")}{TALK}</button></p>'


def failed_load(title: str) -> str:
    return card(empty(title, "Your answers are saved and nothing was lost. Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def loading_page(title: str) -> str:
    return f'<h1 class="visually-hidden">{esc(title)}</h1>{skeleton_header()}{skeleton_list(3, "Loading")}'


def child_lead(c: dict) -> str:
    return f'<span class="avatar avatar--sm avatar--{c["color"]}" aria-hidden="true">{c["initials"]}</span>'


MATEO, SOFIA = CHILD["mateo"], CHILD["sofia"]


# ------------------------------------------------------------------ guardian-learning-bond: the landing page
@screen("guardian-learning-bond", "page", "Learning Bond for your family", route="/g/learning-bond/:token", reqs=R_HOME, shell="guardian", na=NA_G)
def guardian_learning_bond(S):
    T = {
        "en": dict(h1="Mateo and Sofía may be owed money for school after high school",
                   agent="The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to Harbourview Youth Collective.",
                   kids="Your children in After‑School Tutoring and Saturday Sports", upto="Up to {n}", cont="Continue", later="Not now", no="I’m not interested", about="About 15 minutes · nothing to pay · on this phone"),
        "es": dict(h1="Mateo y Sofía podrían tener derecho a dinero para estudiar después de la secundaria",
                   agent="El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá deposita en el RESP de un niño para familias con ingresos más bajos. No tiene que aportar dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a Harbourview Youth Collective.",
                   kids="Sus hijos en After‑School Tutoring y Saturday Sports", upto="Hasta {n}", cont="Continuar", later="Ahora no", no="No me interesa", about="Unos 15 minutos · sin costo · en este teléfono"),
        "fr": dict(h1="Mateo et Sofía pourraient avoir droit à de l’argent pour leurs études après le secondaire",
                   agent="Le Bon d’études canadien est de l’argent que le gouvernement du Canada verse dans le REEE d’un enfant pour les familles à revenu modeste. Vous n’avez rien à verser. Ce que vous saisissez va au fournisseur de REEE et au gouvernement du Canada, pas à Harbourview Youth Collective.",
                   kids="Vos enfants à After‑School Tutoring et Saturday Sports", upto="Jusqu’à {n}", cont="Continuer", later="Pas maintenant", no="Ça ne m’intéresse pas", about="Environ 15 minutes · rien à payer · sur ce téléphone"),
    }

    def landing(lang="en"):
        c = T[lang]
        n1, n2 = ("1 400 $", "1 700 $") if lang == "fr" else ("$1,400", "$1,700")
        kids = card(ul_list([list_item("Mateo Rivera", "9 · After‑School Tutoring, Saturday Sports", lead=child_lead(MATEO), end=badge(c["upto"].format(n=n1), "info")),
                             list_item("Sofía Rivera", "12 · After‑School Tutoring", lead=child_lead(SOFIA), end=badge(c["upto"].format(n=n2), "info"))], card=False, label=c["kids"]), title=c["kids"], tid="kids", cls="card--flush")
        acts = (f'<div class="stack">{btn(c["cont"], "primary", size="lg", icon_name="arrow-right", href=page("learning-bond-consent", "es" if lang == "es" else "default"))}'
                f'<div class="cluster" style="justify-content: center;">{btn(c["later"], "", href=page("guardian-learning-bond", "not-now"))}{btn(c["no"], "ghost", href=page("guardian-learning-bond", "not-interested"))}</div>'
                f'<p class="hint center">{c["about"]}</p></div>')
        return f'<h1>{c["h1"]}</h1>' + agent(c["agent"]) + kids + acts + g_footer()

    S.add("default", "Carmen taps the link on a verified device: three sentences from the agent, each child in a covered program with the amount they may be owed, Continue, Not now, I’m not interested.", main=landing(),
          notes=AGENT_NOTE)
    S.add("es", "The same page in Spanish, the Rivera household’s language (L2-027).", lang="Español", html_lang="es", main=landing("es"))
    S.add("fr", "The same page in French; amounts follow the French format.", lang="Français", html_lang="fr", main=landing("fr"))
    S.add("verify", "A device not verified for the household: the code step first; nothing about the children shows before it succeeds (L2-144).",
          main='<h1>Check it’s you</h1><p class="text-muted">This page holds your family’s private details, so we text a code first.</p>'
               + f'<form class="card stack" action="#" method="post" novalidate><p>Code texted to <strong>905-555-0142</strong>.</p>{field("code", "6-digit code", value="", inputmode="numeric", autocomplete="one-time-code", attrs=" maxlength=\"6\" pattern=\"[0-9]*\"", autofocus=True, help_="Valid for 10 minutes.")}{btn("Continue", "primary", type_="submit", size="lg")}<p class="center"><button class="btn btn--ghost" type="button">Send a new code</button></p></form>' + g_footer())
    S.add("not-now", "Not now: nothing is collected, the status stays Invited and the link keeps working.",
          main='<h1>No problem</h1>' + alert("info", "Your link keeps working", "Come back any time. Nothing was collected.") + card(f'<p>Mateo and Sofía’s Learning Bond can be claimed until the day before each turns 21.</p><div>{btn("Start the claim", "primary", href=page("guardian-learning-bond"))}</div>') + g_footer())
    S.add("not-interested", "I’m not interested: status Not interested and no further reminder or text about the Learning Bond.",
          main='<h1>Okay, we won’t ask again</h1>' + alert("success", "We won’t text you about the Learning Bond again.", "If you change your mind, this link still opens the claim.") + g_footer())

    def in_progress(*, offer=True):
        kids = card(ul_list([
            list_item("Mateo Rivera", f'Sent to {PROVIDER} · Thu 5 Nov · <span class="chip">{EXPECTED}</span>', lead=child_lead(MATEO), href=page("learning-bond-submitted"), end=badge("Submitted", "success")),
            list_item("Sofía Rivera", "You stopped at Sofía’s SIN. Pick up where you left off.", lead=child_lead(SOFIA), href=page("learning-bond-intake", "second-child"), end=badge("Started", "info")),
        ], card=False, label="Your children"), title="Your children", tid="kids", cls="card--flush")
        total = card(f'<p class="stat__value">Nothing confirmed yet</p><p class="text-muted">Applied for: up to <strong>$1,400</strong> · Mateo’s Learning Bond</p>', title="Unlocked so far", tid="total",
                     footer=f'<a href="{page("learning-bond-total", "nothing-confirmed")}">See the total by child</a>')
        ben = card(agent("I can also check whether your family gets every child benefit it qualifies for. It takes about 3 questions.")
                   + f'<div class="cluster">{btn("Check benefits", "primary", data_href=dialog("learning-bond-benefits-offer"))}{btn("Not now", "ghost")}</div>', title="Child benefits", tid="ben") if offer else ""
        consents = card(ul_list([list_item("Mateo Rivera · Learning Bond", "Signed Carmen Rivera · Thu 5 Nov, 4:08 pm · wording v2", end=btn("Withdraw", "ghost", size="sm", data_href=dialog("withdraw-learning-bond-consent"))),
                                 list_item("Sofía Rivera · Learning Bond", "Signed Carmen Rivera · Thu 5 Nov, 4:08 pm · wording v2", end=btn("Withdraw", "ghost", size="sm", data_href=dialog("withdraw-learning-bond-consent")))], card=False, label="Your consents"),
                        title="Your consents", tid="consents", cls="card--flush", footer=f'<a href="{page("learning-bond-reminders")}">Your reminders</a>')
        return '<h1>Hi Carmen</h1><p class="text-muted">Where Mateo’s and Sofía’s claims stand.</p>' + kids + total + ben + consents + talk_link() + g_footer()
    S.add("in-progress", "Reopened later: Mateo submitted with the deposit window, Sofía started, the running total, the benefits offer kept after Not now, and Your consents with Withdraw.", main=in_progress(),
          notes=note("The benefits offer stays here once Not now was chosen on the confirmation page (L2-153). Withdraw opens the dialog that says what stops and what doesn’t (L2-152).", "top: 4rem; right: 1rem;"))
    S.add("older-child", "The Haddad household: Yusuf (13) can be claimed for; Nadia (18) is named with the rule for 18 to 20 and no claim is offered for her.", lang="English",
          main='<h1>Yusuf may be owed money for school after high school</h1>' + agent(T["en"]["agent"].replace("Harbourview Youth Collective", "Harbourview Youth Collective"))
               + card(ul_list([list_item("Yusuf Haddad", "13 · After‑School Tutoring", lead=child_lead(CHILD["yusuf"]), end=badge("Up to $1,800", "info")),
                               list_item("Nadia Haddad", "Nadia can claim the Learning Bond for themselves until they turn 21.", lead='<span class="avatar avatar--sm avatar--sage" aria-hidden="true">NH</span>')], card=False, label="Your children"), title="Your children", tid="kids", cls="card--flush")
               + f'<div class="stack">{btn("Continue", "primary", size="lg", icon_name="arrow-right", href=page("learning-bond-consent"))}</div>' + g_footer())
    S.add("expired", "A revoked or unknown token: the page says the link has expired, as on every guardian page.",
          main='<h1>This link has expired</h1>' + card(f'<div class="stack"><p>Ask Harbourview Youth Collective for a new one.</p><div>{btn("Call 905-555-0100", "primary", icon_name="phone", href="tel:+19055550100")}</div></div>') + g_footer())
    S.add("unavailable", "Learning Bond is off for the organization, or the organization is suspended: the page says it isn’t available and the endpoints answer 404.",
          main='<h1>Learning Bond isn’t available</h1>' + card('<p>Harbourview Youth Collective isn’t offering Learning Bond right now. Nothing about your family was collected.</p>') + g_footer())
    S.add("loading", "The page loading after the code check.", main=loading_page("Learning Bond for your family"))
    S.add("error", "The page failed to load.", main='<h1>Learning Bond for your family</h1>' + failed_load("We couldn’t load your family’s page") + g_footer())


# ------------------------------------------------------------------ learning-bond-consent
@screen("learning-bond-consent", "page", "Learning Bond consent", route="/g/learning-bond/:token/consent", reqs=R_CONSENT, shell="guardian", na=NA_G)
def learning_bond_consent(S):
    def form(*, err=None, busy=False, lang="en", checked=("mateo",)):
        e = err or {}
        if lang == "es":
            h1, lead, sig_label, agree = "Su permiso, por cada hijo", "Antes de preguntar nada, necesito su permiso por cada hijo. Es distinto del consentimiento del programa.", "Escriba su nombre completo para firmar", "Acepto"
            wording = "Acepto que Learning Bond recopile los números de seguro social de {name} y míos y nuestra situación fiscal, y los envíe al proveedor de RESP que yo elija y al Gobierno de Canadá para solicitar el Bono de Estudios Canadiense."
        else:
            h1, lead, sig_label, agree = "Your permission, for each child", "Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave Harbourview.", "Type your full name to sign", "Agree"
            wording = CONSENT_LB
        boxes = "".join(choice("kid", f"<strong>{esc(c['name'])}</strong><small>{esc(wording.format(name=c['name'].split()[0]))}</small>", type_="checkbox", checked=c["id"] in checked, invalid="kid" in e) for c in (MATEO, SOFIA))
        body = (fieldset("Children" if lang == "en" else "Hijos", boxes, error=e.get("kid", ""), fid="kid")
                + field("sig", sig_label, value="" if "sig" in e else "Carmen Rivera", autocomplete="name", error=e.get("sig", ""), required=True)
                + f'<p class="hint">{"Signed on this phone · Thu 5 Nov 2026 · wording version 2" if lang == "en" else "Firmado en este teléfono · jue 5 nov 2026 · versión 2 del texto"}</p>')
        summary = form_summary([(k, v) for k, v in e.items()]) if e else ""
        return (steps(0) + f'<h1>{h1}</h1>' + agent(lead) + f'<form class="card stack" action="#" method="post" novalidate>{summary}{body}{btn(agree, "primary", type_="submit", size="lg", busy=busy, icon_name="check")}</form>' + g_footer())
    S.add("default", "One unticked box per eligible child with the exact wording, a typed full name and Agree; Mateo ticked, Sofía not yet.", main=form(), notes=AGENT_NOTE)
    S.add("es", "The consent in Spanish.", lang="Español", html_lang="es", main=form(lang="es"))
    S.add("invalid", "No child ticked and no name typed: 422 with both messages; nothing is stored.", main=form(err={"kid": "Tick at least one child.", "sig": "Type your full name to sign."}, checked=()))
    S.add("submitting", "Recording the consent.", main=form(busy=True))
    S.add("success", "One consent stored for Mateo with scope LearningBond, the typed name, the wording version, the language and the time; nothing is asked about Sofía.",
          main=steps(0) + '<h1>Thanks, Carmen</h1>' + alert("success", "Consent recorded for Mateo", "Signed Carmen Rivera · Thu 5 Nov 2026, 4:08 pm. You can withdraw it any time from your family page.",
                                                                 actions=btn("Continue to Mateo’s details", "primary", size="sm", icon_name="arrow-right", href=page("learning-bond-intake"))) + g_footer())
    S.add("loading", "Loading.", main=loading_page("Learning Bond consent"))
    S.add("error", "Failed to load.", main=steps(0) + '<h1>Your permission, for each child</h1>' + failed_load("We couldn’t load this step") + g_footer())


# ------------------------------------------------------------------ learning-bond-intake
@screen("learning-bond-intake", "page", "Learning Bond intake", route="/g/learning-bond/:token/intake", reqs=R_INTAKE, shell="guardian", na=NA_G)
def learning_bond_intake(S):
    def confirm_card(child=MATEO, dob="14 Mar 2017", *, fixed=False):
        acts = "" if fixed else f'<div class="cluster">{btn("Yes, that’s right", "primary", icon_name="check")}{btn("Fix this", "ghost", href=page("guardian-update"))}</div>'
        return card(facts([("Name", esc(child["name"])), ("Date of birth", dob)]) + acts, title=f"From {child['name'].split()[0]}’s enrolment", tid="confirm")

    def numbers(*, err=None, g_masked="", c_masked="", child=MATEO, tax="", tax_fixed=False, no_sin=False, g_value="", c_value=""):
        e = err or {}
        first = child["name"].split()[0]
        g = sin_field("gsin", "Your social insurance number", value=g_value, masked=g_masked, error=e.get("gsin", ""), change=True)
        c = sin_field("csin", f"{first}’s social insurance number", value=c_value, masked=c_masked, error=e.get("csin", ""))
        nos = f'<p><a href="{page("learning-bond-paused")}">{first} doesn’t have a SIN yet</a></p>' if not c_masked else ""
        if no_sin:
            nos = alert("info", f"{first} doesn’t have a SIN yet", "That’s okay. We’ll pause here and help you apply for one. It’s free.", actions=btn("Pause and get help", "primary", size="sm", href=page("learning-bond-paused")))
        if tax_fixed:
            t = f'<div class="field"><span class="field__label">Did your family file a 2025 tax return?</span><p>{esc(tax)} <span class="text-caption">· answered for Mateo</span></p></div>'
        else:
            t = fieldset("Did your family file a 2025 tax return?", choice("tax", "Yes", checked=tax == "Yes") + choice("tax", "No", checked=tax == "No") + choice("tax", "Not sure", checked=tax == "Not sure"), fid="tax",
                         hint="The Government of Canada uses it to confirm the bond.")
        return card(f'<div class="stack">{g}{c}{nos}{t}</div>', title="What I still need", tid="numbers")

    def form(*, err=None, busy=False, alert_html="", child=MATEO, dob="14 Mar 2017", step_note="", **kw):
        e = err or {}
        summary = form_summary([(k, v) for k, v in e.items()]) if e else ""
        return (steps(1) + f'<h1>{child["name"].split()[0]}’s details</h1>' + alert_html
                + agent(f"I already have {child['name'].split()[0]}’s name and birthday from the enrolment. I’ll ask only for what’s missing: the numbers go in the boxes, never in a message to me.")
                + f'<form class="stack" action="#" method="post" novalidate>{summary}{confirm_card(child, dob)}{numbers(err=err, child=child, **kw)}{btn("Save and continue", "primary", type_="submit", size="lg", busy=busy, icon_name="arrow-right")}</form>'
                + f'<p class="hint center">Encrypted with a key Harbourview never holds. Shown only as the last 3 digits once saved.</p>' + talk_link() + g_footer())
    S.add("default", "Mateo’s name and date of birth for confirmation, then the only three questions: Carmen’s SIN, Mateo’s SIN and the tax return; SIN fields are masked with Show.", main=form(),
          notes=note("A 9-digit number typed into any free-text message to the agent is removed before it is stored or sent to the model, and the agent asks for it in the box instead (L2-146).", "top: 4rem; right: 1rem;"))
    S.add("es", "The intake in Spanish.", lang="Español", html_lang="es",
          main=steps(1) + '<h1>Los datos de Mateo</h1>' + agent("Ya tengo el nombre y la fecha de nacimiento de Mateo de la inscripción. Solo le pediré lo que falta: los números van en las casillas, nunca en un mensaje para mí.")
               + f'<form class="stack" action="#" method="post" novalidate>{card(facts([("Nombre", "Mateo Rivera"), ("Fecha de nacimiento", "14 mar 2017")]) + f"<div class=\"cluster\">{btn("Sí, es correcto", "primary", icon_name="check")}{btn("Corregir", "ghost", href=page("guardian-update"))}</div>", title="De la inscripción de Mateo", tid="confirm")}'
               + card(sin_field("gsin", "Su número de seguro social") + sin_field("csin", "Número de seguro social de Mateo") + f'<p><a href="{page("learning-bond-paused")}">Mateo aún no tiene NAS</a></p>'
                      + fieldset("¿Su familia presentó la declaración de impuestos de 2025?", choice("tax", "Sí") + choice("tax", "No") + choice("tax", "No estoy segura"), fid="tax"), title="Lo que todavía necesito", tid="numbers")
               + f'{btn("Guardar y continuar", "primary", type_="submit", size="lg", icon_name="arrow-right")}</form>' + g_footer())
    S.add("invalid", "A SIN that fails the check digit and a child SIN equal to the guardian’s: 422 per field; nothing is stored.",
          main=form(err={"gsin": SIN_ERR, "csin": "Each person has their own SIN."}, g_value="123456789", c_value="123456789", tax="Yes"))
    S.add("fix-requested", "Fix this: a change request went to staff as a guardian update and the claim pauses until it is accepted.",
          main=steps(1) + '<h1>Mateo’s details</h1>' + alert("info", "We’ve asked Harbourview to fix Mateo’s date of birth", "They’ll check it and we’ll text you. Your claim picks up here.", actions=btn("Back to your family page", "", size="sm", href=page("guardian-learning-bond", "in-progress")))
               + confirm_card(fixed=True) + g_footer())
    S.add("second-child", "Sofía, started later: Carmen’s SIN and tax answer are reused and shown masked with Change; only Sofía’s SIN is asked.",
          main=form(child=SOFIA, dob="2 Jun 2014", g_masked="286", tax="Yes", tax_fixed=True))
    S.add("resumed", "Reopened from the same link: resumes at the first unanswered question, with the SIN already saved shown as its last three digits.",
          main=form(alert_html=alert("info", "Welcome back", "You stopped at Mateo’s SIN. Everything else is saved."), g_masked="286"))
    S.add("no-sin", "Mateo doesn’t have a SIN yet: the claim pauses with help to apply.", main=form(no_sin=True, g_masked="286"))
    S.add("submitting", "Saving the answers.", main=form(busy=True, g_value="046454286", c_value="130692417", tax="Yes"))
    S.add("unavailable", "The encryption key is unavailable: 503, nothing stored unencrypted.",
          main=steps(1) + '<h1>Mateo’s details</h1>' + card(empty("Learning Bond is unavailable right now. Nothing was lost.", "Try again in a few minutes. Your answers so far are saved.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush") + g_footer())
    S.add("loading", "Loading.", main=loading_page("Learning Bond intake"))
    S.add("error", "Failed to load.", main=steps(1) + '<h1>Mateo’s details</h1>' + failed_load("We couldn’t load this step") + g_footer())


# ------------------------------------------------------------------ learning-bond-estimate
@screen("learning-bond-estimate", "page", "Learning Bond estimate", route="/g/learning-bond/:token/estimate", reqs=R_ESTIMATE, shell="guardian", na=NA_G)
def learning_bond_estimate(S):
    def est(first="Mateo", amount="$1,400", years="Based on the years since Mateo was born.", *, cont=True, extra="", lang="en"):
        if lang == "es":
            h1 = f"{first} podría tener derecho a hasta {amount}."
            why = f"Según los años desde que nació {first}. El Gobierno de Canadá confirma la cantidad con sus declaraciones de impuestos."
            nxt, a = "Siguiente: el proveedor del RESP", "Cada año desde el nacimiento hasta los 15 cuenta: $500 el primer año y $100 cada año siguiente, hasta $2,000."
        else:
            h1 = f"{first} may be owed up to {amount}."
            why = f"{years} The Government of Canada confirms the amount from your tax returns."
            nxt, a = "Next: the RESP provider", "Every year from birth to the year a child turns 15 counts: $500 for the first and $100 for each year after, up to $2,000."
        body = card(f'<p class="stat__label">{"Estimación" if lang == "es" else "Estimate"}</p><p class="stat__value">{amount}</p><p class="text-muted">{why}</p>' + extra)
        act = f'<div class="stack">{btn(nxt, "primary", size="lg", icon_name="arrow-right", href=page("learning-bond-review", "es" if lang == "es" else "default"))}</div>' if cont else ""
        return steps(2) + f'<h1>{h1}</h1>' + agent(a) + body + act + g_footer()
    S.add("default", "Mateo, born 2017, in 2026: ten years, $500 + 9 × $100 = up to $1,400, computed by the versioned rule on the server, never by the model.", main=est(),
          notes=note("The rule (Canada Learning Bond, version 2026-01) and its effective date are recorded with the estimate (L2-147).", "top: 4rem; right: 1rem;"))
    S.add("es", "The estimate in Spanish.", lang="Español", html_lang="es", main=est(lang="es"))
    S.add("capped", "A 15-year-old born in 2011: sixteen years would be $2,000, the cap.", main=est("Jamal", "$2,000", "Based on the years since Jamal was born, up to the $2,000 limit."))
    S.add("needs-tax-return", "The family answered No to filing last year’s taxes: the estimate shows with “You’ll need to file to receive it” and the claim pauses.",
          main=est(cont=False, extra=alert("warning", "You’ll need to file to receive it", "The Learning Bond needs a filed 2025 tax return. There are free clinics in Hamilton.", actions=btn("See how to file", "primary", size="sm", href=page("learning-bond-paused", "needs-tax-return")))))
    S.add("loading", "Loading.", main=loading_page("Learning Bond estimate"))
    S.add("error", "Failed to load.", main=steps(2) + '<h1>Mateo’s estimate</h1>' + failed_load("We couldn’t load the estimate") + g_footer())


# ------------------------------------------------------------------ learning-bond-review
APP_FIELDS = [("Beneficiary", "Mateo Rivera"), ("Date of birth", "14 Mar 2017"), ("Beneficiary’s SIN", "••• ••• 417"), ("Primary caregiver", "Carmen Rivera"),
              ("Address", ADDRESS), ("Caregiver’s SIN", "••• ••• 286"), ("Phone", "905-555-0142"), ("Email", "carmen.rivera@example.com"), ("Language", "Spanish"), ("Provider", PROVIDER)]


def app_review(fields=APP_FIELDS, *, editing: str = "", err: str = "", lang="en") -> str:
    rows = []
    for k, v in fields:
        if k == editing:
            rows.append(f'<div><dt>{esc(k)}</dt><dd>{field("edit-" + k.lower(), k, type_="tel" if k == "Phone" else "text", value=v, error=err, autofocus=True, help_="For this application only. Your household record isn’t changed.")}'
                        f'<div class="cluster">{btn("Save", "primary", size="sm", type_="submit")}{btn("Cancel", "ghost", size="sm")}</div></dd></div>')
        else:
            ed = "" if "SIN" in k or k == "Provider" else btn("Editar" if lang == "es" else "Edit", "ghost", size="sm", aria_label=f"Edit {k}")
            rows.append(f'<div><dt>{esc(k)}</dt><dd class="cluster cluster--between"><span>{v}</span>{ed}</dd></div>')
    return f'<dl class="facts">{"".join(rows)}</dl>'


@screen("learning-bond-review", "page", "Learning Bond review", route="/g/learning-bond/:token/review", reqs=R_REVIEW, shell="guardian", na=NA_G)
def learning_bond_review(S):
    def provider_card(*, choosing=False, lang="en"):
        if choosing:
            opts = choice("prov", f"{PROVIDER} <small>No fees, no deposit needed, and it handles the Learning Bond. Serves Ontario.</small>", checked=True)
            opts += "".join(choice("prov", f"{p} <small>No fees, no deposit needed, and it handles the Learning Bond. Serves Ontario.</small>") for p in OTHER_PROVIDERS)
            return card(fieldset("No-fee RESP providers that administer the Learning Bond", opts, hint="The same list for every organization, kept by the platform. No provider pays to be here.") + f'<div>{btn("Use this provider", "primary")}</div>', title="Choose a provider", tid="provider")
        why = "Sin comisiones, sin depósito, y gestiona el Bono." if lang == "es" else "No fees, no deposit needed, and it handles the Learning Bond"
        return card(f'<p><strong>{PROVIDER}</strong> · {badge("Recommended" if lang == "en" else "Recomendado", "success")}</p><p class="text-muted">{why}. The first no-fee provider on the platform’s list that serves Ontario.</p>',
                    title="RESP provider" if lang == "en" else "Proveedor del RESP", tid="provider", footer=f'<a href="{page("learning-bond-review", "choose-another")}">{"Elegir otro" if lang == "es" else "Choose another"}</a>')

    def body(*, editing="", err="", busy=False, alert_html="", choosing=False, lang="en"):
        es = lang == "es"
        h1 = "Revise la solicitud de Mateo" if es else "Check Mateo’s application"
        a = ("Rellené la solicitud de Northfield con lo que ya tengo. Revise cada dato. Nada se envía hasta que toque Enviar." if es else
             f"I filled in {PROVIDER}’s application from what I have. Check each field. Nothing has been sent yet; here’s exactly what goes, and to whom.")
        line = (f"Esto envía la solicitud de Mateo a {PROVIDER} y al Gobierno de Canadá." if es else f"This sends Mateo’s application to {PROVIDER} and the Government of Canada.")
        submit = btn(f"{'Enviar a' if es else 'Submit to'} {PROVIDER}", "primary", type_="submit", size="lg", busy=busy, icon_name="send", disabled=bool(editing))
        app = card(app_review(editing=editing, err=err, lang=lang), title="Solicitud de RESP y Bono de Estudios" if es else "RESP and Learning Bond application", tid="app")
        return (steps(3) + f'<h1>{h1}</h1>' + alert_html + agent(a) + provider_card(choosing=choosing, lang=lang)
                + f'<form class="stack" action="#" method="post" novalidate>{app}<p class="hint">{line}</p>{submit}</form>' + talk_link() + g_footer())
    S.add("default", "The recommended provider and why, every field of the pre-filled application with Edit (SINs masked, no Edit on them), and Submit to Northfield Credit Union as the only way to send.", main=body(),
          notes=note("Before Submit, no request carrying the family’s data has been made to the provider or any government service. Submit is the guardian’s own request with the review’s version; the agent has no tool that submits (L2-149).", "top: 4rem; right: 1rem;"))
    S.add("es", "The review in Spanish.", lang="Español", html_lang="es", main=body(lang="es"))
    S.add("choose-another", "Choose another: the other no-fee providers serving Ontario, from the platform’s list.", main=body(choosing=True))
    S.add("no-provider", "No provider on the list serves the household’s province: the page says so, offers the Government of Canada link, and the claim stays Started.",
          main=steps(3) + '<h1>No provider yet for your province</h1>' + agent("None of the no-fee providers we work with serves Nunavut yet. Your claim stays saved; I’ll text you when one does.")
               + card(f'<p>You can still open an RESP and claim the bond yourself.</p><div>{btn("Learning Bond on canada.ca", "", icon_name="globe", href="https://www.canada.ca/en/services/benefits/education/education-savings/learning-bond.html", attrs=" target=\"_blank\" rel=\"noopener\"")}</div>') + g_footer())
    S.add("edit", "Editing the phone for this application only; the household record isn’t changed.", main=body(editing="Phone"))
    S.add("invalid", "An edited phone that isn’t ten digits: validated as on the household record.", main=body(editing="Phone", err="Enter a 10-digit mobile number."))
    S.add("submitting", "Sending once; a double tap or retry sends nothing more.", main=body(busy=True))
    S.add("failed", "The provider refused or was unreachable: the application stays Ready to submit and nothing was sent.",
          main=body(alert_html=alert("danger", "We couldn’t send it. Nothing was sent. Try again.", f"{PROVIDER} didn’t answer. Your application is saved exactly as you reviewed it.")))
    S.add("loading", "Loading.", main=loading_page("Learning Bond review"))
    S.add("error", "Failed to load.", main=steps(3) + '<h1>Check Mateo’s application</h1>' + failed_load("We couldn’t load the application") + g_footer())


# ------------------------------------------------------------------ learning-bond-submitted
def next_steps(done: int = 0) -> str:
    items = [(f"{PROVIDER} opens Mateo’s RESP and confirms it received the application", "Usually within 5 business days. We’ll text you."),
             ("The Government of Canada checks your tax returns and approves the bond", "Up to 8 weeks."),
             ("The money is deposited in Mateo’s RESP", "We’ll text you the amount.")]
    lis = "".join(f'<li class="list__item"><span class="step-marker{" step-marker--done" if i < done else ""}" aria-hidden="true">{icon("check", "icon--sm") if i < done else i + 1}</span><div class="list__body"><div class="list__title">{t}</div><div class="list__meta">{m}</div></div>{badge("Done", "success") if i < done else ""}</li>' for i, (t, m) in enumerate(items))
    chipd = f'<span class="chip" aria-label="{EXPECTED}">{icon("calendar", "icon--sm")}{EXPECTED}</span>'
    return card(f'<ol class="list" aria-label="What happens next">{lis}</ol>', title="What happens next", tid="next", cls="card--flush", footer=chipd)


SENT_FIELDS = [(k, v) for k, v in APP_FIELDS]


@screen("learning-bond-submitted", "page", "Learning Bond submitted", route="/g/learning-bond/:token/submitted", reqs=R_SUBMITTED, shell="guardian", na=NA_G)
def learning_bond_submitted(S):
    def offer(*, lang="en"):
        if lang == "es":
            return card(agent("También puedo comprobar si su familia recibe todos los beneficios por hijos a los que tiene derecho. Son unas 3 preguntas.")
                        + f'<div class="cluster">{btn("Comprobar beneficios", "primary", data_href=dialog("learning-bond-benefits-offer"))}{btn("Ahora no", "ghost", href=page("guardian-learning-bond", "in-progress"))}</div>', title="Beneficios por hijos", tid="ben")
        return card(agent("I can also check whether your family gets every child benefit it qualifies for. It takes about 3 questions.")
                    + f'<div class="cluster">{btn("Check benefits", "primary", data_href=dialog("learning-bond-benefits-offer"))}{btn("Not now", "ghost", href=page("guardian-learning-bond", "in-progress"))}</div>', title="Child benefits", tid="ben")

    def sent(done=0, *, alert_html="", lang="en", extra=""):
        es = lang == "es"
        h1 = f"Enviado a {PROVIDER} el jue 5 nov 2026" if es else f"Sent to {PROVIDER} on Thu 5 Nov 2026"
        a = "Listo. Esto es lo que se envió, a quién y qué pasa ahora." if es else "Done. Here’s what was sent, to whom and what happens next. I’ll text you as Northfield and the Government of Canada report back."
        fields = card(facts(SENT_FIELDS) + f'<p class="text-muted">{"Enviado 4:20 pm · estimación hasta $1,400" if es else "Sent 4:20 pm · estimate up to $1,400 · rule version 2026-01"}</p>', title="Lo que se envió" if es else "What was sent", tid="sent")
        acts = f'<div class="cluster">{btn("Empezar la solicitud de Sofía" if es else "Start Sofía’s claim", "", icon_name="arrow-right", href=page("learning-bond-intake", "second-child"))}{btn("Su página familiar" if es else "Your family page", "ghost", href=page("guardian-learning-bond", "in-progress"))}</div>'
        return steps(4) + f'<h1>{h1}</h1>' + alert_html + agent(a) + next_steps(done) + extra + fields + offer(lang=lang) + acts + g_footer()
    S.add("default", "Sent to Northfield Credit Union on Thu 5 Nov 2026: the fields sent (SINs masked), the estimate, what happens next in three steps, the expected deposit window, and the benefits offer.", main=sent(),
          notes=note("The deposit window comes from the provider’s stated processing time. Check benefits opens the Benefits consent (L2-153); Not now is remembered and the offer stays on the family page.", "top: 4rem; right: 1rem;"))
    S.add("es", "The confirmation in Spanish.", lang="Español", html_lang="es", main=sent(lang="es"))
    S.add("received", "Northfield reported Received through its webhook: step 1 done and Carmen was texted.", main=sent(1, alert_html=alert("success", f"{PROVIDER} received Mateo’s application", "Mon 9 Nov · the RESP is open. Next, the Government of Canada checks your tax returns.")))
    S.add("deposited", "Deposited with an amount: the status follows, Carmen is texted, and the total updates.",
          main=sent(3, alert_html=alert("success", "$1,400 was deposited in Mateo’s RESP", "Fri 22 Jan 2027. It counts in your total.", actions=btn("See your total", "primary", size="sm", href=page("learning-bond-total")))))
    def doc(*, name="", busy=False, err=""):
        chosen = f'<span>{esc(name)}</span>' if name else f'{icon("upload")}<span>Choose a file or take a photo</span>'
        e = f'<div class="field__error" id="doc-error">{esc(err)}</div>' if err else ""
        return (f'<form class="card stack" action="#" method="post" novalidate><h2 class="card__title" id="doc">{PROVIDER} needs proof of address for Mateo</h2>'
                '<p>A utility bill, phone bill or bank statement from the last 3 months with your name and address. PDF, JPEG or PNG up to 10 MB. Sent only when you tap Send.</p>'
                f'<label class="dropzone" for="doc-file"><input type="file" id="doc-file" accept=".pdf,.jpg,.jpeg,.png" class="visually-hidden"{" aria-describedby=\"doc-error\" aria-invalid=\"true\"" if err else ""}>{chosen}</label>{e}'
                f'{btn("Send to " + PROVIDER, "primary", type_="submit", size="lg", icon_name="send", busy=busy, disabled=not name)}</form>')
    S.add("document-needed", "The provider asked for a document: Carmen uploads a PDF, JPEG or PNG of up to 10 MB; it is sent only on Send.", main=sent(1, alert_html=alert("warning", f"{PROVIDER} needs a document for Mateo", "Proof of address. Upload it below."), extra=doc()))
    S.add("document-sending", "Sending the document once.", main=sent(1, extra=doc(name="hydro-bill-oct.pdf · 1.2 MB", busy=True)))
    S.add("document-invalid", "A file over 10 MB.", main=sent(1, extra=doc(err="That file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB.")))
    S.add("loading", "Loading.", main=loading_page("Learning Bond submitted"))
    S.add("error", "Failed to load.", main=steps(4) + f'<h1>Sent to {PROVIDER}</h1>' + failed_load("We couldn’t load the confirmation") + g_footer())


# ------------------------------------------------------------------ learning-bond-paused
@screen("learning-bond-paused", "page", "Learning Bond paused", route="/g/learning-bond/:token/paused", reqs=R_PAUSED, shell="guardian", na=NA_G)
def learning_bond_paused(S):
    def remind(*, chosen=""):
        return (f'<form class="card stack" action="#" method="post" novalidate>{fieldset("Remind you in 14 days?", choice("rem", "Yes, text me", small="One text in 14 days and one in 30, with the link to pick up here. None after that.", checked=chosen == "yes") + choice("rem", "No thanks", checked=chosen == "no"), fid="rem")}'
                f'{btn("Save", "primary", type_="submit", size="lg")}</form>')
    sin_help = card('<ol class="stack" style="padding-left: var(--space-5); margin: 0;"><li>Get Mateo’s birth certificate, or his permanent resident card.</li><li>Apply online or at a Service Canada Centre. It’s free and takes about 2 weeks.</li><li>Come back to this link with the number.</li></ol>'
                    + f'<div>{btn("Apply on canada.ca", "", icon_name="globe", href="https://www.canada.ca/en/employment-social-development/services/sin.html", attrs=" target=\"_blank\" rel=\"noopener\"")}</div>', title="How to get Mateo’s SIN", tid="how")
    S.add("default", "Mateo doesn’t have a SIN yet: how to apply, with the Service Canada link in the household’s language, the status Paused: needs a SIN and a reminder offer.",
          main=f'<h1>Mateo’s claim is paused</h1><p>{badge("Paused · needs a SIN", "warning")}</p>' + agent("Mateo needs a social insurance number before the Learning Bond can be paid. It’s free to get. Everything you’ve entered is saved.") + sin_help + remind() + talk_link() + g_footer(),
          notes=note("Staff see only “Paused: needs a SIN” for the Rivera household (L2-142). Reopening the link resumes at this step with every answer kept (L2-151).", "top: 4rem; right: 1rem;"))
    S.add("needs-tax-return", "No or Not sure to filing last year’s taxes: why a filed return is needed, the free tax clinic finder for Ontario, and a reminder offer.",
          main=f'<h1>Mateo’s claim is paused</h1><p>{badge("Paused · needs a tax return", "warning")}</p>' + agent("The Learning Bond is based on your family’s income, so the Government of Canada needs a filed 2025 tax return. Free clinics in Hamilton file it for you.")
               + card(f'<p>Bring your T4s and ID. Most clinics finish in one visit, and filing often brings other benefits too.</p><div>{btn("Find a free clinic", "", icon_name="map-pin", href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/community-volunteer-income-tax-program.html", attrs=" target=\"_blank\" rel=\"noopener\"")}</div>', title="File for free", tid="file")
               + remind() + talk_link() + g_footer())
    S.add("reminder-set", "A reminder chosen: one text after 14 days and one after 30, none after that.",
          main=f'<h1>Mateo’s claim is paused</h1><p>{badge("Paused · needs a SIN", "warning")}</p>' + alert("success", "We’ll text you Thu 19 Nov and Sat 5 Dec", "Each text has the link to pick up here. Reply STOP any time.") + sin_help + g_footer())
    S.add("resumed", "Reopened with the SIN in hand: the claim picks up at Mateo’s SIN with every other answer kept.",
          main='<h1>Welcome back, Carmen</h1>' + alert("info", "Picking up at Mateo’s SIN", "Your other answers are saved.", actions=btn("Continue", "primary", size="sm", icon_name="arrow-right", href=page("learning-bond-intake", "resumed"))) + g_footer())
    S.add("closed", "No activity for 180 days: closed as Not completed, the SINs destroyed; reopening starts again.",
          main=f'<h1>Mateo’s claim was closed</h1><p>{badge("Not completed")}</p>' + agent("Nothing happened for 180 days, so I deleted the numbers you gave me. You can start again any time; Mateo can claim until the day before he turns 21.")
               + f'<div>{btn("Start again", "primary", size="lg", href=page("guardian-learning-bond"))}</div>' + g_footer())
    S.add("loading", "Loading.", main=loading_page("Learning Bond paused"))
    S.add("error", "Failed to load.", main='<h1>Mateo’s claim is paused</h1>' + failed_load("We couldn’t load this page") + g_footer())


# ------------------------------------------------------------------ learning-bond-benefits-intake
@screen("learning-bond-benefits-intake", "page", "Benefits questions", route="/g/learning-bond/:token/benefits/intake", reqs=R_BINTAKE, shell="guardian", na=NA_G)
def learning_bond_benefits_intake(S):
    def form(*, err=None, busy=False, size="3", marital="Single", ccb="Yes", income="", custody=False, extra="", lang="en"):
        e = err or {}
        q = (field("size", "How many people live with you, including you and your children?", type_="number", value=size, inputmode="numeric", error=e.get("size", ""), attrs=' min="1" max="15" style="max-width: 8rem;"', required=True)
             + select("marital", "Your marital status", ["Married", "Common-law", "Separated", "Divorced", "Widowed", "Single"], selected=marital, error=e.get("marital", ""))
             + fieldset("Do you get the Canada Child Benefit now?", choice("ccb", "Yes", checked=ccb == "Yes") + choice("ccb", "No", checked=ccb == "No") + choice("ccb", "Not sure", checked=ccb == "Not sure"), fid="ccb", error=e.get("ccb", ""))
             + fieldset("Has your income changed a lot since your last tax return?", choice("inc", "Yes", checked=income == "Yes") + choice("inc", "No", checked=income == "No"), fid="inc", hint="Estimates use your last return. A big change can change them."))
        if custody:
            q += fieldset("Who claims each child?", "".join(f'<div class="field"><span class="field__label">{n}</span>' + "".join(choice(f"cl-{n.lower()}", o, checked=o == ch) for o in ["Me", "The other parent", "We share", "Not sure"]) + "</div>" for n, ch in [("Mateo", "Me"), ("Sofía", "Not sure")]), fid="cl",
                          hint="You chose Separated. Benefits go to the parent who claims the child.")
        summary = form_summary([(k, v) for k, v in e.items()]) if e else ""
        return (steps(1, BSTEPS) + '<h1>Three questions</h1>' + agent("I’ll reuse Mateo’s and Sofía’s details, your SIN and your tax answer. I need at most three more facts.")
                + f'<form class="stack" action="#" method="post" novalidate>{summary}{card(f"<div class=\"stack\">{q}</div>", title="About your household", tid="hh")}{extra}{btn("Check my benefits", "primary", type_="submit", size="lg", busy=busy, icon_name="arrow-right")}</form>' + talk_link() + g_footer())
    S.add("default", "Household size, marital status, the Canada Child Benefit now and the income-change question; nothing already answered is asked again.", main=form(income="No"), notes=AGENT_NOTE)
    S.add("es", "The questions in Spanish.", lang="Español", html_lang="es",
          main=steps(1, BSTEPS) + '<h1>Tres preguntas</h1>' + agent("Reutilizaré los datos de Mateo y Sofía, su NAS y su respuesta sobre impuestos. Necesito como mucho tres datos más.")
               + f'<form class="stack" action="#" method="post" novalidate>{card(field("size", "¿Cuántas personas viven con usted, incluidos usted y sus hijos?", type_="number", value="3", inputmode="numeric", attrs=" min=\"1\" max=\"15\" style=\"max-width: 8rem;\"") + select("marital", "Su estado civil", ["Casada", "Unión de hecho", "Separada", "Divorciada", "Viuda", "Soltera"], selected="Soltera") + fieldset("¿Recibe ahora el Beneficio Canadiense por Hijos?", choice("ccb", "Sí", checked=True) + choice("ccb", "No") + choice("ccb", "No estoy segura"), fid="ccb"), title="Sobre su hogar", tid="hh")}{btn("Comprobar mis beneficios", "primary", type_="submit", size="lg", icon_name="arrow-right")}</form>' + g_footer())
    S.add("invalid", "A household size out of range and no Canada Child Benefit answer: 422 per field.", main=form(err={"size": "Enter how many people live with you, from 1 to 15.", "ccb": "Choose one."}, size="22", ccb=""))
    S.add("income-changed", "Yes to a big income change: every estimate will carry the note.", main=form(income="Yes", extra=alert("info", "Good to know", "Your estimates will say they use your last tax return and may change.")))
    S.add("separated", "Marital status Separated: who claims each child.", main=form(marital="Separated", income="No", custody=True))
    S.add("not-sure-stops", "Not sure who claims Sofía: the check stops for her, with a way to staff.",
          main=form(marital="Separated", income="No", custody=True, extra=alert("warning", "We can’t check benefits for Sofía until it’s clear who claims them. Staff can help.", "We’ll still check for Mateo.", actions=btn(TALK, "", size="sm", data_href=dialog("learning-bond-callback")))))
    S.add("submitting", "Checking.", main=form(income="No", busy=True))
    S.add("loading", "Loading.", main=loading_page("Benefits questions"))
    S.add("error", "Failed to load.", main=steps(1, BSTEPS) + '<h1>Three questions</h1>' + failed_load("We couldn’t load this step") + g_footer())


# ------------------------------------------------------------------ learning-bond-benefits
def benefit(name, level, amount, state, text, *, action="", src="Ontario Ministry of Children, Community and Social Services · rule 2026-07"):
    kind = {"apply": "success", "doc": "warning", "no": ""}[state]
    label = {"apply": "Apply now", "doc": "Need a document", "no": "Not eligible"}[state]
    return card(f'<div class="benefit"><div class="cluster cluster--between"><span class="benefit__title">{esc(name)}</span>{badge(label, kind)}</div>'
                f'<p class="text-muted">{esc(level)} · <strong>{esc(amount)}</strong></p><p>{text}</p>{f"<div>{action}</div>" if action else ""}<p class="text-caption">{esc(src)}</p></div>')


@screen("learning-bond-benefits", "page", "Your benefits", route="/g/learning-bond/:token/benefits", reqs=R_BENEFITS, shell="guardian",
        na={"empty": "The catalogue always answers the federal entries; the state where the family gets everything is all-received."})
def learning_bond_benefits(S):
    def ocb(note_=""):
        return benefit("Ontario Child Benefit", "Provincial", "About $1,680 a year", "apply", "For Mateo and Sofía, based on your last tax return." + note_, action=btn("Apply now", "primary", icon_name="arrow-right", href=page("learning-bond-benefit-review")))
    hra = benefit("Hamilton Recreation Assistance", "Municipal", "Amount varies", "doc", "Pays for recreation programs for Mateo and Sofía. Hamilton needs proof of address.",
                  action=btn("Upload proof of address", "", icon_name="upload"), src="City of Hamilton · rule 2026-03")
    cdb = benefit("Child Disability Benefit", "Federal", "Up to $3,411 a year per child", "no", "Neither Mateo nor Sofía has an approved Disability Tax Credit certificate.", src="Canada Revenue Agency · rule 2026-07")
    have = card(ul_list([list_item("Canada Child Benefit", "Federal · you told me you receive it", end=badge("Receiving", "success"))], card=False, label="You already get these"), title="You already get these", tid="have", cls="card--flush")
    rem = f'<p class="center"><a href="{page("learning-bond-reminders")}">Your reminders</a> · <a href="{page("learning-bond-total")}">Your total</a></p>'

    def pg(items, *, lead="Here’s what Hamilton, Ontario and Canada likely owe your family. Apply to each one on its own; I never send anything for you.", alert_html=""):
        return steps(2, BSTEPS) + '<h1>Your family’s benefits</h1>' + alert_html + agent(lead) + items + rem + talk_link() + g_footer()
    S.add("default", "Each likely benefit with exactly one of Apply now, Need a document or Not eligible with a reason, and You already get these; estimates from the catalogue’s versioned rules.", main=pg(ocb() + hra + cdb + have),
          notes=note("The catalogue is the platform’s: federal and provincial entries for every province and territory, municipal ones where the organization’s city matches. Estimates are computed by its rules on the server, never by the model (L2-155). There is no Submit all (L2-156).", "top: 4rem; right: 1rem;"))
    S.add("all-received", "The family already receives every likely benefit; reminders are still set.", main=pg(have.replace('Canada Child Benefit", "Federal', 'Canada Child Benefit", "Federal') + card(empty("You’re already getting every benefit we know about.", "I’ll remind you when one needs renewing.", action=btn("See your reminders", "primary", href=page("learning-bond-reminders")), icon_name="check-circle"), cls="card--flush"), lead="Good news."))
    S.add("no-municipal", "The organization’s city matches no municipality in the catalogue: federal and provincial only.", main=pg(ocb() + cdb + have, alert_html=alert("info", "We don’t know local programs for Hamilton yet.", "Federal and Ontario benefits are listed.")))
    S.add("income-changed-note", "After Yes to a big income change, every estimate carries the note.", main=pg(ocb(" These estimates use your last tax return. A big change this year can change them.") + hra + cdb + have))
    S.add("document-uploaded", "Proof of address uploaded for Hamilton Recreation Assistance: it goes only with that application.",
          main=pg(ocb() + benefit("Hamilton Recreation Assistance", "Municipal", "Amount varies", "apply", f"Proof of address attached: hydro-bill-oct.pdf. Sent only with this application.", action=btn("Apply now", "primary", icon_name="arrow-right", href=page("learning-bond-benefit-review", "pdf-form")), src="City of Hamilton · rule 2026-03") + cdb + have))
    S.add("loading", "Loading.", main=loading_page("Your benefits"))
    S.add("error", "Failed to load.", main=steps(2, BSTEPS) + '<h1>Your family’s benefits</h1>' + failed_load("We couldn’t load your benefits") + g_footer())


# ------------------------------------------------------------------ learning-bond-benefit-review
OCB_FIELDS = [("Applicant", "Carmen Rivera"), ("Applicant’s SIN", "••• ••• 286"), ("Marital status", "Single"), ("People in the household", "3"), ("Children", "Mateo Rivera (14 Mar 2017), Sofía Rivera (2 Jun 2014)"),
              ("Address", ADDRESS), ("Phone", "905-555-0142"), ("Canada Child Benefit", "Receiving"), ("Program", "Ontario Child Benefit")]


@screen("learning-bond-benefit-review", "page", "Benefit application", route="/g/learning-bond/:token/benefits/:benefit", reqs=R_BREVIEW, shell="guardian", na=NA_G)
def learning_bond_benefit_review(S):
    def body(*, busy=False, alert_html="", lang="en"):
        es = lang == "es"
        app = card(app_review(OCB_FIELDS, lang=lang), title="Solicitud del Beneficio por Hijos de Ontario" if es else "Ontario Child Benefit application", tid="app")
        line = "Esto envía la solicitud al Beneficio por Hijos de Ontario." if es else "This sends your application to the Ontario Child Benefit. Only this one."
        return (steps(2, BSTEPS) + f'<h1>{"Revise la solicitud" if es else "Check your Ontario Child Benefit application"}</h1>' + alert_html
                + agent("Lo rellené con lo que ya tengo. Revise cada dato." if es else "I filled this in from what you’ve given. Check each field; nothing is sent until you tap Submit.")
                + f'<form class="stack" action="#" method="post" novalidate>{app}<p class="hint">{line}</p>{btn(("Enviar al" if es else "Submit to") + " Ontario Child Benefit", "primary", type_="submit", size="lg", busy=busy, icon_name="send")}</form>' + g_footer())
    S.add("default", "The pre-filled Ontario Child Benefit application with Edit per field and Submit to Ontario Child Benefit; one benefit, one submission.", main=body())
    S.add("es", "The application in Spanish.", lang="Español", html_lang="es", main=body(lang="es"))
    S.add("pdf-form", "A program whose channel is a form the guardian sends: the pre-filled PDF, how to send it, and Mark as sent as the guardian’s own act.",
          main=steps(2, BSTEPS) + '<h1>Hamilton Recreation Assistance</h1>' + agent("Hamilton takes this one on paper or by email. I filled in the form; you send it, then tell me.")
               + card(facts([("Form", "Recreation Assistance application, pre-filled · 3 pages"), ("Attach", "Proof of address: hydro-bill-oct.pdf"), ("Send to", "recassist@hamilton.example or 71 Main St W, Hamilton"), ("Reply", "Usually within 3 weeks")])
                      + f'<div class="cluster">{btn("Download the filled form (PDF)", "primary", icon_name="download")}{btn("Mark as sent", "", icon_name="check")}</div>', title="Send it yourself", tid="pdf") + g_footer())
    S.add("submitting", "Sending once.", main=body(busy=True))
    S.add("submitted", "Submitted: 202, audited, and reminders set; the benefit counts as applied for in the total.",
          main=steps(2, BSTEPS) + '<h1>Sent to the Ontario Child Benefit</h1>' + alert("success", "Sent Thu 5 Nov 2026, 4:41 pm", "About $1,680 a year, once Ontario confirms it. I’ll text you when it starts.", actions=btn("Back to your benefits", "primary", size="sm", href=page("learning-bond-benefits")) + btn("Your reminders", "ghost", size="sm", href=page("learning-bond-reminders"))) + g_footer())
    S.add("failed", "The program was unreachable: nothing was sent.", main=body(alert_html=alert("danger", "We couldn’t send it. Nothing was sent. Try again.", "The Ontario Child Benefit service didn’t answer.")))
    S.add("loading", "Loading.", main=loading_page("Benefit application"))
    S.add("error", "Failed to load.", main=steps(2, BSTEPS) + '<h1>Check your application</h1>' + failed_load("We couldn’t load the application") + g_footer())


# ------------------------------------------------------------------ learning-bond-reminders
REMINDERS = [("File your 2026 taxes", "Mon 15 Mar 2027, then every March 15", "calendar"), ("Mateo turns 18", "Thu 12 Feb 2035, 30 days before his birthday", "star"),
             ("Sofía turns 18", "Wed 3 May 2032, 30 days before her birthday", "star"), ("Ontario Child Benefit renewal", "Each July, after your tax return", "refresh")]


@screen("learning-bond-reminders", "page", "Learning Bond reminders", route="/g/learning-bond/:token/reminders", reqs=R_REMINDERS, shell="guardian", na={})
def learning_bond_reminders(S):
    def lst(items, off=()):
        rows = [list_item(t, m, lead=f'<span class="icon-tile" aria-hidden="true">{icon(i)}</span>', end=(badge("Off") if t in off else btn("Turn off", "ghost", size="sm", aria_label=f"Turn off {t}"))) for t, m, i in items]
        return card(ul_list(rows, card=False, label="Your reminders"), cls="card--flush")
    intro = '<h1>Your reminders</h1>' + agent("One text at 10 am on each date that matters, with what to do and a link. Turn any off.")
    S.add("default", "Filing taxes on March 15 each year, each child turning 6 or 18 thirty days before, and each benefit’s renewal, each with Turn off.", main=intro + lst(REMINDERS) + g_footer(),
          notes=note("Mateo and Sofía are past 6, so no “turns 6” reminder. Sent by the organization’s reminder job in the household’s language; email when there’s no mobile or the SMS cap is reached; never after STOP (L2-157).", "top: 4rem; right: 1rem;"))
    S.add("turned-off", "The renewal reminder turned off: it is never sent.", main=intro + lst(REMINDERS, off=("Ontario Child Benefit renewal",)) + g_footer(), toast_html=toast_region(toast("success", "Reminder turned off", "Ontario Child Benefit renewal", action="Undo")))
    S.add("empty", "No reminder ahead.", main=intro + card(empty("No reminders", "Reminders appear after a benefits check.", action=btn("Check benefits", "primary", href=page("learning-bond-benefits-intake")), icon_name="bell"), cls="card--flush") + g_footer())
    S.add("es", "Reminders in Spanish.", lang="Español", html_lang="es", main='<h1>Sus recordatorios</h1>' + agent("Un mensaje a las 10 de la mañana en cada fecha que importa, con qué hacer y un enlace. Puede desactivar cualquiera.")
          + card(ul_list([list_item("Presente sus impuestos de 2026", "lun 15 mar 2027, y cada 15 de marzo", lead=f'<span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>', end=btn("Desactivar", "ghost", size="sm"))], card=False, label="Sus recordatorios"), cls="card--flush") + g_footer())
    S.add("loading", "Loading.", main=loading_page("Your reminders"))
    S.add("error", "Failed to load.", main='<h1>Your reminders</h1>' + failed_load("We couldn’t load your reminders") + g_footer())


# ------------------------------------------------------------------ learning-bond-total
@screen("learning-bond-total", "page", "Learning Bond total", route="/g/learning-bond/:token/total", reqs=R_TOTAL, shell="guardian", na=NA_G)
def learning_bond_total(S):
    def pg(confirmed, applied, rows, *, lang="en"):
        es = lang == "es"
        head = card(f'<p class="stat__label">{"Desbloqueado hasta ahora" if es else "Unlocked so far"}</p><p class="stat__value">{confirmed}</p><p class="text-muted">{"Solicitado" if es else "Applied for"}: {applied}</p>')
        tbl = table("By child and stream", ["Child", "Stream", "Confirmed", "Applied for"], rows, foot=["Total", "", confirmed if confirmed != "Nothing confirmed yet" else "$0", applied.replace("up to ", "")])
        return f'<h1>{"Su total" if es else "Your total"}</h1>' + head + tbl + f'<p class="center"><a href="{page("guardian-learning-bond", "in-progress")}">{"Su página familiar" if es else "Your family page"}</a></p>' + g_footer()
    rows_done = [["Mateo", "Learning Bond", "$1,400", "—"], ["Sofía", "Learning Bond", "—", "up to $1,700"], ["Mateo and Sofía", "Ontario Child Benefit", "$1,680", "—"]]
    S.add("default", "Unlocked so far $3,080 (Mateo’s bond deposited, the Ontario Child Benefit started) and applied for up to $1,700 (Sofía), split by child and stream.", main=pg("$3,080", "up to $1,700", rows_done),
          notes=note("Confirmed counts deposits of the Learning Bond and the first year of each benefit that started; applied for counts estimates of submitted applications not yet confirmed. Staff never see this (L2-158).", "top: 4rem; right: 1rem;"))
    S.add("nothing-confirmed", "Nothing confirmed yet: what is applied for.", main=pg("Nothing confirmed yet", "up to $3,100", [["Mateo", "Learning Bond", "—", "up to $1,400"], ["Sofía", "Learning Bond", "—", "up to $1,700"]]))
    S.add("es", "The total in Spanish.", lang="Español", html_lang="es", main=pg("$3,080", "hasta $1,700", rows_done, lang="es"))
    S.add("loading", "Loading.", main=loading_page("Your total"))
    S.add("error", "Failed to load.", main='<h1>Your total</h1>' + failed_load("We couldn’t load your total") + g_footer())
