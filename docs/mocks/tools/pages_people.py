"""Manage people (prompt 76, L2-112 to L2-114): one directory of everyone with an account in the organization (staff, mentors,
volunteers and youth), searchable and filtered by role, status and program, and each person's record with their role, status,
what links them to the program and the audited history of their account. Ported from Waypoint's people, person-detail and
users-roles mocks (ADR 0043, ADR 0070). People administration is always on and admins only; a youth account follows its child
record; Mentoring and Learning add their columns and cards only while they are on.

Cast: Tom Nguyen (Admin) manages Harbourview's ten accounts. Marisol Delgado (Program director) is refused. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_mentoring import failed


def forbidden(title: str, text: str) -> str:
    return card(empty(title, text, action=btn("Back to Today", "", href=page("today")), icon_name="lock", heading="h1"), cls="card--flush")

R_PEOPLE = ["L2-112", "L2-114", "L2-007", "L2-001", "L2-005", "L2-035", "L2-036"]
R_PERSON = ["L2-113", "L2-114", "L2-007", "L2-032", "L2-001", "L2-005", "L2-035", "L2-036"]

T = STAFF["tom"]
M = STAFF["marisol"]
KW = dict(nav="", user=T)

# Harbourview's accounts by name: (person, role, programs, mentor, status, last signed in).
PEOPLE = [
    (STAFF["aisha"], "Youth worker", "—", "", "Active", "Today, 3:40 pm"),
    (STAFF["daniel"], "Mentor", "After‑School Tutoring", "", "Active", "Today, 4:05 pm"),
    (STAFF["hana"], "Mentor", "—", "", "Active", "Mon 2 Nov"),
    (STAFF["jaylen"], "Site lead", "—", "", "Active", "Today, 3:55 pm"),
    (STAFF["leo"], "Volunteer", "—", "", "Active", "Yesterday"),
    (STAFF["marisol"], "Program director", "—", "", "Active", "Today, 9:15 am"),
    (YOUTH["nadia"], "Youth", "—", "No mentor", "Active", "Tue 3 Nov"),
    (STAFF["priya"], "Volunteer coordinator", "—", "", "Active", "Wed 28 Oct"),
    (YOUTH["sofia"], "Youth", "After‑School Tutoring", "Daniel Osei", "Active", "Today, 4:10 pm"),
    (T, "Admin", "—", "", "Active", "Today, 9:02 am"),
]
TONES = {"Admin": "success", "Program director": "success", "Site lead": "info", "Mentor": "info", "Youth": "info"}
ROLES = ["All roles", "Admin", "Program director", "Site lead", "Youth worker", "Volunteer coordinator", "Mentor", "Volunteer", "Youth"]


def row(p, *, mentoring: bool = True):
    person, role, programs, mentor, status_, last = p
    you = " (you)" if person is T else ""
    name = f'<div class="cluster cluster--snug">{avatar(person)}<a href="{page("person")}">{esc(person["name"])}</a>{esc(you)}</div>'
    cells = [name, badge(role, TONES.get(role, "")), esc(programs)]
    if mentoring:
        cells.append(esc(mentor or "—"))
    cells += [badge(status_, "success" if status_ == "Active" else ""), esc(last)]
    return cells


def toolbar(q: str = "", role: str = "All roles", status_: str = "All statuses", *, mentoring: bool = True) -> str:
    roles = ROLES if mentoring else [r for r in ROLES if r != "Mentor"]
    value = f' value="{esc(q)}"' if q else ' placeholder="Name or email"'
    return (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="pp-q">Search people</label>'
            f'<input class="input" id="pp-q" type="search"{value}><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
            f'{select("pp-role", "Role", roles, selected=role)}{select("pp-status", "Status", ["All statuses", "Active", "Deactivated"], selected=status_)}'
            f'{select("pp-program", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"])}</div>')


def pager(shown: int, total: int, *, page_no: int = 1, pages: int = 1) -> str:
    first = (page_no - 1) * 25 + 1
    nums = "".join(f'<a class="btn"{" aria-current=\"page\"" if n == page_no else ""} href="#main" aria-label="Page {n}">{n}</a>' for n in range(1, pages + 1))
    return (f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption" role="status">Showing {first}–{first + shown - 1} of {total}</span>'
            f'<div class="cluster cluster--snug">{btn("Previous", "", disabled=page_no == 1)}{nums}{btn("Next", "", icon_name="arrow-right", disabled=page_no == pages)}</div></nav>')


def directory(people, *, mentoring: bool = True) -> str:
    head = ["Person", "Role", "Programs"] + (["Mentor"] if mentoring else []) + ["Status", "Last signed in"]
    hide = {2, 3, 5} if mentoring else {2, 4}
    return table("People", head, [row(p, mentoring=mentoring) for p in people], hide_sm=hide)


def hdr(sub: str = "10 people · 1 admin · 2 youth accounts") -> str:
    return page_header("People", sub, btn("Invite staff", "primary", icon_name="plus", data_href=dialog("invite-staff")))


@screen("people", "page", "People", route="/people", reqs=R_PEOPLE, na={})
def people(S):
    S.add("default", "Everyone with an account at Harbourview, staff, mentors, the volunteer and youth, by name, with role, programs, mentor, status and last sign-in; a name opens the record.", **KW,
          main=hdr() + toolbar() + directory(PEOPLE) + pager(10, 10),
          notes=note("GET /people answers only Harbourview’s accounts, 25 to a page, filtered on the server. Removed accounts are not listed; deactivated ones are, with their status.", "top: 5rem; right: 1rem;"))
    S.add("filtered", "Role set to Mentor: Daniel Osei and Hana Kim.", **KW,
          main=hdr() + toolbar(role="Mentor") + directory([p for p in PEOPLE if p[1] == "Mentor"]) + pager(2, 2))
    S.add("deactivated", "Status set to Deactivated: Leo Martins, turned off on Thu 5 Nov, still listed with his history.", **KW,
          main=hdr() + toolbar(status_="Deactivated") + directory([(STAFF["leo"], "Volunteer", "—", "", "Deactivated", "Yesterday")]) + pager(1, 1))
    S.add("mentoring-off", "Mentoring is off: no Mentor column and no Mentor role to filter by (mentor accounts stay listed so they can be managed).", **KW,
          main=hdr() + toolbar(mentoring=False) + directory(PEOPLE, mentoring=False) + pager(10, 10),
          notes=note("While Mentoring is off the API answers no mentor field and refuses role=Mentor as a filter; nothing about mentoring assignments is sent.", "top: 5rem; right: 1rem;"))
    S.add("paged", "A larger directory: 64 people, page 2 of 3; filters stay as they were.", **KW,
          main=hdr("64 people") + toolbar() + directory(PEOPLE * 2 + PEOPLE[:5]) + pager(25, 64, page_no=2, pages=3))
    S.add("no-results", "A search that matches nobody: say so, clear it or invite someone.", **KW,
          main=hdr() + toolbar(q="Petrov") + card(empty("No one matches “Petrov”", "Clear the search or filters, or invite someone new.",
                                                        action=btn("Clear search", "") + btn("Invite staff", "primary", icon_name="plus", data_href=dialog("invite-staff")), icon_name="search"), cls="card--flush"))
    S.add("empty", "A new organization: only Tom so far.", **KW,
          main=hdr("1 person") + card(empty("It’s just you so far", "Invite the people who run your programs. Youth are invited from their child’s record.",
                                             action=btn("Invite staff", "primary", icon_name="plus", data_href=dialog("invite-staff")), icon_name="users"), cls="card--flush"))
    S.add("loading", "Loading: header, filters and rows as skeletons.", **KW, main=page_header("People", "") + toolbar() + skeleton_list(8, "Loading people"))
    S.add("error", "The directory failed to load; Try again.", **KW, main=page_header("People", "") + failed("We couldn’t load people"))
    S.add("forbidden", "Marisol (Program director) opens /people: only admins manage people, and the API answered 403.", nav="", user=M,
          main=forbidden("Only admins manage people", "Ask Tom Nguyen or another admin to change a role or an account."))


# ------------------------------------------------------------------ the person record
def record_hdr(person: dict, role: str, status_: str, *, actions: str = "") -> str:
    tone = "success" if status_ == "Active" else ""
    return (breadcrumb([("People", page("people"))], person["name"])
            + page_header(f'{esc(person["name"])}', f'{badge(role, TONES.get(role, ""))} {badge(status_, tone)}', actions))


def acts(name: str, *, deactivated: bool = False, youth: bool = False, blocked: bool = False) -> str:
    role = "" if youth else btn("Change role", "", icon_name="user", data_href=dialog("change-role", "person"))
    if deactivated:
        return role + btn("Reactivate", "primary", icon_name="refresh", disabled=blocked)
    return role + btn("Deactivate", "danger", icon_name="lock", data_href=dialog("deactivate-person", "youth" if youth else "default"))


def account(email: str, role: str, status_: str, last: str, extra=()) -> str:
    return card(facts([("Email", esc(email)), ("Role", esc(role)), ("Status", esc(status_)), ("Last signed in", esc(last))] + list(extra)), title="Account", tid="account")


def history(items) -> str:
    return card(ul_list([list_item(esc(t), esc(m)) for t, m in items], card=False, label="Account history"), title="History", tid="history", cls="card--flush")


SOFIA_HISTORY = [("Linked to Sofía Rivera’s child record", "Tom Nguyen · Mon 7 Sep"), ("Joined as Youth", "Accepted Tom Nguyen’s invitation · Mon 7 Sep")]
LEO_HISTORY = [("Deactivated", "Tom Nguyen · Today, 4:20 pm"), ("Joined as Volunteer", "Accepted Priya Raman’s invitation · Tue 1 Sep")]


def youth_cards(*, learning: bool = True, mentoring: bool = True) -> str:
    out = card(facts([("Child record", f'<a href="{page("child")}">Sofía Rivera</a> · 12 · Rivera household'), ("Programs", "After‑School Tutoring")]),
               title="Youth record", tid="youth")
    if mentoring:
        out += card(facts([("Mentor", "Daniel Osei")]), title="Mentoring", tid="mentoring")
    if learning:
        out += card(progress(7, 12, "Lessons done", show="7 of 12 lessons") + facts([("Badges", "First Steps, Faithful Five")]), title="Learning", tid="learning")
    return out


def sofia(*, learning: bool = True, mentoring: bool = True) -> str:
    return (record_hdr(YOUTH["sofia"], "Youth", "Active", actions=acts("Sofía", youth=True))
            + f'<div class="split"><div class="stack">{account("sofia@harbourview.example", "Youth", "Active", "Today, 4:10 pm")}{youth_cards(learning=learning, mentoring=mentoring)}</div>'
            + f'<div class="stack">{history(SOFIA_HISTORY)}</div></div>')


def leo(*, status_: str = "Active", hist=LEO_HISTORY[1:]) -> str:
    deact = status_ == "Deactivated"
    extra = [("Deactivated", "Today, 4:20 pm by Tom Nguyen")] if deact else []
    return (record_hdr(STAFF["leo"], "Volunteer", status_, actions=acts("Leo", deactivated=deact))
            + f'<div class="split"><div class="stack">{account("leo@harbourview.example", "Volunteer", status_, "Yesterday", extra)}'
            + "</div>"
            + f'<div class="stack">{history(hist)}</div></div>')


@screen("person", "page", "Person", route="/people/:id", reqs=R_PERSON, na={"empty": "A record always has its account; sections with nothing to show are left out."})
def person(S):
    S.add("default", "Sofía Rivera’s record: her account, the child record her youth account follows, her program, her mentor, her Learning progress and the account’s history. Her role is fixed, so only Deactivate is offered.", **KW,
          main=sofia(),
          notes=note("GET /people/{id} answers only a Harbourview account. The Mentoring card and the Learning card are sent only while their module is on.", "top: 5rem; right: 1rem;"))
    S.add("staff", "Leo Martins (Volunteer): Change role and Deactivate, his account and its history.", **KW, main=leo())
    S.add("mentoring-off", "Mentoring is off: no Mentoring card (the API sends no mentor).", **KW, main=sofia(mentoring=False))
    S.add("learning-off", "Learning is off: no Learning card (the API sends no learning fields).", **KW, main=sofia(learning=False))
    S.add("deactivated", "Tom deactivated Leo: he is signed out everywhere and can’t sign in; his records stay; Reactivate turns him back on.", **KW,
          main=leo(status_="Deactivated", hist=LEO_HISTORY), toast_html=toast_region(toast("success", "Leo Martins deactivated", "Signed out and can’t sign in. Nothing was deleted.")))
    S.add("success", "Reactivated: Leo can sign in again with his old role; the history says who did it.", **KW,
          main=leo(hist=[("Reactivated", "Tom Nguyen · Today, 4:25 pm")] + LEO_HISTORY), toast_html=toast_region(toast("success", "Leo Martins reactivated", "They can sign in again.")))
    S.add("child-deleted", "Nadia’s household was deleted, so her youth account was deactivated with her child record and can’t be reactivated.", **KW,
          main=record_hdr(YOUTH["nadia"], "Youth", "Deactivated", actions=acts("Nadia", deactivated=True, youth=True, blocked=True))
          + alert("info", "The child record was deleted", "A youth account follows its child record, so Nadia’s stays off. Nothing else was removed.")
          + f'<div class="split"><div class="stack">{account("nadia@harbourview.example", "Youth", "Deactivated", "Tue 3 Nov", [("Deactivated", "Today, 2:10 pm with her child record")])}</div>'
          + f'<div class="stack">{history([("Deactivated with her child record", "Tom Nguyen deleted the Haddad household · Today, 2:10 pm"), ("Joined as Youth", "Accepted Tom Nguyen’s invitation · Tue 8 Sep")])}</div></div>')
    S.add("you", "Tom opens his own record: no Change role or Deactivate; another admin does that.", **KW,
          main=record_hdr(T, "Admin", "Active") + alert("info", "This is you", "Another admin changes your role or turns off your account.")
          + f'<div class="split"><div class="stack">{account("tom@harbourview.example", "Admin", "Active", "Today, 9:02 am")}</div><div class="stack">{history([("Joined as Admin", "Created Harbourview · Tue 1 Sep")])}</div></div>')
    S.add("loading", "Loading the record.", **KW, main=breadcrumb([("People", page("people"))], "Loading") + '<h1 class="visually-hidden">Loading this person</h1>' + skeleton_header() + skeleton_list(4, "Loading the record"))
    S.add("error", "The record failed to load (or is not in this organization); back to People or Try again.", **KW,
          main=breadcrumb([("People", page("people"))], "Person") + page_header("Person") + failed("We couldn’t load this person"))
    S.add("forbidden", "Marisol (Program director) opens a record: admins only.", nav="", user=M,
          main=forbidden("Only admins manage people", "Ask Tom Nguyen or another admin."))
