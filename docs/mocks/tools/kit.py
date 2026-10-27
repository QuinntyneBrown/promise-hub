"""Shared building blocks for the PromiseHub mock generator.

Everything here emits HTML that uses the vendored design system
(../design-system/assets/components.css) including the promoted PromiseHub components.
assets/ui.css remains an empty compatibility file. Run build.py to regenerate docs/mocks.
"""
from __future__ import annotations

import html as _html

# ---------------------------------------------------------------- cast & catalog
TODAY = "Thursday 5 November 2026"
ORG = "Harbourview Youth Collective"
ORG_SHORT = "Harbourview Youth"

STAFF = {
    "jaylen": dict(name="Jaylen Okafor", initials="JO", color="sky", role="Site lead"),
    "marisol": dict(name="Marisol Delgado", initials="MD", color="lilac", role="Program director"),
    "priya": dict(name="Priya Raman", initials="PR", color="mint", role="Volunteer coordinator"),
    "tom": dict(name="Tom Nguyen", initials="TN", color="sun", role="Admin"),
    "aisha": dict(name="Aisha Bello", initials="AB", color="rose", role="Youth worker"),
    # Participants (ADR 0043): mentors and a volunteer at Harbourview, a mentor at Northgate.
    "daniel": dict(name="Daniel Osei", initials="DO", color="sage", role="Mentor"),
    "hana": dict(name="Hana Kim", initials="HK", color="peach", role="Mentor"),
    "leo": dict(name="Leo Martins", initials="LM", color="sky", role="Volunteer"),
    "samuel": dict(name="Samuel Boateng", initials="SB", color="mint", role="Mentor"),
}

# Youth who sign in (ADR 0043). Each account links to one child record in its own organization.
YOUTH = {
    "sofia": dict(name="Sofía Rivera", initials="SR", color="peach", role="Youth", age=12, consent="Needs guardian consent"),
    "nadia": dict(name="Nadia Haddad", initials="NH", color="sage", role="Youth", age=18, consent="Adult; no guardian consent needed"),
    "lucia": dict(name="Lucía Rivera", initials="LR", color="lilac", role="Youth", age=14, consent="Needs guardian consent"),
}

CHILDREN = [
    dict(id="mateo", name="Mateo Rivera", initials="MR", color="peach", age=9, hh="Rivera", medical="Peanut allergy · EpiPen in bag", flag="Allergy"),
    dict(id="sofia", name="Sofía Rivera", initials="SR", color="peach", age=12, hh="Rivera", medical="Asthma · inhaler", flag="Asthma"),
    dict(id="jordan", name="Jordan Thompson", initials="JT", color="sky", age=11, hh="Thompson", medical="", flag=""),
    dict(id="kevin", name="Kevin Tran", initials="KT", color="mint", age=8, hh="Tran", medical="", flag=""),
    dict(id="emily", name="Emily Tran", initials="ET", color="mint", age=10, hh="Tran", medical="", flag=""),
    dict(id="yusuf", name="Yusuf Haddad", initials="YH", color="sage", age=13, hh="Haddad", medical="Medication at noon (methylphenidate)", flag="Medication"),
    dict(id="amara", name="Amara Okonkwo", initials="AO", color="rose", age=7, hh="Okonkwo", medical="Lactose intolerant", flag="Diet"),
    dict(id="nikolai", name="Nikolai Petrov", initials="NP", color="sun", age=10, hh="Petrov", medical="", flag=""),
    dict(id="deshawn", name="DeShawn Williams", initials="DW", color="lilac", age=9, hh="Williams", medical="", flag=""),
    dict(id="lily", name="Lily Chen", initials="LC", color="sky", age=8, hh="Chen", medical="Egg allergy (mild)", flag="Allergy"),
    dict(id="omar", name="Omar Siddiqui", initials="OS", color="sage", age=12, hh="Siddiqui", medical="", flag=""),
    dict(id="grace", name="Grace Adeyemi", initials="GA", color="rose", age=11, hh="Adeyemi", medical="", flag=""),
]
CHILD = {c["id"]: c for c in CHILDREN}

GUARDIANS = {
    "carmen": dict(name="Carmen Rivera", initials="CR", color="peach", phone="905-555-0142", email="carmen.rivera@example.com", lang="Spanish"),
    "dana": dict(name="Dana Thompson", initials="DT", color="sky", phone="905-555-0177", email="dana.t@example.com", lang="English"),
    "linh": dict(name="Linh Tran", initials="LT", color="mint", phone="289-555-0119", email="linh.tran@example.com", lang="English"),
    "nour": dict(name="Nour Haddad", initials="NH", color="sage", phone="905-555-0163", email="nour.haddad@example.com", lang="French"),
    "chidi": dict(name="Chidi Okonkwo", initials="CO", color="rose", phone="905-555-0188", email="c.okonkwo@example.com", lang="English"),
    "elena": dict(name="Elena Petrova", initials="EP", color="sun", phone="289-555-0150", email="elena.petrova@example.com", lang="English"),
}

LONG_GUARDIAN = "Mary-Katherine Fitzgerald-Vanderbroucke"
LONG_CHILD = "Alexander-Christopher Fitzgerald-Vanderbroucke III"

PROGRAMS = [
    dict(id="tutoring", name="After‑School Tutoring", when="Mon–Thu, 4–6 pm", enrolled=48, capacity=50, waitlist=3, status="Enrolling", term="2026–27"),
    dict(id="sports", name="Saturday Sports", when="Sat, 10 am–12 pm", enrolled=62, capacity=80, waitlist=0, status="Enrolling", term="2026–27"),
    dict(id="mentoring", name="One-to-one Mentoring", when="Weekly, by match", enrolled=19, capacity=25, waitlist=0, status="Open"),
    dict(id="winter-camp", name="Winter Camp 2026", when="21–23 Dec, 8 am–5 pm", enrolled=35, capacity=60, waitlist=0, status="Enrolling", term="Winter 2026"),
    dict(id="summer-camp", name="Summer Camp 2026", when="Jul–Aug 2026", enrolled=112, capacity=120, waitlist=0, status="Archived"),
]

EVENTS = [
    dict(id="tutoring-today", name="Tutoring night", program="After‑School Tutoring", when="Today, 4:00–6:00 pm", place="Harbourview Community Centre, Room 2", roster=48, signed=48, cleared=48, slip=False),
    dict(id="rbg-trip", name="Fall field trip: Royal Botanical Gardens", program="After‑School Tutoring", when="Sat 14 Nov, 9:00 am–3:00 pm", place="Bus leaves from the centre at 8:45 am", roster=48, signed=41, cleared=41, slip=True),
    dict(id="sports-sat", name="Saturday Sports", program="Saturday Sports", when="Sat 7 Nov, 10:00 am–12:00 pm", place="Bennetto School gym", roster=62, signed=62, cleared=62, slip=False),
    dict(id="winter-camp-day1", name="Winter Camp · Day 1", program="Winter Camp 2026", when="Mon 21 Dec, 8:00 am–5:00 pm", place="Harbourview Community Centre", roster=35, signed=12, cleared=12, slip=True),
    dict(id="swim-trip", name="Swim trip: Jimmy Thompson Pool", program="Saturday Sports", when="Sat 28 Nov, 10:00 am–1:00 pm", place="Bus leaves from the centre at 9:30 am", roster=62, signed=0, cleared=0, slip=True),
]


def esc(s: str) -> str:
    return _html.escape(s, quote=True)


# ---------------------------------------------------------------- icons (24-unit viewBox, 2px stroke, currentColor)
ICONS = {
    "home": '<path d="M3 11 12 3l9 8M5 10v10h14V10"/>',
    "check": '<path d="M4 12l6 6L20 6"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    "x": '<path d="M6 6l12 12M18 6 6 18"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "more": '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    "users": '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a6 6 0 0 0-5-6"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "clipboard": '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    "heart-pulse": '<path d="M12 21s-7-4.6-9-9a5 5 0 0 1 9-4 5 5 0 0 1 9 4c-2 4.4-9 9-9 9z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
    "message": '<path d="M4 5h16v11H9l-5 4z"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "alert-triangle": '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.4a7 7 0 0 0-1.7 1L5.1 5.5l-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 2.4h5l.4-2.4a7 7 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/>',
    "download": '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/>',
    "upload": '<path d="M12 15V3m0 0-4 4m4-4 4 4M4 17v3h16v-3"/>',
    "send": '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    "phone": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "lock": '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "unlock": '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    "wifi-off": '<path d="M2 2l20 20M5 12.5a11 11 0 0 1 4-2.6M2 8.8A16 16 0 0 1 7.4 5M12 20h.01M8.5 16a5 5 0 0 1 7 0M15 12.5a11 11 0 0 1 4 2.6M22 8.8a16 16 0 0 0-8.5-4.3"/>',
    "refresh": '<path d="M20 11a8 8 0 1 0 2 5.3M20 4v7h-7"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "edit": '<path d="M4 20h4l11-11-4-4L4 16zM13 7l4 4"/>',
    "trash": '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    "arrow-up": '<path d="M12 19V5m0 0-6 6m6-6 6 6"/>',
    "arrow-down": '<path d="M12 5v14m0 0-6-6m6 6 6-6"/>',
    "arrow-left": '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
    "arrow-right": '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
    "chevron-right": '<path d="m9 6 6 6-6 6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>',
    "qr": '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7h-7"/>',
    "file": '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
    "table": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>',
    "star": '<path d="m12 3 2.8 6 6.2.7-4.6 4.3 1.3 6.3L12 17l-5.7 3.3 1.3-6.3L3 9.7 9.2 9z"/>',
    "log-out": '<path d="M9 21H5V3h4M15 17l5-5-5-5M20 12H9"/>',
    "log-in": '<path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H4"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    "map-pin": '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    "bus": '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 10h16M8 17v3M16 17v3M8 14h.01M16 14h.01"/>',
    "camera": '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3"/>',
    "key": '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M15 5l3 3M18 5l1 1"/>',
    "eye": '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "filter": '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    "inbox": '<path d="M4 4h16v16H4zM4 14h5l1 2h4l1-2h5"/>',
    "flag": '<path d="M5 21V4h12l-2 4 2 4H5"/>',
    "list": '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    "credit-card": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    "cloud-off": '<path d="M2 2l20 20M8 19h9a4 4 0 0 0 1.5-7.7A6 6 0 0 0 7.3 8M4.5 10.5A4 4 0 0 0 8 19"/>',
    "sparkle": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0 5 5L9 22l-3-3L16.7 8.3a4 4 0 0 1-2-2z"/>',
    "language": '<path d="M4 5h9M8.5 3v2M11 5c-1 4-4 7-7 9M6 8c1.5 3 4 5 7 6M13 20l4-10 4 10M14.5 17h5"/>',
    "pin": '<path d="M12 17v5M8 7h8l-1 6 3 2H6l3-2z"/><path d="M9 2h6v5H9z"/>',
    "id-card": '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M15 10h3M15 14h3"/>',
}


def icon(name: str, cls: str = "") -> str:
    extra = f" {cls}" if cls else ""
    return f'<svg class="icon{extra}" aria-hidden="true" viewBox="0 0 24 24">{ICONS[name]}</svg>'


# ---------------------------------------------------------------- paths
def rel(from_kind: str, to_kind: str, sid: str, state: str = "default") -> str:
    """Relative href from a mock in <from_kind>/<x>/ to <to_kind>/<sid>/<state>.html."""
    folder = {"page": "pages", "dialog": "dialogs", "notification": "notifications"}[to_kind]
    return f"../../{folder}/{sid}/{state}.html"


def page(sid: str, state: str = "default") -> str:
    return rel("page", "page", sid, state)


def dialog(sid: str, state: str = "default") -> str:
    return rel("page", "dialog", sid, state)


def notif(sid: str, state: str = "default") -> str:
    return rel("page", "notification", sid, state)


# ---------------------------------------------------------------- atoms
def btn(label: str, variant: str = "", *, icon_name: str = "", href: str = "", type_: str = "button",
        busy: bool = False, disabled: bool = False, size: str = "", block: bool = False, attrs: str = "",
        data_href: str = "", aria_label: str = "") -> str:
    classes = "btn" + (f" btn--{variant}" if variant else "") + (f" btn--{size}" if size else "") + (" btn--block" if block else "")
    inner = (icon(icon_name) if icon_name else "") + esc(label)
    a = attrs
    if busy:
        a += ' aria-busy="true" disabled'
    elif disabled:
        a += " disabled"
    if aria_label:
        a += f' aria-label="{esc(aria_label)}"'
    if href:
        return f'<a class="{classes}" href="{href}"{(" " + a) if a else ""}>{inner}</a>'
    if data_href:
        a += f' data-href="{data_href}"'
    return f'<button class="{classes}" type="{type_}"{(" " + a) if a else ""}>{inner}</button>'


def icon_btn(name: str, label: str, *, variant: str = "ghost", attrs: str = "", data_href: str = "") -> str:
    a = attrs + (f' data-href="{data_href}"' if data_href else "")
    return f'<button class="btn btn--{variant} btn--icon" type="button" aria-label="{esc(label)}"{(" " + a) if a else ""}>{icon(name)}</button>'


def badge(text: str, kind: str = "") -> str:
    return f'<span class="badge{(" badge--" + kind) if kind else ""}">{esc(text)}</span>'


def status(text: str, kind: str = "") -> str:
    return f'<span class="status{(" status--" + kind) if kind else ""}">{esc(text)}</span>'


def flag(text: str, kind: str = "") -> str:
    return f'<span class="flag{(" flag--" + kind) if kind else ""}" role="img" aria-label="{esc(text)}">{icon("heart-pulse")}<span class="flag__text">{esc(text)}</span></span>'


def avatar(person: dict, size: str = "sm", hidden: bool = True) -> str:
    aria = ' aria-hidden="true"' if hidden else f' role="img" aria-label="{esc(person["name"])}"'
    return f'<span class="avatar avatar--{size} avatar--{person["color"]}"{aria}>{person["initials"]}</span>'


def field(fid: str, label: str, *, type_: str = "text", value: str = "", help_: str = "", error: str = "",
          optional: bool = False, required: bool = False, placeholder: str = "", attrs: str = "", autofocus: bool = False,
          readonly: bool = False, inputmode: str = "", autocomplete: str = "") -> str:
    describe = []
    if help_:
        describe.append(f"{fid}-help")
    if error:
        describe.append(f"{fid}-error")
    a = attrs
    if describe:
        a += f' aria-describedby="{" ".join(describe)}"'
    if error:
        a += ' aria-invalid="true"'
    if required:
        a += " required"
    if autofocus:
        a += " autofocus"
    if readonly:
        a += " readonly"
    if inputmode:
        a += f' inputmode="{inputmode}"'
    if autocomplete:
        a += f' autocomplete="{autocomplete}"'
    if placeholder:
        a += f' placeholder="{esc(placeholder)}"'
    lab = esc(label) + (' <span class="optional">(optional)</span>' if optional else "")
    out = [f'<div class="field"><label class="field__label" for="{fid}">{lab}</label>']
    out.append(f'<input class="input" id="{fid}" name="{fid}" type="{type_}" value="{esc(value)}"{a}>')
    if help_:
        out.append(f'<div class="field__help" id="{fid}-help">{help_}</div>')
    if error:
        out.append(f'<div class="field__error" id="{fid}-error">{esc(error)}</div>')
    out.append("</div>")
    return "".join(out)


def textarea(fid: str, label: str, *, value: str = "", rows: int = 3, help_: str = "", error: str = "", optional: bool = False,
             placeholder: str = "", attrs: str = "", count: str = "") -> str:
    describe = []
    if help_:
        describe.append(f"{fid}-help")
    if error:
        describe.append(f"{fid}-error")
    a = attrs + (f' aria-describedby="{" ".join(describe)}"' if describe else "") + (' aria-invalid="true"' if error else "")
    if placeholder:
        a += f' placeholder="{esc(placeholder)}"'
    lab = esc(label) + (' <span class="optional">(optional)</span>' if optional else "")
    out = [f'<div class="field"><label class="field__label" for="{fid}">{lab}</label>']
    out.append(f'<textarea class="textarea" id="{fid}" name="{fid}" rows="{rows}"{a}>{esc(value)}</textarea>')
    if help_ or count:
        out.append(f'<div class="cluster cluster--between"><div class="field__help" id="{fid}-help">{help_}</div>{f"<span class=\"field__count\">{count}</span>" if count else ""}</div>')
    if error:
        out.append(f'<div class="field__error" id="{fid}-error">{esc(error)}</div>')
    out.append("</div>")
    return "".join(out)


def select(fid: str, label: str, options: list, *, selected: str = "", help_: str = "", error: str = "", attrs: str = "",
           optional: bool = False, visually_hidden_label: bool = False) -> str:
    describe = []
    if help_:
        describe.append(f"{fid}-help")
    if error:
        describe.append(f"{fid}-error")
    a = attrs + (f' aria-describedby="{" ".join(describe)}"' if describe else "") + (' aria-invalid="true"' if error else "")
    opts = "".join(f'<option{" selected" if o == selected else ""}>{esc(o)}</option>' for o in options)
    lab = esc(label) + (' <span class="optional">(optional)</span>' if optional else "")
    labcls = "visually-hidden" if visually_hidden_label else "field__label"
    out = [f'<div class="field"><label class="{labcls}" for="{fid}">{lab}</label><select class="select" id="{fid}" name="{fid}"{a}>{opts}</select>']
    if help_:
        out.append(f'<div class="field__help" id="{fid}-help">{help_}</div>')
    if error:
        out.append(f'<div class="field__error" id="{fid}-error">{esc(error)}</div>')
    out.append("</div>")
    return "".join(out)


def choice(name: str, label: str, *, small: str = "", checked: bool = False, type_: str = "radio", attrs: str = "", invalid: bool = False) -> str:
    a = attrs + (" checked" if checked else "") + (' aria-invalid="true"' if invalid else "")
    sm = f"<small>{small}</small>" if small else ""
    return f'<label class="choice"><input type="{type_}" name="{name}"{a}><span class="choice__text">{label}{sm}</span></label>'


def switch(name: str, label: str, *, checked: bool = False, desc: str = "", attrs: str = "") -> str:
    did = f"{name}-desc"
    a = attrs + (" checked" if checked else "") + (f' aria-describedby="{did}"' if desc else "")
    out = f'<label class="switch"><input type="checkbox" name="{name}"{a}><span class="switch__text">{label}</span></label>'
    if desc:
        out += f'<p class="text-caption switch__description" id="{did}">{desc}</p>'
    return out


def fieldset(legend: str, body: str, *, error: str = "", fid: str = "", hint: str = "") -> str:
    a = (f' id="{fid}"' if fid else "") + (f' aria-describedby="{fid}-error"' if error else "")
    h = f'<p class="text-caption">{hint}</p>' if hint else ""
    e = f'<div class="field__error" id="{fid}-error">{esc(error)}</div>' if error else ""
    return f'<fieldset class="stack" style="gap: var(--space-2);"{a}><legend class="field__label">{legend}</legend>{h}{body}{e}</fieldset>'


def form_summary(errors: list[tuple[str, str]], title: str = "Fix these to continue") -> str:
    items = "".join(f'<li><a href="#{fid}">{esc(msg)}</a></li>' for fid, msg in errors)
    return (f'<div class="alert alert--danger form-summary" role="alert" tabindex="-1" id="form-summary">{icon("alert-triangle")}'
            f'<div class="alert__body"><div class="alert__title">{esc(title)}</div><ul style="margin: 0; padding-left: var(--space-5);">{items}</ul></div></div>')


def alert(kind: str, title: str, text: str = "", *, actions: str = "", role: str = "", banner: bool = False, dismiss: bool = False) -> str:
    r = role or ("alert" if kind == "danger" else "status")
    ic = {"info": "info", "success": "check-circle", "warning": "alert-triangle", "danger": "x-circle"}[kind]
    act = f'<div class="alert__actions">{actions}</div>' if actions else ""
    tx = f'<div class="alert__text">{text}</div>' if text else ""
    dis = f'<button class="close" type="button" aria-label="Dismiss">{icon("x", "icon--sm")}</button>' if dismiss else ""
    return f'<div class="alert alert--{kind}{" banner" if banner else ""}" role="{r}">{icon(ic)}<div class="alert__body"><div class="alert__title">{title}</div>{tx}{act}</div>{dis}</div>'


def empty(title: str, text: str, *, action: str = "", icon_name: str = "inbox", error: bool = False, heading: str = "h2", extra: str = "") -> str:
    cls = "empty empty--error" if error else "empty"
    role = ' role="alert"' if error else ""
    act = f'<div class="empty__actions">{action}</div>' if action else ""
    return (f'<div class="{cls}"{role}><span class="empty__icon" aria-hidden="true">{icon(icon_name, "icon--lg")}</span>'
            f'<{heading} class="empty__title">{title}</{heading}><p class="empty__text">{text}</p>{extra}{act}</div>')


def skeleton_list(rows: int = 5, label: str = "Loading") -> str:
    row = ('<li class="list__item"><span class="skeleton avatar avatar--sm" aria-hidden="true"></span><div class="list__body">'
           '<span class="skeleton skeleton--title" aria-hidden="true"></span><span class="skeleton skeleton--text" aria-hidden="true" style="width: 70%;"></span></div>'
           '<span class="skeleton skeleton--pill" aria-hidden="true" style="width: 5rem; height: 1.5rem; border-radius: var(--radius-full);"></span></li>')
    return f'<div class="card card--flush" aria-busy="true" aria-label="{esc(label)}"><ul class="list" aria-hidden="true">{row * rows}</ul></div>'


def skeleton_header(subtitle: bool = True) -> str:
    sub = '<span class="skeleton skeleton--text skeleton--subtitle" aria-hidden="true"></span>' if subtitle else ""
    return f'<span class="skeleton skeleton--title" aria-hidden="true" style="width: 14rem; height: 2rem;"></span>{sub}'


def skeleton_kpis(n: int = 4) -> str:
    card = '<div class="card stat" aria-hidden="true"><span class="skeleton skeleton--text" style="width: 60%;"></span><span class="skeleton skeleton--stat"></span></div>'
    return f'<div class="kpis" aria-busy="true" aria-label="Loading numbers">{card * n}</div>'


def stat(label: str, value: str, caption: str = "", *, card: bool = True) -> str:
    cap = f'<span class="text-caption">{caption}</span>' if caption else ""
    inner = f'<span class="stat__label">{esc(label)}</span><span class="stat__value">{value}</span>{cap}'
    return f'<div class="card stat">{inner}</div>' if card else f'<div class="stat">{inner}</div>'


def kpis(items: list[tuple[str, str, str]]) -> str:
    return '<div class="kpis">' + "".join(stat(l, v, c) for l, v, c in items) + "</div>"


def list_item(title: str, meta: str, *, person: dict | None = None, href: str = "", end: str = "", lead: str = "", cls: str = "") -> str:
    lead_html = lead or (avatar(person) if person else "")
    body = f'<div class="list__body"><div class="list__title">{title}</div><div class="list__meta">{meta}</div></div>'
    if href:
        inner = f'<a class="list-link" href="{href}">{lead_html}{body}</a>'
    else:
        inner = lead_html + body
    return f'<li class="list__item{(" " + cls) if cls else ""}">{inner}{end}</li>'


def ul_list(items: list[str], *, card: bool = True, label: str = "") -> str:
    a = f' aria-label="{esc(label)}"' if label else ""
    return f'<ul class="list{" card card--flush" if card else ""}"{a}>{"".join(items)}</ul>'


def chips(options: list[tuple[str, bool]], label: str) -> str:
    return (f'<div class="cluster cluster--snug" role="group" aria-label="{esc(label)}">'
            + "".join(f'<button class="chip" type="button" aria-pressed="{"true" if on else "false"}">{esc(t)}</button>' for t, on in options)
            + "</div>")


def tabs_nav(items: list[tuple[str, str, bool]], label: str) -> str:
    return (f'<nav class="tabs" aria-label="{esc(label)}">'
            + "".join(f'<a class="tab" href="{h}"{" aria-current=\"page\"" if cur else ""}>{t}</a>' for t, h, cur in items)
            + "</nav>")


def breadcrumb(items: list[tuple[str, str]], current: str) -> str:
    lis = "".join(f'<li><a href="{h}">{esc(t)}</a></li>' for t, h in items)
    return f'<nav aria-label="Breadcrumb"><ol class="breadcrumb">{lis}<li aria-current="page">{esc(current)}</li></ol></nav>'


def page_header(title: str, subtitle: str = "", actions: str = "", *, h1_attrs: str = "") -> str:
    sub = f'<p class="subtitle">{subtitle}</p>' if subtitle else ""
    act = f'<div class="cluster">{actions}</div>' if actions else ""
    return f'<div class="page-header"><div><h1{(" " + h1_attrs) if h1_attrs else ""}>{title}</h1>{sub}</div>{act}</div>'


def table(caption: str, head: list[str], rows: list[list[str]], *, cls: str = "", selectable: bool = False, selected: set | None = None, hide_sm: set | None = None) -> str:
    """Columns listed in hide_sm (0-based) are dropped below 640px; the row must still make sense without them."""
    selected = selected or set()
    hide_sm = hide_sm or set()
    th = "".join(f'<th scope="col"{" class=\"" + " ".join(c for c in ["num" if h.startswith("#") else "", "hide-sm" if j in hide_sm else ""] if c) + "\"" if (h.startswith("#") or j in hide_sm) else ""}>{h.lstrip("#") if h not in ("", "Actions") else ("<span class=\"visually-hidden\">Actions</span>" if h == "Actions" else "")}</th>' for j, h in enumerate(head))
    if selectable:
        th = '<th scope="col" class="select-col"><label class="visually-hidden" for="sel-all">Select all</label><input type="checkbox" id="sel-all"></th>' + th
    body = []
    num_cols = [h.startswith("#") for h in head]
    for i, r in enumerate(rows):
        cells = "".join(f'<td{(" class=\"" + " ".join(c2 for c2 in ["num" if (j < len(num_cols) and num_cols[j]) else "", "hide-sm" if j in hide_sm else ""] if c2) + "\"") if ((j < len(num_cols) and num_cols[j]) or j in hide_sm) else ""}>{c}</td>' for j, c in enumerate(r))
        sel = ""
        if selectable:
            on = i in selected
            sel = f'<td class="select-col"><label class="visually-hidden" for="sel-{i}">Select row {i + 1}</label><input type="checkbox" id="sel-{i}"{" checked" if on else ""}></td>'
        body.append(f'<tr{" aria-selected=\"true\"" if i in selected else ""}>{sel}{cells}</tr>')
    return (f'<div class="table-wrap card card--flush{(" " + cls) if cls else ""}"><table class="table"><caption class="visually-hidden">{esc(caption)}</caption>'
            f'<thead><tr>{th}</tr></thead><tbody>{"".join(body)}</tbody></table></div>')


def facts(pairs: list[tuple[str, str]]) -> str:
    return '<dl class="facts">' + "".join(f"<div><dt>{esc(k)}</dt><dd>{v}</dd></div>" for k, v in pairs) + "</dl>"


def card(body: str, *, title: str = "", tid: str = "", cls: str = "", footer: str = "", tag: str = "section") -> str:
    t = ""
    a = ""
    if title:
        tid = tid or "sec-" + "".join(ch for ch in title.lower() if ch.isalnum())[:16]
        t = f'<h2 class="card__title" id="{tid}">{title}</h2>'
        a = f' aria-labelledby="{tid}"'
    f = f'<p class="card__footer">{footer}</p>' if footer else ""
    return f'<{tag} class="card{(" " + cls) if cls else ""}"{a}>{t}{body}{f}</{tag}>'


def progress(value: int, max_: int, label: str, *, kind: str = "", show: str = "") -> str:
    pct = round(100 * value / max_) if max_ else 0
    text = show or f"{value} of {max_}"
    return (f'<div class="progress-row"><div class="progress{(" progress--" + kind) if kind else ""}" role="progressbar" aria-valuenow="{value}" aria-valuemin="0" aria-valuemax="{max_}" aria-label="{esc(label)}">'
            f'<div class="progress__bar" style="--value: {pct}%;"></div></div><span class="progress-row__label">{text}</span></div>')


def qr(label: str, size: str = "") -> str:
    # deterministic pseudo-QR: a 21×21 pattern from a tiny LCG, with finder squares
    cells = []
    seed = 7
    for y in range(21):
        for x in range(21):
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            finder = (x < 7 and y < 7) or (x > 13 and y < 7) or (x < 7 and y > 13)
            if finder:
                fx, fy = (x if x < 7 else x - 14), (y if y < 7 else y - 14)
                on = fx in (0, 6) or fy in (0, 6) or (2 <= fx <= 4 and 2 <= fy <= 4)
            else:
                on = (seed >> 16) & 1
            if on:
                cells.append(f'<rect x="{x}" y="{y}" width="1" height="1"/>')
    return (f'<figure class="qr-code{(" qr-code--" + size) if size else ""}"><span class="qr-code__plate"><svg viewBox="0 0 21 21" role="img" aria-label="{esc(label)}">{"".join(cells)}</svg></span>'
            f'<figcaption class="qr-code__caption">Scan with a phone camera</figcaption></figure>')


def sms(text: str, *, segments: int = 1, chars: int = 0, over: bool = False) -> str:
    chars = chars or len(text)
    meta_cls = "sms__meta sms__meta--over" if over else "sms__meta"
    return f'<div class="sms"><div class="sms__bubble">{esc(text)}</div><div class="{meta_cls}"><span>{chars} characters</span><span>{segments} SMS segment{"s" if segments != 1 else ""}</span></div></div>'


def note(text: str, pos: str) -> str:
    return f'<p class="mock-note" style="{pos}">{text}</p>'


def toast(kind: str, title: str, text: str = "", *, action: str = "", progress_: bool = True, role: str = "") -> str:
    ic = {"info": "info", "success": "check-circle", "warning": "alert-triangle", "danger": "x-circle"}[kind]
    act = f'<button class="toast__action" type="button">{esc(action)}</button>' if action else ""
    tx = f'<div class="toast__text">{text}</div>' if text else ""
    prog = '<span class="toast__progress" aria-hidden="true"></span>' if progress_ else ""
    r = f' role="{role}"' if role else ""
    return (f'<div class="toast toast--{kind}"{r}>{icon(ic)}<div class="toast__body"><div class="toast__title">{esc(title)}</div>{tx}{act}</div>'
            f'<button class="close" type="button" aria-label="Dismiss">{icon("x", "icon--sm")}</button>{prog}</div>')


def toast_region(inner: str = "", *, alert_: bool = False) -> str:
    role = 'role="alert" aria-live="assertive"' if alert_ else 'role="status" aria-live="polite"'
    return f'<div class="toast-region" {role}>{inner}</div>'


# ---------------------------------------------------------------- shells
NAV_STAFF = [
    ("today", "Today", "home", "today"),
    ("check-in", "Check-in", "clipboard", "check-in"),
    ("families", "Families", "users", "families"),
    ("events", "Events", "calendar", "events"),
    ("programs", "Programs", "list", "programs"),
    ("messages", "Messages", "message", "messages"),
    ("reports", "Reports", "chart", "reports"),
]
NAV_SECONDARY = [
    ("incidents", "Incidents", "flag", "incidents"),
    ("settings", "Settings", "settings", "settings"),
]
TABBAR = [("today", "Today", "home"), ("check-in", "Check-in", "clipboard"), ("families", "Families", "users"), ("events", "Events", "calendar")]

# Participant roles (ADR 0043): their own sections only, each shown while its module is on. No search, no Settings.
NAV_ROLE = {
    "youth": [("today", "Today", "home", "today"), ("learning", "Learning", "star", "learning")],
    "mentor": [("today", "Today", "home", "today"), ("mentor-dashboard", "Mentoring", "users", "mentor-dashboard")],
    "volunteer": [("today", "Today", "home", "today"), ("check-in", "Check-in", "clipboard", "check-in")],
}


def brand(href: str, name: str = "PromiseHub") -> str:
    return (f'<a class="topbar__brand" href="{href}" aria-label="{esc(name)} home"><span class="ph-mark" aria-hidden="true"></span>'
            f'<span class="topbar__brand-name">{esc(name)}</span></a>')


def org_switcher(kind: str = "page", *, open_: bool = False, org: str = ORG, initials: str = "HY") -> str:
    """The design system's org switcher: shown only to people who cover more than one organization."""
    return (f'<div class="org-switcher"><button class="org-switcher__button" type="button" aria-haspopup="menu" aria-expanded="{"true" if open_ else "false"}" aria-label="Organization: {esc(org)}. Switch organization" data-href="{rel(kind, "dialog", "switch-organization")}">'
            f'<span class="org-mark" aria-hidden="true">{initials}</span><span class="org-switcher__name">{esc(org)}</span>{icon("chevron-down", "org-switcher__chevron")}</button></div>')


def topbar(current: str, user: dict, *, unread: int = 2, kind: str = "page", menu_open: bool = False, modules: list | None = None,
           switcher: str = "", role: str = "staff") -> str:
    links = []
    participant = role in NAV_ROLE
    for sid, label, _ic, cur in (NAV_ROLE[role] if participant else NAV_STAFF):
        if modules is not None and sid not in modules:
            continue
        a = ' aria-current="page"' if cur == current else ""
        md = " nav-link--md" if sid in ("programs", "messages", "reports") else ""
        links.append(f'<a class="nav-link{md}" href="{rel(kind, "page", sid)}"{a}>{esc(label)}</a>')
    for sid, label, _ic, cur in ([] if participant else NAV_SECONDARY):
        a = ' aria-current="page"' if cur == current else ""
        links.append(f'<a class="nav-link nav-link--secondary" href="{rel(kind, "page", sid)}"{a}>{esc(label)}</a>')
    links.append(f'<button class="nav-link nav-link--more" type="button" aria-haspopup="dialog" aria-expanded="false" data-href="{rel(kind, "dialog", "main-menu", role if participant else "default")}">More{icon("chevron-down", "icon--sm")}</button>')
    bell_label = f"Notifications, {unread} unread" if unread else "Notifications"
    bell_badge = f'<span class="badge badge--count" aria-hidden="true">{unread}</span>' if unread else ""
    search = "" if participant else (f'<form class="topbar__search" role="search" action="{rel(kind, "page", "search")}"><label class="visually-hidden" for="global-q">Search children, families and events</label>'
                                     f'<input class="input input--sm" id="global-q" name="q" type="search" placeholder="Search"></form>')
    return (f'<header class="topbar">{brand(rel(kind, "page", "today"))}{switcher}<span class="ph-org">{esc(ORG_SHORT)}</span>'
            f'<nav class="topbar__nav" aria-label="Primary">{"".join(links)}</nav><span class="topbar__spacer"></span>'
            f'{search}'
            f'<div class="bell-anchor"><button class="btn btn--ghost btn--icon" type="button" aria-label="{bell_label}" aria-haspopup="dialog" aria-expanded="false" data-href="{rel(kind, "notification", "bell", "unread" if unread else "empty")}">{icon("bell")}{bell_badge}</button></div>'
            f'<button class="avatar-trigger" type="button" aria-haspopup="menu" aria-expanded="{"true" if menu_open else "false"}" aria-label="Account menu for {esc(user["name"])}" data-href="{rel(kind, "dialog", "account-menu")}">{avatar(user)}</button></header>')


def tabbar(current: str, kind: str = "page", *, checkin_badge: int = 0, modules: list | None = None, role: str = "staff") -> str:
    items = []
    participant = role in NAV_ROLE
    for sid, label, ic in ([(i[0], i[1], i[2]) for i in NAV_ROLE[role]] if participant else TABBAR):
        if modules is not None and sid not in modules:
            continue
        a = ' aria-current="page"' if sid == current else ""
        b = f'<span class="badge badge--count" aria-label="{checkin_badge} not checked in">{checkin_badge}</span>' if (sid == "check-in" and checkin_badge) else ""
        items.append(f'<a href="{rel(kind, "page", sid)}"{a}>{icon(ic)}{esc(label)}{b}</a>')
    items.append(f'<button type="button" aria-haspopup="dialog" aria-expanded="false" data-href="{rel(kind, "dialog", "main-menu", role if participant else "default")}">{icon("menu")}More</button>')
    return f'<nav class="tabbar" aria-label="Primary, phone">{"".join(items)}</nav>'


def head(title: str, kind: str, sid: str, state: str, reqs: list[str], desc: str, depth: int = 2) -> str:
    up = "../" * depth
    reqm = f'<meta name="mock:requirements" content="{" ".join(reqs)}">' if reqs else ""
    return (f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{esc(title)} · {state} — PromiseHub mocks</title>\n<meta name="mock:kind" content="{kind}">\n<meta name="mock:screen" content="{sid}">\n'
            f'<meta name="mock:state" content="{state}">\n{reqm}\n<meta name="description" content="{esc(desc)}">\n'
            f'<link rel="stylesheet" href="{up}../design-system/tokens/tokens.css">\n<link rel="stylesheet" href="{up}../design-system/assets/components.css">\n'
            f'<link rel="stylesheet" href="{up}assets/ui.css">\n<link rel="stylesheet" href="{up}assets/mock.css">\n</head>\n')


def mock_bar(title: str, states: list[str], state: str, depth: int = 2) -> str:
    up = "../" * depth
    lis = "".join(f'<li><a href="{s}.html"{" aria-current=\"page\"" if s == state else ""}>{s}</a></li>' for s in states)
    return (f'<nav class="mock-bar" aria-label="Mock navigation"><a class="mock-bar__home" href="{up}index.html" aria-label="All mocks">⌂</a>'
            f'<span class="mock-bar__screen">{esc(title)}</span><ul class="mock-bar__states">{lis}</ul>'
            f'<button type="button" data-theme-toggle aria-pressed="false">☾ Dark</button>'
            f'<button type="button" data-chrome-toggle aria-label="Hide mock chrome">×</button></nav>\n<script src="{up}assets/mock.js"></script>\n</body>\n</html>\n')


def staff_doc(*, kind: str, sid: str, state: str, title: str, desc: str, reqs: list[str], states: list[str], nav: str,
              main: str, user: dict = STAFF["jaylen"], overlays: str = "", notes: str = "", inert: bool = False,
              unread: int = 2, checkin_badge: int = 0, toast_html: str = "", menu_open: bool = False, show_tabbar: bool = True,
              modules: list | None = None, switcher: str = "", role: str = "staff") -> str:
    inner = topbar(nav, user, unread=unread, kind=kind, menu_open=menu_open, modules=modules, switcher=switcher, role=role) + f'<main id="main" class="container">{main}</main>'
    if show_tabbar:
        inner += tabbar(nav, kind, checkin_badge=checkin_badge, modules=modules, role=role)
    wrap_open = '<div class="has-tabbar"' + (' inert aria-hidden="true"' if inert else "") + ">"
    body = ('<body>\n<a class="skip-link" href="#main">Skip to content</a>\n' + wrap_open + inner + "</div>\n"
            + (toast_html or toast_region()) + overlays + notes)
    return head(title, kind, sid, state, reqs, desc) + body + mock_bar(title, states, state)


def guardian_bar(kind: str = "page", lang: str = "English", *, help_href: str = "") -> str:
    langs = ["English", "Español", "Français"]
    opts = "".join(f'<option{" selected" if o == lang else ""}>{o}</option>' for o in langs)
    return (f'<header class="guardian-bar"><a class="guardian-bar__brand" href="{rel(kind, "page", "guardian-home")}"><span class="ph-mark" aria-hidden="true"></span>{esc(ORG)}</a>'
            f'<div class="field"><label class="visually-hidden" for="lang">Language</label>{icon("language", "icon--sm")}<select class="select" id="lang" name="lang">{opts}</select></div></header>')


def guardian_doc(*, kind: str, sid: str, state: str, title: str, desc: str, reqs: list[str], states: list[str], main: str,
                 lang: str = "English", overlays: str = "", notes: str = "", inert: bool = False, toast_html: str = "", html_lang: str = "en") -> str:
    inner = guardian_bar(kind, lang) + f'<main id="main" class="container"><div class="guardian">{main}</div></main>'
    wrap = f'<div{" inert aria-hidden=\"true\"" if inert else ""}>{inner}</div>'
    body = '<body>\n<a class="skip-link" href="#main">Skip to content</a>\n' + wrap + (toast_html or toast_region()) + overlays + notes
    doc = head(title, kind, sid, state, reqs, desc) + body + mock_bar(title, states, state)
    if html_lang != "en":
        doc = doc.replace('<html lang="en">', f'<html lang="{html_lang}">', 1)
    return doc


def auth_doc(*, kind: str, sid: str, state: str, title: str, desc: str, reqs: list[str], states: list[str], main: str,
             overlays: str = "", notes: str = "", toast_html: str = "") -> str:
    body = ('<body>\n<a class="skip-link" href="#main">Skip to content</a>\n'
            f'<main id="main" class="auth-layout"><div class="auth-card card stack">{main}</div></main>' + (toast_html or toast_region()) + overlays + notes)
    return head(title, kind, sid, state, reqs, desc) + body + mock_bar(title, states, state)


def wizard_doc(*, kind: str, sid: str, state: str, title: str, desc: str, reqs: list[str], states: list[str], main: str,
               user: dict = STAFF["marisol"], exit_href: str = "", exit_label: str = "Finish later", overlays: str = "", notes: str = "",
               toast_html: str = "", org: str = "") -> str:
    """Onboarding shell: brand, the organization once it has a name, one way out. No navigation until setup is done."""
    exit_ = f'<a class="btn btn--ghost btn--sm" href="{exit_href}">{exit_label}</a>' if exit_href else ""
    org_html = f'<span class="wizard-bar__org">{esc(org)}</span>' if org else ""
    inner = (f'<header class="topbar wizard-bar">{brand(rel(kind, "page", "today"))}{org_html}<span class="topbar__spacer"></span>{exit_}'
             f'<span class="avatar-trigger" aria-hidden="true">{avatar(user)}</span></header>'
             f'<main id="main" class="container"><div class="onboarding">{main}</div></main>')
    body = ('<body>\n<a class="skip-link" href="#main">Skip to content</a>\n<div>' + inner + "</div>\n" + (toast_html or toast_region()) + overlays + notes)
    return head(title, kind, sid, state, reqs, desc) + body + mock_bar(title, states, state)


def dialog_box(title: str, desc: str, body: str, footer: str, *, icon_name: str = "", danger: bool = False, alert_html: str = "",
               form: bool = False, scroll: bool = False) -> str:
    ic = ""
    if icon_name:
        ic = f'<div class="dialog__icon{" dialog__icon--danger" if danger else ""}" aria-hidden="true">{icon(icon_name)}</div>'
    d = f'<p id="dlg-desc" class="dialog__description">{desc}</p>' if desc else ""
    describe = ' aria-describedby="dlg-desc"' if desc else ""
    tag = "form" if form else "div"
    style = ' style="max-height: 60dvh;"' if scroll else ""
    return (f'<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title"{describe} data-dismiss-on-escape>'
            f'<{tag} class="dialog__panel"{style}{" action=\"#\" method=\"post\"" if form else ""}><div class="dialog__header">{ic}<div class="dialog__heading"><h2 class="dialog__title" id="dlg-title">{title}</h2>{d}</div>'
            f'<button class="btn btn--ghost btn--icon" type="button" aria-label="Close">{icon("x")}</button></div>'
            f'<div class="dialog__body stack">{alert_html}{body}</div><div class="dialog__footer">{footer}</div></{tag}></div>')


def push(kind: str, app: str, when: str, title: str, text: str) -> str:
    ic = {"info": "message", "success": "check-circle", "warning": "alert-triangle", "danger": "x-circle"}[kind]
    mod = "" if kind == "info" else f" push__icon--{kind}"
    return (f'<div class="push"><span class="push__icon{mod}" aria-hidden="true">{icon(ic, "icon--sm")}</span><div class="push__body">'
            f'<div class="push__head"><span>{esc(app)}</span><span>{esc(when)}</span></div><div class="push__title">{esc(title)}</div><div class="push__text">{esc(text)}</div></div></div>')
