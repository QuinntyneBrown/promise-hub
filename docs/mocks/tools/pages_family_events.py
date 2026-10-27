"""Family and all-ages events (prompt 82): an event has an audience (children, children with guardian, all ages) and an age band;
households register from the public page or at the door, and staff check whole households in and out, recording the adult present.
Harvest Family Night (Fri 13 Nov, all ages, 23 households) is the story; Family Swim (Sat 21 Nov, ages 4–12, children with guardian)
shows the audience that needs an adult to stay. The child roster (`check-in`) is untouched: program sessions keep it."""
from kit import *  # noqa: F401,F403
from reg import screen

R_ENROLL, R_ROLL, R_QC, R_PICKUP, R_NOTIFY, R_REPORTS, R_GUARDIAN, R_MOBILE, R_SITE = (
    "L1-005", "L1-007", "L1-008", "L1-009", "L1-010", "L1-012", "L1-013", "L1-014", "L1-025")
J = STAFF["jaylen"]
NIGHT = EVENTS[5]
SWIM = EVENTS[6]
NIGHT_SUB = "Fri 13 Nov, 5:30–7:30 pm · Gym · All ages"
DROP_IN_URL = "harbourview.promisehub.app/site/harbourview/events/harvest-family-night"

# Households at Harvest Family Night as of 6:10 pm on the night: (name, avatar colour, adult line, children, state, extra badge)
HOUSEHOLDS = [
    ("Tran", "mint", "Here with Linh Tran · since 5:41 pm", [("Kevin", 8, ""), ("Emily", 10, "")], "in", ""),
    ("Rivera", "peach", "Here with Luis Rivera (uncle) · since 5:38 pm", [("Mateo", 9, "Allergy"), ("Sofía", 12, "Asthma")], "in", ""),
    ("Kowalski", "sky", "Here with Piotr Kowalski · since 6:02 pm", [("Zofia", 5, ""), ("Jakub", 9, "")], "in", "Registered at the door"),
    ("Thompson", "sky", "Not here yet · Dana Thompson 905-555-0177", [("Jordan", 11, "")], "none", ""),
    ("Haddad", "sage", "Here with Nour Haddad · since 5:52 pm", [("Yusuf", 13, "Medication")], "in", ""),
    ("Okonkwo", "rose", "Not here yet · Chidi Okonkwo 905-555-0188", [("Amara", 7, "Diet")], "none", ""),
    ("Rahimi", "lilac", "Not here yet · Fatima Rahimi 905-555-0244", [("Sami", 7, ""), ("Yasmin", 14, "")], "none", "Registered online"),
    ("Petrov", "sun", "Left 6:05 pm with Elena Petrova", [("Nikolai", 10, "")], "out", ""),
    ("Chen", "sky", "Here with Wen Chen · since 5:45 pm", [("Lily", 8, "Allergy")], "in", ""),
    ("Adeyemi", "rose", "Not here yet · Bola Adeyemi, no mobile", [("Grace", 11, "")], "none", ""),
]


def hh(name: str, color: str) -> dict:
    return dict(name=f"{name} household", initials=name[0], color=color)


def household_row(name: str, color: str, adult: str, children: list, state: str, tag: str = "", kind: str = "page", event: str = "night") -> str:
    act = {
        "in": btn("Check out", "", size="sm", data_href=rel(kind, "dialog", "household-check-out")),
        "none": btn("Check in", "primary", size="sm", data_href=rel(kind, "dialog", "household-check-in")),
        "out": '<span class="status status--success">Left</span>',
        "queued": btn("Check out", "", size="sm", disabled=True),
        "no-adult": btn("Check out", "", size="sm", data_href=rel(kind, "dialog", "household-check-out", "confirm")),
    }[state]
    cls = {"in": "roster__item--in", "none": "", "out": "roster__item--out", "queued": "roster__item--queued", "no-adult": "roster__item--missing"}[state]
    kids = "".join(f'<a class="roster__child" href="{rel(kind, "page", "quick-card", "drop-in" if name == "Kowalski" else "default")}">{esc(n)}, {a}</a>{flag(f) if f else ""}' for n, a, f in children)
    b = badge(tag, "") if tag else ""
    return (f'<li class="roster__item {cls}">{avatar(hh(name, color))}<div class="roster__body"><div class="roster__name">{esc(name)} household{b}</div>'
            f'<div class="roster__meta">{adult}</div><div class="roster__children">{kids}</div></div><div class="roster__action">{act}</div></li>')


def household_rows(kind: str = "page", offline: bool = False) -> str:
    out = []
    for name, color, adult, kids, state, tag in HOUSEHOLDS:
        if offline and name == "Haddad":
            state, adult = "queued", "Checked in 5:52 pm with Nour Haddad · waiting to sync"
        out.append(household_row(name, color, adult, kids, state, tag, kind))
    return "".join(out)


def crumbs(current: str = "Check-in", event: dict = NIGHT, state: str = "family") -> str:
    return breadcrumb([("Events", page("events")), (event["name"], page("event", state))], current)


def night_header(kind: str = "page", sync: str = "", actions: bool = True) -> str:
    s = sync or f'<span class="sync-chip sync-chip--ok">{icon("check")}Synced 6:10 pm</span>'
    act = (btn("Register a household", "", icon_name="plus", data_href=rel(kind, "dialog", "register-drop-in"))
           + btn("End event", "", icon_name="check-circle", data_href=rel(kind, "dialog", "end-family-event"))) if actions else ""
    return page_header(esc(NIGHT["name"]), f"{NIGHT_SUB} · 23 households &nbsp;{s}", act)


def night_summary(here: int = 12, not_yet: int = 9, left: int = 2, children: int = 17, adults: int = 13) -> str:
    return (f'<div class="roster-summary" role="group" aria-label="Event totals">{stat("Here", str(here), "households")}{stat("Not yet", str(not_yet), "households")}'
            f'{stat("Left", str(left), "households")}{stat("Children here", str(children), f"with {adults} adults")}</div>')


def night_filters(current: str = "all", q: str = "") -> str:
    v = f' value="{esc(q)}"' if q else ""
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="hh-q">Find a household</label>'
            f'<input class="input" id="hh-q" type="search" placeholder="Find a household"{v}><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            + chips([("All 23", current == "all"), ("Not yet 9", current == "not-yet"), ("Here 12", current == "here"), ("Left 2", current == "left")], "Filter households") + "</div>")


def roster(rows: str, label: str = "Households at Harvest Family Night") -> str:
    return f'<div class="card card--flush"><ul class="roster" aria-label="{esc(label)}">{rows}</ul></div>'


# ------------------------------------------------------------------ Household check-in (the night of a family event)
@screen("event-check-in", "page", "Household check-in", route="/events/:id/check-in", reqs=[R_ROLL, R_PICKUP, R_ENROLL, R_MOBILE], na={})
def event_check_in(S):
    body = crumbs() + night_header() + night_summary() + night_filters() + roster(household_rows()) + f'<div class="list-more">{btn("Show 13 more", "ghost")}</div>'
    S.add("default", "Harvest Family Night at 6:10 pm: 12 households here with the adult who came, 9 not yet, 2 left; one tap checks a whole household in or out.", nav="check-in", user=J,
          main=body, toast_html=toast_region(toast("success", "Tran household checked in", "Linh Tran · Kevin and Emily · 5:41 pm", action="Undo")),
          notes=note("A household is the row: the adult present is recorded with the check-in, the children come along. Tap a child’s name for the Quick Card. A household registered at the door is flagged so the office completes its record.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Households loading: skeleton totals and rows the height of the real ones.", nav="check-in", user=J,
          main=crumbs() + page_header(esc(NIGHT["name"]), NIGHT_SUB) + skeleton_kpis(4) + skeleton_list(8, "Loading households"))
    S.add("empty", "Nobody registered yet, a week before the night: share the drop-in link or register a household at the door.", nav="check-in", user=J,
          main=crumbs() + page_header(esc(NIGHT["name"]), f"{NIGHT_SUB} · 0 households") +
          card(empty("No households registered yet", "Families register from the public page, or you register them at the door.",
                     action=btn("Share the drop-in link", "primary", icon_name="link", data_href=dialog("drop-in-link")) + btn("Register a household", "", icon_name="plus", data_href=dialog("register-drop-in")), icon_name="users"), cls="card--flush"))
    S.add("error", "Households failed to load and nothing is cached: retry or go back to the event.", nav="check-in", user=J,
          main=crumbs() + page_header(esc(NIGHT["name"]), NIGHT_SUB) +
          card(empty("Couldn’t load the households", "Try again.", action=btn("Try again", "primary", icon_name="refresh") + btn("Back to the event", "ghost", href=page("event", "family")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "A family at the door who never registered: the search finds nothing and offers to register them now.", nav="check-in", user=J,
          main=crumbs() + night_header() + night_summary() + night_filters(q="Kowalski") +
          card(empty("No “Kowalski” registered", "Register them at the door; they are checked in at once.",
                     action=btn("Clear search", "") + btn("Register a household", "primary", icon_name="plus", data_href=dialog("register-drop-in")), icon_name="search"), cls="card--flush"))
    S.add("with-guardian", "Family Swim, children with guardian: an adult stays for the whole event, and a household whose adult stepped out is flagged until someone is with the children.", nav="check-in", user=J,
          main=crumbs(event=SWIM) + page_header(esc(SWIM["name"]), f'Sat 21 Nov, 1:00–3:00 pm · Ages 4–12 · {badge("With guardian", "warning")} · 14 households &nbsp;<span class="sync-chip sync-chip--ok">{icon("check")}Synced 1:42 pm</span>',
                                                btn("Register a household", "", icon_name="plus", data_href=dialog("register-drop-in")) + btn("End event", "", icon_name="check-circle", data_href=dialog("end-family-event"))) +
          alert("info", "An adult stays for the whole event", "Children with guardian: each household is checked in with the adult who came, and checked out with an adult.") +
          f'<div class="roster-summary" role="group" aria-label="Event totals">{stat("Here", "11", "households")}{stat("Not yet", "3", "households")}{stat("Left", "0", "households")}{stat("Children here", "15", "with 12 adults")}</div>' +
          night_filters().replace("All 23", "All 14").replace("Not yet 9", "Not yet 3").replace("Here 12", "Here 11").replace("Left 2", "Left 0") +
          roster(household_row("Rivera", "peach", f'{status("No adult with them", "warning")} Luis Rivera stepped out 1:40 pm · Mateo and Sofía are in the pool', [("Mateo", 9, "Allergy"), ("Sofía", 12, "Asthma")], "no-adult")
                 + household_row("Tran", "mint", "Here with Linh Tran · since 1:05 pm", [("Kevin", 8, ""), ("Emily", 10, "")], "in")
                 + household_row("Haddad", "sage", "Here with Nour Haddad · since 1:12 pm", [("Yusuf", 13, "Medication")], "in")
                 + household_row("Okonkwo", "rose", "Not here yet · Chidi Okonkwo 905-555-0188", [("Amara", 7, "Diet")], "none")
                 + household_row("Chen", "sky", "Here with Wen Chen · since 1:03 pm", [("Lily", 8, "Allergy")], "in"), "Households at Family Swim") +
          f'<div class="list-more">{btn("Show 9 more", "ghost")}</div>',
          notes=note("Checking a household out without the adult who came opens the check-out dialog on its confirm step: another approved adult, or a phone okay from the guardian.", "top: 5rem; right: 1rem;"))
    S.add("offline", "Offline on the phone in the gym: the household list is cached, one check-in is queued, Quick Cards still open.", nav="check-in", user=J,
          main=alert("warning", "You’re offline", "Households saved 5:58 pm. 1 check-in queued.", banner=True) +
          crumbs() + night_header(sync=f'<span class="sync-chip">{icon("wifi-off")}1 queued</span>') + night_summary() + night_filters() + roster(household_rows(offline=True)),
          notes=note("Check-in keeps working from the saved list; each tap is queued and sent in order when the connection returns. Check-out waits while a household’s check-in is unsent.", "top: 9rem; right: 1rem;"))
    S.add("long", "A winter fair with 140 households: search first, the list pages, nothing breaks.", nav="check-in", user=J,
          main=breadcrumb([("Events", page("events")), ("Winter Family Fair", page("event", "family"))], "Check-in") +
          page_header("Winter Family Fair", f'Sat 12 Dec, 2:00–5:00 pm · Gym and Room 2 · All ages · 140 households &nbsp;<span class="sync-chip sync-chip--ok">{icon("check")}Synced 3:20 pm</span>',
                      btn("Register a household", "", icon_name="plus", data_href=dialog("register-drop-in")) + btn("End event", "", icon_name="check-circle", data_href=dialog("end-family-event"))) +
          night_summary(96, 38, 6, 151, 112) + night_filters().replace("All 23", "All 140").replace("Not yet 9", "Not yet 38").replace("Here 12", "Here 96").replace("Left 2", "Left 6") +
          roster(household_rows() + household_row("Fitzgerald-Vanderbroucke", "sun", f"Here with {LONG_GUARDIAN} · since 2:04 pm", [("Alexander-Christopher", 9, "Allergy"), ("Beatrix", 7, ""), ("Cornelius", 5, ""), ("Dorothea", 3, ""), ("Eleanor", 1, "")], "in"), "Households A to F") +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–25 of 140</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')
    S.add("complete", "The event ended at 7:34 pm: every household is checked out, the totals are recorded and the report is one tap away.", nav="check-in", user=J,
          main=crumbs() + page_header(esc(NIGHT["name"]), "Fri 13 Nov, 5:30–7:30 pm · ended 7:34 pm") +
          card(f'<div class="stack">{icon("check-circle", "icon--lg")}<h2 class="empty__title">Harvest Family Night recorded</h2><p class="text-muted measure">21 of 23 households came: 29 children with 25 adults. 2 households registered at the door; the office completes their records.</p>'
               f'<div class="cluster">{btn("Back to Today", "primary", href=page("today"))}{btn("View the report", "", icon_name="chart", href=page("reports", "family"))}{btn("Report an incident", "ghost", icon_name="flag", href=page("new-incident"))}</div></div>', cls="card--success"),
          toast_html=toast_region(toast("success", "Event ended", "21 households · 29 children · 25 adults · attendance saved")))


# ------------------------------------------------------------------ Drop-in registration from the public page (no account)
R_DROP = [R_ENROLL, R_GUARDIAN, R_SITE, R_NOTIFY]
LANGS = ["English", "Español", "Français", "Polski", "دری (Dari)", "العربية (Arabic)", "Other"]


def g_footer() -> str:
    return f'<p class="hint center">Questions? Text or call <a href="tel:+19055550100">905-555-0100</a>. <a href="{page("guardian-home")}">Privacy</a></p>'


def drop_in_hdr(sub: str = f"{ORG} · Fri 13 Nov, 5:30–7:30 pm") -> str:
    return f'<h1>{esc(NIGHT["name"])}</h1><p class="text-muted">{sub}</p>'


def event_card() -> str:
    return card(facts([("When", "Friday 13 November 2026, 5:30–7:30 pm · doors open 5:15"), ("Where", "Harbourview Community Centre gym, 47 Simcoe St E, Hamilton"),
                       ("Who", "All ages. Children come with an adult who stays."), ("Bring", "Nothing. Dinner is provided and nut-free."), ("Cost", "Free")]), title="The evening", tid="ev")


AGE_ATTRS = ' min="0" max="18"'


def child_row(i: int, name: str, age: str, *, name_err: str = "", age_err: str = "") -> str:
    return (f'<div class="two-col">{field(f"child-{i}", f"Child {i} name", value=name, error=name_err, autocomplete="off")}'
            f'{field(f"age-{i}", "Age", type_="number", value=age, inputmode="numeric", error=age_err, attrs=AGE_ATTRS)}</div>')


def drop_in_form(*, err=None, busy: bool = False, name: str = "Fatima Rahimi", mobile: str = "905-555-0244", lang: str = "English",
                 children=(("Sami", "7"), ("Yasmin", "14")), medical: str = "", consent: bool = True) -> str:
    e = err or {}
    summary = form_summary([(k, m) for k, m in e.items()]) if e else ""
    kids = "".join(child_row(i + 1, n, a, name_err=e.get(f"child-{i + 1}", ""), age_err=e.get(f"age-{i + 1}", "")) for i, (n, a) in enumerate(children))
    who = card(f'<div class="stack">{field("adult", "Your name", value=name, required=True, autocomplete="name", error=e.get("adult", ""))}'
               f'{field("mobile", "Mobile number", type_="tel", value=mobile, required=True, inputmode="tel", autocomplete="tel", error=e.get("mobile", ""), help_="We text you a link to show at the door. No account needed.")}'
               f'{select("lang", "Language for texts", LANGS, selected=lang)}</div>', title="You", tid="you", tag="div")
    kids_card = card(f'<div class="stack">{kids}{btn("Add another child", "ghost", icon_name="plus")}'
                     f'{textarea("medical", "Allergies or medical we should know", value=medical, rows=2, optional=True, placeholder="None that we know of")}</div>', title="Children coming with you", tid="kids", tag="div")
    c_err = e.get("consent", "")
    agree = (switch("consent", "I agree to first aid and an emergency call if needed, and to Harbourview’s privacy notice.", checked=consent,
                    attrs=' id="consent" role="switch"' + (' aria-invalid="true" aria-describedby="consent-error"' if c_err else ""))
             + (f'<div class="field__error" id="consent-error">{esc(c_err)}</div>' if c_err else "")
             + btn("Register", "primary", type_="submit", busy=busy, size="lg"))
    return f'<form class="stack" action="#" method="post" novalidate>{summary}{who}{kids_card}{card(agree, tag="div")}</form>'


@screen("drop-in", "page", "Drop-in registration", route="/site/harbourview/events/harvest-family-night/register", reqs=R_DROP, shell="guardian",
        na={"empty": "A registration form has no collection to be empty of."})
def drop_in(S):
    S.add("default", "Fatima registers her household for Harvest Family Night from the public page: her name and mobile, the children with their ages, and one consent.",
          main=drop_in_hdr() + event_card() + drop_in_form() + g_footer(),
          notes=note("Anonymous, from the organization’s public page while Public website is on. The household joins Roster flagged “Registered at an event”; the office completes it later. The link in her text opens her household page.", "top: 4rem; right: 1rem;"))
    S.add("invalid", "Submitted with no mobile, a child with no age and the consent off: a summary at the top, errors beside each field.",
          main=drop_in_hdr() + event_card() + drop_in_form(err={"mobile": "Enter a mobile number we can text.", "age-2": "Enter Yasmin’s age.", "consent": "Agree so we can give first aid if needed."},
                                                           mobile="", children=(("Sami", "7"), ("Yasmin", "")), consent=False) + g_footer())
    S.add("submitting", "Registering: the button is busy and cannot be pressed twice.", main=drop_in_hdr() + event_card() + drop_in_form(busy=True) + g_footer())
    S.add("success", "Registered: what to show at the door and the link to keep.",
          main=card(f'<div class="stack center" style="align-items: center;"><span class="empty__icon" aria-hidden="true">{icon("check-circle", "icon--lg")}</span><h1>See you Friday, Fatima</h1>'
                    f'<p class="text-muted">Sami and Yasmin are registered for Harvest Family Night, Fri 13 Nov at 5:30 pm. We texted 905-555-0244.</p>{qr("Your door code for Harvest Family Night", "sm")}'
                    f'<p><strong>Show this at the door</strong>, or give your name.</p><p><a href="{page("guardian-update")}">harbourview.promisehub.app/g/rahimi</a></p>'
                    f'{btn("Add to calendar", "", icon_name="calendar")}</div>', cls="card--success") + g_footer(),
          toast_html=toast_region(toast("success", "You’re registered", "A text with your link is on its way.")))
    S.add("loading", "The event loading before the form shows.", main=f'<h1>{esc(NIGHT["name"])}</h1>' + skeleton_list(3, "Loading the event"))
    S.add("error", "The event failed to load.", main=drop_in_hdr() + card(empty("We couldn’t load this event", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush") + g_footer())
    S.add("closed", "Registration closed: the gym is full, or the event has passed.",
          main=drop_in_hdr() + alert("warning", "Registration is closed", "The gym is full at 60 households. Come anyway and ask at the door, or call 905-555-0100.", actions=f'<a class="btn btn--primary btn--sm" href="tel:+19055550100">{icon("phone")}Call 905-555-0100</a>') + event_card() + g_footer())
    S.add("not-found", "An unknown event, or Public website is off: the same not-found page as the rest of the site.",
          main='<h1>Page not found</h1>' + card(empty("This page isn’t here", "Check the address, or ask the organization for its link.", icon_name="globe"), cls="card--flush") + g_footer())
