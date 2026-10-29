"""Configure the organization (prompt 79, L2-122 to L2-126): Settings › Organization (`settings-organization`) holds the organization's
profile and logo and, only while their module is on, the defaults Learning, Mentoring and Public website bring: the guardian consent policy,
how often mentors check in and the public website profile. Each card is read here and edited in its own dialog (`organization-profile`,
`consent-policy`, `mentoring-defaults`, `website-profile`, in dialogs.py); the logo uploads from the card. Ported from Waypoint's
program-administration settings-org mock (ADR 0043, ADR 0073); Waypoint's terms, tracks, integrations and brand accent are not ported.

Cast: Tom Nguyen (Admin, Harbourview), Jaylen Okafor (Site lead), Grace Mensah (Admin, Northgate, where Learning, Mentoring and Public
website are off). Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_admin import settings_nav
from pages_mentoring import failed
from pages_ops import skeleton_form

R_ORG = ["L2-122", "L2-123", "L2-124", "L2-125", "L2-126", "L2-001", "L2-005", "L2-007", "L2-032", "L2-035", "L2-036"]

T = STAFF["tom"]
J = STAFF["jaylen"]
GRACE = dict(name="Grace Mensah", initials="GM", color="lilac", role="Admin")
NORTHGATE = "Northgate Community Church Kids"
import base64 as _b64
from pathlib import Path as _Path
# Inlined so the specimen also renders when the design system copies it (the file stays in assets/ as the source).
LOGO = "data:image/svg+xml;base64," + _b64.b64encode((_Path(__file__).resolve().parent.parent / "assets/harbourview-logo.svg").read_bytes()).decode()
CONSENT = ("I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, "
           "and to staff contacting them about their program.")
TAGLINE = "Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays."
ABOUT = ("Harbourview Youth Collective runs free after-school tutoring, Saturday sports and one-to-one mentoring for children and youth "
         "in Hamilton’s north end. Families sign up once and hear from us in their own language.")


def muted(text: str) -> str:
    return f'<p class="text-muted">{text}</p>'


def actions(*buttons: str) -> str:
    return f'<div class="cluster" style="margin-top: var(--space-3);">{"".join(buttons)}</div>'


def org_logo(*, logo: bool, initials: str = "HY") -> str:
    if logo:
        return f'<span class="org-logo"><img src="{LOGO}" alt="Harbourview Youth Collective logo" width="96" height="96"></span>'
    return f'<span class="org-logo" aria-hidden="true">{initials}</span>'


def logo_block(state: str = "logo") -> str:
    """The logo inside the Profile card: the logo (or the initials) above the drop zone, which replaces it; uploading, invalid and failed."""
    def zone(title: str, err: str = "", busy: bool = False) -> str:
        inv = ' aria-invalid="true" aria-describedby="logo-error"' if err else ""
        return (f'<div class="dropzone{" dropzone--invalid" if err else ""}" role="group" aria-labelledby="logo-title"{" aria-busy=\"true\"" if busy else ""}>'
                f'<span class="icon-tile" aria-hidden="true">{icon("upload")}</span>'
                f'<h3 class="dropzone__title" id="logo-title">{title}</h3><p class="dropzone__text">A PNG or JPEG, square, up to 1 MB.</p>'
                f'<label class="btn btn--primary" for="logo">{icon("file")}Choose image<input class="visually-hidden" id="logo" type="file" accept="image/png,image/jpeg"{inv}></label></div>'
                + (f'<div class="field__error" id="logo-error">{esc(err)}</div>' if err else ""))
    if state == "logo":
        return (f'<div class="cluster">{org_logo(logo=True)}<div class="stack" style="gap: var(--space-1);"><strong>harbourview-logo.png</strong>'
                f'{muted("Uploaded Mon 2 Nov by Tom Nguyen")}<div>{btn("Remove logo", "ghost", size="sm", icon_name="trash")}</div></div></div>'
                + zone("Replace your logo"))
    initials = f'<div class="cluster">{org_logo(logo=False)}</div>'
    if state == "uploading":
        return initials + zone("Add your logo", busy=True)
    if state == "invalid":
        return initials + zone("Add your logo", "“harbourview-flyer.pdf” wasn’t uploaded. Choose a PNG or JPEG of up to 1 MB.")
    if state == "failed":
        return initials + alert("danger", "The upload didn’t finish", "Your logo is unchanged. Check your connection and choose the image again.") + zone("Add your logo")
    return initials + zone("Add your logo")


def profile_card(*, org=ORG, city="Hamilton, Ontario", email="hello@harbourview.example", phone="905-555-0100", tz="Eastern (Toronto)",
                 logo="logo", initials="HY") -> str:
    return card(f'<div class="stack">{logo_block(logo) if logo else ""}'
                + facts([("Name", esc(org)), ("City", city), ("Contact email", email or "Not given"), ("Phone", phone or "Not given"), ("Time zone", tz)])
                + muted("The phone is on every guardian page. Today’s sessions and every date follow the time zone.")
                + actions(btn("Edit profile", "", icon_name="edit", data_href=dialog("organization-profile"), attrs='aria-haspopup="dialog"')) + "</div>",
                title="Profile", tid="profile")


def learning_card(age: str = "18") -> str:
    return card('<div class="stack">' + facts([("Consent needed under", f"{age} years"), ("Wording guardians sign", CONSENT)])
                + muted("Youth under this age need a guardian’s consent before they use Learning.")
                + actions(btn("Edit consent policy", "", icon_name="edit", data_href=dialog("consent-policy"), attrs='aria-haspopup="dialog"')) + '</div>',
                title="Learning", tid="learning")


def mentoring_card(days: str = "14") -> str:
    return card('<div class="stack">' + facts([("Mentors check in", f"Every {days} days")])
                + muted(f"A youth whose mentor hasn’t logged a mentor check-in in {days} days shows under Check-ins due on that mentor’s dashboard.")
                + actions(btn("Edit mentoring defaults", "", icon_name="edit", data_href=dialog("mentoring-defaults"), attrs='aria-haspopup="dialog"')) + '</div>',
                title="Mentoring", tid="mentoring")


def website_card(slug: str = "harbourview", tagline: str = TAGLINE) -> str:
    return card('<div class="stack">' + facts([("Address", f"/site/{slug}"), ("Tagline", tagline), ("About", ABOUT), ("Public email", "hello@harbourview.example")])
                + muted("Visitors see these on your public website without signing in.")
                + actions(btn("Edit website profile", "", icon_name="edit", data_href=dialog("website-profile"), attrs='aria-haspopup="dialog"')) + '</div>',
                title="Public website", tid="website")


def hdr(org: str = ORG) -> str:
    return page_header("Organization", org) + settings_nav("settings-organization")


def body(*cards: str) -> str:
    return f'<div class="stack form-width--md">{"".join(cards)}</div>'


def everything(**kw) -> str:
    return body(profile_card(**kw), learning_card(), mentoring_card(), website_card())


@screen("settings-organization", "page", "Organization", route="/settings/organization", reqs=R_ORG,
        na={"empty": "An organization always has a name, city and time zone.", "invalid": "Nothing is edited on the page; each dialog shows its own invalid state."})
def settings_organization(S):
    kw = dict(nav="settings", user=T)
    S.add("default", "Tom (Admin) opens Settings › Organization: the profile and logo, then Learning, Mentoring and Public website, each on because its module is on.",
          **kw, main=hdr() + everything(),
          notes=note("A card appears only while its module is on; its endpoint answers 404 while the module is off. Each Edit opens a dialog; nothing is edited inline.", "top: 5rem; right: 1rem;"))
    S.add("modules-off", "Grace (Admin) at Northgate, where Learning, Mentoring and Public website are off: only the profile, and nothing about them is mentioned.",
          nav="settings", user=GRACE, main=hdr(NORTHGATE) + body(profile_card(org=NORTHGATE, city="Burlington, Ontario", email="", phone="289-555-0190", logo="none", initials="NC")))
    S.add("no-logo", "No logo yet: the drop zone says what it takes.", **kw, main=hdr() + everything(logo="none"))
    S.add("logo-uploading", "The logo uploading: the drop zone is busy; the rest of the page stays usable.", **kw, main=hdr() + everything(logo="uploading"))
    S.add("logo-invalid", "A PDF chosen as the logo: refused with what to choose instead; nothing changed.", **kw, main=hdr() + everything(logo="invalid"))
    S.add("logo-failed", "The upload failed partway: the logo is unchanged.", **kw, main=hdr() + everything(logo="failed"))
    S.add("logo-saved", "A new logo uploaded: shown at once with a toast.", **kw, main=hdr() + everything(),
          toast_html=toast_region(toast("success", "Logo saved")))
    S.add("profile-saved", "The profile dialog saved: the card shows the new phone and a toast; the top bar shows the name.", **kw,
          main=hdr() + body(profile_card(phone="905-555-0111"), learning_card(), mentoring_card(), website_card()),
          toast_html=toast_region(toast("success", "Organization profile saved")))
    S.add("learning-saved", "The consent policy saved from the Learning card: consent now needed under 16.", **kw,
          main=hdr() + body(profile_card(), learning_card("16"), mentoring_card(), website_card()),
          toast_html=toast_region(toast("success", "Consent policy saved", "It applies from each youth’s next request.")))
    S.add("mentoring-saved", "Mentoring defaults saved: mentors now check in every 7 days.", **kw,
          main=hdr() + body(profile_card(), learning_card(), mentoring_card("7"), website_card()),
          toast_html=toast_region(toast("success", "Mentoring defaults saved", "Each mentor’s Check-ins due follows it from now.")))
    S.add("website-saved", "The website profile saved with a new address: the old one stops working.", **kw,
          main=hdr() + body(profile_card(), learning_card(), mentoring_card(), website_card("harbourview-youth")),
          toast_html=toast_region(toast("success", "Website profile saved", "Your site is at /site/harbourview-youth.")))
    S.add("loading", "Loading: the cards as skeletons.", **kw, main=page_header("Organization", "") + settings_nav("settings-organization") + skeleton_form(5))
    S.add("error", "The settings failed to load; Try again reloads.", **kw,
          main=page_header("Organization", "") + settings_nav("settings-organization") + failed("We couldn’t load your organization’s settings"))
    S.add("forbidden", "Jaylen (Site lead) opens /settings/organization: the server answers 403.", nav="settings", user=J,
          main=page_header("Organization", "") + card(empty("Admins set up the organization", "Ask an admin or a program director.",
                                                            action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))
