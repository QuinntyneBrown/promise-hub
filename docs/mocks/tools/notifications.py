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


# ------------------------------------------------------------------ Learning Bond (L1-026 to L1-029)
from pages_learning_bond import SENDER, PROVIDER, SMS_EN, SMS_ES, email_preview  # noqa: E402

R_SD_X = ["L2-161", "L2-162", "L2-163"]


def _region(p):
    return f'<div class="push-region" role="status" aria-live="polite">{p}</div>'


@screen("learning-bond-sms", "notification", "Learning Bond text", opens_from="guardian-learning-bond", reqs=["L2-139", "L2-150", "L2-151", "L2-157", "L2-158", "L1-027", "L1-028"] + R_SD_X, na={})
def learning_bond_sms(S):
    n = note("Every Learning Bond text goes through Messages in the household’s language: the SMS cap, STOP replies and the email fallback apply. No text ever carries a SIN, an income answer or a document (L2-159).", "bottom: 6rem; left: 1rem;")
    S.add("info", "The invitation: the platform text with the organization’s sender name, naming each eligible child (L2-139).", **on("guardian-learning-bond", "verify", overlays=_region(push("info", "Messages", "Mon 10:00 am", SENDER, SMS_EN)), notes=n))
    S.add("es", "The invitation in Spanish, the Rivera household’s language.", **on("guardian-learning-bond", "verify", overlays=_region(push("info", "Mensajes", "lun 10:00 am", SENDER, SMS_ES)), lang="Español"))
    S.add("success", "The provider received the application (L2-150).", **on("guardian-learning-bond", "in-progress", overlays=_region(push("success", "Messages", "Mon 9 Nov", SENDER, f"{SENDER}: {PROVIDER} received Mateo’s application. Next, the Government of Canada checks your tax returns. hbv.ph/sd/4r7k"))))
    S.add("deposited", "The deposit, with the amount; it counts in the dashboard and the running total.", **on("guardian-learning-bond", "in-progress", overlays=_region(push("success", "Messages", "Fri 22 Jan", SENDER, f"{SENDER}: $1,400 was deposited in Mateo’s RESP. You’ve unlocked $1,400 so far. hbv.ph/sd/4r7k"))))
    S.add("warning", "The provider needs a document (L2-150).", **on("guardian-learning-bond", "in-progress", overlays=_region(push("warning", "Messages", "Tue 10 Nov", SENDER, f"{SENDER}: {PROVIDER} needs proof of address for Mateo. Tap to send it: hbv.ph/sd/4r7k/doc"))))
    S.add("paused-reminder", "The 14-day reminder for a paused claim, with the link to resume (L2-151).", **on("learning-bond-paused", "default", overlays=_region(push("info", "Messages", "Thu 19 Nov", SENDER, f"{SENDER}: when you have Mateo’s SIN, pick up his Learning Bond claim here: hbv.ph/sd/4r7k. One more reminder in two weeks, then we’ll stop."))))
    S.add("reminder", "A dated reminder from the benefits check (L2-157).", **on("learning-bond-reminders", "default", overlays=_region(push("info", "Messages", "Mon 15 Mar 2027", SENDER, f"{SENDER}: file your 2026 taxes to keep the Learning Bond and the Ontario Child Benefit coming. Free clinics in Hamilton: hbv.ph/sd/4r7k/tax"))))
    S.add("benefit-started", "A program reported a benefit started: the running total in the text (L2-158).", **on("learning-bond-total", "default", overlays=_region(push("success", "Messages", "Mon 7 Dec", SENDER, f"{SENDER}: Ontario Child Benefit has started for your family. You’ve unlocked $3,080 so far. hbv.ph/sd/4r7k/total"))))
    S.add("danger", "A text that couldn’t be delivered falls back to email; the guardian page shows the same content.", **on("guardian-learning-bond", "in-progress", overlays=_region(push("danger", "Messages", "Mon 9 Nov", SENDER, f"{SENDER}: we couldn’t text 905-555-0142. Mateo’s updates go to carmen.rivera@example.com instead. Change your number: hbv.ph/g/8k2q"))))


@screen("learning-bond-staff-notice", "notification", "Learning Bond staff notices", opens_from="learning-bond-families", reqs=["L2-136", "L2-137", "L2-138", "L2-140", "L2-142", "L1-026"] + R_SD_X, na={})
def learning_bond_staff_notice(S):
    def panel(items: str, unread=2):
        header = f'<div class="bell-panel__header"><strong id="bell-title">Notifications</strong>{btn("Mark all read", "ghost", size="sm") if unread else ""}</div>'
        return (f'<div class="backdrop" style="background: transparent;"></div><div class="bell-panel" role="dialog" aria-labelledby="bell-title" style="position: fixed; top: calc(var(--layout-topbar-height) + var(--space-4)); right: var(--layout-margin);" data-dismiss-on-escape>{header}{items}'
                f'<div class="bell-panel__footer"><a href="{page("notifications")}">See all</a></div></div>')
    items = (f'<ul class="notice-list"><li class="notice notice--unread">{avatar(GUARDIANS["linh"])}<div class="notice__body"><strong>Linh Tran</strong> asked for a call about Learning Bond · 289-555-0119 · afternoons. <a href="{page("learning-bond-families", "call-requested")}">Open</a><div class="notice__meta">Today, 2:10 pm · Unread</div></div></li>'
             f'<li class="notice notice--unread"><span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("shield", "icon--sm")}</span><div class="notice__body"><strong>Agreement signed</strong> by Rev. Angela Baptiste, Board chair: Learning Bond data-handling agreement version 2. <a href="{page("learning-bond-agreement", "accepted")}">Open</a><div class="notice__meta">Thu 29 Oct, 6:12 pm · Unread</div></div></li></ul>')
    S.add("info", "The bell panel: a call request names the household, the number and the time of day for staff in the status roles; the signer’s acceptance tells the admin (L2-142, L2-137).", **on("learning-bond-families", "default", overlays=panel(items), user=STAFF["jaylen"], unread=2))
    S.add("success", "Coverage saved (L2-138).", **on("learning-bond-coverage", "default", toast_html=toast_region(toast("success", "Learning Bond settings saved", "After‑School Tutoring and Saturday Sports · 112 households")), user=STAFF["tom"]))
    S.add("warning", "A new agreement version: Launch paused until it is accepted; families in progress continue (L2-136).", **on("learning-bond-dashboard", "default", user=STAFF["marisol"],
          main=alert("warning", "A new version of the agreement needs accepting.", "No new invitation goes out until Tom or a named signer accepts version 3. Claims under way continue.", actions=btn("Read version 3", "primary", size="sm", href=page("learning-bond-agreement")), banner=True) + base("learning-bond-dashboard", "default")["main"]))
    S.add("danger", "The launch job failed to send: nothing went out; the admin retries.", **on("learning-bond-launch", "scheduled", user=STAFF["tom"],
          toast_html=toast_region(toast("danger", "Invitations didn’t go out", "The SMS provider didn’t answer at 10:00 am. Nothing was sent. Try again or choose another day.", action="Try again", progress_=False), alert_=True)))
    S.add("invited", "Staff invited a household at the door (L2-140).", **on("learning-bond-families", "default", toast_html=toast_region(toast("success", "Petrov household invited", "Texted Elena Petrova at 4:48 pm")), user=STAFF["jaylen"]))


@screen("learning-bond-email", "notification", "Learning Bond emails", opens_from="learning-bond-agreement", reqs=["L2-137", "L2-139", "L2-140", "L1-026"] + R_SD_X,
        na={"warning": "Learning Bond sends no warning email; a needed document is texted (learning-bond-sms/warning).", "danger": "Learning Bond sends no failure email; failures surface to staff as toasts (learning-bond-staff-notice/danger)."})
def learning_bond_email(S):
    def mail(title, text, action, href, footer):
        return card(f'<div class="email"><p class="email__title">{title}</p><p class="email__text">{text}</p><p class="email__action"><a class="email__button" href="{href}">{action}</a></p><p class="email__footer">{footer}</p></div>', cls="card--flush")
    def over_page(sid, state, html, **kw):
        k = on(sid, state, **kw)
        k["overlays"] = f'<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title"><div class="dialog__panel"><div class="dialog__header"><div class="dialog__heading"><h2 class="dialog__title" id="dlg-title">Email preview</h2></div><button class="btn btn--ghost btn--icon" type="button" aria-label="Close">{icon("x")}</button></div><div class="dialog__body stack">{html}</div></div></div>'
        k["inert"] = True
        return k
    S.add("info", "The signer’s email from “Harbourview Youth Collective via PromiseHub” with the single-use link (L2-137).", **over_page("learning-bond-agreement", "waiting-signer", mail(
        "Tom Nguyen asked you to accept the Learning Bond data-handling agreement", f"Hello Angela. Harbourview Youth Collective wants to offer Learning Bond, which helps families claim the Canada Learning Bond and child benefits. Someone with authority has to accept a one-page agreement about what it collects and where it goes. Tom named you, as board chair. The link works for 14 days and once.",
        "Read and accept", page("learning-bond-agreement", "signer"), f"Harbourview Youth Collective via PromiseHub · Hamilton, Ontario · Questions? tom@harbourview.example"), user=STAFF["tom"]))
    S.add("success", "The admin’s email when the signer accepts.", **over_page("learning-bond-agreement", "accepted", mail(
        "Rev. Angela Baptiste accepted the Learning Bond agreement", "Angela Baptiste, Board chair, accepted version 2 on Thu 29 Oct 2026 at 6:12 pm. It’s recorded in your audit log. You can now choose coverage and plan the launch.",
        "Open Learning Bond settings", page("settings-learning-bond"), "PromiseHub for Harbourview Youth Collective"), user=STAFF["tom"]))
    S.add("invitation", "The email-only invitation for a guardian with no mobile number (L2-140).", **over_page("learning-bond-invitation", "default", email_preview("en"), user=STAFF["tom"]))
