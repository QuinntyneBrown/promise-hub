"""Assign work (prompt 69, L2-092): a mentor assigns a lesson, quiz or assignment to one of his youth, several of them or a whole cohort
he is on, with a due date and an optional message. The youth sees it on her Learning home under Assigned to you. Assigning needs Learning,
so with Learning off nothing offers it. Ported from Waypoint's mentor assign-work mock. The dialog (assign-work) is in dialogs.py; the
mentor dashboard's Assign work button is in pages_mentoring.py and the Learning home's card in pages_learning.py."""
from kit import *  # noqa: F401,F403

R_ASSIGN = ["L2-092", "L2-065", "L2-068", "L2-007", "L2-032", "L1-024", "L1-023"]
KINDS = [("Lesson", "Something to read"), ("Quiz", "Questions to answer"), ("Assignment", "Something to make and hand in")]

# Today is Thu 5 Nov 2026. What Daniel assigned Sofía (a whole-cohort lesson) and what Hana assigned her before (an overdue assignment).
ASSIGNED = [
    dict(title="Last in Line", kind="Lesson", module="Leading by Serving", due="Due Fri 13 Nov", kind_badge=("Due in 8 days", "info"), by="Daniel Osei",
         message="Read this before Tutoring night next week. Come ready to share one way you served someone.", href="learn-lesson-scripture"),
    dict(title="Serve someone this week", kind="Assignment", module="Leading by Serving", due="Was due Tue 3 Nov", kind_badge=("Overdue", "danger"), by="Daniel Osei",
         message="", href="learn-assignment"),
]


def assigned_item(a: dict) -> str:
    meta = f'{a["kind"]} · {a["module"]} · {a["due"]} · From {a["by"]}'
    text = f'<p class="list__text">{esc(a["message"])}</p>' if a["message"] else ""
    body = f'<div class="list__body"><div class="list__title">{esc(a["title"])}</div><div class="list__meta">{esc(meta)}</div>{text}</div>'
    return f'<li class="list__item"><a class="list-link" href="{page(a["href"])}">{body}</a>{badge(*a["kind_badge"])}</li>'


def assigned_card(rows=None) -> str:
    rows = ASSIGNED if rows is None else rows
    return card(ul_list([assigned_item(a) for a in rows], card=False, label="Work assigned to you, soonest due first"),
                title="Assigned to you", tid="assigned", cls="card--flush")
