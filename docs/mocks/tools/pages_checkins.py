"""Record mentor check-ins (prompt 67, L2-090): a mentor logs a conversation with one of his youth (how it went, what they talked about,
action items, private notes, a follow-up date) and reads his history. Ported from Waypoint's mentor check-in and check-in history mocks.
Copy always says "mentor check-in" so it is never confused with Roll Call check-in. Only the mentor who wrote a check-in reads it; private
notes stay his even when the check-in is shared. The dialog itself (mentor-check-in) is in dialogs.py."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_mentoring import KW, DANIEL, HANA, failed, forbidden, R_MENTOR

R_CHECKIN = ["L2-090", "L2-065", "L2-007", "L2-032", R_MENTOR, "L2-035", "L2-036"]
KINDS = ["1:1", "Call", "Session"]
HOW = [("Struggling", "Having a hard time"), ("Low", "Quiet or distracted"), ("Steady", "Doing okay"), ("Engaged", "Into it"), ("Thriving", "Flying")]

# Daniel's mentor check-ins, newest first (today is Thu 5 Nov 2026).
CHECKINS = [
    dict(cid="mateo", date="Thu 5 Nov", kind="1:1", how="Engaged", shared=True, informed=True,
         topics="Fractions homework and the spelling bee on Friday. He wants to read his word list to Carmen tonight.",
         actions="Practise ten spelling words each night.", follow="Thu 12 Nov",
         private="Carmen mentioned money is tight this month; check whether the program fee waiver applies."),
    dict(cid="yusuf", date="Wed 4 Nov", kind="Call", how="Low", shared=False, informed=False,
         topics="Missed Tutoring night: football practice moved to Wednesdays. Open to coming on Tuesdays instead.",
         actions="Ask Jaylen about a Tuesday spot.", follow="Tue 10 Nov"),
    dict(cid="sofia", date="Mon 2 Nov", kind="Session", how="Thriving", shared=True, informed=False,
         topics="Led the group reflection on Pick Up the Towel. Ready to help a newer youth find their feet.",
         actions="", follow=""),
    dict(cid="jordan", date="Thu 29 Oct", kind="1:1", how="Steady", shared=False, informed=False,
         topics="Science fair project: a water filter from a plastic bottle. Needs a cardboard tube and sand.",
         actions="Bring sand and a tube next week.", follow="Tue 3 Nov"),
]
FOLLOW_UPS = [("jordan", "Tue 3 Nov", True), ("yusuf", "Tue 10 Nov", False), ("mateo", "Thu 12 Nov", False)]


def checkin_item(c: dict, *, show_youth: bool = True) -> str:
    child = CHILD[c["cid"]]
    title = child["name"] if show_youth else f'{c["kind"]} · {c["date"]}'
    meta = " · ".join(x for x in [f'{c["kind"]} · {c["date"]}' if show_youth else "", f'Went {c["how"].lower()}'] if x)
    caption = " · ".join(x for x in [f'Action items: {c["actions"]}' if c["actions"] else "", f'Follow-up {c["follow"]}' if c["follow"] else "",
                                     "Guardian informed" if c["informed"] else "", f'Private notes: {c["private"]}' if c.get("private") else ""] if x)
    end = badge("Shared", "success") if c["shared"] else badge("Private")
    body = (f'<div class="list__body"><div class="list__title">{esc(title)}</div><div class="list__meta">{esc(meta)}</div>'
            f'<p class="list__text">{esc(c["topics"])}</p>' + (f'<span class="list__meta">{esc(caption)}</span>' if caption else "") + "</div>")
    lead = avatar(child) if show_youth else ""
    return f'<li class="list__item">{lead}{body}{end}</li>'


def checkin_list(rows, *, show_youth: bool = True, label: str = "Mentor check-ins, newest first") -> str:
    return ul_list([checkin_item(c, show_youth=show_youth) for c in rows], card=False, label=label)


def followups_card(rows=FOLLOW_UPS) -> str:
    if not rows:
        return card(empty("No follow-ups planned", "When you set a follow-up date on a mentor check-in, it shows here.", icon_name="calendar", heading="h3"),
                    title="Follow-ups", tid="follow-ups", cls="card--flush")
    items = [list_item(CHILD[cid]["name"], ("Overdue · " if late else "") + when, person=CHILD[cid], href=page("mentor-youth-detail"),
                       end=badge("Overdue", "warning") if late else "") for cid, when, late in rows]
    return card(ul_list(items, card=False, label="Follow-ups, soonest first"), title="Follow-ups", tid="follow-ups", cls="card--flush")


CHECKINS_DUE = [("emily", "No mentor check-in yet"), ("kevin", "No mentor check-in yet")]


def checkins_due_card(rows=CHECKINS_DUE, days: int = 14) -> str:
    """Youth whose mentor hasn't logged a mentor check-in within the organization's cadence (L2-125), never-checked-in first, then the oldest."""
    if not rows:
        return card(empty("No check-ins due", f"You’ve logged a mentor check-in with each of your youth in the last {days} days.", icon_name="check-circle", heading="h3"),
                    title="Check-ins due", tid="check-ins-due", cls="card--flush")
    items = [list_item(CHILD[cid]["name"], when, person=CHILD[cid], href=page("mentor-youth-detail"), end=badge("Due", "warning")) for cid, when in rows]
    return card(ul_list(items, card=False, label=f"Youth without a mentor check-in in {days} days"), title="Check-ins due", tid="check-ins-due", cls="card--flush",
                footer=f"Your organization asks for a mentor check-in every {days} days.")


def record_card(rows, first: str = "Mateo") -> str:
    footer = btn("All mentor check-ins", "ghost", href=page("mentor-check-in-history"))
    if not rows:
        return card(empty("No mentor check-ins yet", f"Log how your conversations with {first} go. Only you can read them.", icon_name="message", heading="h3",
                          action=btn("Log a mentor check-in", "", icon_name="plus", data_href=dialog("mentor-check-in", "from-record"))),
                    title="Mentor check-ins", tid="check-ins", cls="card--flush")
    return card(checkin_list(rows, show_youth=False, label=f"Mentor check-ins with {first}, newest first"), title="Mentor check-ins", tid="check-ins",
                cls="card--flush", footer=footer)


def crumbs() -> str:
    return breadcrumb([("Mentoring", page("mentor-dashboard"))], "Mentor check-ins")


def hdr(sub: str = "Every 1:1, call and session you’ve logged, newest first. Only you can read them.") -> str:
    return crumbs() + page_header("Mentor check-ins", sub, btn("Log a mentor check-in", "primary", icon_name="plus", data_href=dialog("mentor-check-in")))


def filters(youth: str = "All youth", kind: str = "All types") -> str:
    names = ["All youth"] + [CHILD[c]["name"] for c in ["emily", "jordan", "kevin", "mateo", "sofia", "yusuf"]]
    return ('<form class="cluster" action="#" role="search" aria-label="Filter mentor check-ins">'
            + select("filter-youth", "Youth", names, selected=youth) + select("filter-kind", "Type", ["All types"] + KINDS, selected=kind) + "</form>")


@screen("mentor-check-in-history", "page", "Mentor check-ins", route="/mentoring/check-ins", reqs=R_CHECKIN)
def mentor_check_in_history(S):
    S.add("default", "Daniel’s mentor check-ins with all his youth, newest first: who, how they met, how it went, what they talked about, the follow-up and whether it is shared.", **KW,
          main=hdr() + filters() + card(checkin_list(CHECKINS), cls="card--flush"),
          notes=note("GET /mentoring/check-ins answers only the check-ins Daniel wrote for youth in his scope. His private notes show only to him.", "top: 5rem; right: 1rem;"))
    S.add("filtered", "Filtered to Mateo: only his mentor check-ins.", **KW,
          main=hdr() + filters("Mateo Rivera") + card(checkin_list(CHECKINS[:1]), cls="card--flush"))
    S.add("no-results", "A filter nothing matches: Sessions with Yusuf. Clear filters brings everything back.", **KW,
          main=hdr() + filters("Yusuf Haddad", "Session") + card(empty("No mentor check-ins match", "Try another youth or type.", action=btn("Clear filters", ""), icon_name="search"), cls="card--flush"))
    S.add("empty", "Hana has not logged a mentor check-in yet: one calm empty state with the action.", **(KW | {"user": HANA}),
          main=crumbs() + page_header("Mentor check-ins", "Every 1:1, call and session you’ve logged, newest first. Only you can read them.")
          + card(empty("No mentor check-ins yet", "Log your first conversation with one of your youth: how it went, what you talked about and when to follow up.",
                       action=btn("Log a mentor check-in", "primary", icon_name="plus", data_href=dialog("mentor-check-in")), icon_name="message"), cls="card--flush"))
    S.add("saved", "Just logged Mateo’s mentor check-in: a toast confirms it and it tops the list.", **KW,
          main=hdr() + filters() + card(checkin_list(CHECKINS), cls="card--flush"),
          toast_html=toast_region(toast("success", "Mentor check-in saved", "Mateo Rivera · Thu 5 Nov")))
    S.add("loading", "The history loading: skeleton rows in the list’s place.", **KW, main=hdr() + skeleton_list(4, "Loading your mentor check-ins"))
    S.add("error", "The history failed to load; the header stays.", **KW, main=hdr() + failed("We couldn’t load your mentor check-ins"))
    S.add("forbidden", "Marisol (Program director) opens /mentoring/check-ins: mentor check-ins are for mentors; the server answers 403.", nav="today", user=STAFF["marisol"],
          main=page_header("Mentor check-ins", "") + forbidden("Mentoring is for mentors", "Program directors assign mentors from a cohort’s page in Programs."))
