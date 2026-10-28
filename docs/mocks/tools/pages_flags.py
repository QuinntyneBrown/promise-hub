"""Flag at-risk youth (prompt 68, L2-091): a mentor raises an at-risk flag on one of his youth with a reason and how serious it is, program
directors are notified, and the flag is tracked until it is resolved with an outcome. Ported from Waypoint's mentor at-risk mock. An at-risk
flag is not an incident: while the Incident log is on, staff who read the flag can report one from it. The dialogs (raise-flag,
resolve-flag) are in dialogs.py."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_mentoring import KW, HANA, failed, forbidden, R_MENTOR

R_FLAGS = ["L2-091", "L2-065", "L2-040", "L2-032", "L2-023", "L2-007", R_MENTOR, "L2-035", "L2-036"]
SEVERITY = [("Low", "Keep an eye on it"), ("Medium", "Needs a plan this week"), ("High", "Needs attention today")]
SEVERITY_KIND = {"High": "danger", "Medium": "warning", "Low": ""}
OUTCOMES = ["Reconnected, back on track", "Handed to the program director", "Left the program", "Flagged in error"]
MARISOL = STAFF["marisol"]
DIRECTOR = dict(nav="today", user=MARISOL)

# Open flags, most serious first, then newest (today is Thu 5 Nov 2026).
NEW = dict(cid="mateo", severity="Medium", by="Daniel Osei", when="Today, 4:20 pm",
           reason="Asked me twice whether he could stay late because nobody is home after school.")
OPEN = [
    dict(cid="yusuf", severity="High", by="Daniel Osei", when="Wed 4 Nov",
         reason="Missed three Tutoring nights in a row and stopped answering my messages. He said things at home are hard right now."),
    dict(cid="jordan", severity="Medium", by="Hana Kim", when="Mon 2 Nov",
         reason="Falling behind on homework and withdrawn at Tutoring night. Says he isn’t sleeping much."),
]
RESOLVED = [
    dict(cid="emily", severity="Low", by="Daniel Osei", when="Sat 24 Oct", reason="Quiet at Saturday Sports for two weeks and sitting out the drills.",
         outcome="Reconnected, back on track", resolved_by="Daniel Osei", resolved_when="Sat 31 Oct",
         note="Her best friend moved away. She’s back in the drills and paired with Kevin."),
    dict(cid="kevin", severity="Low", by="Daniel Osei", when="Sat 17 Oct", reason="Left Saturday Sports early twice without saying why.",
         outcome="Flagged in error", resolved_by="Marisol Delgado", resolved_when="Mon 19 Oct", note="His grandmother picks him up early on alternate weeks."),
]


def flag_item(f: dict, *, director: bool = False, incidents: bool = True) -> str:
    child = CHILD[f["cid"]]
    resolved = "outcome" in f
    meta = f'Raised by {f["by"]} · {f["when"]}'
    sev = badge(f["severity"], SEVERITY_KIND[f["severity"]])
    extra = ""
    if resolved:
        line = f'{f["outcome"]} · Resolved by {f["resolved_by"]} · {f["resolved_when"]}' + (f' · Note: {f["note"]}' if f.get("note") else "")
        extra = f'<span class="list__meta">{esc(line)}</span>'
        actions = ""
    else:
        buttons = [btn("Resolve", "", icon_name="check", data_href=dialog("resolve-flag"))]
        if not director:
            buttons.insert(0, btn("View record", "ghost", href=page("mentor-youth-detail")))
        if director and incidents:
            buttons.append(btn("Report an incident", "ghost", icon_name="flag", href=page("new-incident")))
        actions = f'<div class="cluster">{"".join(buttons)}</div>'
    body = (f'<div class="list__body"><div class="list__title">{esc(child["name"])}</div><div class="list__meta">{esc(meta)}</div>'
            f'<p class="list__text">{esc(f["reason"])}</p>{extra}{actions}</div>')
    return f'<li class="list__item">{avatar(child)}{body}{sev}</li>'


def flag_list(rows, *, director: bool = False, incidents: bool = True, label: str = "Open at-risk flags, most serious first") -> str:
    return card(ul_list([flag_item(f, director=director, incidents=incidents) for f in rows], card=False, label=label), cls="card--flush")


def crumbs() -> str:
    return breadcrumb([("Mentoring", page("mentor-dashboard"))], "At-risk flags")


SUB = "Youth you’re worried about. Program directors are told when you raise a flag."
SUB_DIRECTOR = "Every at-risk flag at your organization. Mentors raise them; you can resolve them or report an incident."


def hdr(sub: str = SUB, *, raise_: bool = True, director: bool = False) -> str:
    action = btn("Raise a flag", "primary", icon_name="plus", data_href=dialog("raise-flag")) if raise_ else ""
    return ("" if director else crumbs()) + page_header("At-risk flags", sub, action)


def tabs(open_n: int, resolved_n: int, *, resolved: bool = False) -> str:
    return tabs_nav([(f"Open · {open_n}", page("mentor-flags", "default"), not resolved),
                     (f"Resolved · {resolved_n}", page("mentor-flags", "resolved"), resolved)], "At-risk flags")


@screen("mentor-flags", "page", "At-risk flags", route="/mentoring/flags", reqs=R_FLAGS)
def mentor_flags(S):
    S.add("default", "Daniel’s open at-risk flags on his youth, most serious first: who, how serious, why, who raised it and when, with View record and Resolve.", **KW,
          main=hdr() + tabs(2, 2) + flag_list(OPEN),
          notes=note("GET /mentoring/flags?status=Open answers the open flags on youth in Daniel’s scope, whoever of their mentors raised them. High before Medium before Low, then newest.", "top: 5rem; right: 1rem;"))
    S.add("raised", "Just raised a flag on Mateo: a toast says Marisol has been told and it joins the open list.", **KW,
          main=hdr() + tabs(3, 2) + flag_list(OPEN[:1] + [NEW] + OPEN[1:]),
          toast_html=toast_region(toast("success", "Flag raised", "Mateo Rivera · Program directors have been told")))
    S.add("resolved", "The Resolved tab: each resolved flag with how it was resolved, by whom, when and the note.", **KW,
          main=hdr() + tabs(2, 2, resolved=True) + flag_list(RESOLVED, label="Resolved at-risk flags, newest first"))
    S.add("empty", "Hana has no open flags: a calm empty state with the action.", **(KW | {"user": HANA}),
          main=hdr() + tabs(0, 0) + card(empty("No youth flagged", "When you’re worried about one of your youth, raise a flag. Your program director is told and it stays here until it’s resolved.",
                                                   action=btn("Raise a flag", "primary", icon_name="plus", data_href=dialog("raise-flag")), icon_name="flag"), cls="card--flush"))
    S.add("loading", "The flags loading: skeleton rows in the list’s place.", **KW, main=hdr() + tabs(0, 0) + skeleton_list(3, "Loading at-risk flags"))
    S.add("error", "The flags failed to load; the header stays.", **KW, main=hdr() + failed("We couldn’t load the at-risk flags"))
    S.add("director", "Marisol (Program director) opens At-risk flags from More or from her notification: every open flag at Harbourview, with Resolve and Report an incident.", **DIRECTOR,
          main=hdr(SUB_DIRECTOR, raise_=False, director=True) + tabs(2, 2) + flag_list(OPEN, director=True),
          notes=note("Admins and program directors read every flag of the organization. Report an incident opens the Incident log’s report form; a flag is not an incident.", "top: 5rem; right: 1rem;"))
    S.add("incidents-off", "The Incident log is off for Harbourview: no Report an incident on any flag and nothing mentions incidents.", **DIRECTOR,
          main=hdr(SUB_DIRECTOR.replace(" or report an incident", ""), raise_=False, director=True) + tabs(2, 2) + flag_list(OPEN, director=True, incidents=False))
    S.add("forbidden", "Aisha (Youth worker) opens /mentoring/flags: at-risk flags are for mentors and program directors; the server answers 403.", nav="today", user=STAFF["aisha"],
          main=page_header("At-risk flags", "") + forbidden("At-risk flags are for mentors and program directors", "Ask your program director if you’re worried about a child."))
