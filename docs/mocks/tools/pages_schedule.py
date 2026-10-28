"""Schedule sessions and RSVP (prompt 70, L2-093 and L2-094): staff schedule cohort sessions as events, repeating weekly through the
program's last day, and browse them on a month calendar; youth see their upcoming sessions and RSVP; staff see the RSVP counts and notes on
the event. Ported from Waypoint's admin and mentor calendar mocks and its youth schedule mock. The event form's Repeat weekly states are in
pages_ops.py, the event page's RSVP card in pages_core.py and the RSVP dialog (rsvp) in dialogs.py."""
from kit import *  # noqa: F401,F403
from reg import screen

R_SCHEDULE = ["L2-093", "L2-012", "L2-007", "L2-005", "L2-001", "L2-035", "L2-036"]
R_RSVP = ["L2-094", "L2-093", "L2-012", "L2-056", "L2-007", "L2-032", "L2-035", "L2-036"]
MARISOL = STAFF["marisol"]
SOFIA = YOUTH["sofia"]
STAFF_KW = dict(nav="events", user=MARISOL)
YOUTH_KW = dict(nav="schedule", role="youth", user=SOFIA, unread=0, modules=["today", "learning", "schedule"])

WEEKDAYS = [("Mon", "Monday"), ("Tue", "Tuesday"), ("Wed", "Wednesday"), ("Thu", "Thursday"), ("Fri", "Friday"), ("Sat", "Saturday"), ("Sun", "Sunday")]

# November 2026 as Marisol sees it after scheduling Tutoring night every Thursday (today is Thu 5 Nov). Each entry: day, time, name, program, cancelled.
NOVEMBER = {
    4: [("4:00 pm", "Tutoring night", "After‑School Tutoring", False)],
    5: [("4:00 pm", "Tutoring night", "After‑School Tutoring", False)],
    7: [("10:00 am", "Saturday Sports", "Saturday Sports", False)],
    12: [("4:00 pm", "Tutoring night", "After‑School Tutoring", False)],
    14: [("9:00 am", "Fall field trip: Royal Botanical Gardens", "After‑School Tutoring", False), ("10:00 am", "Saturday Sports", "Saturday Sports", False)],
    19: [("4:00 pm", "Tutoring night", "After‑School Tutoring", False)],
    21: [("10:00 am", "Saturday Sports", "Saturday Sports", True)],
    26: [("4:00 pm", "Tutoring night", "After‑School Tutoring", False)],
    28: [("10:00 am", "Swim trip: Jimmy Thompson Pool", "Saturday Sports", False), ("10:00 am", "Saturday Sports", "Saturday Sports", False)],
}
MONTH_DAYS = 30
FIRST_WEEKDAY = 6  # 1 Nov 2026 is a Sunday (Mon = 0)
LEADING = [26, 27, 28, 29, 30, 31]  # Mon 26 – Sat 31 Oct
TRAILING = [1, 2, 3, 4, 5, 6]  # Tue 1 – Sun 6 Dec


def entry_link(time: str, name: str, cancelled: bool, href_state: str = "upcoming") -> str:
    status = '<span class="calendar__status">Cancelled · </span>' if cancelled else ""
    cls = "calendar__event calendar__event--cancelled" if cancelled else "calendar__event"
    return (f'<a class="{cls}" href="{page("event", "cancelled" if cancelled else href_state)}">{status}'
            f'<span class="calendar__time">{esc(time)}</span> <span class="calendar__name">{esc(name)}</span></a>')


def month_grid(events: dict, *, label: str = "November 2026", today: int | None = 5) -> str:
    cells: list[str] = []
    for d in LEADING:
        cells.append(f'<td class="calendar__day calendar__day--outside"><span class="calendar__date" aria-hidden="true">{d}</span></td>')
    for d in range(1, MONTH_DAYS + 1):
        weekday = WEEKDAYS[(FIRST_WEEKDAY + d - 1) % 7][1]
        current = ' aria-current="date"' if d == today else ""
        cls = "calendar__day calendar__day--today" if d == today else "calendar__day"
        items = events.get(d, [])
        links = "".join(f"<li>{entry_link(t, n, c)}</li>" for t, n, _p, c in items)
        lst = f'<ul class="calendar__events" aria-label="{weekday} {d} November">{links}</ul>' if items else ""
        cells.append(f'<td class="{cls}"{current}><span class="calendar__date"><span class="visually-hidden">{weekday} </span>{d}</span>{lst}</td>')
    for d in TRAILING:
        cells.append(f'<td class="calendar__day calendar__day--outside"><span class="calendar__date" aria-hidden="true">{d}</span></td>')
    rows = "".join("<tr>" + "".join(cells[i:i + 7]) + "</tr>" for i in range(0, len(cells), 7))
    head = "".join(f'<th scope="col"><abbr title="{full}">{short}</abbr></th>' for short, full in WEEKDAYS)
    agenda_days = []
    for d in range(1, MONTH_DAYS + 1):
        items = events.get(d, [])
        if not items:
            continue
        weekday = WEEKDAYS[(FIRST_WEEKDAY + d - 1) % 7][0]
        today_tag = ' <span class="badge badge--info">Today</span>' if d == today else ""
        links = "".join(f"<li>{entry_link(t, n, c)}</li>" for t, n, _p, c in items)
        agenda_days.append(f'<li class="calendar__agenda-day"><h3 class="calendar__agenda-date">{weekday} {d} Nov{today_tag}</h3><ul class="calendar__events">{links}</ul></li>')
    agenda = f'<ol class="calendar__agenda" aria-label="{esc(label)}, days with sessions">{"".join(agenda_days)}</ol>'
    return (f'<div class="calendar"><table class="calendar__grid"><caption class="visually-hidden">{esc(label)}</caption><thead><tr>{head}</tr></thead>'
            f'<tbody>{rows}</tbody></table>{agenda}</div>')


def toolbar(month: str = "November 2026", program: str = "All programs") -> str:
    nav = (f'<div class="cluster cluster--snug" role="group" aria-label="Month">{icon_btn("arrow-left", "Previous month")}'
           f'<h2 class="calendar__month" aria-live="polite">{esc(month)}</h2>{icon_btn("arrow-right", "Next month")}{btn("This month", "ghost", size="sm")}</div>')
    prog = select("cal-prog", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports", "Winter Camp 2026"], selected=program,
                  visually_hidden_label=True).replace('class="field"', 'class="field toolbar__end"')
    return f'<div class="toolbar">{nav}{prog}</div>'


def hdr(sub: str = "23 sessions this month · 1 cancelled") -> str:
    actions = btn("List", "", icon_name="list", href=page("events")) + btn("New event", "primary", icon_name="plus", href=page("event-form"))
    return breadcrumb([("Events", page("events"))], "Calendar") + page_header("Calendar", sub, actions)


@screen("events-calendar", "page", "Events calendar", route="/events/calendar", reqs=R_SCHEDULE, na={})
def events_calendar(S):
    S.add("default", "November 2026 by week: every session of every program on its day with its time, today marked, the cancelled Saturday Sports struck through. On a phone it is a list of the days with sessions.", **STAFF_KW,
          main=hdr("12 sessions this month · 1 cancelled") + toolbar() + month_grid(NOVEMBER),
          notes=note("GET /events/calendar?month=2026-11 answers the month’s events by the organization’s calendar day. Each opens its event page.", "top: 5rem; right: 1rem;"))
    tutoring = {d: [e for e in items if e[2] == "After‑School Tutoring"] for d, items in NOVEMBER.items()}
    tutoring = {d: v for d, v in tutoring.items() if v}
    S.add("filtered", "Filtered to After‑School Tutoring: its weekly Tutoring nights and the field trip only.", **STAFF_KW,
          main=hdr("6 sessions this month") + toolbar(program="After‑School Tutoring") + month_grid(tutoring))
    S.add("loading", "The month loading: the toolbar stays, a skeleton holds the grid’s place.", **STAFF_KW,
          main=hdr("") + toolbar() + '<div class="card" aria-busy="true" aria-label="Loading the calendar"><span class="skeleton skeleton--card" aria-hidden="true" style="height: 28rem;"></span></div>')
    S.add("empty", "January 2027 has nothing scheduled yet: say so and offer a new event.", **STAFF_KW,
          main=hdr("Nothing scheduled") + toolbar("January 2027") + card(empty("Nothing scheduled in January 2027", "Sessions you schedule show up here on their day.",
                                                                              action=btn("New event", "primary", icon_name="plus", href=page("event-form")), icon_name="calendar"), cls="card--flush"))
    S.add("error", "The month failed to load; the toolbar stays so she can try another month.", **STAFF_KW,
          main=hdr("") + toolbar() + card(empty("We couldn’t load the calendar", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"),
                                                 error=True, icon_name="alert-triangle"), cls="card--flush"))


# ------------------------------------------------------------------ youth schedule
# Sofía's sessions in the next four weeks (After‑School Tutoring), from Thu 5 Nov 2026 at 4:12 pm.
SESSIONS = [
    dict(day="Thursday 12 November", name="Tutoring night", when="4:00–6:00 pm", place="Harbourview Community Centre, Room 2", rsvp=("Going", "success"), note="I’ll bring my reflection notes."),
    dict(day="Saturday 14 November", name="Fall field trip: Royal Botanical Gardens", when="9:00 am–3:00 pm", place="Royal Botanical Gardens · bus leaves 8:45 am", rsvp=None, note=""),
    dict(day="Thursday 19 November", name="Tutoring night", when="4:00–6:00 pm", place="Harbourview Community Centre, Room 2", rsvp=("Maybe", "info"), note=""),
    dict(day="Thursday 26 November", name="Tutoring night", when="4:00–6:00 pm", place="Harbourview Community Centre, Room 2", rsvp=("Can’t make it", "warning"), note="Dentist appointment."),
    dict(day="Thursday 3 December", name="Tutoring night", when="4:00–6:00 pm", place="Harbourview Community Centre, Room 2", rsvp=None, note=""),
]


def session_item(s: dict, *, cancelled: bool = False) -> str:
    meta = f'{s["when"]} · {s["place"]} · After‑School Tutoring'
    text = f'<p class="list__text">Your note: {esc(s["note"])}</p>' if s["note"] and not cancelled else ""
    if cancelled:
        end = badge("Cancelled", "danger")
        action = ""
    else:
        end = badge(*s["rsvp"]) if s["rsvp"] else badge("Not replied", "")
        label = "Change RSVP" if s["rsvp"] else "RSVP"
        action = f'<div class="cluster">{btn(label, "" if s["rsvp"] else "primary", size="sm", data_href=dialog("rsvp"), aria_label=f"{label} for {s["name"]}, {s["day"]}")}</div>'
    body = f'<div class="list__body"><div class="list__title">{esc(s["name"])}</div><div class="list__meta">{esc(meta)}</div>{text}{action}</div>'
    return f'<li class="list__item"><span class="icon-tile" aria-hidden="true">{icon("calendar")}</span>{body}{end}</li>'


def day_groups(sessions: list[dict], cancelled: set | None = None) -> str:
    cancelled = cancelled or set()
    out = []
    for i, s in enumerate(sessions):
        hid = f"day-{i}"
        out.append(f'<section class="stack" aria-labelledby="{hid}"><h2 class="overline" id="{hid}">{esc(s["day"])}</h2>'
                   + ul_list([session_item(s, cancelled=i in cancelled)], label=f'Sessions on {s["day"]}') + "</section>")
    return f'<div class="stack">{"".join(out)}</div>'


def youth_hdr() -> str:
    return page_header("Your schedule", "Your sessions in the next four weeks. Let staff know if you’ll be there.")


@screen("youth-schedule", "page", "Your schedule", route="/schedule", reqs=R_RSVP, na={})
def youth_schedule(S):
    S.add("default", "Sofía’s next four weeks, by day: each session with its time, place and program, her RSVP (Going, Maybe, Can’t make it or Not replied) and her note, with RSVP or Change RSVP.", **YOUTH_KW,
          main=youth_hdr() + day_groups(SESSIONS),
          notes=note("GET /schedule answers the sessions of the programs she is enrolled in that start in the next 28 days. A session that has started is not listed.", "top: 5rem; right: 1rem;"))
    sent = [dict(SESSIONS[0])] + [dict(SESSIONS[1], rsvp=("Going", "success"), note="Can I bring my inhaler on the bus?")] + SESSIONS[2:]
    S.add("sent", "Just sent Going for the field trip with a note: a toast says staff can see it and the session shows Going.", **YOUTH_KW,
          main=youth_hdr() + day_groups(sent),
          toast_html=toast_region(toast("success", "RSVP sent", "Fall field trip: Royal Botanical Gardens · Going")))
    S.add("cancelled", "Staff cancelled Tutoring night on Thu 19 Nov: it says Cancelled and offers no RSVP.", **YOUTH_KW,
          main=youth_hdr() + day_groups(SESSIONS, cancelled={2}))
    S.add("loading", "The schedule loading: skeleton rows in its place.", **YOUTH_KW, main=youth_hdr() + skeleton_list(4, "Loading your schedule"))
    S.add("empty", "Nothing in the next four weeks: say when it will show up.", **YOUTH_KW,
          main=youth_hdr() + card(empty("Nothing scheduled in the next four weeks", "When your program adds a session, it’ll show up here.", icon_name="calendar"), cls="card--flush"))
    S.add("error", "The schedule failed to load; the header stays.", **YOUTH_KW,
          main=youth_hdr() + card(empty("We couldn’t load your schedule", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"),
                                         error=True, icon_name="alert-triangle"), cls="card--flush"))
