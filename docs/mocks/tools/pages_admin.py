"""Admin, shell and entry pages: settings, staff, privacy, audit log, billing, account, notifications, search, errors, auth."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_core import R_NOTIFY, R_PRIVACY, R_DATA, R_ROLL, R_SLIPS, R_INC, R_ENROLL
from pages_ops import form_actions, skeleton_form

M = STAFF["marisol"]
T = STAFF["tom"]
J = STAFF["jaylen"]
R_SEC, R_COST, R_TTV, R_COMPL = "L1-016", "L1-020", "L1-004", "L1-015"

SETTINGS_TABS = [("Organization", "settings"), ("Modules", "settings-modules"), ("Staff and roles", "staff"), ("Notifications", "settings-notifications"), ("Privacy and data", "settings-privacy"), ("Billing", "billing")]


def settings_nav(cur: str) -> str:
    return tabs_nav([(t, page(sid), sid == cur) for t, sid in SETTINGS_TABS], "Settings sections")


# ------------------------------------------------------------------ Settings: organization
@screen("settings", "page", "Settings", route="/settings", reqs=[R_COMPL, R_TTV], na={"empty": "Settings always have values."})
def settings(S):
    def form(err=None, busy=False, saved=False):
        e = err or {}
        return (f'<form class="card stack form-width--md" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + field("org", "Organization name", value=ORG, required=True, error=e.get("org", ""), help_="Shown to guardians.")
                + field("short", "Short name for texts", value="Harbourview Youth", help_="Under 20 characters.", error=e.get("short", ""))
                + f'<div class="two-col">{select("tz", "Time zone", ["America/Toronto", "America/Vancouver", "America/New_York"], selected="America/Toronto")}{select("country", "Country", ["Canada", "United States"], selected="Canada", help_="Sets data residency.")}</div>'
                + field("addr", "Main site address", value="100 Harbour St, Hamilton ON L8L 2A1")
                + field("reply", "Reply-to email", type_="email", value="hello@harbourview.example", error=e.get("reply", ""))
                + fieldset("Languages offered to guardians", choice("l", "English", type_="checkbox", checked=True, attrs=' name="l-en" disabled') + choice("l", "Spanish", type_="checkbox", checked=True, attrs=' name="l-es"') + choice("l", "French", type_="checkbox", checked=True, attrs=' name="l-fr"'))
                + f'<div class="form-actions cluster">{f"<p class=\"save-status save-status--saved\" role=\"status\">{icon("check")}Saved 2:10 pm</p>" if saved else ""}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')
    hdr = page_header("Settings", ORG) + settings_nav("settings")
    S.add("default", "Organization settings: name, short name, time zone, country, languages.", nav="settings", user=T, main=hdr + form())
    S.add("loading", "Settings loading.", nav="settings", main=page_header("Settings", "") + settings_nav("settings") + skeleton_form(6))
    S.add("error", "Settings failed to load.", nav="settings", main=page_header("Settings", "") + settings_nav("settings") + card(empty("We couldn’t load settings", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Short name too long and reply-to not an email.", nav="settings", user=T, main=hdr + form(err={"short": "Under 20 characters (yours is 27).", "reply": "Enter a valid email."}).replace('value="Harbourview Youth"', 'value="Harbourview Youth Collective"').replace('value="hello@harbourview.example"', 'value="hello@harbourview"'))
    S.add("submitting", "Saving settings.", nav="settings", user=T, main=hdr + form(busy=True))
    S.add("success", "Saved, with an inline saved status.", nav="settings", user=T, main=hdr + form(saved=True), toast_html=toast_region(toast("success", "Settings saved")))


# ------------------------------------------------------------------ Staff and roles
@screen("coverage", "page", "Staff coverage", route="/settings/coverage", reqs=[R_SEC], na={"loading": "Same as the staff list.", "empty": "See the gap state."})
def coverage(S):
    rows = [list_item("Tutoring night · Thu 5 Nov, 4–6 pm", "Jaylen Okafor, Aisha Bello", end=btn("Assign staff", "", size="sm")),
            list_item("Saturday Sports · Sat 7 Nov, 10 am–12 pm", "No one assigned yet", end=badge("Gap", "warning") + btn("Assign staff", "primary", size="sm"))]
    hdr = page_header("Staff coverage", "Next 14 days · 1 gap", btn("Invite a volunteer", "primary"))
    S.add("default", "Upcoming sessions with who works them; a session with no one is a gap. Coordinators assign staff and invite youth workers.", nav="settings", main=hdr + card(ul_list(rows, card=False, label="Upcoming sessions"), cls="card--flush"))
    S.add("error", "Coverage failed to load.", nav="settings", main=page_header("Staff coverage", "") + card(empty("Couldn’t load coverage", "Try again.", action=btn("Try again", "primary"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "Youth workers can't assign staff.", nav="settings", main='<h1>Only coordinators, site leads and directors assign staff</h1><p class="text-muted">Ask your site lead.</p>')


@screen("staff", "page", "Staff and roles", route="/settings/staff", reqs=[R_PRIVACY, R_SEC], na={})
def staff(S):
    hdr = page_header("Staff and roles", "5 staff · 2 admins with MFA · 3 invitations open", btn("Invite staff", "primary", icon_name="plus", data_href=dialog("invite-staff"))) + settings_nav("staff")
    roles = {"Program director": "success", "Site lead": "info", "Admin": "info", "Youth worker": "", "Volunteer coordinator": ""}

    def row(p, extra=""):
        return [f'<div class="cluster cluster--snug">{avatar(p)}{esc(p["name"])}</div>', badge(p["role"], roles[p["role"]]), extra or badge("Active", "success"), f'<div class="row-actions">{btn("Change role", "ghost", size="sm", data_href=dialog("change-role"))}{btn("Remove", "ghost", size="sm", data_href=dialog("remove-staff"))}</div>']
    tbl = table("Staff", ["Person", "Role", "Status", "Actions"], [row(M, badge("Admin · MFA on", "success")), row(T, badge("Admin · MFA on", "success")), row(J), row(STAFF["priya"]), row(STAFF["aisha"])])
    mail = f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("mail", "icon--sm")}</span>'
    acts = btn("Resend", "ghost", size="sm") + btn("Withdraw", "ghost", size="sm")
    invites = card(ul_list([list_item("sam.lee@example.org", "Youth worker · invited by Tom Nguyen · expires Mon 16 Nov", lead=mail, end=acts),
                            list_item("grace.adeyemi@example.org", "Mentor · invited by Tom Nguyen · expires Thu 19 Nov", lead=mail, end=acts),
                            list_item("yusuf.haddad@example.com", "Youth · Yusuf Haddad · invited by Tom Nguyen · expired Wed 4 Nov", lead=mail, end=badge("Expired") + badge("Asked for a new link", "warning") + btn("Resend", "primary", size="sm") + btn("Withdraw", "ghost", size="sm"))], card=False), title="Invitations · 3", tid="inv", cls="card--flush")
    perms = card(table("What each role can see", ["Role", "Medical", "Incidents", "Messages", "Settings"], [["Program director", "Yes", "Read and review", "Send", "All"], ["Admin", "Yes", "No", "Send", "All"], ["Site lead", "Yes", "Report", "Send to own programs", "No"], ["Youth worker", "Yes", "Report", "No", "No"], ["Volunteer coordinator", "No", "No", "Send to volunteers", "No"]], cls="table-wrap--flush"), title="Roles", tid="roles", cls="card--flush")
    S.add("default", "Staff with roles and MFA status; who can see medical data and incidents.", nav="settings", user=T, main=hdr + f'<div class="stack">{tbl}{invites}{perms}</div>')
    S.add("resent", "Tom resent Yusuf’s expired invitation: a fresh link that lasts 14 days, and the old link stops working.", nav="settings", user=T, main=hdr + f'<div class="stack">{tbl}{invites.replace(badge("Expired") + badge("Asked for a new link", "warning") + btn("Resend", "primary", size="sm"), btn("Resend", "ghost", size="sm")).replace("expired Wed 4 Nov", "expires Thu 19 Nov")}{perms}</div>',
          toast_html=toast_region(toast("success", "Invitation resent", "yusuf.haddad@example.com has a fresh link for 14 days.")))
    S.add("loading", "Staff loading.", nav="settings", main=page_header("Staff and roles", "") + settings_nav("staff") + skeleton_list(5, "Loading staff"))
    S.add("empty", "Only the founder so far.", nav="settings", user=M, main=page_header("Staff and roles", "1 staff") + settings_nav("staff") + card(empty("It’s just you so far", "Invite the people who run sessions.", action=btn("Invite staff", "primary", icon_name="plus", data_href=dialog("invite-staff")), icon_name="users"), cls="card--flush"))
    S.add("error", "Staff failed to load.", nav="settings", main=page_header("Staff and roles", "") + settings_nav("staff") + card(empty("We couldn’t load staff", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A site lead opening staff settings.", nav="settings", user=J, main=page_header("Staff and roles", "") + card(empty("Admins manage staff", "Ask Tom Nguyen or Marisol Delgado.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


# ------------------------------------------------------------------ Notifications settings
@screen("settings-notifications", "page", "Notification settings", route="/settings/notifications", reqs=[R_NOTIFY, R_ROLL, R_COST], na={"empty": "Settings always have values."})
def settings_notifications(S):
    def form(err=None, busy=False, saved=False):
        e = err or {}
        return (f'<form class="stack form-width--md" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + card(switch("noshow", "Text the guardian when a child isn’t checked in", checked=True) + field("delay", "Minutes after start", type_="number", value="15", inputmode="numeric", error=e.get("delay", ""), attrs=' min="5" max="60" style="max-width: 8rem;"')
                       + fieldset("Message", choice("ns", "“{child} hasn’t arrived at {session}. Reply if they’re on the way or absent today.”", checked=True) + choice("ns", "Custom text, per language")), title="No-show alert", tid="noshow")
                + card(fieldset("Slip reminders", choice("rem", "Tue and Thu at 6 pm until signed", checked=True) + choice("rem", "Daily at 6 pm until signed") + choice("rem", "Once, 2 days before the deadline")) + switch("escalate", "Email the site lead the day before if unsigned", checked=True), title="Permission slips", tid="slips")
                + card(fieldset("Default channel", choice("dc", "Email, text for reminders and same-day alerts", checked=True) + choice("dc", "Text first for everything")) + field("cap", "Monthly SMS cap (segments)", type_="number", value="2000", inputmode="numeric", error=e.get("cap", ""), help_="Used: 1,212 this month. At the cap, texts pause.", attrs=' style="max-width: 10rem;"'), title="Texts and cost", tid="sms")
                + card(switch("sup-inc", "Email supervisors on new incidents", checked=True) + switch("sup-bounce", "Email the admin on bounces", checked=True) + switch("sup-week", "Weekly summary every Monday at 8 am"), title="Staff emails", tid="staff")
                + f'<div class="form-actions cluster">{f"<p class=\"save-status save-status--saved\" role=\"status\">{icon("check")}Saved just now</p>" if saved else ""}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')
    hdr = page_header("Notifications", "No-show alerts, slip reminders, SMS cap") + settings_nav("settings-notifications")
    S.add("default", "No-show alert delay, slip reminder schedule, default channel and the SMS cap.", nav="settings", user=M, main=hdr + form())
    S.add("loading", "Loading.", nav="settings", main=page_header("Notifications", "") + settings_nav("settings-notifications") + skeleton_form(5))
    S.add("error", "Failed to load.", nav="settings", main=page_header("Notifications", "") + settings_nav("settings-notifications") + card(empty("We couldn’t load notification settings", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Delay out of range and a cap below what is already used.", nav="settings", user=M, main=hdr + form(err={"delay": "Choose between 5 and 60 minutes.", "cap": "Can’t be below 1,212, already used this month."}).replace('value="15"', 'value="2"').replace('value="2000"', 'value="1000"'))
    S.add("submitting", "Saving.", nav="settings", user=M, main=hdr + form(busy=True))
    S.add("success", "Saved.", nav="settings", user=M, main=hdr + form(saved=True), toast_html=toast_region(toast("success", "Notification settings saved")))
    S.add("forbidden", "A site lead opening notification settings.", nav="settings", user=J, main=page_header("Notifications", "") + card(empty("Admins configure notifications", "Ask an admin or a program director.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


# ------------------------------------------------------------------ Privacy and data
@screen("settings-privacy", "page", "Privacy and data", route="/settings/privacy", reqs=[R_PRIVACY, R_COMPL, R_SEC, R_DATA], na={"empty": "Settings always have values."})
def settings_privacy(S):
    def body(busy=False, saved=False):
        return (f'<form class="stack form-width--md" action="#" method="post" novalidate>'
                + card(facts([("Data residency", "Canada (Toronto region)"), ("Encryption", "At rest and in transit"), ("Multi-factor sign-in", "Required for admins · 2 of 2 enrolled"), ("Last security review", "Third-party, Sep 2026 · <a href=\"#residency\">Summary</a>")]), title="Residency and security", tid="residency")
                + card(fieldset("Keep consent records and slips for", choice("ret", "7 years after the event", checked=True) + choice("ret", "3 years after the event") + choice("ret", "Until deleted by request"))
                       + fieldset("Keep inactive family records for", choice("ret2", "2 seasons after the last enrollment, then anonymize", checked=True) + choice("ret2", "Until deleted by request"))
                       + f'<div class="form-actions cluster">{f"<p class=\"save-status save-status--saved\" role=\"status\">{icon("check")}Saved just now</p>" if saved else ""}{btn("Save retention", "primary", type_="submit", busy=busy)}</div>', title="Retention", tid="retention")
                + card(facts([("Consent needed under", "18 years"), ("Wording guardians sign", "I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, and to staff contacting them about their program.")])
                       + f'<div class="cluster" style="margin-top: var(--space-3);">{btn("Edit consent policy", "", icon_name="edit", data_href=dialog("consent-policy"))}</div>', title="Guardian consent", tid="consent")
                + card(f'<p class="text-muted">Export or delete a household on request. Both are logged.</p><div class="cluster" style="margin-top: var(--space-3);">{btn("Export a household", "", icon_name="download", data_href=dialog("export-data"))}{btn("Delete a household", "", icon_name="trash", data_href=dialog("delete-household"))}{btn("Open the audit log", "ghost", href=page("audit-log"))}</div>', title="Requests from guardians", tid="requests")
                + '<div class="danger-zone"><div><div class="section-title">Export everything</div><p class="text-muted">All data as CSV, emailed to admins.</p></div>' + btn("Export all data", "", icon_name="download", data_href=dialog("export-data")) + "</div>"
                + "</form>")
    hdr = page_header("Privacy and data", "Residency, retention, guardian requests, audit") + settings_nav("settings-privacy")
    S.add("default", "Where data lives, how long it is kept, and how guardian export and deletion requests are handled.", nav="settings", user=M, main=hdr + body())
    S.add("loading", "Loading.", nav="settings", main=page_header("Privacy and data", "") + settings_nav("settings-privacy") + skeleton_form(4))
    S.add("error", "Failed to load.", nav="settings", main=page_header("Privacy and data", "") + settings_nav("settings-privacy") + card(empty("We couldn’t load privacy settings", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("forbidden", "A site lead opening privacy settings.", nav="settings", user=J, main=page_header("Privacy and data", "") + card(empty("Admins set privacy", "Ask an admin or a program director.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))
    S.add("submitting", "Saving retention.", nav="settings", user=M, main=hdr + body(busy=True))
    S.add("success", "Saved.", nav="settings", user=M, main=hdr + body(saved=True), toast_html=toast_region(toast("success", "Retention saved")))
    S.add("consent-saved", "After saving the consent policy: youth under the new age need consent from their next request.", nav="settings", user=M, main=hdr + body().replace("18 years", "16 years"), toast_html=toast_region(toast("success", "Consent policy saved", "It applies from each youth’s next request.")))


# ------------------------------------------------------------------ Audit log
@screen("audit-log", "page", "Audit log", route="/settings/audit", reqs=[R_PRIVACY, R_SEC, R_DATA], na={})
def audit_log(S):
    hdr = page_header("Audit log", "4,812 entries this season", btn("Export", "", icon_name="download", data_href=dialog("export-data"))) + settings_nav("settings-privacy")
    filters = (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="au-q">Search the log</label><input class="input" id="au-q" type="search" placeholder="Child, staff member or action"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
               f'{select("au-what", "Action", ["All actions", "Viewed medical", "Changed record", "Signed slip", "Exported", "Deleted"], visually_hidden_label=True)}{select("au-when", "Period", ["Last 7 days", "Last 30 days", "This season"], visually_hidden_label=True)}</div>')
    rows = [["<span class=\"mono\">2026-11-05 15:41</span>", "Carmen Rivera (guardian)", "Signed slip", "Mateo Rivera · RBG trip", "Phone, Hamilton"], ["<span class=\"mono\">2026-11-05 13:10</span>", "Tom Nguyen", "Accepted enrollment", "3 children · After‑School Tutoring", "Laptop"],
            ["<span class=\"mono\">2026-11-04 20:22</span>", "Nour Haddad (guardian)", "Changed medical", "Yusuf Haddad · medication note", "Phone, Hamilton"], ["<span class=\"mono\">2026-11-02 09:10</span>", "Tom Nguyen", "Viewed medical", "Mateo Rivera", "Laptop"],
            ["<span class=\"mono\">2026-11-01 17:30</span>", "Marisol Delgado", "Exported", "Reports · OTF template · 184 children", "Laptop"], ["<span class=\"mono\">2026-10-30 14:14</span>", "Priya Raman", "Sent message", "62 guardians · Saturday Sports cancelled", "Laptop"]]
    S.add("default", "Who viewed or changed what, when, from where.", nav="settings", user=M, main=hdr + filters + table("Audit log", ["When", "Who", "Action", "Record", "Device"], rows) +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–50 of 4,812</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')
    S.add("forbidden", "A program director opening the audit log.", nav="settings", user=M, main=card(empty("Admins read the audit log", "Ask Tom Nguyen or another admin.", action=btn("Back to Today", "", href=page("today")), icon_name="lock", heading="h1"), cls="card--flush"))
    S.add("loading", "Audit log loading.", nav="settings", main=page_header("Audit log", "") + settings_nav("settings-privacy") + skeleton_list(8, "Loading log"))
    S.add("empty", "A brand-new organization with nothing logged.", nav="settings", user=M, main=page_header("Audit log", "") + settings_nav("settings-privacy") + card(empty("Nothing logged yet", "Views, changes and exports appear here.", icon_name="shield"), cls="card--flush"))
    S.add("error", "Audit log failed to load.", nav="settings", main=page_header("Audit log", "") + settings_nav("settings-privacy") + card(empty("We couldn’t load the audit log", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "A search that matches nothing in the period.", nav="settings", user=M, main=hdr + filters.replace('placeholder="Child, staff member or action"', 'value="Petrov"') + card(empty("No entries for “Petrov” in the last 7 days", "Widen the period.", action=btn("Search this season", "") + btn("Clear", "ghost"), icon_name="search"), cls="card--flush"))
    S.add("long", "A season of entries with the period widened; the table scrolls inside its wrap on phones.", nav="settings", user=M, main=hdr + filters.replace('<option selected>Last 7 days</option>', '<option>Last 7 days</option>').replace('<option>This season</option>', '<option selected>This season</option>') + table("Audit log", ["When", "Who", "Action", "Record", "Device"], rows * 4) +
          f'<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–50 of 4,812</span><div class="cluster cluster--snug">{btn("Previous", "", disabled=True)}{btn("Next", "", icon_name="arrow-right")}</div></nav>')


# ------------------------------------------------------------------ Billing
@screen("billing", "page", "Billing", route="/settings/billing", reqs=[R_COST], na={"empty": "Billing always shows a plan."})
def billing(S):
    hdr = page_header("Billing", "Standard plan · $89/month · renews 1 December") + settings_nav("billing")

    def meter(children=184, cap=500, sms=1212, smscap=2000, kind=""):
        return card(f'<div class="plan-meter"><div class="plan-meter__row"><span>Active children</span><span>{children} of {cap}</span></div>{progress(children, cap, "Active children", kind=kind, show="")}'
                    f'<div class="plan-meter__row" style="margin-top: var(--space-3);"><span>SMS segments this month</span><span>{sms:,} of {smscap:,}</span></div>{progress(sms, smscap, "SMS segments", kind="warning" if sms / smscap > 0.6 else "", show="")}'
                    f'<p class="hint">No per-seat charges.</p></div>', title="Usage", tid="usage")
    plan = card(facts([("Plan", "Standard · up to 500 active children · $89/month"), ("Payment", "Visa ···· 4242 · Tom Nguyen"), ("Next invoice", "1 Dec 2026 · $89 + $6.40 SMS overage so far"), ("Invoices", "<a href=\"#usage\">Nov 2026</a> · <a href=\"#usage\">Oct 2026</a> · <a href=\"#usage\">Sep 2026</a>")]) + f'<div class="cluster">{btn("Change plan", "", data_href=dialog("change-plan"))}{btn("Update card", "", icon_name="credit-card", data_href=dialog("change-plan"))}{btn("Raise SMS cap", "ghost", href=page("settings-notifications"))}</div>', title="Plan", tid="plan")
    S.add("default", "Standard plan, usage against limits, payment and invoices.", nav="settings", user=T, main=hdr + f'<div class="split">{plan}{meter()}</div>')
    S.add("loading", "Billing loading.", nav="settings", main=page_header("Billing", "") + settings_nav("billing") + skeleton_form(4))
    S.add("error", "Billing failed to load.", nav="settings", main=page_header("Billing", "") + settings_nav("billing") + card(empty("We couldn’t load billing", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("free", "The free tier: 48 of 50 children, with what happens at the limit.", nav="settings", user=T, main=page_header("Billing", "Free plan · up to 50 active children") + settings_nav("billing") +
          f'<div class="split">{card(facts([("Plan", "Free · up to 50 active children · email unlimited · 200 SMS segments a month"), ("Next", "Standard: $89/month, 500 children, 2,000 segments.")]) + f"<div class=\"cluster\" style=\"margin-top: var(--space-4);\">{btn("Move to Standard", "primary", data_href=dialog("change-plan"))}</div>", title="Plan", tid="plan")}{meter(48, 50, 140, 200, kind="warning")}</div>')
    S.add("limit-reached", "At the free-tier limit: new enrollments wait until the plan changes; nothing is lost.", nav="settings", user=T, main=page_header("Billing", "Free plan · 50 of 50 active children") + settings_nav("billing") +
          alert("warning", "You’ve reached 50 active children", "3 enrollments are waiting. Move to Standard or archive a program.", actions=btn("Move to Standard", "primary", size="sm", data_href=dialog("change-plan")) + btn("Archive a program", "ghost", size="sm", href=page("programs"))) +
          f'<div class="split">{card(facts([("Plan", "Free · up to 50 active children")]), title="Plan", tid="plan")}{meter(50, 50, 140, 200, kind="danger")}</div>')
    S.add("forbidden", "A program director opening billing.", nav="settings", user=M, main=card(empty("Admins manage billing", "Ask Tom Nguyen or another admin.", action=btn("Back to Today", "", href=page("today")), icon_name="lock", heading="h1"), cls="card--flush"))
    S.add("payment-failed", "The card was declined: a grace period, no lockout.", nav="settings", user=T, main=hdr + alert("danger", "Payment didn’t go through", "Visa ···· 4242 declined 1 Nov. Retry 8 Nov; service continues 14 days.", actions=btn("Update card", "primary", size="sm", icon_name="credit-card", data_href=dialog("change-plan"))) + f'<div class="split">{plan}{meter()}</div>')


# ------------------------------------------------------------------ Account
@screen("account", "page", "Your account", route="/account", reqs=[R_SEC], na={"empty": "An account always has a profile."})
def account(S):
    def form(err=None, busy=False, saved=False, mfa=True):
        e = err or {}
        return (f'<form class="stack form-width--md" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "")
                + card(f'<div class="cluster">{avatar(J, "lg")}<div><div class="section-title">Jaylen Okafor</div><div class="text-muted">Site lead · After‑School Tutoring, Saturday Sports</div></div></div>'
                       + field("name", "Name", value="Jaylen Okafor", required=True) + field("email", "Email", type_="email", value="jaylen@harbourview.example", error=e.get("email", "")) + field("phone", "Mobile", type_="tel", value="905-555-0181"), title="Profile", tid="profile")
                + card(field("pw1", "New password", type_="password", error=e.get("pw1", ""), help_="At least 12 characters.", autocomplete="new-password") + field("pw2", "Repeat it", type_="password", error=e.get("pw2", ""), autocomplete="new-password"), title="Password", tid="pw")
                + card((f'<div class="cluster cluster--between"><div><div class="section-title">Authenticator app</div><div class="text-muted">Added Tue 2 Sep 2026 · required for admins</div></div>{badge("On", "success")}</div><div class="cluster" style="margin-top: var(--space-3);">{btn("Show recovery codes", "", icon_name="key", data_href=dialog("recovery-codes"))}{btn("Turn off", "ghost", data_href=dialog("recovery-codes"))}</div>' if mfa else
                        f'<p class="text-muted">Takes two minutes with any authenticator app.</p><div class="cluster" style="margin-top: var(--space-3);">{btn("Set up two-step sign-in", "primary", icon_name="shield", data_href=dialog("recovery-codes"))}</div>'), title="Two-step sign-in", tid="mfa")
                + card(switch("n1", "Email me about unsigned slips the day before my events", checked=True) + switch("n2", "Email me a Monday summary") + switch("n3", "Text me when no-show alerts go out", checked=True), title="Your notifications", tid="notif")
                + card(ul_list([list_item("Fall on the stairs · Jordan Thompson", "Today, 5:52 pm · needs review", lead=f'<span class="icon-tile icon-tile--sm" aria-hidden="true">{icon("flag", "icon--sm")}</span>', href=page("incident"), end=badge("Needs review", "warning"))], card=False), title="Incidents you reported", tid="inc", cls="card--flush")
                + f'<div class="form-actions cluster">{f"<p class=\"save-status save-status--saved\" role=\"status\">{icon("check")}Saved just now</p>" if saved else ""}{btn("Sign out everywhere", "ghost", data_href=dialog("sign-out-all"))}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')
    hdr = page_header("Your account", "2 devices · last sign-in Today, 3:55 pm, this phone")
    S.add("default", "Profile, password, two-step sign-in, personal notifications and reported incidents.", nav="", main=hdr + form())
    S.add("loading", "Account loading.", nav="", main=page_header("Your account", "") + skeleton_form(6))
    S.add("error", "Account failed to load.", nav="", main=page_header("Your account", "") + card(empty("We couldn’t load your account", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))
    S.add("invalid", "Passwords don’t match and the email is taken.", nav="", main=hdr + form(err={"email": "Email already in use.", "pw2": "Passwords don’t match."}))
    S.add("submitting", "Saving.", nav="", main=hdr + form(busy=True))
    S.add("success", "Saved.", nav="", main=hdr + form(saved=True), toast_html=toast_region(toast("success", "Account saved")))
    S.add("mfa-off", "An admin without two-step sign-in sees the setup prompt.", nav="", user=T, main=alert("warning", "Admins must turn on two-step sign-in by 1 December", "Takes two minutes.", banner=True) + hdr.replace("2 devices", "1 device").replace("this phone", "a laptop") + form(mfa=False).replace("Jaylen Okafor", "Tom Nguyen").replace("Site lead · After‑School Tutoring, Saturday Sports", "Admin").replace("jaylen@harbourview.example", "tom@harbourview.example").replace(avatar(J, "lg"), avatar(T, "lg")))


# ------------------------------------------------------------------ Notification center
@screen("notifications", "page", "Notifications", route="/notifications", reqs=[R_NOTIFY, R_SLIPS, R_INC], na={})
def notifications(S):
    def item(p, text, when, unread=False, link=""):
        return (f'<li class="notice{" notice--unread" if unread else ""}">{avatar(p) if isinstance(p, dict) else f"<span class=\"icon-tile icon-tile--sm\" aria-hidden=\"true\">{icon(p, "icon--sm")}</span>"}<div class="notice__body">{text}{link}<div class="notice__meta">{when}{" · Unread" if unread else ""}</div></div></li>')
    items = [item(GUARDIANS["carmen"], "<strong>Carmen Rivera</strong> signed Mateo’s slip for the RBG trip.", "Today, 3:41 pm", True, f' <a href="{page("event")}">See slip status</a>'),
             item("flag", "<strong>Incident reported</strong> by Jaylen Okafor: Jordan Thompson, fall on the stairs.", "Today, 5:52 pm", True, f' <a href="{page("incident")}">Open report</a>'),
             item("alert-triangle", "<strong>Email bounced</strong> for Bola Adeyemi (Adeyemi household).", "Yesterday, 5:06 pm", False, f' <a href="{page("household")}">Fix email</a>'),
             item(T, "<strong>Tom Nguyen</strong> accepted 3 enrollments for After‑School Tutoring.", "Today, 1:10 pm"),
             item("clipboard", "<strong>7 slips still unsigned</strong> for the RBG trip, due Thursday.", "Today, 6:00 am", False, f' <a href="{dialog("send-reminder")}">Send a reminder</a>'),
             item("check-circle", "<strong>Roster imported</strong>: 109 of 112 rows, 3 to fix.", "Mon 2 Nov, 9:40 am")]
    hdr = page_header("Notifications", "2 unread", btn("Mark all read", "", icon_name="check") + btn("Settings", "ghost", icon_name="settings", href=page("account")))
    S.add("default", "Two unread notifications on top of this week’s.", nav="", main=hdr + f'<ul class="notice-list card card--flush" aria-label="Notifications">{"".join(items)}</ul>')
    S.add("read", "Everything read.", nav="", unread=0, main=hdr.replace("2 unread", "All read").replace(btn("Mark all read", "", icon_name="check"), "") + f'<ul class="notice-list card card--flush" aria-label="Notifications">{"".join(items).replace(" notice--unread", "").replace(" · Unread", "")}</ul>')
    S.add("loading", "Notifications loading.", nav="", main=page_header("Notifications", "") + skeleton_list(6, "Loading notifications"))
    S.add("empty", "Nothing yet.", nav="", unread=0, main=page_header("Notifications", "") + card(empty("You’re all caught up", "New activity lands here.", icon_name="bell"), cls="card--flush"))
    S.add("error", "Notifications failed to load.", nav="", main=page_header("Notifications", "") + card(empty("We couldn’t load notifications", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))


# ------------------------------------------------------------------ Search
@screen("search", "page", "Search", route="/search", reqs=[R_ENROLL], na={})
def search(S):
    def form_(q=""):
        return f'<form class="search-form input-group form-width--md" role="search" action="#"><label class="visually-hidden" for="q">Search children, families and events</label><input class="input input--lg" id="q" type="search" value="{esc(q)}" placeholder="Child, guardian, phone, event…" autofocus><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
    results = ('<div class="stack search-results">'
               f'<section class="search-group" aria-labelledby="g-ch"><h2 id="g-ch" class="search-group__title">Children (2)</h2>{ul_list([list_item("Mateo <mark>Rivera</mark>", "9 · Rivera household · After‑School Tutoring, Saturday Sports", person=CHILD["mateo"], href=page("child"), end=flag("Allergy")), list_item("Sofía <mark>Rivera</mark>", "12 · Rivera household · After‑School Tutoring", person=CHILD["sofia"], href=page("child"), end=flag("Asthma"))])}</section>'
               f'<section class="search-group" aria-labelledby="g-fam"><h2 id="g-fam" class="search-group__title">Families (1)</h2>{ul_list([list_item("<mark>Rivera</mark> household", "Carmen Rivera, Luis Rivera · 905-555-0142 · Spanish", person=GUARDIANS["carmen"], href=page("household"))])}</section>'
               f'<section class="search-group" aria-labelledby="g-ev"><h2 id="g-ev" class="search-group__title">Events (0)</h2><p class="text-muted">No events match.</p></section></div>')
    S.add("default", "Results for “Rivera” grouped by children, families and events.", nav="", main=page_header("Search") + form_("Rivera") + '<p role="status" class="text-muted">3 results for “Rivera”</p>' + results)
    S.add("loading", "Searching.", nav="", main=page_header("Search") + form_("Riv") + skeleton_list(3, "Searching"))
    S.add("empty", "No query yet: recent items.", nav="", main=page_header("Search") + form_() + f'<section class="search-group" aria-labelledby="g-rec"><h2 id="g-rec" class="search-group__title">Recent</h2>{ul_list([list_item("Mateo Rivera", "Opened today, 4:02 pm", person=CHILD["mateo"], href=page("child")), list_item("Fall field trip: Royal Botanical Gardens", "Opened today, 3:50 pm", lead=f"<span class=\"icon-tile\" aria-hidden=\"true\">{icon("bus")}</span>", href=page("event"))])}</section>')
    S.add("error", "Search failed.", nav="", main=page_header("Search") + form_("Rivera") + card(empty("Search isn’t responding", "Try again in a moment.", action=btn("Try again", "primary", icon_name="refresh") + btn("Browse families", "ghost", href=page("families")), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "Nothing matches.", nav="", main=page_header("Search") + form_("Garcia") + '<p role="status" class="text-muted">No results for “Garcia”</p>' + card(empty("Nothing matches “Garcia”", "Try a name, phone or email.", action=btn("Add family", "", icon_name="plus", data_href=dialog("add-family")), icon_name="search"), cls="card--flush"))


# ------------------------------------------------------------------ Error pages
def error_page(title: str, text: str, icon_name: str, actions: str, extra: str = "") -> str:
    return f'<div class="error-page">{empty(title, text, action=actions, icon_name=icon_name, heading="h1", extra=extra)}</div>'


@screen("not-found", "page", "Not found", route="/404", reqs=[], na={"loading": "Static page.", "empty": "Static page.", "error": "This page is the error."})
def not_found(S):
    S.add("default", "404: the link was mistyped or the record was deleted.", nav="", main=error_page("We can’t find that page", "The link may be out of date or the record deleted.", "search", btn("Go to Today", "primary", href=page("today")) + btn("Search", "", href=page("search", "empty"))))


@screen("forbidden", "page", "Forbidden", route="/403", reqs=[R_PRIVACY], na={"loading": "Static page.", "empty": "Static page.", "error": "This page is the error."})
def forbidden(S):
    S.add("default", "403: the role can’t open this; who to ask.", nav="", user=STAFF["aisha"], main=error_page("You don’t have access to this", "Youth workers can’t open this. Ask Tom Nguyen or Marisol Delgado.", "lock", btn("Go to Today", "primary", href=page("today")) + f'<a class="btn" href="mailto:tom@harbourview.example">{icon("mail")}Email Tom</a>'))


@screen("server-error", "page", "Server error", route="/500", reqs=[], na={"loading": "Static page.", "empty": "Static page.", "error": "This page is the error."})
def server_error(S):
    S.add("default", "500: not the user’s fault, a reference code, retry.", nav="", main=error_page("Something went wrong on our side", "Try again in a minute. Nothing was lost.", "alert-triangle", btn("Try again", "primary", icon_name="refresh") + btn("Go to Today", "", href=page("today")), extra='<p class="text-caption">Reference: 7f3c-21a9-4b0e</p>'))


@screen("offline", "page", "Offline", route="/offline", reqs=["L1-014", R_ROLL], na={"loading": "Static page.", "empty": "Static page.", "error": "This page is the error."})
def offline(S):
    S.add("default", "Offline with nothing cached for this page; what still works.", nav="", main=error_page("You’re offline", "This page isn’t saved on your phone. Check-in and Quick Cards still work.", "wifi-off", btn("Open check-in", "primary", href=page("check-in", "offline")) + btn("Try again", "", icon_name="refresh")))


@screen("maintenance", "page", "Maintenance", route="/maintenance", reqs=[], na={"loading": "Static page.", "empty": "Static page.", "error": "This page is the error."})
def maintenance(S):
    S.add("default", "Planned maintenance window; when it ends.", nav="", unread=0, show_tabbar=False, main=error_page("Back at 6:30 am", "Updating 6:00 to 6:30 am Eastern, Sunday 8 November. Check-in and Quick Cards work offline.", "wrench", btn("Try again", "primary", icon_name="refresh")))


# ------------------------------------------------------------------ Auth
def auth_head(title: str, text: str = "") -> str:
    t = f'<p class="text-muted">{text}</p>' if text else ""
    return f'<div class="stack" style="gap: var(--space-2); align-items: center; text-align: center;"><span class="ph-mark" aria-hidden="true" style="width: var(--size-avatar-lg); height: var(--size-avatar-lg);"></span><h1 style="font: var(--text-h2);">{title}</h1>{t}</div>'


@screen("sign-in", "page", "Sign in", route="/sign-in", reqs=[R_SEC], shell="auth", na={"loading": "The form is static.", "empty": "A form has no collection to be empty of."})
def sign_in(S):
    def form(err=None, busy=False, alert_html="", who="jaylen@harbourview.example"):
        e = err or {}
        return (f'<form class="stack" action="#" method="post" novalidate>{alert_html}' + field("email", "Email", type_="email", value=who, autofocus=True, autocomplete="username", error=e.get("email", ""))
                + f'<div class="field"><label class="field__label" for="pw">Password</label><div class="input-group"><input class="input" id="pw" name="pw" type="password" autocomplete="current-password" value="{"" if e else "harbour-tutoring-2026"}"{" aria-invalid=\"true\" aria-describedby=\"pw-error\"" if e.get("pw") else ""}><button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-label="Show password" aria-pressed="false">{icon("eye")}</button></div>{f"<div class=\"field__error\" id=\"pw-error\">{esc(e["pw"])}</div>" if e.get("pw") else ""}</div>'
                + switch("remember", "Keep me signed in on this phone", checked=True)
                + btn("Sign in", "primary", type_="submit", busy=busy, size="lg", block=True) + f'<p class="text-center"><a href="{page("forgot-password")}">Forgot your password?</a></p></form>')
    S.add("default", "Staff sign-in: email, password, remember on this phone.", main=auth_head("Sign in to PromiseHub", ORG) + form())
    S.add("invalid", "Wrong email or password: one message that never reveals whether the email exists; only the password is cleared.", main=auth_head("Sign in to PromiseHub", ORG) + form(err={"pw": "That email and password don’t match. Try again or reset your password."}))
    S.add("submitting", "Signing in.", main=auth_head("Sign in to PromiseHub", ORG) + form(busy=True))
    S.add("error", "The server didn’t answer.", main=auth_head("Sign in to PromiseHub", ORG) + form(alert_html=alert("danger", "We couldn’t sign you in", "Connection dropped. Try again.")))
    S.add("mfa", "Second step for admins: a six-digit code from the authenticator app.", main=auth_head("Enter your code", "From your authenticator app.") +
          f'<form class="stack" action="#" method="post" novalidate>{field("code", "Six-digit code", value="", inputmode="numeric", autocomplete="one-time-code", attrs=" maxlength=\"6\" pattern=\"[0-9]*\"", autofocus=True)}{switch("trust", "Don’t ask again on this laptop for 30 days", checked=True)}{btn("Continue", "primary", type_="submit", size="lg", block=True)}<p class="text-center"><a href="{dialog("recovery-codes")}">Use a recovery code</a> · <a href="{page("sign-in")}">Start over</a></p></form>')
    S.add("expired", "Session expired after inactivity; sign back in, work is kept.", main=auth_head("Your session timed out", "Signed out after 12 hours. Your draft incident report is saved.") + form())
    S.add("youth", "Sofía (Youth) signs in with the same form; she lands on Learning, a mentor on Mentoring, and Today when that module is off.", main=auth_head("Sign in to PromiseHub", ORG) + form(who="sofia@harbourview.example"),
          notes=note("After sign-in the home follows the role: Youth → /learning, Mentor → /mentoring, everyone else → Today. A deep link wins over the home.", "top: 5rem; right: 1rem;"))
    S.add("locked", "Too many attempts: locked for 15 minutes, reset offered.", main=auth_head("Sign in to PromiseHub", ORG) + form(alert_html=alert("warning", "Too many tries", "Sign-in paused until 4:27 pm. You can reset your password instead.", actions=btn("Reset password", "primary", size="sm", href=page("forgot-password")))).replace('<button class="btn btn--primary btn--lg btn--block" type="submit">Sign in</button>', '<button class="btn btn--primary btn--lg btn--block" type="submit" disabled>Sign in</button>'))


@screen("signed-out", "page", "Signed out", route="/signed-out", reqs=[R_SEC], shell="auth", na={"loading": "Nothing loads: the page is shown after the session has ended.", "empty": "A confirmation has no collection to be empty of.", "error": "Signing out always ends here; a failed request still clears the device."})
def signed_out(S):
    S.add("default", "After Sign out: the session is ended on the server and this device keeps none of the person's data, so a shared phone is safe to hand on.",
          main=auth_head("You’re signed out", "This device no longer keeps your PromiseHub data. On a shared device, close the browser too.") + btn("Sign in again", "primary", href=page("sign-in"), size="lg", block=True),
          notes=note("The back button leads to sign-in, never to a page of the last person's data.", "top: 5rem; right: 1rem;"))


@screen("account-deactivated", "page", "Account inactive", route="/account-deactivated", reqs=[R_SEC], shell="auth", na={"loading": "Nothing loads: the server has already answered.", "empty": "A message has no collection to be empty of.", "error": "This page is itself the refusal."})
def account_deactivated(S):
    S.add("default", "A youth whose account was turned off signs in with the right password: sign-in is refused and the page says who can restore it.",
          main=auth_head("This account is inactive", "Your access to PromiseHub was turned off. Nothing has been deleted; ask your program director or admin to turn it back on.") + btn("Back to sign in", "", href=page("sign-in"), size="lg", block=True),
          notes=note("Shown only after a correct password, so it never reveals whether an email has an account. A session whose account is turned off lands here on its next request.", "top: 5rem; right: 1rem;"))


@screen("forgot-password", "page", "Forgot password", route="/forgot-password", reqs=[R_SEC], shell="auth", na={"loading": "The form is static.", "empty": "A form has no collection to be empty of."})
def forgot_password(S):
    def form(err=None, busy=False):
        e = err or {}
        return f'<form class="stack" action="#" method="post" novalidate>{field("email", "Work email", type_="email", value="jaylen@harbourview.example" if not e else "jaylen@harbourview", autofocus=True, autocomplete="username", error=e.get("email", ""))}{btn("Email me a reset link", "primary", type_="submit", busy=busy, size="lg", block=True)}<p class="text-center"><a href="{page("sign-in")}">Back to sign in</a></p></form>'
    S.add("default", "Ask for a reset link.", main=auth_head("Reset your password", "The link works for one hour.") + form())
    S.add("invalid", "Not an email.", main=auth_head("Reset your password", "The link works for one hour.") + form(err={"email": "Enter your work email."}))
    S.add("submitting", "Sending.", main=auth_head("Reset your password", "The link works for one hour.") + form(busy=True))
    S.add("success", "Sent, with the same message whether or not the address exists.", main=auth_head("Check your email", "If jaylen@harbourview.example has an account, a link is on its way.") + f'<div class="cluster" style="justify-content: center;">{btn("Back to sign in", "", href=page("sign-in"))}{btn("Send again", "ghost")}</div>')
    S.add("error", "Couldn’t send.", main=auth_head("Reset your password", "The link works for one hour.") + alert("danger", "We couldn’t send the email", "Try again in a moment.") + form())


@screen("reset-password", "page", "Reset password", route="/reset-password", reqs=[R_SEC], shell="auth", na={"loading": "The form is static.", "empty": "A form has no collection to be empty of."})
def reset_password(S):
    def form(err=None, busy=False):
        e = err or {}
        return f'<form class="stack" action="#" method="post" novalidate>{field("pw1", "New password", type_="password", autofocus=True, autocomplete="new-password", error=e.get("pw1", ""), help_="At least 12 characters.")}{field("pw2", "Repeat it", type_="password", autocomplete="new-password", error=e.get("pw2", ""))}{btn("Set password and sign in", "primary", type_="submit", busy=busy, size="lg", block=True)}</form>'
    S.add("default", "Choose a new password from the emailed link.", main=auth_head("Choose a new password", "For jaylen@harbourview.example") + form())
    S.add("invalid", "Too short, and the repeat doesn’t match.", main=auth_head("Choose a new password", "For jaylen@harbourview.example") + form(err={"pw1": "Use at least 12 characters.", "pw2": "The two passwords don’t match."}))
    S.add("submitting", "Saving.", main=auth_head("Choose a new password", "For jaylen@harbourview.example") + form(busy=True))
    S.add("success", "Done and signed in.", main=auth_head("Password changed", "Other devices were signed out.") + btn("Go to Today", "primary", href=page("today"), size="lg", block=True))
    S.add("error", "The link expired.", main=auth_head("This link has expired", "Links work for one hour.") + btn("Send a new link", "primary", href=page("forgot-password"), size="lg", block=True))


@screen("accept-invite", "page", "Accept invitation", route="/invite/:token", reqs=[R_SEC, R_TTV, "L1-023", "L1-024"], shell="auth", na={"loading": "The form is static.", "empty": "A form has no collection to be empty of."})
def accept_invite(S):
    def form(err=None, busy=False, name="Sam Lee", email="sam.lee@example.org", email_label="Work email", join="Join Harbourview Youth", privacy=True):
        e = err or {}
        return (f'<form class="stack" action="#" method="post" novalidate>' + (form_summary([(k, m) for k, m in e.items()]) if e else "") + f'{field("name", "Your name", value=name, autofocus=True, autocomplete="name", error=e.get("name", ""))}{field("email", email_label, type_="email", value=email, readonly=True)}'
                f'<div class="field"><label class="field__label" for="pw1">Choose a password</label><div class="input-group"><input class="input" id="pw1" name="pw1" type="password" autocomplete="new-password" aria-describedby="pw1-help{" pw1-error" if e.get("pw1") else ""}"{" aria-invalid=\"true\"" if e.get("pw1") else ""}><button class="btn btn--ghost btn--icon input-group__btn" type="button" aria-label="Show password" aria-pressed="false">{icon("eye")}</button></div><div class="field__help" id="pw1-help">At least 12 characters, and not your email. A short sentence works well.</div>{f"<div class=\"field__error\" id=\"pw1-error\">{esc(e['pw1'])}</div>" if e.get("pw1") else ""}</div>'
                + (switch("tos", "I’ve read how PromiseHub handles children’s data", desc="<a href=\"#name\">Privacy summary</a>") if privacy else "") + f'{btn(join, "primary", type_="submit", busy=busy, size="lg", block=True)}</form>')
    S.add("default", "Sam accepts Tom’s invitation as a youth worker.", main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you as a Youth worker.") + form())
    S.add("youth", "Yusuf (13) opens the invitation Tom sent from his child record: his own email, a name already filled from the record, and the same password rule as staff.",
          main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you to Learning as a Youth.") + form(name="Yusuf Haddad", email="yusuf.haddad@example.com", email_label="Email", join="Join and start Learning", privacy=False),
          notes=note("After joining, Yusuf is signed in and lands on Learning (Today if Learning has since been turned off). His account links to his child record.", "top: 5rem; right: 1rem;"))
    S.add("mentor", "Grace Adeyemi, invited as a mentor from Staff and roles; she lands on Mentoring.",
          main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you as a Mentor.") + form(name="", email="grace.adeyemi@example.org", email_label="Email", join="Join Harbourview Youth", privacy=False))
    S.add("invalid", "Missing name, and a password that is too short.", main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you as a Youth worker.") + form(err={"name": "Enter your name.", "pw1": "Use at least 12 characters."}, name=""))
    S.add("weak", "A long password that contains the email’s name is refused by the same policy as reset.", main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you to Learning as a Youth.") + form(err={"pw1": "Don’t use your email in your password."}, name="Yusuf Haddad", email="yusuf.haddad@example.com", email_label="Email", join="Join and start Learning", privacy=False))
    S.add("submitting", "Creating the account.", main=auth_head("Join Harbourview Youth Collective", "Tom Nguyen invited you as a Youth worker.") + form(busy=True))
    S.add("success", "In: a 30-second orientation with the three things to try first.", main=auth_head("Welcome, Sam", "You’re a Youth worker at Harbourview Youth Collective.") +
          ul_list([list_item("Open tonight’s check-in", "Tap a child to check them in.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("clipboard")}</span>', href=page("check-in")), list_item("Try a Quick Card", "Allergies, contacts and pickups, offline.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("heart-pulse")}</span>', href=page("quick-card")), list_item("Know where incidents go", "Reports go to Marisol Delgado.", lead=f'<span class="icon-tile" aria-hidden="true">{icon("flag")}</span>', href=page("new-incident"))]) + btn("Get set up (2 minutes)", "primary", href=page("onboard-staff-phone"), size="lg", block=True) + f'<p class="text-center"><a href="{page("today")}">Skip to Today</a></p>')
    S.add("error", "The invitation was withdrawn or already used: it can’t be used and there is nothing to request.", main=auth_head("This invitation can’t be used", "It was withdrawn or has already been used. If you already joined, sign in.") + btn("Sign in", "primary", href=page("sign-in"), size="lg", block=True),
          notes=note("An expired invitation shows invite-expired instead, with a way to ask for a new link.", "top: 5rem; right: 1rem;"))


@screen("invite-expired", "page", "Invitation expired", route="/invite/:token", reqs=[R_SEC, "L1-023", "L1-024"], shell="auth", na={"loading": "The server has already answered 410 when this shows.", "empty": "A message has no collection to be empty of.", "invalid": "There is nothing to fill in: one button asks for a new link."})
def invite_expired(S):
    head_ = auth_head("This invitation has expired", "Invitations last 14 days to keep accounts safe. Tom Nguyen can send you a fresh link.")
    def actions(busy=False):
        return btn("Ask Tom Nguyen for a new link", "primary", type_="submit", busy=busy, size="lg", block=True, icon_name="send") + f'<p class="text-center"><a href="{page("sign-in")}">I already have an account</a></p>'
    S.add("default", "Yusuf opens his link 15 days later: it can’t be used, and one button tells Tom he needs a fresh one.", main=head_ + f'<form class="stack" action="#" method="post" novalidate>{actions()}</form>',
          notes=note("The request needs no account: the expired link itself proves which invitation it is. Asking twice sends one request.", "top: 5rem; right: 1rem;"))
    S.add("submitting", "Sending the request.", main=head_ + f'<form class="stack" action="#" method="post" novalidate>{actions(busy=True)}</form>')
    S.add("success", "Sent: Tom sees “Asked for a new link” on Staff and roles and resends it.", main=auth_head("We’ve let Tom Nguyen know", "When Tom Nguyen sends a fresh invitation, it arrives by email. The new link lasts 14 days.") + btn("Back to sign in", "", href=page("sign-in"), size="lg", block=True))
    S.add("error", "The request didn’t go through.", main=head_ + alert("danger", "That didn’t go through", "Try again in a minute.") + f'<form class="stack" action="#" method="post" novalidate>{actions()}</form>')


# ------------------------------------------------------------------ First-run setup
@screen("setup", "page", "Set up", route="/setup", reqs=[R_TTV, "L1-004"], na={"empty": "The setup checklist is the empty state of the product.", "loading": "Static checklist."})
def setup(S):
    def checklist(done: int):
        steps_ = [("Name your organization and pick a country", "Sets data residency.", page("onboard-org")), ("Import your roster from Sheets", "About ten minutes.", page("onboard-roster")), ("Invite the staff who run sessions", "They get check-in on their phones.", page("onboard-staff")), ("Send your first permission slip", "Create an event, write the slip, send.", page("onboard-first-event"))]
        items = []
        for i, (t, d, h) in enumerate(steps_):
            cls = "chapter chapter--done" if i < done else ("chapter chapter--next" if i == done else "chapter chapter--future")
            num = icon("check", "icon--sm") if i < done else str(i + 1)
            items.append(f'<a class="{cls}" href="{h}"><span class="chapter__num" aria-hidden="true">{num}</span><span class="chapter__body"><span class="chapter__title">{t}</span><span class="chapter__meta">{d}</span></span><span class="chapter__status">{"Done" if i < done else ("Next" if i == done else "")}</span></a>')
        return card("".join(items), cls="card--flush")
    S.add("default", "A new organization’s first hour: four steps, one done.", nav="today", user=M, unread=0, main=page_header("Welcome to PromiseHub, Marisol", "One step down, three to go.", btn("Continue setup", "primary", icon_name="arrow-right", href=page("onboard-roster"))) + progress(1, 4, "Setup progress", kind="success", show="1 of 4") + checklist(1))
    S.add("error", "The checklist state couldn’t be loaded; steps still link.", nav="today", user=M, unread=0, main=page_header("Welcome to PromiseHub, Marisol") + alert("warning", "We couldn’t check your progress", "The steps still work.", actions=btn("Try again", "", size="sm", icon_name="refresh")) + checklist(0))
    S.add("forbidden", "A site lead opening setup.", nav="today", user=J, unread=0, main=card(empty("Admins set up the organization", "Ask an admin or a program director.", action=btn("Back to Today", "", href=page("today")), icon_name="lock", heading="h1"), cls="card--flush"))
    S.add("success", "All four done: setup disappears from Today.", nav="today", user=M, unread=0, main=page_header("You’re set up", "Roster imported, 4 staff invited, first slip sent to 48 households.") + progress(4, 4, "Setup progress", kind="success", show="4 of 4") + checklist(4) + f'<div class="cluster">{btn("Go to Today", "primary", href=page("today"))}{btn("Watch signatures arrive", "", href=page("event"))}</div>')
