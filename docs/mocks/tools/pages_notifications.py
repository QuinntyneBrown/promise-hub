"""Receive notifications (prompt 75, L2-109 to L2-111): the notification center for youth and mentors as well as staff, with the new kinds
from Learning, Mentoring and Messages (grades, badges, assigned work, at-risk flags, direct messages and announcements) arriving without a
reload, and each person's own choice of what reaches them in the app (`account-notifications`). Ported from Waypoint's mentor and youth
notifications and the shared notification settings mocks (ADR 0043, ADR 0069). Notifications are not a module; a kind follows its module, so
nothing of a module that is off is listed, sent or offered as a choice.

Cast: Sofía Rivera (12, youth, mentored by Daniel Osei), Daniel Osei (Mentor), Marisol Delgado (Program director), Hana Kim (Volunteer view
in empty). Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_mentoring import DANIEL, failed
from pages_ops import skeleton_form

R_CENTER = ["L2-109", "L2-110", "L2-040", "L2-005", "L2-001", "L2-035", "L2-036"]
R_PREFS = ["L2-111", "L2-109", "L2-005", "L2-001", "L2-032", "L2-035", "L2-036"]

SOFIA = YOUTH["sofia"]
MARISOL = STAFF["marisol"]
MODS_Y = ["today", "learning", "schedule", "conversations"]
MODS_M = ["today", "mentor-dashboard", "check-in", "conversations"]
YKW = dict(nav="", role="youth", user=SOFIA, modules=MODS_Y)
MKW = dict(nav="", role="mentor", user=DANIEL, modules=MODS_M)

# Sofía's notices, newest first: (kind label, text, when, unread, link page).
YOUTH_ITEMS = [
    ("Message", "New message from Daniel Osei", "Today, 4:05 pm", True, "conversation"),
    ("Announcement", "Marisol Delgado posted an announcement: Tutoring night moves to Room 2", "Today, 3:30 pm", True, "youth-announcements"),
    ("Assigned work", "Daniel Osei assigned you the Servant Leadership quiz, due Fri 13 Nov.", "Today, 1:15 pm", True, "learn-home"),
    ("Grade", "Daniel Osei approved Pick Up the Towel: 9 of 10 points.", "Yesterday, 6:20 pm", False, "learn-submission"),
    ("Badge", "You earned the Faithful Five badge.", "Mon 2 Nov, 5:00 pm", False, "learn-badges"),
]
MENTOR_ITEMS = [
    ("Message", "New message from Sofía Rivera", "Today, 3:58 pm", True, "conversation"),
    ("Announcement", "Marisol Delgado posted an announcement: Mentor huddle moved to Thursday 7 pm", "Fri 30 Oct, 9:10 am", False, "youth-announcements"),
]
LIVE = ("Message", "New message from Daniel Osei", "Just now", True, "conversation")


def n_item(kind: str, text: str, when: str, unread: bool, link: str) -> str:
    return list_item(esc(text), f"{esc(kind)} · {esc(when)}" + (" · Unread" if unread else ""), href=page(link), end=badge("New", "info") if unread else "")


def n_hdr(unread: int, action: bool = True) -> str:
    actions = (btn("Mark all read", "", icon_name="check") if unread and action else "") + btn("Settings", "ghost", icon_name="settings", href=page("account-notifications"))
    return page_header("Notifications", f"{unread} unread" if unread else "All read", actions)


def n_list(items) -> str:
    return card(ul_list([n_item(*i) for i in items], card=False, label="Notifications"), cls="card--flush")


def center_states(S):
    """The youth, mentor, live and module-off states of the notification center (`notifications`)."""
    S.add("youth", "Sofía’s notifications: a new message from her mentor, an announcement, work assigned to her, a grade and a badge, newest first; the three unread have New.", **YKW, unread=3,
          main=n_hdr(3) + n_list(YOUTH_ITEMS),
          notes=note("GET /notifications answers only Sofía’s own notices in Harbourview. A message notice never carries the words: it links to the conversation, which checks who may read it.", "top: 5rem; right: 1rem;"))
    S.add("mentor", "Daniel’s notifications: Sofía wrote to him and the mentor huddle announcement.", **MKW, unread=1,
          main=n_hdr(1) + n_list(MENTOR_ITEMS))
    S.add("live", "A new notice arrives while the center is open: it tops the list with New and the bell counts it, without a reload.", **YKW, unread=4,
          main=n_hdr(4) + n_list([LIVE] + YOUTH_ITEMS),
          notes=note("The stream (GET /realtime) sends a notification event with no content; the center and the bell fetch again quietly. On reconnecting they fetch again, so nothing is missed or shown twice.", "top: 5rem; right: 1rem;"))
    S.add("module-off", "Messages is off at Harbourview: message and announcement notices are not listed (and none are sent); grades, assigned work and badges stay.", **(YKW | {"modules": ["today", "learning", "schedule"]}), unread=1,
          main=n_hdr(1) + n_list([i for i in YOUTH_ITEMS if i[0] not in ("Message", "Announcement")]))
    S.add("youth-empty", "Nothing for Sofía yet: calm, with where to choose what reaches her.", **YKW, unread=0,
          main=page_header("Notifications", "", btn("Settings", "ghost", icon_name="settings", href=page("account-notifications")))
          + card(empty("You’re all caught up", "We’ll let you know when something needs you.", icon_name="bell"), cls="card--flush"))


# ------------------------------------------------------------------ personal notification preferences
YOUTH_TOPICS = [
    ("learning", "Grades and badges", "When your work is graded, a quiz score is approved or you earn a badge.", True),
    ("assignments", "Assigned work", "When your mentor assigns you a lesson, quiz or assignment.", True),
    ("messages", "Messages", "When someone writes to you in a conversation.", True),
    ("announcements", "Announcements", "When an announcement for your programs is posted.", False),
]
MENTOR_TOPICS = [YOUTH_TOPICS[2], YOUTH_TOPICS[3]]
STAFF_TOPICS = [
    ("incidents", "Incidents to review", "When an incident is reported.", True),
    ("mentoring", "At-risk flags", "When a mentor flags a youth as at risk.", True),
]


def prefs_hdr() -> str:
    return (breadcrumb([("Your account", page("account"))], "Notifications")
            + page_header("Notifications", "Choose what reaches you in the app. You still see everything in the center you chose to get."))


def prefs_form(topics, *, busy: bool = False, saved: bool = False, alert_html: str = "") -> str:
    rows = "".join(f'<div class="stack stack--tight">{switch("pref-" + k, esc(t), checked=on, desc=esc(d))}</div>' for k, t, d, on in topics)
    status_ = f'<p class="save-status save-status--saved" role="status">{icon("check")}Saved just now</p>' if saved else ""
    return (f'<form class="stack form-width--md" action="#" method="post" novalidate>{alert_html}'
            + card(f'<fieldset class="fieldset"><legend class="visually-hidden">In the app</legend><div class="stack">{rows}</div></fieldset>', title="What we notify you about", tid="topics")
            + f'<div class="form-actions cluster">{status_}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')


@screen("account-notifications", "page", "Notification preferences", route="/account/notifications", reqs=R_PREFS,
        na={"forbidden": "Everyone sets their own; nobody can open another person’s.", "invalid": "Switches are always valid; a refused save shows the failed state."})
def account_notifications(S):
    S.add("default", "Sofía chooses what reaches her: grades and badges, assigned work, messages and announcements, each with what it covers; she has turned announcements off.", **YKW, unread=3,
          main=prefs_hdr() + prefs_form(YOUTH_TOPICS),
          notes=note("GET /notifications/preferences offers only the kinds her role receives whose module is on. Everything starts on. Email for these is not offered yet.", "top: 5rem; right: 1rem;"))
    S.add("mentor", "Daniel’s choices: messages and announcements.", **MKW, unread=1, main=prefs_hdr() + prefs_form([(k, t, d, True) for k, t, d, _ in MENTOR_TOPICS]))
    S.add("staff", "Marisol (Program director): incidents to review and at-risk flags.", nav="", user=MARISOL, unread=2, main=prefs_hdr() + prefs_form(STAFF_TOPICS))
    S.add("module-off", "Messages is off: no choice is offered for messages or announcements.", **(YKW | {"modules": ["today", "learning", "schedule"]}), unread=1,
          main=prefs_hdr() + prefs_form(YOUTH_TOPICS[:2]))
    S.add("empty", "Leo (Volunteer) receives none of these kinds: the page says so.", nav="", role="volunteer", user=STAFF["leo"], unread=0,
          modules=["today", "check-in", "my-schedule"],
          main=prefs_hdr() + card(empty("Nothing to choose yet", "Notifications for your role arrive in the center. There are no choices to make for them.", icon_name="bell"), cls="card--flush"))
    S.add("loading", "Loading: the form as a skeleton.", **YKW, unread=3, main=prefs_hdr() + skeleton_form(4))
    S.add("error", "The preferences failed to load; the header stays and Try again reloads.", **YKW, unread=3, main=prefs_hdr() + failed("We couldn’t load your notification preferences"))
    S.add("submitting", "Saving: Save changes is busy.", **YKW, unread=3, main=prefs_hdr() + prefs_form(YOUTH_TOPICS, busy=True))
    S.add("success", "Saved: a toast and Saved just now; announcements no longer reach her in the app.", **YKW, unread=3,
          main=prefs_hdr() + prefs_form(YOUTH_TOPICS, saved=True), toast_html=toast_region(toast("success", "Notification preferences saved")))
    S.add("failed", "The save failed: the switches keep her choices and nothing changed.", **YKW, unread=3,
          main=prefs_hdr() + prefs_form(YOUTH_TOPICS, alert_html=alert("danger", "That didn’t go through", "Your preferences are unchanged. Try again.")))
