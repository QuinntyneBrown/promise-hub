"""Configurable modules and multi-tenancy: Settings › Modules, the platform admin's organizations list,
the organization switcher for people who cover several organizations, and adding an organization."""
from kit import *  # noqa: F401,F403
from reg import screen, SCREENS, Builder
from pages_core import R_ROLL, R_SLIPS, R_QC, R_PICKUP, R_NOTIFY, R_INC, R_REPORTS, R_ENROLL
from pages_admin import R_SEC, R_COMPL, R_COST, settings_nav, skeleton_form

M = STAFF["marisol"]
T = STAFF["tom"]
J = STAFF["jaylen"]
P = STAFF["priya"]
R_MODULES, R_TENANT = "L1-002", "L1-001"

# id, name, what it does, requirement, needs
MODULES = [
    ("roster", "Roster", "Families, children, guardians, enrollment.", R_ENROLL, []),
    ("slips", "Permission slips", "Signed slips, reminders, day-of status.", R_SLIPS, ["roster"]),
    ("rollcall", "Roll Call", "Check-in, sign-out, attendance, offline.", R_ROLL, ["roster"]),
    ("quickcard", "Quick Cards", "Allergies, medication, contacts; offline.", R_QC, ["roster"]),
    ("pickup", "Pickup", "Approved adults, ID checks.", R_PICKUP, ["roster", "rollcall"]),
    ("notify", "Messages", "Texts, emails, push; no-show alerts.", R_NOTIFY, ["roster"]),
    ("incidents", "Incident log", "Reports, review, audit trail.", R_INC, ["roster"]),
    ("reports", "Reports", "Grant-ready attendance and outcomes.", R_REPORTS, ["roster"]),
    # Learning, Mentoring and Public website (ADR 0043); not in the "Whole suite" preset, switched on one at a time.
    ("learning", "Learning", "Lessons, quizzes, assignments and badges for youth.", "L1-023", ["roster"]),
    ("mentoring", "Mentoring", "Mentors, assigned youth, check-ins and at-risk flags.", "L1-024", ["roster"]),
    ("website", "Public website", "Your organization’s public pages.", "L1-025", ["roster"]),
]
SUITE = {"roster", "slips", "rollcall", "quickcard", "pickup", "notify", "incidents", "reports"}
ALL_ON = SUITE | {"learning", "mentoring"}
CHECKIN_ONLY = {"roster", "rollcall"}


def module_rows(on: set, *, disabled: set | None = None, errors: dict | None = None) -> str:
    disabled = disabled or set()
    errors = errors or {}
    items = []
    for mid, name, what, _req, needs in MODULES:
        need = ""
        if needs and set(needs) - on:
            missing = ", ".join(next(m[1] for m in MODULES if m[0] == n) for n in needs if n not in on)
            need = f'<span class="text-caption module__needs">Needs {esc(missing)}</span>'
        err = f'<div class="field__error" id="{mid}-error">{esc(errors[mid])}</div>' if mid in errors else ""
        a = (" checked" if mid in on else "") + (" disabled" if mid in disabled else "") + (f' aria-describedby="{mid}-error" aria-invalid="true"' if mid in errors else "")
        items.append(f'<li class="list__item module"><div class="list__body"><div class="list__title">{esc(name)}</div><div class="list__meta">{esc(what)}</div>{need}{err}</div>'
                     f'<label class="switch module__switch"><input type="checkbox" name="m-{mid}"{a}><span class="visually-hidden">{esc(name)} on</span></label></li>')
    return f'<ul class="list card card--flush module-list" aria-label="Modules">{"".join(items)}</ul>'


def presets(cur: str) -> str:
    return chips([("Whole suite", cur == "suite"), ("Just check-in", cur == "checkin"), ("Just slips", cur == "slips"), ("Custom", cur == "custom")], "Presets")


# ------------------------------------------------------------------ Settings › Modules
@screen("settings-modules", "page", "Modules", route="/settings/modules", reqs=[R_MODULES, R_COMPL], na={"empty": "The roster module is always listed; the page is never empty."})
def settings_modules(S):
    def body(on: set, preset: str, *, busy=False, errors=None, saved=False, alert_html=""):
        n = len(on)
        summary = (f'<div class="cluster cluster--between"><p class="text-muted">{n} of {len(MODULES)} modules on</p>{presets(preset)}</div>')
        actions = f'<div class="form-actions cluster">{f"<p class=\"save-status save-status--saved\" role=\"status\">{icon("check")}Saved 2:14 pm</p>" if saved else ""}{btn("Save changes", "primary", type_="submit", busy=busy)}</div>'
        return f'<form class="stack form-width--lg" action="#" method="post" novalidate>{alert_html}{summary}{module_rows(on, errors=errors)}{actions}</form>'
    hdr = page_header("Modules", "The plan covers every module.") + settings_nav("settings-modules")
    S.add("default", "Harbourview: the whole suite plus Learning and Mentoring on, Public website off; every module listed with its dependency, a preset row and one Save.", nav="settings", user=T, main=hdr + body(ALL_ON, "custom"),
          notes=note("Switching a module off hides it for every role; data is kept.", "top: 5rem; right: 1rem;"))
    S.add("single", "Only Roll Call (and the roster it needs) is on; the app is a check-in tool and nothing else.", nav="settings", user=T, modules=["today", "check-in", "families", "settings"],
          main=hdr + body(CHECKIN_ONLY, "checkin", alert_html=alert("info", "Harbourview runs PromiseHub as a check-in app", "Nine modules are off. Guardians see only the enrollment form.")))
    S.add("invalid", "Pickup switched on without Roll Call, and the roster switched off while others need it.", nav="settings", user=T,
          main=hdr + body({"pickup", "slips"}, "custom", errors={"pickup": "Pickup needs Roll Call.", "roster": "Permission slips and Pickup need the roster."}))
    S.add("blocked", "The roster switched off while Learning and Mentoring are on: the save is refused and the reason sits beside the roster; nothing is deleted.", nav="settings", user=T,
          main=hdr + body({"learning", "mentoring"}, "custom", errors={"roster": "Learning and Mentoring need the roster."}),
          notes=note("The server rejects the same configuration with 422 even if the page is bypassed.", "top: 5rem; right: 1rem;"))
    S.add("submitting", "Saving the configuration.", nav="settings", user=T, main=hdr + body(ALL_ON, "suite", busy=True))
    S.add("success", "Saved; navigation updates for everyone on next load.", nav="settings", user=T, main=hdr + body(CHECKIN_ONLY | {"quickcard"}, "custom", saved=True),
          toast_html=toast_region(toast("success", "Modules saved", "3 on")))
    S.add("loading", "Modules loading.", nav="settings", main=page_header("Modules", "") + settings_nav("settings-modules") + skeleton_list(11, "Loading modules"))
    S.add("error", "Modules failed to load.", nav="settings", main=page_header("Modules", "") + settings_nav("settings-modules") + card(empty("We couldn’t load modules", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("forbidden", "A site lead opening Modules.", nav="settings", user=J, main=page_header("Modules", "") + card(empty("Admins configure modules", "Ask Tom Nguyen or Marisol Delgado.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


# ------------------------------------------------------------------ Organizations (platform admin, multi-tenant)
ORGS = [
    dict(name="Harbourview Youth Collective", mark="HY", color="lilac", city="Hamilton, ON", plan="Standard", children=184, modules=8, status=("Active", "success")),
    dict(name="Bayfront Boys & Girls Club", mark="BB", color="sky", city="Hamilton, ON", plan="Standard", children=321, modules=3, status=("Active", "success")),
    dict(name="Riverside Tutoring Network", mark="RT", color="mint", city="Brantford, ON", plan="Free", children=42, modules=2, status=("Active", "success")),
    dict(name="Northgate Community Church Kids", mark="NC", color="sun", city="Burlington, ON", plan="Free", children=0, modules=8, status=("Setting up", "info")),
    dict(name="St. Clair Summer Camps", mark="SC", color="peach", city="Windsor, ON", plan="Standard", children=112, modules=5, status=("Suspended", "danger")),
]


def org_mark(o: dict, size: str = "") -> str:
    return f'<span class="org-mark{(" org-mark--" + size) if size else ""} avatar--{o["color"]}" aria-hidden="true">{o["mark"]}</span>'


def org_row(o: dict) -> list[str]:
    st, kind = o["status"]
    return [f'<div class="cluster cluster--snug"><a class="list-link" href="{page("today")}" aria-label="Open {esc(o["name"])}">{org_mark(o)}<div><div class="list__title">{esc(o["name"])}</div><div class="list__meta">{esc(o["city"])}</div></div></a></div>',
            o["plan"], f'{o["children"]:,}', f'{o["modules"]} of 8', badge(st, kind),
            f'<div class="row-actions">{btn("Suspend" if st != "Suspended" else "Reinstate", "ghost", size="sm", data_href=dialog("suspend-organization"))}</div>']


@screen("organizations", "page", "Organizations", route="/admin/organizations", reqs=[R_TENANT, R_SEC, R_COST], na={})
def organizations(S):
    hdr = page_header("Organizations", "5 organizations · 659 active children · 3 on Standard", btn("Add organization", "primary", icon_name="plus", data_href=dialog("add-organization")))
    tb = (f'<div class="toolbar"><form role="search" class="input-group" style="flex: 1 1 14rem;"><label class="visually-hidden" for="org-q">Find an organization</label>'
          f'<input class="input" id="org-q" type="search" placeholder="Find an organization"><span class="input-group__btn btn btn--ghost btn--icon" aria-hidden="true">{icon("search")}</span></form>'
          + chips([("All 5", True), ("Standard 3", False), ("Free 2", False), ("Setting up 1", False), ("Suspended 1", False)], "Filter organizations") + "</div>")
    tbl = table("Organizations", ["Organization", "Plan", "#Children", "#Modules", "Status", "Actions"], [org_row(o) for o in ORGS], hide_sm={1, 2, 3, 5}, cls="table-wrap--fit table-wrap--names")
    S.add("default", "The platform admin’s list of tenants: plan, size, how many modules are on, status; open or suspend.", nav="settings", user=T, unread=0, main=hdr + tb + tbl,
          notes=note("Each organization is a separate tenant; only platform admins see this list.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Organizations loading.", nav="settings", user=T, unread=0, main=page_header("Organizations", "") + skeleton_list(5, "Loading organizations"))
    S.add("empty", "A fresh platform with no organizations yet.", nav="settings", user=T, unread=0, main=page_header("Organizations", "0 organizations") +
          card(empty("No organizations yet", "Add one or send a sign-up link.", action=btn("Add organization", "primary", icon_name="plus", data_href=dialog("add-organization")) + btn("Copy sign-up link", "", icon_name="link"), icon_name="globe"), cls="card--flush"))
    S.add("error", "Organizations failed to load.", nav="settings", user=T, unread=0, main=page_header("Organizations", "") + card(empty("We couldn’t load organizations", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush"))
    S.add("no-results", "A search with no match.", nav="settings", user=T, unread=0, main=hdr + tb.replace('placeholder="Find an organization"', 'value="Kitchener"') +
          card(empty("No organization matches “Kitchener”", "Check the spelling.", action=btn("Clear search", "") + btn("Add organization", "primary", icon_name="plus", data_href=dialog("add-organization")), icon_name="search"), cls="card--flush"))
    S.add("forbidden", "An organization admin opening the platform list.", nav="settings", user=M, main=page_header("Organizations", "") + card(empty("Platform admins only", "Your organization’s settings are under Settings.", action=btn("Open Settings", "", href=page("settings-organization")), icon_name="lock"), cls="card--flush"))


# ------------------------------------------------------------------ Switch organization (a person who covers two tenants)
def _base(sid: str, state: str = "default") -> dict:
    meta = next(s for s in SCREENS if s["id"] == sid and s["kind"] == "page")
    b = Builder(meta)
    meta["fn"](b)
    for st, _desc, kw in b.states:
        if st == state:
            kw = dict(kw)
            for k in ("notes", "toast_html", "overlays"):
                kw.pop(k, None)
            return kw
    raise KeyError(state)


@screen("switch-organization", "dialog", "Switch organization", opens_from="today", reqs=[R_TENANT, R_SEC], na={"busy": "Switching is a navigation, not a submit.", "invalid": "A menu has no inputs."})
def switch_organization(S):
    opts = []
    for o, checked, typ in [(ORGS[0], True, "Admin · 184 children"), (ORGS[1], False, "Volunteer coordinator · 321 children")]:
        opts.append(f'<li role="none"><a class="menu__item org-switcher__option" role="menuitemradio" aria-checked="{"true" if checked else "false"}" href="{page("today")}">{org_mark(o)}'
                    f'<span class="org-switcher__option-text"><span class="org-switcher__option-name">{esc(o["name"])}</span><span class="org-switcher__option-type">{esc(typ)}</span></span>{icon("check", "org-switcher__check")}</a></li>')
    menu = ('<ul class="menu org-switcher__menu" role="menu" aria-label="Switch organization" style="display: block;">'
            '<li role="none" class="menu__header"><span class="menu__title">Your organizations</span><span class="text-caption">Separate data and settings.</span></li>'
            + "".join(opts) + '<li role="none" class="menu__divider" aria-hidden="true"></li>'
            f'<li role="none"><a class="menu__item" role="menuitem" href="{page("onboard-welcome")}">{icon("plus")}Set up a new organization</a></li></ul>')
    kw = _base("today")
    kw.update(user=P, inert=True, overlays=menu, switcher=org_switcher(kind="dialog", open_=True))
    S.add("default", "Priya covers two organizations: the switcher in the top bar lists both with her role in each; switching reloads Today for that tenant.", **kw)


# ------------------------------------------------------------------ Add organization (platform admin)
@screen("add-organization", "dialog", "Add organization", opens_from="organizations", reqs=[R_TENANT, R_COST], na={})
def add_organization(S):
    def box(err=None, busy=False, alert_html=""):
        e = err or {}
        body = (field("o-name", "Organization name", value="" if e else "Kitchener Youth Alliance", autofocus=True, error=e.get("o-name", ""))
                + field("o-admin", "First admin’s email", type_="email", value="dana@kya" if e else "dana@kitcheneryouth.example", error=e.get("o-admin", ""), help_="Gets the welcome email.")
                + f'<div class="two-col">{select("o-plan", "Plan", ["Free (up to 50 children)", "Standard ($89/month)"], selected="Free (up to 50 children)")}{select("o-preset", "Modules", ["Whole suite", "Just check-in", "Just slips"], selected="Whole suite")}</div>')
        return dialog_box("Add an organization", "A separate tenant. The admin finishes setup.", body,
                          btn("Cancel", "") + btn("Create and invite", "primary", type_="submit", busy=busy, icon_name="send"), icon_name="globe", alert_html=alert_html, form=True)
    kw = _base("organizations"); kw["inert"] = True
    S.add("default", "Name, first admin, plan and module preset.", **dict(kw, overlays=box()))
    S.add("busy", "Creating the tenant and sending the welcome email.", **dict(kw, overlays=box(busy=True)))
    S.add("invalid", "No name and an incomplete email.", **dict(kw, overlays=box(err={"o-name": "Enter the organization’s name.", "o-admin": "That doesn’t look like an email address."})))
    S.add("failed", "Creating failed.", **dict(kw, overlays=box(alert_html=alert("danger", "We couldn’t create the organization", "Try again."))))
    S.add("success", "Created; the admin has been emailed.", **dict(kw, overlays=dialog_box("Kitchener Youth Alliance is ready", "", "<p>dana@kitcheneryouth.example has the welcome email.</p>", btn("Done", "primary", attrs=" autofocus"), icon_name="check-circle", form=False)))


@screen("suspend-organization", "dialog", "Suspend organization", opens_from="organizations", reqs=[R_TENANT, R_SEC], na={"invalid": "No inputs beyond the confirmation."})
def suspend_organization(S):
    def box(busy=False, alert_html=""):
        return dialog_box("Suspend St. Clair Summer Camps?", "Access and messaging stop until reinstated. Nothing is deleted.",
                          choice("why", "Unpaid invoice", checked=True) + choice("why", "Requested by the organization") + choice("why", "Safeguarding review"),
                          btn("Cancel", "") + btn("Suspend", "danger", type_="submit", busy=busy), icon_name="alert-triangle", danger=True, alert_html=alert_html, form=True)
    kw = _base("organizations"); kw["inert"] = True
    S.add("default", "Confirm with a reason.", **dict(kw, overlays=box()))
    S.add("busy", "Suspending.", **dict(kw, overlays=box(busy=True)))
    S.add("failed", "Suspending failed.", **dict(kw, overlays=box(alert_html=alert("danger", "Couldn’t suspend", "Try again."))))
