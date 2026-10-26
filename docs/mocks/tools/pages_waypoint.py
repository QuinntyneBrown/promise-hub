"""The Waypoint foundation (ADR 0043): the first page of each new library, shown while its module is on.
Learning (youth) and Curriculum (authors) follow Learning, Mentoring follows Mentoring, and the public website
follows Public website. The journeys of prompts 50 to 81 fill these pages; until then each is its own empty state."""
from kit import *  # noqa: F401,F403
from reg import screen

R_LEARN, R_MENTOR, R_SITE = "L1-023", "L1-024", "L1-025"
SOFIA = YOUTH["sofia"]
DANIEL = STAFF["daniel"]
MARISOL = STAFF["marisol"]
NA_PLACEHOLDER = "Until the journeys add content, the default state is the empty state."


def failed(title: str) -> str:
    return card(empty(title, "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle"), cls="card--flush")


@screen("learning", "page", "Learning", route="/learning", reqs=[R_LEARN, "L1-002"], na={"empty": NA_PLACEHOLDER})
def learning(S):
    hdr = page_header("Learning", "Your lessons, quizzes, assignments and badges.")
    kw = dict(nav="learning", role="youth", user=SOFIA, unread=0, modules=["today", "learning"])
    S.add("default", "Sofía opens Learning before any track is published: the page explains what will appear and where to go meanwhile.", **kw,
          main=hdr + card(empty("No lessons yet", "When your program publishes a track, its lessons appear here.",
                                action=btn("Back to Today", "", href=page("today", "youth")), icon_name="star"), cls="card--flush"),
          notes=note("Loaded only while Learning is on; the server answers 404 for /learning/me when it is off.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Learning loading.", **kw, main=hdr + skeleton_list(3, "Loading your lessons"))
    S.add("error", "Learning failed to load; the shell stays.", **kw, main=hdr + failed("We couldn’t load your lessons"))


@screen("curriculum", "page", "Curriculum", route="/curriculum", reqs=[R_LEARN], na={"empty": NA_PLACEHOLDER})
def curriculum(S):
    hdr = page_header("Curriculum", "Tracks, modules and lessons your youth work through.")
    kw = dict(nav="curriculum", user=MARISOL)
    S.add("default", "Marisol (Program director) opens Curriculum from More while Learning is on: no tracks written yet.", **kw,
          main=hdr + card(empty("No tracks yet", "Tracks you write appear here, ready to publish to a program.", icon_name="list"), cls="card--flush"))
    S.add("loading", "Curriculum loading.", **kw, main=hdr + skeleton_list(3, "Loading tracks"))
    S.add("error", "Curriculum failed to load.", **kw, main=hdr + failed("We couldn’t load the curriculum"))
    S.add("forbidden", "A site lead opening Curriculum: only admins and program directors author.", nav="curriculum", user=STAFF["jaylen"],
          main=hdr + card(empty("Program directors write the curriculum", "Ask Marisol Delgado or Tom Nguyen.", action=btn("Back to Today", "", href=page("today")), icon_name="lock"), cls="card--flush"))


@screen("mentoring", "page", "Mentoring", route="/mentoring", reqs=[R_MENTOR, "L1-002"], na={"empty": NA_PLACEHOLDER})
def mentoring(S):
    hdr = page_header("Mentoring", "The youth assigned to you.")
    kw = dict(nav="mentoring", role="mentor", user=DANIEL, unread=0, modules=["today", "mentoring"])
    S.add("default", "Daniel opens Mentoring before anyone is assigned to him: a mentor sees only assigned youth, so the list is empty.", **kw,
          main=hdr + card(empty("No youth assigned yet", "A program director assigns youth to you. They appear here with their progress.", icon_name="users"), cls="card--flush"),
          notes=note("The server lists only youth assigned to this mentor; with no assignments the answer is an empty list.", "top: 5rem; right: 1rem;"))
    S.add("loading", "Mentoring loading.", **kw, main=hdr + skeleton_list(4, "Loading your youth"))
    S.add("error", "Mentoring failed to load.", **kw, main=hdr + failed("We couldn’t load your youth"))


@screen("website", "page", "Public website", route="/site/harbourview", reqs=[R_SITE], shell="guardian", na={"empty": NA_PLACEHOLDER})
def website(S):
    hero = page_header(ORG, "Hamilton, Ontario · after-school tutoring, sports and mentoring for children and teens")
    S.add("default", "A visitor opens Harbourview’s public page while Public website is on: published content only, no sign-in.",
          main=hero + card(empty("Our pages are being written", "Programs, open cohorts and ways to join appear here once they are published.", icon_name="globe"), cls="card--flush"),
          notes=note("Anonymous and read-only. The organization comes from the slug in the address; the server answers 404 for an unknown slug or while the module is off.", "top: 5rem; right: 1rem;"))
    S.add("loading", "The public page loading.", main=page_header(ORG, "") + skeleton_list(2, "Loading the page"))
    S.add("error", "The public page failed to load.", main=hero + failed("We couldn’t load this page"))
    S.add("not-found", "An unknown slug, or Public website is off: the same not-found page, so a visitor cannot tell which.",
          main=page_header("Page not found", "") + card(empty("This page isn’t here", "Check the address, or ask the organization for its link.", icon_name="globe"), cls="card--flush"))
