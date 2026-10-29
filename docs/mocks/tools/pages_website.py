"""Explore the public website (prompt 81, L2-132 to L2-134): an organization's anonymous, read-only public pages at /site/{slug}: the
landing page (`site-landing`), programs and open cohorts with a link to apply (`site-programs`), about (`site-about`), get involved
(`site-get-involved`, which opens `volunteer-interest` and `start-donation` in dialogs.py), contact (`site-contact`) and privacy
(`site-privacy`). Every page shares the site nav and the site footer (`site-nav`, `site-footer`). Only published content shows: active
programs that have not ended, and while Learning is on, published tracks and their published modules; while Mentoring is on, the mentorship
model and each program's lead mentor by first name. An unknown address, a suspended organization and Public website off all show the same
not-found page. Ported from Waypoint's public-site landing, programs, about, get-involved, contact and privacy mocks (ADR 0043, ADR 0075).

Cast: a visitor (Dana Thompson, a parent looking for programs) at Harbourview Youth Collective, Hamilton. Northgate Community Church Kids has
Learning and Mentoring off. Today is Thu 5 Nov 2026."""
from kit import *  # noqa: F401,F403
from reg import screen

R_SITE = ["L2-132", "L2-133", "L2-134", "L1-025", "L2-005", "L2-001", "L2-031", "L2-033"]
TAGLINE = "Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays."
ABOUT = ("Harbourview Youth Collective runs free after-school tutoring, Saturday sports and one-to-one mentoring for children and youth "
         "in Hamilton’s north end. Families sign up once and hear from us in their own language.")
NORTHGATE = "Northgate Community Church Kids"
NA_FRAME = "The page has no data of its own: the site loads once with its frame (`site-landing/loading`, `site-landing/error`)."
NA_COLLECTION = "The page has no collection to be empty of."

STEPS = [
    ("Find a program", "Browse what’s running now and who each program is for."),
    ("Apply online", "Fill in the program’s enrollment form. It takes about five minutes."),
    ("We say hello", "Our team reviews your application and confirms your place."),
    ("Grow with us", "Your child learns, plays and grows with people who know their name."),
]

PROGRAMS = [
    dict(name="After‑School Tutoring", when="Mon–Thu, 4–6 pm", ages="Ages 6–13", runs="8 Sep 2026 – 24 Jun 2027", status=("Running now", "success"),
         open=True, track="Leadership Foundations", mentor="Daniel"),
    dict(name="Saturday Sports", when="Sat, 10 am–12 pm", ages="Ages 7–14", runs="12 Sep 2026 – 29 May 2027", status=("Running now", "success"),
         open=True, track="", mentor=""),
    dict(name="Winter Camp 2026", when="21–23 Dec, 8 am–5 pm", ages="Ages 6–12", runs="21 Dec 2026 – 23 Dec 2026", status=("Starts 21 Dec", "info"),
         open=True, track="", mentor=""),
]

TRACKS = [
    ("Leadership Foundations", "Growing as a leader at home, at school and in the cohort.",
     [("Knowing Yourself", "Strengths, values and the people around you.", "First Steps"), ("Leading by Serving", "Leading isn’t a title.", "")]),
]


def failed_load(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


def eyebrow(text: str) -> str:
    return f'<p class="site-section__eyebrow">{esc(text)}</p>'


def section(sid: str, over: str, title: str, body: str, lead: str = "") -> str:
    ld = f'<p class="text-muted">{lead}</p>' if lead else ""
    return f'<section class="site-section" aria-labelledby="{sid}">{eyebrow(over)}<h2 id="{sid}">{title}</h2>{ld}{body}</section>'


def program_card(p: dict, *, learning: bool = True, mentoring: bool = True, closed: bool = False) -> str:
    pairs = [("When", esc(p["when"])), ("Who", esc(p["ages"])), ("Runs", esc(p["runs"]))]
    if learning and p["track"]:
        pairs.append(("Learning track", esc(p["track"])))
    if mentoring and p["mentor"]:
        pairs.append(("Lead mentor", esc(p["mentor"])))
    head = f'<div class="cluster cluster--between"><h3 class="card__title">{esc(p["name"])}</h3>{badge(*p["status"])}</div>'
    if closed:
        act = '<p class="hint">Enrollment is closed for now. Contact us to hear when it opens.</p>'
    else:
        act = btn("Apply", "primary", href=page("enroll"), icon_name="arrow-right") .replace("Apply</", f'Apply<span class="visually-hidden"> to {esc(p["name"])}</span></')
    return f'<article class="card stack">{head}{facts(pairs)}{act}</article>'


def programs_grid(*, learning: bool = True, mentoring: bool = True, closed_last: bool = False, items=None) -> str:
    items = items or PROGRAMS
    cards = [program_card(p, learning=learning, mentoring=mentoring, closed=closed_last and i == len(items) - 1) for i, p in enumerate(items)]
    return f'<div class="site-grid">{"".join(cards)}</div>'


def hero(org: str = ORG, tagline: str = TAGLINE, city: str = "Hamilton, Ontario") -> str:
    return (f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">{esc(org)}</h1>'
            f'<p class="site-hero__lead">{esc(tagline)}</p>'
            f'<div class="cluster">{btn("See programs", "primary", href=page("site-programs"), size="lg")}{btn("Get involved", "ghost", href=page("site-get-involved"), size="lg")}</div></section>')


def steps_section() -> str:
    cards = "".join(f'<article class="card stack">{eyebrow(f"Step {i}")}<h3 class="card__title">{esc(t)}</h3><p class="text-muted">{esc(d)}</p></article>'
                    for i, (t, d) in enumerate(STEPS, 1))
    return section("how", "How it works", "From first visit to first day", f'<div class="site-grid">{cards}</div>')


def impact(learning: bool = True, programs: str = "3", open_: str = "3") -> str:
    items = [("Programs running", programs, "now or starting soon"), ("Open for enrollment", open_, "apply online")]
    if learning:
        items += [("Learning tracks", "1", "published"), ("Modules", "2", "published")]
    return section("impact", "Our programs", "What we run", kpis(items))


@screen("site-landing", "page", "Public website: home", route="/site/:slug", reqs=R_SITE, shell="site", na={})
def site_landing(S):
    S.add("default", "Dana opens Harbourview’s public website without signing in: the name and tagline, how it works, what runs now and how to join.",
          current="", main=hero() + steps_section() + impact()
          + section("open-now", "Open now", "Programs taking applications", programs_grid() + btn("See every program", "", href=page("site-programs"), icon_name="arrow-right")),
          notes=note("Anonymous and read-only. The organization comes from the address; the counts are programs and published content, never people.", "top: 5rem; right: 1rem;"))
    S.add("loading", "The site’s name and tagline show first; how it works and the programs load in skeletons.", current="",
          main=hero() + skeleton_kpis(2) + skeleton_list(3, "Loading programs"))
    S.add("empty", "Nothing is open right now: the counts say so and the visitor is invited to get in touch.", current="",
          main=hero() + steps_section() + impact(programs="0", open_="0")
          + section("open-now", "Open now", "Programs taking applications",
                    card(empty("No programs are open right now", "New programs open each season. Get in touch and we’ll let you know.", action=btn("Contact us", "primary", href=page("site-contact")), icon_name="calendar"), cls="card--flush")))
    S.add("error", "The site’s content failed to load; the frame stays and offers Try again.", current="", main=hero() + failed_load("We couldn’t load our programs"))
    S.add("modules-off", "Northgate, with Learning and Mentoring off: no learning counts and no track or mentor on a program.", current="", org=NORTHGATE, city="Hamilton, Ontario",
          main=hero(NORTHGATE, "A Wednesday kids club with games, snacks and homework help.") + steps_section() + impact(learning=False, programs="1", open_="1")
          + section("open-now", "Open now", "Programs taking applications", programs_grid(learning=False, mentoring=False,
                    items=[dict(name="Kids Club", when="Wed, 6–7:30 pm", ages="Ages 5–11", runs="9 Sep 2026 – 16 Jun 2027", status=("Running now", "success"), open=True, track="", mentor="")])))
    S.add("not-found", "An unknown address, a suspended organization or Public website off: the same page, so a visitor cannot tell which. The website library never loads.", chrome=False,
          main=page_header("Page not found", "") + card(empty("This page isn’t here", "Check the address, or ask the organization for its link.", icon_name="globe"), cls="card--flush"))


@screen("site-programs", "page", "Public website: programs", route="/site/:slug/programs", reqs=R_SITE, shell="site", na={})
def site_programs(S):
    hdr = (f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">Programs and open cohorts</h1>'
           '<p class="site-hero__lead">Everything we run this season, who it’s for and how to apply.</p></section>')
    tracks = "".join(
        '<article class="card stack">' + f'<h3 class="card__title">{esc(n)}</h3><p class="text-muted">{esc(d)}</p>'
        + '<ol class="stack" style="gap: var(--space-2); padding-inline-start: var(--space-5);">'
        + "".join(f'<li><strong>{esc(m)}</strong> · <span class="text-muted">{esc(md)}</span>{" " + badge(b, "success") if b else ""}</li>' for m, md, b in mods)
        + "</ol></article>" for n, d, mods in TRACKS)
    learn = section("learn", "What youth learn", "Learning tracks", f'<div class="site-grid">{tracks}</div>', "Published tracks and their modules. Finishing a module earns its badge.")
    mentor = section("mentor", "Mentorship", "You’re never on your own",
                     ul_list([list_item("Weekly check-ins", "A mentor checks in with each young person every week."), list_item("Feedback on their work", "Encouragement on what they make and write."), list_item("Extra support", "More time when it’s needed.")], label="What mentors do"),
                     "Every young person in a mentored program has a mentor who walks with them through the season.")
    cur = lambda body: section("open", "Current and upcoming", "Cohorts you can join", body)
    S.add("default", "Every current program with when, who, the dates and Apply; the published learning track and the mentorship model.", current="site-programs",
          main=hdr + cur(programs_grid()) + learn + mentor,
          notes=note("Apply opens the program’s enrollment link (prompt 58). Archived and finished programs never show; nor do drafts.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Loading programs.", current="site-programs", main=hdr + skeleton_list(3, "Loading programs"))
    S.add("empty", "No current programs: an explanation and Contact us.", current="site-programs",
          main=hdr + cur(card(empty("No programs are open right now", "New programs open each season. Get in touch and we’ll let you know.", action=btn("Contact us", "primary", href=page("site-contact")), icon_name="calendar"), cls="card--flush")))
    S.add("error", "Programs failed to load.", current="site-programs", main=hdr + failed_load("We couldn’t load our programs"))
    S.add("closed", "Winter Camp’s enrollment is closed: it still shows, with no Apply and a way to ask.", current="site-programs", main=hdr + cur(programs_grid(closed_last=True)) + learn + mentor)
    S.add("modules-off", "Northgate with Learning and Mentoring off: programs only, no tracks, no mentorship, no mentor names.", current="site-programs", org=NORTHGATE,
          main=hdr + cur(programs_grid(learning=False, mentoring=False, items=[dict(name="Kids Club", when="Wed, 6–7:30 pm", ages="Ages 5–11", runs="9 Sep 2026 – 16 Jun 2027", status=("Running now", "success"), open=True, track="", mentor="")])))


@screen("site-about", "page", "Public website: about", route="/site/:slug/about", reqs=R_SITE, shell="site", na={"loading": NA_FRAME, "error": NA_FRAME})
def site_about(S):
    hdr = f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">About {esc(ORG)}</h1></section>'
    promise = section("promise", "Our promise", "Safe, known and cared for",
                      ul_list([list_item("Screened adults", "Every adult who works with children is screened and reference checked."),
                               list_item("Guardian consent", "We ask a guardian’s consent before a child takes part."),
                               list_item("Health on hand", "Allergies and medications are on hand at every session.")], label="Our promise"))
    find = card(facts([("Where", "Hamilton, Ontario"), ("Email", '<a href="mailto:hello@harbourview.example">hello@harbourview.example</a>')]), title="Find us", tid="find")
    S.add("default", "The organization’s about text from its website profile, where to find it and its promise to families.", current="site-about",
          main=hdr + f'<div class="site-prose"><p>{esc(ABOUT)}</p></div>' + find + promise + f'<div class="cluster">{btn("See programs", "primary", href=page("site-programs"))}{btn("Contact us", "ghost", href=page("site-contact"))}</div>')
    S.add("empty", "No about text and no public email yet: a short line instead, and the city.", current="site-about",
          main=hdr + f'<div class="site-prose"><p class="text-muted">We’re a youth organization in Hamilton, Ontario. Our story is coming soon.</p></div>'
          + card(facts([("Where", "Hamilton, Ontario")]), title="Find us", tid="find") + promise)


def volunteer_card() -> str:
    return ('<article class="card stack"><h2 class="card__title" id="volunteer">Volunteer with us</h2>'
            '<p class="text-muted">Help with homework, coach a team or lend a hand at camp. Because you’ll work with children, every volunteer is screened and reference checked first.</p>'
            + btn("Sign up to volunteer", "primary", data_href=dialog("volunteer-interest"), attrs='aria-haspopup="dialog"') + '</article>')


def give_card() -> str:
    return ('<article class="card stack"><h2 class="card__title" id="give">Give monthly</h2>'
            '<p class="text-muted">A monthly gift of $20, $50 or $100 keeps programs free for every family. Payment is handled by our secure payment provider; we never see your card.</p>'
            + btn("Donate", "primary", data_href=dialog("start-donation"), attrs='aria-haspopup="dialog"') + '</article>')


def ask_card() -> str:
    return ('<article class="card stack"><h2 class="card__title" id="ask">Have a question first?</h2>'
            '<p class="text-muted">Not sure where you’d fit? Write to us and we’ll help you find a place.</p>'
            + btn("Contact us", "", href=page("site-contact")) + '</article>')


def get_involved_main(extra: str = "") -> str:
    return (f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">Help us keep our promises</h1>'
            '<p class="site-hero__lead">Give your time, give monthly, or just ask us how you can help.</p></section>'
            + extra + f'<div class="site-grid">{volunteer_card()}{give_card()}{ask_card()}</div>')


@screen("site-get-involved", "page", "Public website: get involved", route="/site/:slug/get-involved", reqs=R_SITE, shell="site",
        na={"loading": NA_FRAME, "error": NA_FRAME, "empty": NA_COLLECTION})
def site_get_involved(S):
    S.add("default", "Three ways to help: volunteer (a dialog with the screening acknowledgement), give monthly (a dialog that hands over to the payment provider) and ask a question.",
          current="site-get-involved", main=get_involved_main())
    S.add("volunteered", "After signing up: a toast says the team will follow up about screening.", current="site-get-involved", main=get_involved_main(),
          toast_html=toast_region(toast("success", "Thanks for offering to help", "We’ll be in touch about next steps, including screening.")))


CONTACT_TOPICS = ["Programs and enrollment", "Volunteering", "Giving", "Something else"]


def contact_main(*, err=None, busy=False, alert_html="", name="Dana Thompson", email="dana.t@example.com", topic="Programs and enrollment",
                 message="Is there still room in Saturday Sports for an 11-year-old?") -> str:
    e = err or {}
    summary = form_summary(list(e.items())) if e else ""
    form = (f'<form class="card stack" style="max-width: var(--layout-form-wide);" action="#" method="post" novalidate aria-labelledby="form-title">'
            f'<h2 class="card__title" id="form-title">Send us a message</h2>{alert_html}{summary}'
            + field("contact-name", "Your name", value=name, required=True, autocomplete="name", error=e.get("contact-name", ""))
            + field("contact-email", "Email", type_="email", value=email, required=True, autocomplete="email", error=e.get("contact-email", ""), help_="We reply to this address.")
            + select("contact-topic", "Topic", CONTACT_TOPICS, selected=topic)
            + textarea("contact-message", "Message", value=message, rows=5, error=e.get("contact-message", ""), count=f"{len(message)} / 2,000")
            + f'<div class="cluster">{btn("Sending…" if busy else "Send message", "primary", type_="submit", busy=busy, icon_name="" if busy else "send")}</div>'
            + '<p class="hint">We use what you send only to reply. See <a href="' + page("site-privacy") + '">Privacy</a>.</p></form>')
    hdr = (f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">Get in touch</h1>'
           '<p class="site-hero__lead">Questions about programs, volunteering or giving? We’d love to hear from you.</p></section>')
    find = card(facts([("Where", "Hamilton, Ontario"), ("Email", '<a href="mailto:hello@harbourview.example">hello@harbourview.example</a>')]), title="Find us", tid="find")
    return hdr + f'<div class="split">{form}{find}</div>'


@screen("site-contact", "page", "Public website: contact", route="/site/:slug/contact", reqs=R_SITE, shell="site",
        na={"loading": NA_FRAME, "error": "A failed send is `failed`; the page itself loads with the site.", "empty": NA_COLLECTION})
def site_contact(S):
    S.add("default", "Dana writes to Harbourview: name, email, topic and message, with where to find them.", current="site-contact", main=contact_main())
    S.add("invalid", "Sent with the name empty, an email that isn’t one and no message: inline errors and a summary; nothing is sent.", current="site-contact",
          main=contact_main(err={"contact-name": "Enter your name.", "contact-email": "Enter an email like name@example.com.", "contact-message": "Write your message."}, name="", email="dana@", message=""))
    S.add("busy", "Sending.", current="site-contact", main=contact_main(busy=True))
    S.add("sent", "Sent: the form is replaced by an acknowledgement that says what happens next.", current="site-contact",
          main=(f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">Get in touch</h1></section>'
                + card(empty("Message sent", "Thanks, Dana. We’ve got your message and someone from our team will reply by email, usually within two working days.",
                             action=btn("Back to home", "primary", href=page("site-landing")), icon_name="check-circle"), cls="card--flush")))
    S.add("failed", "The send failed: everything typed is kept and Try again is one press.", current="site-contact",
          main=contact_main(alert_html=alert("danger", "Your message didn’t send", "Nothing was lost. Check your connection and try again.")))
    S.add("too-many", "A sixth message from the same email within an hour: refused kindly; nothing is stored.", current="site-contact",
          main=contact_main(alert_html=alert("warning", "You’ve sent several messages already", "We’ve got them. Please wait an hour before sending another.")))


@screen("site-privacy", "page", "Public website: privacy", route="/site/:slug/privacy", reqs=R_SITE, shell="site",
        na={"loading": NA_FRAME, "error": NA_FRAME, "empty": "The privacy page is fixed text with the organization’s name."})
def site_privacy(S):
    body = ('<div class="site-prose">'
            '<h2>What we collect</h2><p>When you apply, we collect what the enrollment form asks: your child’s name and date of birth, your contact details and anything you tell us about allergies or medication, so we can welcome your child safely.</p>'
            '<h2>When you write to us</h2><p>A message, a volunteer sign-up or a donation keeps your name, email and what you wrote, only so we can reply. We never sell personal information.</p>'
            '<h2>Safeguarding</h2><p>A guardian consents before a child takes part, and every adult who works with children is screened and reference checked. Donations are handled by our payment provider; we never see or store card details.</p>'
            f'<h2>Questions</h2><p>Write to us from the <a href="{page("site-contact")}">contact page</a>.</p></div>')
    S.add("default", "Privacy and safeguarding in plain words, with the organization’s name.", current="",
          main=f'<section class="site-hero" aria-labelledby="site-title"><h1 id="site-title">Privacy and safeguarding</h1>'
          f'<p class="site-hero__lead">{esc(ORG)} works with children, so their privacy and safety come first.</p></section>' + body)
