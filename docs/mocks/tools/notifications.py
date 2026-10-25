"""Notifications: toasts, banners, the bell panel, inline alerts and the texts guardians receive, each on the page that triggers it."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_core import R_SLIPS, R_ROLL, R_NOTIFY, R_INC, R_ENROLL
from pages_admin import R_COST
from dialogs import base

R_MOBILE = "L1-014"


def on(sid: str, state: str = "default", **extra) -> dict:
    kw = base(sid, state)
    kw.update(extra)
    return kw


# ------------------------------------------------------------------ Toasts
@screen("toast", "notification", "Toast", opens_from="check-in", reqs=[R_ROLL, R_SLIPS, R_NOTIFY], na={})
def toasts(S):
    n = note("Toasts rise from the bottom (above the tab bar on phones), auto-dismiss after 8 s and pause on hover or focus. Danger toasts never auto-dismiss.", "bottom: 12rem; left: 1rem;")
    S.add("info", "Neutral information: the no-show alert went out.", **on("check-in", toast_html=toast_region(toast("info", "No-show texts sent", "Amara’s and Omar’s guardians · 4:15 pm")), notes=n))
    S.add("success", "Something completed, with Undo because it is reversible.", **on("check-in", toast_html=toast_region(toast("success", "Kevin Tran checked in", "4:16 pm · 32 of 48 now here", action="Undo"))))
    S.add("warning", "Needs attention, nothing broke.", **on("check-in", toast_html=toast_region(toast("warning", "Saved on this phone", "Kevin’s check-in sends when online.", action="See queue"))))
    S.add("danger", "Something failed; says what and what to do; stays until dismissed.", **on("check-in", toast_html=toast_region(toast("danger", "Sign-out not saved", "Mateo still shows as checked in.", action="Try again", progress_=False), alert_=True)))
    S.add("with-action", "A toast carrying the primary follow-up: a signature just arrived.", **on("event", toast_html=toast_region(toast("success", "Carmen Rivera signed", "Mateo cleared · 42 of 48 signed", action="See slip status"))))
    S.add("stacked", "Three toasts at once: newest at the bottom, each dismissible, the danger one persistent.", **on("check-in", toast_html=toast_region(
        toast("success", "Kevin Tran checked in", "4:16 pm", action="Undo") + toast("info", "No-show texts sent", "2 guardians · 4:15 pm") + toast("danger", "Sign-out not saved", "Mateo still shows as checked in.", action="Try again", progress_=False)),
        notes=note("At most three toasts show; older ones collapse into the newest. Order is oldest on top so the newest is nearest the thumb.", "bottom: 20rem; left: 1rem;")))


# ------------------------------------------------------------------ Banners
@screen("banner", "notification", "Banner", opens_from="today", reqs=[R_MOBILE, R_COST, R_ENROLL], na={})
def banners(S):
    def with_banner(sid, state, b, **kw):
        k = on(sid, state, **kw)
        k["main"] = b + k["main"]
        return k
    S.add("info", "Planned maintenance, dismissible, shown a day ahead.", **with_banner("today", "default", alert("info", "Maintenance Sunday 6:00–6:30 am", "Check-in and Quick Cards keep working offline.", banner=True, dismiss=True)))
    S.add("success", "The import finished while the admin was elsewhere.", **with_banner("families", "default", alert("success", "Roster imported: 109 of 112 rows", "3 families need a guardian phone or email.", actions=btn("Fix the 3 families", "primary", size="sm", href=page("families", "edge")), banner=True, dismiss=True)))
    S.add("warning", "Offline: cached data, actions queued; stays until the connection returns.", **with_banner("check-in", "default", alert("warning", "You’re offline", "Roster saved at 3:58 pm. 2 check-ins will send when online.", actions=btn("See queue", "", size="sm", data_href=dialog("offline-queue")), banner=True)))
    S.add("danger", "The monthly SMS cap is reached; texts pause, email continues.", **with_banner("messages", "default", alert("danger", "SMS cap reached: 2,000 of 2,000 segments", "Texts paused until 1 December. Email still sends.", actions=btn("Raise the cap", "primary", size="sm", href=page("settings-notifications")) + btn("Remind me on 1 Dec", "ghost", size="sm"), banner=True)))
    S.add("persistent", "The free tier is full; stays until the plan changes.", **with_banner("today", "default", alert("warning", "50 of 50 free-plan children: 3 enrollments are waiting", "Move to Standard ($89/month) or archive a program.", actions=btn("See plans", "primary", size="sm", href=page("billing", "limit-reached")), banner=True), user=STAFF["tom"]))
    S.add("verify", "A new admin hasn’t confirmed their email; persistent with a resend.", **with_banner("today", "default", alert("info", "Confirm your email to receive incident reports", "Link sent to tom@harbourview.example.", actions=btn("Resend link", "", size="sm") + btn("Change email", "ghost", size="sm", href=page("account")), banner=True), user=STAFF["tom"]))


# ------------------------------------------------------------------ Bell panel
@screen("bell", "notification", "Bell panel", opens_from="today", reqs=[R_NOTIFY, R_SLIPS, R_INC], na={"info": "The panel lists notices of mixed kinds; see unread, read and empty.", "success": "See unread.", "warning": "See unread.", "danger": "See unread."})
def bell(S):
    def panel(items: str, unread=2, empty_=False):
        header = f'<div class="bell-panel__header"><strong id="bell-title">Notifications</strong>{btn("Mark all read", "ghost", size="sm") if unread else ""}</div>'
        body = items if not empty_ else f'<div class="bell-panel__empty">{empty("You’re all caught up", "New notices land here.", icon_name="bell")}</div>'
        return (f'<div class="backdrop" style="background: transparent;"></div><div class="bell-panel" role="dialog" aria-labelledby="bell-title" style="position: fixed; top: calc(var(--layout-topbar-height) + var(--space-4)); right: var(--layout-margin);" data-dismiss-on-escape>{header}{body}'
                f'<div class="bell-panel__footer"><a href="{page("notifications")}">See all</a></div></div>')
    items = (f'<ul class="notice-list"><li class="notice notice--unread">{avatar(GUARDIANS["carmen"])}<div class="notice__body"><strong>Carmen Rivera</strong> signed Mateo’s slip for the RBG trip. <a href="{page("event")}">See slip status</a><div class="notice__meta">Today, 3:41 pm · Unread</div></div></li>'
             f'<li class="notice notice--unread"><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("flag", "icon--sm")}</span><div class="notice__body"><strong>Incident reported</strong> by Jaylen Okafor: fall on the stairs. <a href="{page("incident")}">Open report</a><div class="notice__meta">Today, 5:52 pm · Unread</div></div></li>'
             f'<li class="notice"><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("alert-triangle", "icon--sm")}</span><div class="notice__body"><strong>Email bounced</strong> for Bola Adeyemi. <a href="{page("household")}">Fix email</a><div class="notice__meta">Yesterday, 5:06 pm</div></div></li></ul>')
    S.add("unread", "Two unread notices in the bell panel.", **on("today", overlays=panel(items), user=STAFF["marisol"]))
    S.add("read", "All read: no badge, no Mark all read.", **on("today", overlays=panel(items.replace(" notice--unread", "").replace(" · Unread", ""), unread=0), unread=0, user=STAFF["marisol"]))
    S.add("empty", "Nothing yet.", **on("today", overlays=panel("", unread=0, empty_=True), unread=0, user=STAFF["marisol"]))


# ------------------------------------------------------------------ Inline alerts
@screen("inline-alert", "notification", "Inline alert", opens_from="event", reqs=[R_SLIPS, R_ROLL, "L1-008"], na={})
def inline(S):
    def inject(sid, state, html, after='<div class="split">', **kw):
        k = on(sid, state, **kw)
        k["main"] = k["main"].replace(after, html + after, 1)
        return k
    S.add("info", "Slip deadline approaching, on the event page.", **inject("event", "default", alert("info", "Slips are due in 7 days", "7 households haven’t signed.")))
    S.add("success", "Everyone cleared: the trip can go ahead.", **inject("event", "default", alert("success", "All 48 slips signed", "2 days before the deadline.")))
    S.add("warning", "Medical information older than a year on a child’s profile.", **inject("child", "default", alert("warning", "Medical details are 14 months old", "Last confirmed September 2025.", actions=btn("Text Carmen the form", "primary", size="sm", data_href=dialog("send-reminder"))), after='<div class="split">', user=STAFF["tom"]))
    S.add("danger", "A child on today’s roster has no emergency contact that works.", **inject("check-in", "default", alert("danger", "No working number for Grace Adeyemi’s guardian", "Email bounced, no mobile. Ask at pickup tonight.", actions=btn("Open household", "primary", size="sm", href=page("household"))), after='<div class="roster-summary"'))
    S.add("with-action", "An alert with the primary action inside it: send the reminder.", **inject("event", "default", alert("warning", "7 slips unsigned, due Thursday", "Linh Tran, Elena Petrova and 5 others.", actions=btn("Text the 7", "primary", size="sm", icon_name="send", data_href=dialog("send-reminder")) + btn("Show who", "ghost", size="sm"))))


# ------------------------------------------------------------------ Texts the guardian receives (shown as phone notifications over the guardian page)
@screen("guardian-sms", "notification", "Guardian text", opens_from="guardian-update", reqs=[R_NOTIFY, R_SLIPS, R_ROLL, "L1-019"], na={})
def guardian_sms(S):
    def region(p):
        return f'<div class="push-region" role="status" aria-live="polite">{p}</div>'
    n = note("These are the texts as Carmen’s phone shows them. Every text starts with the organization’s short name and ends with an opt-out; links open the pages in this set without an account.", "bottom: 6rem; left: 1rem;")
    S.add("info", "A permission slip to sign.", **on("guardian-update", overlays=region(push("info", "Messages", "now", "Harbourview Youth", "Harbourview Youth: sign Mateo’s slip for the RBG trip by Thu 12 Nov: hbv.ph/s/8k2q (STOP to opt out)")), notes=n))
    S.add("success", "Receipt after signing.", **on("guardian-update", overlays=region(push("success", "Messages", "3:41 pm", "Harbourview Youth", "Harbourview Youth: Mateo is cleared for the RBG trip, Sat 14 Nov. Bus 8:45 am. hbv.ph/s/8k2q"))))
    S.add("warning", "The no-show alert, 15 minutes after the session started.", **on("guardian-update", overlays=region(push("warning", "Messages", "4:15 pm", "Harbourview Youth", "Harbourview Youth: Amara hasn’t arrived at Tutoring (4:00 pm). Reply 1 on the way, 2 absent, or call 905-555-0181.")), notes=note("Configurable delay (Settings › Notifications, default 15 min). Replies update the roster: 1 keeps her as expected, 2 marks her absent.", "bottom: 6rem; left: 1rem;")))
    S.add("danger", "An event cancelled on the day.", **on("guardian-update", overlays=region(push("danger", "Messages", "7:02 am", "Harbourview Youth", "Harbourview Youth: CANCELLED, today’s Saturday Sports (10 am). Gym closed for voting. See you 7 Nov.")), lang="English"))
    S.add("stacked", "Two texts close together: slip reminder and a reply confirmation.", **on("guardian-update", overlays=region(push("info", "Messages", "6:00 pm", "Harbourview Youth", "Harbourview Youth: sign Sofía’s RBG slip by Thursday: hbv.ph/s/9m3r") + push("success", "Messages", "6:04 pm", "Harbourview Youth", "Thanks! Sofía is cleared."))))
    S.add("es", "The slip text in Spanish for a Spanish-speaking household.", **on("guardian-update", overlays=region(push("info", "Mensajes", "ahora", "Harbourview Youth", "Harbourview Youth: firme la autorización de Mateo para la excursión RBG antes del jue 12 nov: hbv.ph/s/8k2q (STOP para salir)")), lang="Español"))
