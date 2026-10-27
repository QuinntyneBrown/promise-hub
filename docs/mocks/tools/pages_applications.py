"""Review and place applicants (prompt 59, L2-072): the organization's application pipeline and one application with who applied,
the referrer, the reason, the family and staff notes. Ported from Waypoint's admin applications mock. Placing accepts the young person
into a cohort (a program, ADR 0043) and can offer a youth invitation; waitlisting and declining text the family (L2-013)."""
from kit import *  # noqa: F401,F403
from reg import screen

R_ENROLL = "L1-005"
T = STAFF["tom"]
KW = dict(nav="applications", user=T)
ZOE = dict(name="Zoe Campbell", initials="ZC", color="lilac")
MALIK = dict(name="Malik Johnson", initials="MJ", color="sky")
NIKOLAI = CHILD["nikolai"]

TABS = [("WaitingReview", "Waiting review", 3), ("Waitlisted", "Waitlisted", 3), ("Accepted", "Accepted", 18), ("Declined", "Declined", 2)]


def tabs(current: str = "WaitingReview") -> str:
    out = []
    for value, label, count in TABS:
        on = value == current
        kind = ' badge--info' if value == "WaitingReview" else ""
        out.append(f'<button class="tab" role="tab" type="button" id="t-{value}" aria-controls="p-apps" aria-selected="{"true" if on else "false"}"{"" if on else " tabindex=\"-1\""}>{label} <span class="badge{kind}">{count}</span></button>')
    return f'<div class="tabs" role="tablist" aria-label="Application status">{"".join(out)}</div>'


def header(sub: str = "3 waiting review · 3 waitlisted · every program") -> str:
    return page_header("Applications", sub)


def row(person: dict, name: str, meta: str, end: str = "") -> str:
    return list_item(name, meta, person=person, href=page("application"), end=end)


WAITING = [
    row(ZOE, "Zoe Campbell", "13 · referred by Rachel Ellis, Guidance counsellor · After‑School Tutoring · applied Today", badge("Referral", "info")),
    row(MALIK, "Malik Johnson", "14 · applied for themselves · After‑School Tutoring · applied Wed 4 Nov", badge("Consent needed", "warning")),
    row(NIKOLAI, "Nikolai Petrov", "10 · Elena Petrova · After‑School Tutoring · applied Mon 2 Nov · returning"),
]
WAITLISTED = [
    row(CHILD["sofia"], "#1 · Sofía Rivera", "Carmen Rivera · After‑School Tutoring · applied Mon 2 Nov"),
    row(dict(initials="LP", color="sky"), "#2 · Leo Park", "Min-ji Park · After‑School Tutoring · applied Tue 3 Nov"),
    row(dict(initials="AS", color="mint"), "#3 · Ava Singh", "Raj Singh · After‑School Tutoring · applied Wed 4 Nov"),
]
ACCEPTED = [
    row(CHILD["omar"], "Omar Siddiqui", "12 · Farah Siddiqui · placed in Saturday Sports by Tom Nguyen · Tue 3 Nov"),
    row(CHILD["kevin"], "Kevin Tran", "8 · Linh Tran · placed in After‑School Tutoring by Tom Nguyen · Mon 2 Nov"),
]
DECLINED = [
    row(CHILD["grace"], "Grace Adeyemi", "11 · Bola Adeyemi · declined by Marisol Delgado · Sun 1 Nov · “Winter Camp is for ages 6 to 10.”"),
]


def panel(items: list[str], label: str) -> str:
    return f'<div id="p-apps" role="tabpanel" aria-labelledby="t-{label}" tabindex="0">{ul_list(items, label="Applications")}</div>'


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


# ---------------------------------------------------------------- applications
@screen("applications", "page", "Applications", route="/applications", reqs=["L2-072", "L2-013", R_ENROLL])
def applications(S):
    S.add("default", "Tom opens Applications: everything waiting review across programs, newest first, with who applied; a referral and a young person’s own application are marked.", **KW,
          main=header() + tabs() + panel(WAITING, "WaitingReview"),
          notes=note("The tabs filter on the server (GET /applications?status=). Only admins and program directors open this page; it lives in More while Roster is on.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Applications loading: skeleton rows under the same header and tabs.", **KW, main=header("") + tabs() + skeleton_list(4, "Loading applications"))
    S.add("empty", "Nothing waiting review: one calm line and the way to bring applications in.", **KW,
          main=header("Nothing waiting review · 3 waitlisted · every program") + tabs().replace('badge--info">3', 'badge--info">0')
          + card(empty("You’re all caught up", "New applications, referrals and enrollments appear here for review. Open enrollment on a program to share its link.",
                       action=btn("Programs", "primary", href=page("programs")), icon_name="inbox"), cls="card--flush"))
    S.add("error", "The pipeline failed to load; the shell and the header stay.", **KW, main=header("") + failed("Couldn’t load applications"))
    S.add("waitlisted", "The Waitlisted filter: each program’s waitlist in order.", **KW, main=header() + tabs("Waitlisted") + panel(WAITLISTED, "Waitlisted"))
    S.add("accepted", "The Accepted filter: who placed each young person and where.", **KW, main=header() + tabs("Accepted") + panel(ACCEPTED, "Accepted"))
    S.add("declined", "The Declined filter, with the reason the family read.", **KW, main=header() + tabs("Declined") + panel(DECLINED, "Declined"))
    S.add("forbidden", "Jaylen (site lead) opens /applications: only admins and program directors review applications; the server answers 403.", nav="applications",
          main=page_header("Applications") + card(empty("Only admins and program directors review applications", "Ask Tom Nguyen or Marisol Delgado.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


# ---------------------------------------------------------------- application
NOTES = [
    ("Tom Nguyen", "Today, 3:40 pm", "Called Tanya: she knows about the referral and is happy for Zoe to start. Wants Tuesdays and Thursdays."),
    ("Marisol Delgado", "Today, 2:15 pm", "Rachel says Zoe would do well with a mentor. Tutoring has two places."),
]


def notes_card(rows=NOTES, *, failed_: bool = False) -> str:
    action = btn("Add note", "", icon_name="plus", size="sm", data_href=dialog("add-application-note"))
    if failed_:
        return card(alert("danger", "Couldn’t load notes", "Try again."), title="Notes", tid="notes")
    if not rows:
        body = empty("No notes yet", "Notes are for staff only; the family never sees them.", action=action, icon_name="edit")
        return card(body, title="Notes", tid="notes", cls="card--flush")
    items = "".join(f'<li>{avatar(dict(initials="".join(w[0] for w in who.split()), color="peach"))}<div class="feed__body"><strong>{esc(who)}</strong> {esc(text)}<div class="feed__meta">{esc(when)}</div></div></li>' for who, when, text in rows)
    return card(f'<ul class="feed" aria-label="Staff notes">{items}</ul>', title="Notes", tid="notes", footer=action)


def decide_actions(first: str = "Zoe") -> str:
    return (btn("Place", "primary", icon_name="check", data_href=dialog("place-applicant"), aria_label=f"Place {first}")
            + btn("Waitlist", "", data_href=dialog("decide-application"))
            + btn("Decline", "ghost", data_href=dialog("decide-application", "decline")))


def crumbs(name: str) -> str:
    return breadcrumb([("Applications", page("applications"))], name)


def zoe(*, status_html: str = "Waiting review", actions: str | None = None, outcome: str = "", notes_html: str | None = None, sub: str = "13 · applied Today for After‑School Tutoring") -> str:
    young = card(facts([("Name", "Zoe Campbell"), ("Date of birth", "14 Mar 2013 (13)"), ("Applied for", "After‑School Tutoring"), ("Applied", "Thu 5 Nov, 1:02 pm"),
                        ("Status", status_html), ("Season consent", "Not given yet: collect it from Tanya")]), title="Young person", tid="young")
    referrer = card(facts([("Referred by", "Rachel Ellis"), ("Role", "Guidance counsellor"), ("Organization", "Bennetto Elementary"), ("Verified contact", "rachel.ellis@bennetto.example.ca"),
                           ("Why", "Zoe is curious and kind, and needs somewhere to belong after school.")]), title="Referral", tid="referral")
    family = card(facts([("Parent or guardian", "Tanya Campbell"), ("Mobile", "905-555-0320"), ("Messages in", "English"), ("Household", "Campbell · new household")]), title="Family", tid="family", footer=btn("Open household", "", size="sm", href=page("household")))
    return (crumbs("Zoe Campbell") + page_header("Zoe Campbell", sub, decide_actions() if actions is None else actions) + outcome
            + f'<div class="split"><div class="stack">{young}{referrer}</div><div class="stack">{family}{notes_card() if notes_html is None else notes_html}</div></div>')


@screen("application", "page", "Application", route="/applications/:id", reqs=["L2-072", "L2-013", R_ENROLL])
def application(S):
    S.add("default", "Zoe Campbell’s referral: the young person, Rachel’s referral and reason, Tanya’s contact and staff notes, with Place, Waitlist and Decline.", **KW, main=zoe(),
          notes=note("Place opens place-applicant to choose a cohort; Waitlist and Decline open decide-application, which texts Tanya. Notes are staff-only and audited.", "top: 5rem; right: 1rem;"))
    young = card(facts([("Name", "Malik Johnson"), ("Date of birth", "2 Jun 2012 (14)"), ("Applied for", "After‑School Tutoring"), ("Applied", "Wed 4 Nov, 7:48 pm"),
                        ("Status", "Waiting review"), ("Season consent", "Not given yet: Malik is under 18, so Denise consents")]), title="Young person", tid="young")
    why = card(facts([("Applied by", "Malik, for himself"), ("Why", "I want to learn to code and help with the younger kids.")]), title="Application", tid="app")
    family = card(facts([("Parent or guardian", "Denise Johnson"), ("Mobile", "905-555-0310"), ("Messages in", "English"), ("Household", "Johnson · new household")]), title="Family", tid="family", footer=btn("Open household", "", size="sm", href=page("household")))
    S.add("youth", "Malik Johnson applied for themselves: his reason, his verified phone, and the reminder that Denise must consent.", **KW,
          main=crumbs("Malik Johnson") + page_header("Malik Johnson", "14 · applied Wed 4 Nov for After‑School Tutoring", decide_actions("Malik"))
          + f'<div class="split"><div class="stack">{young}{why}</div><div class="stack">{family}{notes_card([])}</div></div>')
    S.add("loading", "The application loading: skeletons in the same two columns.", **KW,
          main=crumbs("Application") + page_header("Application") + f'<div class="split"><div class="stack">{skeleton_list(4, "Loading the application")}</div><div class="stack">{skeleton_list(3, "Loading notes")}</div></div>')
    S.add("empty", "No notes yet on Zoe’s referral: the Notes card explains who sees notes and offers Add note.", **KW, main=zoe(notes_html=notes_card([])))
    S.add("error", "The application failed to load; the breadcrumb stays.", **KW, main=crumbs("Application") + page_header("Application") + failed("Couldn’t load the application"))
    S.add("not-found", "Another organization’s application, or one that doesn’t exist: the server answers 404 and nothing of it shows.", **KW,
          main=crumbs("Application") + card(empty("We can’t find that application", "It may belong to another organization.", action=btn("Applications", "primary", href=page("applications")), icon_name="search", heading="h1"), cls="card--flush"))
    placed = alert("success", "Placed in After‑School Tutoring", "Tom Nguyen placed Zoe today at 3:52 pm. Tanya Campbell was texted. A youth invitation went to zoe.campbell@example.ca.",
                   actions=btn("Open Zoe’s record", "", size="sm", href=page("child")))
    S.add("placed", "After placing: the outcome on top, read only, no decision buttons; the notes stay.", **KW,
          main=zoe(status_html="Accepted", actions="", outcome=placed))
    declined = alert("info", "Declined", "Marisol Delgado declined on Thu 5 Nov. Tanya Campbell read: “Tutoring is full this term; we’ll call you in January.”")
    S.add("declined", "A declined referral: the reason the family read, read only.", **KW, main=zoe(status_html="Declined", actions="", outcome=declined))
    S.add("forbidden", "Aisha (youth worker) opens an application link: only admins and program directors review applications.", nav="applications", user=STAFF["aisha"],
          main=crumbs("Application") + card(empty("Only admins and program directors review applications", "Ask Tom Nguyen or Marisol Delgado.", action=btn("Back to Today", "", href=page("today")), icon_name="lock", heading="h1"), cls="card--flush"))
