"""Guardian consent for a youth (prompt 52, ADR 0046): the guardian page reached by a verified link, and the youth's
consent-required state on Learning. Consent policy lives on Settings › Privacy (pages_admin) and the status on the
child record (pages_core)."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_guardian import g_footer

R_GUARD, R_LEARN, R_PRIVACY, R_AUDIT = "L1-013", "L1-023", "L1-015", "L1-017"
SOFIA = YOUTH["sofia"]
WORDING = ("I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, "
           "and to staff contacting them about their program.")
WORDING_ES = ("Doy mi consentimiento para que mi hijo o hija participe en lecciones, mentoría y actividades del programa de "
              "Harbourview Youth Collective, y para que el personal se comunique con él o ella sobre su programa.")
RELATIONSHIPS = ["Parent", "Legal guardian", "Grandparent", "Other caregiver"]


def record(rows: list[tuple[str, str]]) -> str:
    return facts(rows)


@screen("guardian-consent", "page", "Guardian consent", route="/g/consent/:token", reqs=[R_GUARD, R_LEARN, R_PRIVACY, R_AUDIT], shell="guardian",
        na={"empty": "A consent link always names one child."})
def guardian_consent(S):
    hdr = ('<div><h1>Consent for Sofía</h1><p class="text-muted">Hi Carmen. Sofía asked to start Learning and mentoring at '
           'Harbourview Youth Collective. Because she’s under 18, a guardian consents first.</p></div>')

    def what():
        return card(f'<div class="stack"><p>{WORDING}</p><p class="hint">You can withdraw consent at any time from this link.</p></div>',
                    title="What you’re agreeing to", tid="what")

    def about():
        return card(record([("Youth", "Sofía Rivera, 12"), ("Organization", "Harbourview Youth Collective")]),
                    title="About Sofía", tid="about")

    def sign(err=None, busy=False, name="Carmen Rivera", rel="Parent", agreed=True):
        e = err or {}
        body = (select("rel", "How you’re related to Sofía", ["Choose…"] + RELATIONSHIPS, selected=rel, error=e.get("rel", ""))
                + fieldset("Consent", choice("agree", "I consent to Sofía taking part", type_="checkbox", checked=agreed, invalid=bool(e.get("agree"))),
                           error=e.get("agree", ""), fid="agree")
                + field("sig", "Type your full name to sign", value=name, error=e.get("sig", ""), autocomplete="name", required=True,
                        help_="Typing your name is your signature. We keep the time, this device and the wording you read.")
                + btn("Give consent", "primary", type_="submit", busy=busy, size="lg"))
        return card(f'<div class="stack">{body}</div>', title="Sign", tid="sign")

    def form(err=None, busy=False, **kw):
        return f'<form class="stack" action="#" method="post" novalidate>{what()}{about()}{sign(err, busy, **kw)}</form>'

    S.add("default", "Carmen opens the link Sofía asked for, on a device that verified a code: the wording, Sofía, and one typed signature.",
          main=hdr + form(), notes=note("No account: the link names Sofía and her household; the device verified a six-digit code first (L2-026).", "top: 4rem; right: 1rem;"))
    S.add("loading", "Loading the consent.", main='<h1>Guardian consent</h1>' + '<div class="card stack" aria-busy="true" aria-label="Loading consent">' + '<span class="skeleton skeleton--text" aria-hidden="true"></span>' * 5 + "</div>")
    S.add("verify", "A new device: a code first, as for every guardian link.",
          main='<h1>Check it’s you</h1><p class="text-muted">We’ll send a six-digit code to a mobile number or email Harbourview Youth Collective has on file for your family.</p>'
          + f'<form class="card stack" action="#" method="post" novalidate>{field("contact", "Your mobile number or email", value="905-555-0142", autocomplete="tel")}{btn("Send me a code", "primary", type_="submit", size="lg")}</form>' + g_footer())
    S.add("invalid", "Sent without a relationship, without the box ticked, and with a name that is no guardian of Sofía.",
          main=hdr + form(err={"rel": "Choose how you’re related to Sofía.", "agree": "Tick the box to give consent.", "sig": "That name doesn’t match a guardian of Sofía."}, name="Carmen R", rel="Choose…", agreed=False))
    S.add("submitting", "Saving the consent.", main=hdr + form(busy=True))
    S.add("error", "Saving failed; everything typed is kept.", main=hdr + alert("danger", "We couldn’t save your consent", "Your answers are kept. Try again.") + form())
    given_rows = [("Signed by", "Carmen Rivera (Parent)"), ("When", "5 Nov 2026, 15:41"), ("Method", "Typed signature"), ("Reference", "GC-4F7A2C")]
    withdraw = btn("Withdraw consent", "ghost", data_href=dialog("withdraw-consent"))
    S.add("signed", "Signed: Sofía can start Learning; the record and how to withdraw.",
          main=card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("check-circle", "icon--lg")}</span>'
                    '<h1>Consent given. Thank you, Carmen</h1><p class="text-muted">Sofía can start Learning now.</p></div>', cls="card--success")
          + card(record(given_rows), title="Your consent record", tid="record") + f'<p class="center">{withdraw}</p>' + g_footer())
    S.add("given", "Opening the link again after consenting: the record, and withdraw.",
          main='<h1>Consent already given</h1><p class="text-muted">Sofía can use Learning.</p>' + card(record(given_rows), title="Your consent record", tid="record")
          + f'<p class="center">{withdraw}</p>' + g_footer())
    S.add("withdrawn", "After withdrawing: Sofía is gated again; a guardian can consent again from the same link.",
          main='<h1>Consent withdrawn</h1>' + alert("warning", "Sofía can’t use Learning now", "Withdrawn by Carmen Rivera on 5 Nov 2026, 15:52. Staff can see it.")
          + form(name="", agreed=False) + g_footer())
    S.add("expired", "The link is more than 30 days old, or a newer link replaced it.",
          main='<h1>This link has expired</h1>' + card(f'<div class="stack"><p>Ask Harbourview Youth Collective for a new one, or Sofía can ask again from her account.</p><div>{btn("Call 905-555-0100", "primary", icon_name="phone", href="tel:+19055550100")}</div></div>') + g_footer())
    S.add("not-found", "Roster is off for the organization: the page is not available.",
          main=empty("This page isn’t available", "Ask the organization that sent you the link.", icon_name="lock", heading="h1"))
    S.add("es", "The same consent in Spanish, as Carmen’s household language shows it; the English wording is the one signed.", lang="Español", html_lang="es",
          main='<div><h1>Consentimiento para Sofía</h1><p class="text-muted">Hola Carmen. Sofía pidió empezar Learning y la mentoría en Harbourview Youth Collective. Como tiene menos de 18 años, primero da su consentimiento un tutor.</p></div>'
          + f'<form class="stack" action="#" method="post" novalidate>'
          + card(f'<div class="stack"><p>{WORDING}</p><p class="hint">El texto en inglés es el que firma. Puede retirar su consentimiento en cualquier momento desde este enlace.</p></div>', title="Lo que acepta", tid="what")
          + card(f'<div class="stack">{select("rel", "Su relación con Sofía", ["Elija…", "Madre o padre", "Tutor legal", "Abuela o abuelo", "Otro cuidador"], selected="Madre o padre")}'
                 f'{fieldset("Consentimiento", choice("agree", "Doy mi consentimiento para que Sofía participe", type_="checkbox", checked=True))}'
                 f'{field("sig", "Escriba su nombre completo para firmar", value="Carmen Rivera", autocomplete="name", required=True)}{btn("Dar consentimiento", "primary", type_="submit", size="lg")}</div>', title="Firmar", tid="sign")
          + '</form><p class="hint center">¿Preguntas? Llame a Harbourview Youth Collective al <a href="tel:+19055550100">905-555-0100</a>.</p>')


@screen("consent-required", "page", "Consent required", route="/learning", reqs=[R_LEARN, R_GUARD], na={"empty": "The state itself is the empty Learning page for a youth without consent."})
def consent_required(S):
    hdr = page_header("Learning", "Your lessons, quizzes, assignments and badges.")
    kw = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning", "schedule"])
    text = "Because you’re under 18, a parent or guardian approves your account before you start. We’ll text them a secure link; it takes them a minute."

    def gate(action, title="A guardian needs to give consent", body=text, icon_name="shield", extra=""):
        return hdr + extra + card(empty(title, body, action=action, icon_name=icon_name), cls="card--flush")

    S.add("default", "Sofía (12) opens Learning before a guardian consented: the server refuses her lessons and the page asks her to involve a guardian.", **kw,
          main=gate(btn("Ask my guardian", "primary", icon_name="send")),
          notes=note("The server answers 403 consent-required for every protected Learning call until a guardian consents; hiding the page is not the gate.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Learning loading.", **kw, main=hdr + skeleton_list(3, "Loading your lessons"))
    S.add("busy", "Sending the request.", **kw, main=gate(btn("Ask my guardian", "primary", icon_name="send", busy=True)))
    S.add("sent", "Asked: who got the link; Learning opens once a guardian signs.", **kw,
          main=gate(btn("Check again", "", icon_name="refresh"), title="We asked your guardian",
                    body="We sent a secure link to •••-•••-0142. Learning opens as soon as they sign.", icon_name="send"))
    S.add("no-guardian", "No guardian who may sign can be reached: who to ask instead.", **kw,
          main=gate(btn("Back to Today", "", href=page("today", "youth")), title="We can’t reach a guardian",
                    body="Ask the program staff to add a guardian’s mobile number or email to your record.", icon_name="phone"))
    S.add("error", "The request failed; try again.", **kw,
          main=gate(btn("Ask my guardian", "primary", icon_name="send"), extra=alert("danger", "That didn’t go through", "Nothing was sent. Try again.")))
