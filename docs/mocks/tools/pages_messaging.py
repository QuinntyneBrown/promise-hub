"""Announce and message (prompt 74, L2-105 to L2-108): staff publish announcements to a program or the whole organization, aimed at youth,
guardians, mentors or everyone, sent now or scheduled, with how many read them; youth and mentors read theirs in the app; a mentor and each
youth he mentors exchange direct messages under minor safeguards. Ported from Waypoint's admin and youth announcements and the mentor and
youth messages mocks as the Messages module (ADR 0043, ADR 0068). Guardians still get texts and emails from Messages (L2-021) and read them
on the guardian pages (L2-103); the SMS cap (L2-022) is unchanged. The compose dialog (compose-announcement) is below too.

Cast: Marisol Delgado (Program director) announces; Daniel Osei mentors Sofía Rivera (12, Carmen consented) and Nadia Haddad (18); Hana Kim
mentors nobody with a youth account yet. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_mentoring import DANIEL, HANA, failed, forbidden

R_ANN = ["L2-105", "L2-021", "L2-022", "L2-032", "L2-005", "L2-001", "L1-010", "L2-035", "L2-036"]
R_FEED = ["L2-105", "L2-107", "L2-005", "L2-001", "L1-010", "L1-024", "L2-035", "L2-036"]
R_TALK = ["L2-106", "L2-107", "L2-108", "L2-032", "L2-005", "L2-001", "L1-024", "L2-035", "L2-036"]

MARISOL = STAFF["marisol"]
SOFIA = YOUTH["sofia"]
NADIA = YOUTH["nadia"]
MODS_Y = ["today", "learning", "schedule", "conversations"]
MODS_M = ["today", "mentor-dashboard", "check-in", "conversations"]
YKW = dict(nav="conversations", role="youth", user=SOFIA, unread=0, modules=MODS_Y)
MKW = dict(nav="conversations", role="mentor", user=DANIEL, unread=0, modules=MODS_M)
SKW = dict(nav="messages", user=MARISOL)

AUDIENCES = [("Youth", "Youth with an account in the program"), ("Youth and guardians", "Youth in the app; guardians by text or email"),
             ("Guardians", "By text, or email when there’s no mobile"), ("Mentors", "Mentors of the program, in the app"),
             ("Everyone", "Youth, mentors and guardians")]

# Marisol's announcements, newest first.
ANNOUNCEMENTS = [
    dict(title="Saturday Sports field day", body="Field day is on at Bennetto School: wear running shoes and bring water. Families welcome from 11.",
         program="Saturday Sports", audience="Everyone", status="Scheduled", when="Sends Fri 6 Nov, 9:00 am", reads=None),
    dict(title="Royal Botanical Gardens trip: sign-ups close Friday", body="Sign up for the trip on Sat 14 Nov by Friday. Your permission slip comes by text.",
         program="All programs", audience="Youth and guardians", status="Sent", when="Tue 3 Nov · Marisol Delgado", reads=(1, 2), households=14),
    dict(title="Tutoring night moves to Room 2", body="Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.",
         program="After‑School Tutoring", audience="Youth", status="Sent", when="Mon 2 Nov · Marisol Delgado", reads=(1, 1)),
    dict(title="Mentor huddle moved to Thursday 7 pm", body="This week’s mentor huddle is Thursday at 7 pm in Room 3. We’ll plan the field day.",
         program="All programs", audience="Mentors", status="Sent", when="Fri 30 Oct · Marisol Delgado", reads=(2, 2)),
]

# What Sofía reads, newest first (not the Mentors one, not the scheduled one).
FEED = [
    dict(title="Royal Botanical Gardens trip: sign-ups close Friday", body=ANNOUNCEMENTS[1]["body"], who="Marisol Delgado · Program director", when="Tue 3 Nov", new=True, scope="All programs"),
    dict(title="Tutoring night moves to Room 2", body=ANNOUNCEMENTS[2]["body"], who="Marisol Delgado · Program director", when="Mon 2 Nov", new=True, scope="After‑School Tutoring"),
    dict(title="Welcome to Learning", body="Your lessons, badges and journey are in Learning. Your mentor will check in with you each week.", who="Tom Nguyen · Admin", when="Mon 19 Oct", new=False, scope="All programs"),
]

# Daniel ↔ Sofía, oldest first.
THREAD = [
    ("Yesterday", None),
    ("them", "Hi Daniel, I finished the Pick Up the Towel reflection. Can I lead the group one on Thursday?", "Sofía · 6:40 pm"),
    ("mine", "That’s a great idea. Bring the question you liked most and we’ll start with it.", "You · 7:02 pm"),
    ("Today", None),
    ("them", "Ok! Is it still in Room 2?", "Sofía · 3:58 pm"),
    ("mine", "Yes, Room 2 at 4:00. See you there.", "You · 4:05 pm"),
]


# ------------------------------------------------------------------ announcements (staff)
def ann_item(a: dict) -> str:
    if a["status"] == "Scheduled":
        end, meta = badge("Scheduled", "info"), a["when"]
    else:
        r, n = a["reads"]
        meta = a["when"] + (f' · {a["households"]} households texted' if a.get("households") else "")
        end = badge(f"Read by {r} of {n}", "success" if r == n else "")
    return (f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(a["title"])}</div>'
            f'<div class="list__meta">{esc(a["program"])} · {esc(a["audience"])}</div><p class="list__text">{esc(a["body"])}</p>'
            f'<span class="list__meta">{esc(meta)}</span></div>{end}</li>')


def ann_hdr() -> str:
    return (breadcrumb([("Messages", page("messages"))], "Announcements")
            + page_header("Announcements", "Tell youth, mentors and families what’s coming. Youth and mentors read them in the app; guardians get a text or an email.",
                          btn("New announcement", "primary", icon_name="plus", data_href=dialog("compose-announcement"))))


def ann_body(rows=ANNOUNCEMENTS) -> str:
    return ann_hdr() + kpis([("Sent", "3", "1 scheduled"), ("Read in the app", "4 of 5", "80% of youth and mentors")]) + card(ul_list([ann_item(a) for a in rows], card=False, label="Announcements, newest first"), cls="card--flush")


@screen("announcements", "page", "Announcements", route="/messages/announcements", reqs=R_ANN)
def announcements(S):
    S.add("default", "Marisol’s announcements, newest first: what, to which program and who, when it went (or is scheduled to) and how many of the youth and mentors it reached have read it; guardians’ texts are counted by household.", **SKW,
          main=ann_body(), notes=note("GET /announcements answers this organization’s announcements only, with reads counted from the in-app recipients. Scheduled ones send at their time.", "top: 5rem; right: 1rem;"))
    S.add("sent", "Just sent: a toast says who it reached; it tops the list unread by everyone.", **SKW,
          main=ann_body(), toast_html=toast_region(toast("success", "Announcement sent", "2 youth in the app · 14 households by text or email")))
    S.add("scheduled", "Just scheduled for later: a toast says when it goes.", **SKW,
          main=ann_body(), toast_html=toast_region(toast("success", "Announcement scheduled", "Sends Fri 6 Nov, 9:00 am")))
    S.add("empty", "No announcement yet: one calm empty state with the action.", **SKW,
          main=ann_hdr() + card(empty("No announcements yet", "Tell a program, or everyone, what’s coming: youth and mentors read it in the app and guardians get a text.",
                                      action=btn("New announcement", "primary", icon_name="plus", data_href=dialog("compose-announcement")), icon_name="message"), cls="card--flush"))
    S.add("loading", "Loading: numbers and rows as skeletons.", **SKW, main=ann_hdr() + skeleton_kpis(2) + skeleton_list(4, "Loading announcements"))
    S.add("error", "The list failed to load; the header and New announcement stay.", **SKW, main=ann_hdr() + failed("We couldn’t load announcements"))
    S.add("forbidden", "Aisha (Youth worker) opens /messages/announcements: sending announcements needs Send messages; the server answers 403.", nav="messages", user=STAFF["aisha"],
          main=page_header("Announcements", "") + forbidden("Announcements are sent by directors and site leads", "Ask your program director if families need to hear something."))


# ------------------------------------------------------------------ compose dialog
def compose_box(*, errors: dict | None = None, busy: bool = False, alert_html: str = "", scheduled: bool = False, blank: bool = False) -> str:
    from dialogs import footer
    e = errors or {}
    summary = form_summary([(k, v) for k, v in e.items()]) if e else ""
    title = "" if blank or "ann-title" in e else "Royal Botanical Gardens trip: sign-ups close Friday"
    body_v = "" if blank or "ann-body" in e else ANNOUNCEMENTS[1]["body"]
    radios = "".join(choice("ann-audience", t, small=h, checked=(t == ("Everyone" if scheduled else "Youth and guardians")) and not blank, invalid="ann-audience" in e) for t, h in AUDIENCES)
    when = (choice("ann-when", "Send now", checked=not scheduled) + choice("ann-when", "Schedule for later", checked=scheduled))
    sched = (f'<div class="cluster">{field("ann-date", "Date", type_="date", value="2026-11-06", error=e.get("ann-date", ""))}{field("ann-time", "Time", type_="time", value="09:00")}</div>'
             if scheduled or "ann-date" in e else "")
    body = (summary + field("ann-title", "Title", value=title, error=e.get("ann-title", ""), autofocus=not busy)
            + textarea("ann-body", "Message", value=body_v, rows=4, error=e.get("ann-body", ""), count=f"{len(body_v)} / 2,000")
            + select("ann-program", "Program", ["All programs", "After‑School Tutoring", "Saturday Sports"], selected="Saturday Sports" if scheduled else "All programs")
            + fieldset("Who hears it", f'<div class="stack stack--tight">{radios}</div>', error=e.get("ann-audience", ""), fid="ann-audience")
            + fieldset("When", f'<div class="cluster">{when}</div>' + sched)
            + alert("info", "Guardians get a text", "Or an email when there’s no mobile. Texts count toward your SMS cap; youth and mentors read it in the app."))
    return dialog_box("New announcement", "Pick who hears it and when it goes out.", body,
                      footer("Schedule" if scheduled else "Send", busy=busy), form=True, scroll=True, alert_html=alert_html)


@screen("compose-announcement", "dialog", "New announcement", opens_from="announcements", reqs=R_ANN)
def compose_announcement(S):
    from dialogs import over, failed_alert
    S.add("default", "Composing: title, message, the program (or all), who hears it and Send now. Guardians’ copies go through Messages, so the SMS cap applies.",
          **over("announcements", overlays=compose_box()))
    S.add("scheduled", "Schedule for later: date and time appear; the button says Schedule.", **over("announcements", overlays=compose_box(scheduled=True)))
    S.add("invalid", "Sent with nothing filled in: a summary and an error under each field; focus on the summary.",
          **over("announcements", overlays=compose_box(errors={"ann-title": "Give it a title.", "ann-body": "Write the announcement.", "ann-audience": "Choose who hears it."}, blank=True)))
    S.add("past", "A scheduled time that has passed: the date says so and nothing is sent.",
          **over("announcements", overlays=compose_box(errors={"ann-date": "Pick a time from now on."}, scheduled=True)))
    S.add("busy", "Sending: Send is busy and cannot be pressed twice.", **over("announcements", overlays=compose_box(busy=True)))
    S.add("failed", "The send failed: nothing went out and everything typed is still here.",
          **over("announcements", overlays=compose_box(alert_html=failed_alert("That didn’t go through", "Nobody was told anything. Try again."))))


# ------------------------------------------------------------------ youth (and mentor) announcements
def feed_item(f: dict, *, read: bool = False) -> str:
    new = f["new"] and not read
    end = badge("New", "info") if new else ""
    return (f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(f["title"])}</div>'
            f'<p class="list__text">{esc(f["body"])}</p><span class="list__meta">{esc(f["who"])} · {esc(f["when"])} · {esc(f["scope"])}</span></div>{end}</li>')


def feed_hdr(action: bool = True) -> str:
    return page_header("Announcements", "News from your organization and your programs.", btn("Mark all read", "", icon_name="check") if action else "")


@screen("youth-announcements", "page", "Your announcements", route="/announcements", reqs=R_FEED)
def youth_announcements(S):
    kw = YKW | {"nav": "announcements"}
    S.add("default", "Sofía’s announcements, newest first: the two she hasn’t read have a New badge; who sent each, when and which program.", **kw,
          main=feed_hdr() + ul_list([feed_item(f) for f in FEED], label="Announcements, newest first"),
          notes=note("GET /announcements/mine answers only what was aimed at her role and her programs, already sent. A new one arrives without a reload.", "top: 5rem; right: 1rem;"))
    S.add("success", "After Mark all read: the badges go and a toast says she’s caught up.", **kw,
          main=feed_hdr(False) + ul_list([feed_item(f, read=True) for f in FEED], label="Announcements, newest first"),
          toast_html=toast_region(toast("success", "All caught up", "Every announcement is marked read.")))
    S.add("mentor", "Daniel reads his: the mentor huddle is meant for mentors, the trip for youth and guardians is not his.", **(MKW | {"nav": "announcements"}),
          main=feed_hdr() + ul_list([feed_item(dict(title=ANNOUNCEMENTS[3]["title"], body=ANNOUNCEMENTS[3]["body"], who="Marisol Delgado · Program director", when="Fri 30 Oct", new=True, scope="All programs"))], label="Announcements, newest first"))
    S.add("empty", "Nothing aimed at her yet.", **kw,
          main=feed_hdr(False) + card(empty("No announcements yet", "News from your organization and your programs shows up here.", icon_name="message"), cls="card--flush"))
    S.add("loading", "Loading: skeleton rows.", **kw, main=feed_hdr(False) + skeleton_list(3, "Loading announcements"))
    S.add("error", "The list failed to load.", **kw, main=feed_hdr(False) + failed("We couldn’t load your announcements"))
    S.add("mark-failed", "Mark all read failed: nothing changed and the New badges stay.", **kw,
          main=feed_hdr() + alert("danger", "That didn’t go through", "Your announcements are still marked new. Try again.") + ul_list([feed_item(f) for f in FEED], label="Announcements, newest first"))


# ------------------------------------------------------------------ conversations (list)
def convo_item(person: dict, last: str, when: str, *, unread: int = 0, href: str = "", blocked: bool = False, sub: str = "") -> str:
    end = (badge("Waiting for consent", "warning") if blocked else badge(f"{unread} new", "info") if unread else f'<span class="list__meta">{esc(when)}</span>')
    return list_item(esc(person["name"]) + (f' <span class="text-caption">{esc(sub)}</span>' if sub else ""), esc(last), person=person, href=href or page("conversation"), end=end)


def convo_hdr(sub: str) -> str:
    return page_header("Messages", sub)


@screen("conversations", "page", "Messages", route="/conversations", reqs=R_TALK)
def conversations(S):
    rows = [convo_item(SOFIA, "Sofía: Ok! Is it still in Room 2?", "3:58 pm", unread=1),
            convo_item(NADIA, "You: Good luck with the interview tomorrow.", "Tue", href=page("conversation", "empty"))]
    S.add("default", "Daniel’s messages: one conversation per youth he mentors who has a youth account, newest first, with what was said last and how many are new.", **MKW,
          main=convo_hdr("Talk with the youth you mentor. Program directors can read these conversations.") + ul_list(rows, label="Conversations"),
          notes=note("GET /conversations answers only youth assigned to Daniel (L2-062) with a youth account in this organization. Mentors message only their own youth.", "top: 5rem; right: 1rem;"))
    S.add("youth", "Sofía’s messages: her one conversation, with her mentor Daniel.", **YKW,
          main=convo_hdr("Talk with your mentor. Program directors can read these conversations.") + ul_list([convo_item(DANIEL, "You: Ok! Is it still in Room 2?", "4:05 pm", unread=1, href=page("conversation", "youth"))], label="Conversations"))
    S.add("blocked", "Before Carmen consented: Sofía’s conversation waits for a guardian’s consent; messaging opens once it is given.", **MKW,
          main=convo_hdr("Talk with the youth you mentor. Program directors can read these conversations.")
          + ul_list([convo_item(SOFIA, "Messaging opens once a guardian gives consent.", "", blocked=True, href=page("conversation", "blocked")), rows[1]], label="Conversations"))
    S.add("supervisor", "Marisol (Program director) reads every mentor and youth conversation of Harbourview, read only, for safeguarding.", **SKW,
          main=breadcrumb([("Messages", page("messages"))], "Mentor conversations")
          + page_header("Mentor conversations", "Every conversation between a mentor and a youth, kept for safeguarding. You can read them; only the mentor and the youth write.")
          + ul_list([convo_item(SOFIA, "With Daniel Osei · Ok! Is it still in Room 2?", "3:58 pm", href=page("conversation", "supervisor")),
                     convo_item(NADIA, "With Daniel Osei · Good luck with the interview tomorrow.", "Tue")], label="Conversations"))
    S.add("empty", "Hana mentors nobody with a youth account yet: an empty state that says how conversations start.", **(MKW | {"user": HANA}),
          main=convo_hdr("Talk with the youth you mentor. Program directors can read these conversations.")
          + card(empty("No conversations yet", "When a youth you mentor has a youth account, you can message them here.", icon_name="message"), cls="card--flush"))
    S.add("loading", "Loading: skeleton rows.", **MKW, main=convo_hdr("Talk with the youth you mentor.") + skeleton_list(2, "Loading conversations"))
    S.add("error", "The list failed to load.", **MKW, main=convo_hdr("Talk with the youth you mentor.") + failed("We couldn’t load your messages"))
    S.add("forbidden", "Aisha (Youth worker) opens /conversations: direct messages are between a mentor and the youth they mentor; the server answers 403.", nav="today", user=STAFF["aisha"],
          main=page_header("Messages", "") + forbidden("Direct messages are for mentors and youth", "Message families from Messages; mentors talk with their youth here."))


# ------------------------------------------------------------------ conversation (thread)
def thread(lines, *, mine_label: str = "You", new_last: bool = False, extra: str = "") -> str:
    out = []
    for i, ln in enumerate(lines):
        if ln[1] is None:
            out.append(f'<li class="thread__day">{esc(ln[0])}</li>')
            continue
        who, text, meta = ln
        cls = "thread__message" + (" thread__message--mine" if who == "mine" else "") + (" thread__message--new" if new_last and i == len(lines) - 1 else "")
        out.append(f'<li class="{cls}"><p class="thread__bubble">{esc(text)}</p><span class="thread__meta">{esc(meta)}</span></li>')
    return f'<ol class="thread__log" aria-label="Messages, oldest first" aria-live="polite">{"".join(out)}{extra}</ol>'


def composer(*, value: str = "", busy: bool = False, error: str = "", disabled: bool = False) -> str:
    return (f'<form class="thread__composer" action="#" aria-label="Write a message">'
            + textarea("msg-body", "Message", value=value, rows=4, error=error, attrs=" disabled" if disabled else "")
            + btn("Send", "primary", icon_name="send", type_="submit", busy=busy, disabled=disabled) + "</form>")


def convo_page(person: dict, sub: str, body: str, *, back: str = "conversations", back_state: str = "default") -> str:
    return (breadcrumb([("Messages", page(back, back_state))], person["name"])
            + page_header(esc(person["name"]))
            + f'<section class="card thread" aria-label="Conversation with {esc(person["name"])}">{body}</section>'
            + '<p class="text-caption">Messages are kept for safeguarding. Program directors can read this conversation.</p>')


@screen("conversation", "page", "Conversation", route="/conversations/:youthId", reqs=R_TALK)
def conversation(S):
    sub = "Age 12 · After‑School Tutoring · Saturday Sports"
    S.add("default", "Daniel and Sofía: their messages oldest first, his on the right, hers on the left, with who and when; the composer at the end.", **MKW,
          main=convo_page(SOFIA, sub, thread(THREAD) + composer()),
          notes=note("GET /conversations/{youthId} marks what Daniel received as read. A new message from Sofía arrives through the event stream and is fetched, never pushed with its words.", "top: 5rem; right: 1rem;"))
    yt = [(t if t[1] is None else ("mine" if t[0] == "them" else "them", t[1], t[2].replace("Sofía", "You") if t[0] == "them" else t[2].replace("You", "Daniel"))) for t in THREAD]
    S.add("youth", "Sofía’s side of the same conversation, with Daniel her mentor.", **YKW,
          main=convo_page(DANIEL, "Your mentor · Saturday Sports", thread(yt) + composer()))
    S.add("received", "A new message from Sofía arrives while Daniel has the conversation open: it appears at the end, marked, without a reload.", **MKW,
          main=convo_page(SOFIA, sub, thread(THREAD + [("them", "Can I bring my friend Grace next time?", "Sofía · 4:12 pm · New")], new_last=True) + composer()))
    S.add("sending", "Sending: the message shows at the end as Sending…, Send is busy.", **MKW,
          main=convo_page(SOFIA, sub, thread(THREAD + [("mine", "Of course, tell her to come at 4.", "You · Sending…")]) + composer(busy=True)))
    S.add("failed", "The send failed: the message is kept with Not sent and Try again; nothing was delivered.", **MKW,
          main=convo_page(SOFIA, sub, thread(THREAD, extra=f'<li class="thread__message thread__message--mine"><p class="thread__bubble">Of course, tell her to come at 4.</p><span class="thread__meta thread__meta--failed">Not sent. {btn("Try again", "link", size="sm")}</span></li>') + composer()))
    S.add("invalid", "Too long: the composer says so and keeps the text.", **MKW,
          main=convo_page(SOFIA, sub, thread(THREAD) + composer(value="Of course…", error="Keep it to 2,000 characters.")))
    S.add("empty", "Daniel and Nadia have not written yet: the empty thread says who can read it and the composer is ready.", **MKW,
          main=convo_page(NADIA, "Age 18 · Saturday Sports",
                          empty("Say hi to Nadia", "Start the conversation. Program directors can read it.", icon_name="message", heading="h2") + composer()))
    S.add("blocked", "Sofía is 12 and no guardian has consented yet: the server refuses messages both ways, the composer is disabled and the page says why.", **MKW,
          main=convo_page(SOFIA, sub, alert("warning", "Waiting for a guardian’s consent", "Messaging opens once Sofía’s guardian consents. Ask your program director to send the consent link.") + composer(disabled=True)))
    S.add("supervisor", "Marisol reads the conversation, read only: no composer, and her opening it is recorded in the audit log.", **SKW,
          main=(breadcrumb([("Mentor conversations", page("conversations", "supervisor"))], "Sofía Rivera and Daniel Osei")
                + page_header("Sofía Rivera and Daniel Osei", "Mentor and youth · read only")
                + f'<section class="card thread" aria-label="Conversation between Daniel Osei and Sofía Rivera">{thread([(t if t[1] is None else (t[0], t[1], t[2].replace("You", "Daniel"))) for t in THREAD])}</section>'
                + '<p class="text-caption">You’re reading this for safeguarding; opening it is recorded in the audit log.</p>'))
    S.add("loading", "Loading: the header and skeleton bubbles.", **MKW,
          main=convo_page(SOFIA, sub, '<div aria-busy="true" aria-label="Loading messages" class="stack"><span class="skeleton skeleton--text" style="width: 60%;"></span><span class="skeleton skeleton--text" style="width: 45%; align-self: flex-end;"></span><span class="skeleton skeleton--text" style="width: 55%;"></span></div>'))
    S.add("error", "The conversation failed to load.", **MKW, main=convo_page(SOFIA, sub, failed("We couldn’t load this conversation")))
    S.add("forbidden", "Hana opens Sofía’s conversation: Sofía isn’t one of her youth; the server answers 403.", **(MKW | {"user": HANA}),
          main=page_header("Messages", "") + forbidden("This isn’t one of your conversations", "You can message the youth you mentor, or your mentor."))
