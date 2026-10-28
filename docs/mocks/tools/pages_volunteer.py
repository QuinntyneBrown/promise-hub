"""The volunteer portal (prompt 72, L2-100 and L2-101): a volunteer's own schedule of the sessions he is assigned to. Ported from Waypoint's
volunteer schedule mock; his Today (today/volunteer*), his check-in (check-in/volunteer*) and the volunteer's check-in sheet
(check-in-sheet/volunteer) are in pages_core.py and dialogs.py. The volunteer portal is the PromiseHub shell composed for the Volunteer role
(ADR 0043, ADR 0066); there is no separate app."""
from kit import *  # noqa: F401,F403
from reg import screen

R_VOLUNTEER = ["L2-101", "L2-100", "L2-007", "L2-005", "L2-001", "L2-038", "L2-035", "L2-036"]
LEO = STAFF["leo"]
KW = dict(nav="my-schedule", role="volunteer", user=LEO, unread=0, modules=["today", "check-in", "my-schedule"])

# Leo's assigned sessions in the next four weeks, from Thu 5 Nov 2026 at 4:12 pm.
SESSIONS = [
    dict(day="Thursday 5 November", name="Tutoring night", when="4:00–6:00 pm", place="Harbourview Community Centre, Room 2", program="After‑School Tutoring", youth=4, today=True),
    dict(day="Saturday 7 November", name="Saturday Sports", when="10:00 am–12:00 pm", place="Bennetto School gym", program="Saturday Sports", youth=2, today=False),
]


def session_item(s: dict, *, cancelled: bool = False) -> str:
    meta = f'{s["when"]} · {s["place"]} · {s["program"]} · {s["youth"]} youth'
    if cancelled:
        end = badge("Cancelled", "danger")
    elif s["today"]:
        end = badge("Today", "info")
    else:
        end = badge("Assigned", "")
    action = (f'<div class="cluster">{btn("Take attendance", "primary", size="sm", icon_name="clipboard", href=page("check-in", "volunteer"), aria_label=f"Take attendance for {s["name"]}, today")}</div>'
              if s["today"] and not cancelled else "")
    body = f'<div class="list__body"><div class="list__title">{esc(s["name"])}</div><div class="list__meta">{esc(meta)}</div>{action}</div>'
    return f'<li class="list__item">{body}{end}</li>'


def day_groups(sessions: list[dict], cancelled: set | None = None) -> str:
    cancelled = cancelled or set()
    out = []
    for i, s in enumerate(sessions):
        hid = f"day-{i}"
        out.append(f'<section class="stack" aria-labelledby="{hid}"><h2 class="overline" id="{hid}">{esc(s["day"])}</h2>'
                   + ul_list([session_item(s, cancelled=i in cancelled)], label=f'Sessions on {s["day"]}') + "</section>")
    return f'<div class="stack">{"".join(out)}</div>'


def hdr() -> str:
    return page_header("Your schedule", "The sessions you’re assigned to in the next four weeks.")


@screen("my-schedule", "page", "Your schedule", route="/my-schedule", reqs=R_VOLUNTEER,
        na={})
def my_schedule(S):
    S.add("default", "Leo’s next four weeks, by day: tonight’s Tutoring night marked Today with Take attendance, then Saturday Sports, each with its time, place, program and how many youth are on the roster.", **KW,
          main=hdr() + day_groups(SESSIONS),
          notes=note("GET /sessions/mine answers the sessions he is assigned to that have not ended and start in the next 28 days, by the organization’s calendar day. Nothing about any youth.", "top: 5rem; right: 1rem;"))
    S.add("cancelled", "Saturday Sports was cancelled: it stays on his schedule, marked Cancelled, so he knows not to come.", **KW,
          main=hdr() + day_groups(SESSIONS, cancelled={1}))
    S.add("loading", "His schedule loading: the header stays, skeleton rows hold the list’s place.", **KW,
          main=hdr() + skeleton_list(3, "Loading your schedule"))
    S.add("empty", "Leo is assigned to no session in the next four weeks: say so and who assigns him.", **KW,
          main=hdr() + card(empty("No sessions scheduled", "You’re not assigned to any session in the next four weeks. Your volunteer coordinator will add you.", icon_name="calendar"), cls="card--flush"))
    S.add("error", "The schedule failed to load: the header stays and Try again is offered.", **KW,
          main=hdr() + card(empty("We couldn’t load your schedule", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"),
                                  error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A youth opens /my-schedule: the server answers 403 and the page says the schedule is for the people who run sessions.", nav="today", role="youth",
          user=YOUTH["sofia"], unread=0, modules=["today", "learning", "schedule"],
          main=card(empty("This schedule is for people who run sessions", "Your own sessions are in Schedule.",
                          action=btn("Back to Today", "primary", href=page("today", "youth")), icon_name="lock", heading="h1"), cls="card--flush"))
