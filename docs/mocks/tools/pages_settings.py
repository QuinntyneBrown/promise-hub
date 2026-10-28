"""Manage personal settings (prompt 78, L2-117 to L2-121): Your account as the hub of personal settings, the profile (`settings-profile`),
display and theme (`settings-display`) and change password (dialog `change-password`, in dialogs.py). Ported from Waypoint's shared
settings-profile, settings-display, settings-display-dark and settings-notifications mocks and the youth and mentor profile pages (ADR 0043,
ADR 0072). Personal settings belong to no module and are always on; notification choices follow their modules (`account-notifications`).

Cast: Jaylen Okafor (Site lead), Sofía Rivera (12, youth), Daniel Osei (Mentor), Tom Nguyen (Admin). Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_admin import R_SEC
from pages_mentoring import failed
from pages_ops import skeleton_form

R_ACCOUNT = [R_SEC, "L2-006", "L2-117", "L2-118", "L2-119", "L2-121", "L2-035", "L2-036"]
R_PROFILE = ["L2-117", "L2-001", "L2-032", "L2-035", "L2-036"]
R_DISPLAY = ["L2-119", "L2-120", "L2-035", "L2-036"]

J = STAFF["jaylen"]
T = STAFF["tom"]
SOFIA = YOUTH["sofia"]
DANIEL = STAFF["daniel"]
YKW = dict(nav="", role="youth", user=SOFIA, modules=["today", "learning", "schedule", "conversations"], unread=3)
MKW = dict(nav="", role="mentor", user=DANIEL, modules=["today", "mentor-dashboard", "check-in", "conversations"], unread=1)


def muted(text: str) -> str:
    return f'<p class="text-muted">{text}</p>'


def actions(*buttons: str) -> str:
    return f'<div class="cluster" style="margin-top: var(--space-3);">{"".join(buttons)}</div>'


# ------------------------------------------------------------------ Your account: the hub of personal settings
def hub(name: str, email: str, mobile: str, role: str, *, two_step: bool = True, display: str = "System theme · Default text · Motion on") -> str:
    two = (f'<div class="cluster cluster--between">{muted("Authenticator app on. 8 recovery codes left.")}{badge("On", "success")}</div>' if two_step
           else muted("Not set up yet. 0 recovery codes left."))
    return (page_header("Your account", name)
            + '<div class="stack form-width--md">'
            + card(facts([("Email", email), ("Mobile", mobile), ("Role", f"{role} · {ORG}")])
                   + actions(btn("Edit profile", "", icon_name="edit", href=page("settings-profile"))), title="Profile", tid="profile")
            + card(muted("Change it any time. Your other devices are signed out when you do.")
                   + actions(btn("Change password", "", icon_name="lock", data_href=dialog("change-password"), attrs='aria-haspopup="dialog"')), title="Password", tid="password")
            + card(muted(display) + actions(btn("Change display", "", icon_name="sun", href=page("settings-display"))), title="Display", tid="display")
            + card(two + muted("Recovery codes let you sign in if you lose your phone. Making new ones stops the old ones.")
                   + actions(btn("Make new recovery codes", "", icon_name="key", data_href=dialog("recovery-codes"), attrs='aria-haspopup="dialog"')), title="Two-step sign-in", tid="mfa")
            + card(muted("Choose which kinds of notification reach you in the app.")
                   + actions(btn("Choose notifications", "", icon_name="bell", href=page("account-notifications"))), title="Notifications", tid="notif")
            + card(muted("Lost a phone or used a shared computer? Sign out everywhere else; you stay signed in here.")
                   + actions(btn("Sign out everywhere else", "", data_href=dialog("sign-out-all"), attrs='aria-haspopup="dialog"')), title="Devices", tid="devices")
            + "</div>")


@screen("account", "page", "Your account", route="/account", reqs=R_ACCOUNT, na={"empty": "An account always has a profile."})
def account(S):
    S.add("default", "Jaylen’s account: profile, password, display, two-step sign-in, notifications and devices; each opens its own screen or dialog.", nav="",
          main=hub("Jaylen Okafor", "jaylen@harbourview.example", "905-555-0181", "Site lead"),
          notes=note("Personal settings belong to no module: every role has them, in every organization. Nothing here is edited inline.", "top: 5rem; right: 1rem;"))
    S.add("youth", "Sofía’s account (Youth): the same settings; two-step sign-in is not set up.", **YKW,
          main=hub("Sofía Rivera", "sofia@harbourview.example", "Not given", "Youth", two_step=False, display="Dark theme · Large text · Motion on"))
    S.add("mentor", "Daniel’s account (Mentor).", **MKW, main=hub("Daniel Osei", "daniel@harbourview.example", "905-555-0144", "Mentor", two_step=False))
    S.add("password-changed", "After changing the password: the dialog closed, a toast says other devices were signed out; this device stays signed in.", nav="",
          main=hub("Jaylen Okafor", "jaylen@harbourview.example", "905-555-0181", "Site lead"),
          toast_html=toast_region(toast("success", "Password changed", "Your other devices were signed out.")))
    S.add("loading", "Account loading.", nav="", main=page_header("Your account", "") + skeleton_form(6))
    S.add("error", "Account failed to load.", nav="", main=page_header("Your account", "") + card(empty("We couldn’t load your account", "Try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush form-width--md"))


# ------------------------------------------------------------------ Profile
def profile_hdr() -> str:
    return breadcrumb([("Your account", page("account"))], "Profile") + page_header("Profile", f"How you appear to others at {ORG}.")


def profile_form(*, name="Jaylen Okafor", email="jaylen@harbourview.example", mobile="905-555-0181", role="Site lead", youth=False,
                 err=None, busy=False, saved=False, alert_html="") -> str:
    e = err or {}
    summary = form_summary([(k, m) for k, m in e.items()]) if e else ""
    name_field = (field("name", "Name", value=name, readonly=True, help_=f"Your name comes from your record at {ORG_SHORT}. Ask staff to change it.") if youth
                  else field("name", "Name", value=name, required=True, autocomplete="name", error=e.get("name", "")))
    status_ = f'<p class="save-status save-status--saved" role="status">{icon("check")}Saved just now</p>' if saved else ""
    return (f'<form class="stack form-width--md" action="#" method="post" novalidate>{summary}{alert_html}'
            + card(name_field
                   + field("email", "Email", type_="email", value=email, readonly=True, help_="You sign in with this email in every organization. Ask an admin to change it.")
                   + field("mobile", "Mobile", type_="tel", value=mobile, optional=True, autocomplete="tel", inputmode="tel", error=e.get("mobile", ""),
                           help_=f"For alerts from {ORG_SHORT}. Families never see it."), title="About you", tid="about")
            + card(facts([("Role", role), ("Organization", ORG)]) + muted("Your role is set by an admin."), title=f"Set by {ORG_SHORT}", tid="managed")
            + f'<div class="form-actions cluster">{status_}{btn("Cancel", "ghost", href=page("account"))}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')


@screen("settings-profile", "page", "Profile", route="/account/profile", reqs=R_PROFILE,
        na={"empty": "Every account has a profile.", "forbidden": "Everyone edits their own; nobody opens another person’s profile here."})
def settings_profile(S):
    S.add("default", "Jaylen edits his name and mobile; his email and role are shown but set elsewhere.", nav="", main=profile_hdr() + profile_form(),
          notes=note("PUT /me/profile changes the name and mobile of this membership only: Jaylen at another organization keeps his own.", "top: 5rem; right: 1rem;"))
    S.add("youth", "Sofía (Youth): her name comes from her child record and is read-only; she can add a mobile.", **YKW,
          main=profile_hdr() + profile_form(name="Sofía Rivera", email="sofia@harbourview.example", mobile="", role="Youth", youth=True))
    S.add("mentor", "Daniel (Mentor) edits his own profile.", **MKW,
          main=profile_hdr() + profile_form(name="Daniel Osei", email="daniel@harbourview.example", mobile="905-555-0144", role="Mentor"))
    S.add("loading", "Loading: the form as a skeleton.", nav="", main=profile_hdr() + skeleton_form(3))
    S.add("error", "The profile failed to load; Try again reloads.", nav="", main=profile_hdr() + failed("We couldn’t load your profile"))
    S.add("invalid", "The name is empty and the mobile has no area code: inline errors and a summary.", nav="",
          main=profile_hdr() + profile_form(name="", mobile="555-0181", err={"name": "Enter your name.", "mobile": "Include the area code, like 905-555-0101."}))
    S.add("submitting", "Saving: Save changes is busy.", nav="", main=profile_hdr() + profile_form(busy=True))
    S.add("success", "Saved: a toast and Saved just now; the top bar shows the new name.", nav="", main=profile_hdr() + profile_form(saved=True),
          toast_html=toast_region(toast("success", "Profile saved")))
    S.add("failed", "The save failed: the form keeps what he typed and nothing changed.", nav="",
          main=profile_hdr() + profile_form(alert_html=alert("danger", "That didn’t go through", "Your profile is unchanged. Try again.")))


# ------------------------------------------------------------------ Display and theme
THEMES = [("system", "System", "Follows your device’s light or dark setting."), ("light", "Light", ""), ("dark", "Dark", "")]
SIZES = [("default", "Default", ""), ("large", "Large", "About an eighth bigger."), ("larger", "Larger", "About a quarter bigger.")]


def display_hdr() -> str:
    return breadcrumb([("Your account", page("account"))], "Display") + page_header("Display", "Your choices follow you to every device you sign in on.")


def display_form(*, theme="system", size="default", motion=False, busy=False, saved=False, alert_html="") -> str:
    themes = fieldset("Theme", "".join(choice("theme", t, small=h, checked=k == theme) for k, t, h in THEMES))
    sizes = fieldset("Text size", "".join(choice("size", t, small=h, checked=k == size) for k, t, h in SIZES))
    status_ = f'<p class="save-status save-status--saved" role="status">{icon("check")}Saved just now</p>' if saved else ""
    return (f'<form class="stack form-width--md" action="#" method="post" novalidate>{alert_html}'
            + card(themes, tid="theme")
            + card(sizes, tid="size")
            + card(switch("motion", "Reduce motion", checked=motion, desc="Turns off animations and smooth scrolling."), title="Motion", tid="motion")
            + muted("Changes show at once. Save to keep them.")
            + f'<div class="form-actions cluster">{status_}{btn("Cancel", "ghost", href=page("account"))}{btn("Save changes", "primary", type_="submit", busy=busy)}</div></form>')


@screen("settings-display", "page", "Display", route="/account/display", reqs=R_DISPLAY,
        na={"empty": "There are always three themes and three text sizes.", "invalid": "Every choice is valid; a refused save shows the failed state.",
            "forbidden": "Everyone sets their own display."})
def settings_display(S):
    S.add("default", "Jaylen’s display: System theme, Default text, motion on.", nav="", main=display_hdr() + display_form(),
          notes=note("Choosing previews at once on this page and across the app; Save keeps it with the account (PUT /me/display). Cancel puts back what was saved.", "top: 5rem; right: 1rem;"))
    S.add("dark", "Sofía chose Dark: the whole app turns dark at once, whatever her device says, and stays dark on her next sign-in.", **YKW,
          theme="dark", main=display_hdr() + display_form(theme="dark", size="large", saved=True))
    S.add("light", "Light chosen on a device set to dark: the app stays light.", nav="", theme="light", main=display_hdr() + display_form(theme="light"))
    S.add("large-text", "Larger text: every page’s text is a quarter bigger and still fits a phone without sideways scrolling; reduce motion is on.", nav="",
          root_style="font-size: 125%;", main=display_hdr() + display_form(size="larger", motion=True))
    S.add("loading", "Loading: the form as a skeleton.", nav="", main=display_hdr() + skeleton_form(3))
    S.add("error", "The display settings failed to load; Try again reloads.", nav="", main=display_hdr() + failed("We couldn’t load your display settings"))
    S.add("submitting", "Saving: Save changes is busy.", nav="", main=display_hdr() + display_form(theme="dark", busy=True))
    S.add("success", "Saved: a toast and Saved just now.", nav="", theme="dark", main=display_hdr() + display_form(theme="dark", saved=True),
          toast_html=toast_region(toast("success", "Display saved", "It follows you to every device you sign in on.")))
    S.add("failed", "The save failed: the choices stay previewed on this page and nothing was saved.", nav="",
          main=display_hdr() + display_form(theme="dark", alert_html=alert("danger", "That didn’t go through", "Your display settings weren’t saved. Try again.")))
