"""The guardian portal (prompt 73, L2-102 to L2-104): what a verified household link shows about each child and the announcements meant for
the family. Ported from Waypoint's guardian home, child-progress and announcements mocks as guardian pages (ADR 0043, ADR 0067): no account,
a verified link and code (L2-026), in the household's language (L2-027). The portal states of guardian-home are in pages_guardian.py.
Carmen Rivera (Spanish) is the guardian; Sofía (12) has a youth account and Learning, Mateo (9) does not."""
from kit import *  # noqa: F401,F403
from reg import screen
from pages_guardian import g_footer
from pages_journey import medals, medal, EARNED

R_CHILD = ["L2-102", "L2-104", "L2-026", "L2-027", "L2-005", "L2-001", "L1-013", "L1-023", "L2-035", "L2-036"]
R_NEWS = ["L2-103", "L2-026", "L2-027", "L2-005", "L2-001", "L1-013", "L1-010", "L2-035", "L2-036"]

# ------------------------------------------------------------------ copy in the three household languages
T = {
    "en": dict(
        back="Back to your family", heading="Sofía", intro="A read-only look at how Sofía is doing at Harbourview Youth Collective.",
        programs="After‑School Tutoring · Saturday Sports",
        schedule="Schedule", schedule_cap="The next four weeks.",
        s1=("Tutoring night", "Thu 5 Nov · 4:00–6:00 pm · Harbourview Community Centre, Room 2", "Today"),
        s2=("Saturday Sports", "Sat 7 Nov · 10:00 am–12:00 pm · Bennetto School gym", ""),
        s3=("Royal Botanical Gardens trip", "Sat 14 Nov · 9:00 am–3:00 pm · Royal Botanical Gardens", ""),
        cancelled="Cancelled", today="Today",
        consents="Consents", c1=("Taking part in Learning and mentoring", "Signed by Carmen Rivera (Parent) · 5 Nov 2026 · GC‑4F7A2C", "Given"),
        c2=("Royal Botanical Gardens trip", "Signed by Carmen Rivera · 3 Nov 2026", "Signed"),
        c3=("Saturday Sports field day", "Sign by Fri 13 Nov from the link we texted you.", "Not signed yet"),
        attendance="Attendance", att_value="92%", att_cap="11 of 12 sessions",
        a=[("Tutoring night", "Thu 29 Oct", "Present", "success"), ("Tutoring night", "Thu 22 Oct", "Late", "info"),
           ("Tutoring night", "Thu 15 Oct", "Excused", ""), ("Saturday Sports", "Sat 10 Oct", "Absent", "warning")],
        learning="Learning", overall="Overall progress", overall_cap="4 of 9 lessons", badges_label="Badges", badges_value="2", badges_cap="of 6 badges",
        modules="Progress by module",
        m=[("Knowing Yourself", 2, 2, "Complete", "success"), ("Leading by Serving", 1, 3, "In progress", "info"),
           ("Speaking Up", 0, 2, "Not started", ""), ("Web Basics", 0, 2, "Not started", "")],
        of="of", lessons="lessons", earned="Badges Sofía has earned",
        private="Lessons, quiz answers, reflections and her mentor’s notes stay between Sofía and her mentor.",
        loading="Loading Sofía’s page",
    ),
    "es": dict(
        back="Volver a su familia", heading="Sofía", intro="Un resumen de solo lectura de cómo le va a Sofía en Harbourview Youth Collective.",
        programs="After‑School Tutoring · Saturday Sports",
        schedule="Horario", schedule_cap="Las próximas cuatro semanas.",
        s1=("Tutoring night", "jue 5 nov · 4:00–6:00 p. m. · Harbourview Community Centre, Room 2", "Hoy"),
        s2=("Saturday Sports", "sáb 7 nov · 10:00 a. m.–12:00 p. m. · Bennetto School gym", ""),
        s3=("Royal Botanical Gardens trip", "sáb 14 nov · 9:00 a. m.–3:00 p. m. · Royal Botanical Gardens", ""),
        cancelled="Cancelada", today="Hoy",
        consents="Consentimientos", c1=("Participar en Learning y la mentoría", "Firmado por Carmen Rivera (Parent) · 5 nov 2026 · GC‑4F7A2C", "Dado"),
        c2=("Royal Botanical Gardens trip", "Firmado por Carmen Rivera · 3 nov 2026", "Firmado"),
        c3=("Saturday Sports field day", "Firme antes del vie 13 nov con el enlace que le enviamos.", "Sin firmar"),
        attendance="Asistencia", att_value="92 %", att_cap="11 de 12 sesiones",
        a=[("Tutoring night", "jue 29 oct", "Presente", "success"), ("Tutoring night", "jue 22 oct", "Tarde", "info"),
           ("Tutoring night", "jue 15 oct", "Justificada", ""), ("Saturday Sports", "sáb 10 oct", "Ausente", "warning")],
        learning="Learning", overall="Progreso general", overall_cap="4 de 9 lecciones", badges_label="Insignias", badges_value="2", badges_cap="de 6 insignias",
        modules="Progreso por módulo",
        m=[("Knowing Yourself", 2, 2, "Completo", "success"), ("Leading by Serving", 1, 3, "En curso", "info"),
           ("Speaking Up", 0, 2, "Sin empezar", ""), ("Web Basics", 0, 2, "Sin empezar", "")],
        of="de", lessons="lecciones", earned="Insignias que Sofía ha ganado",
        private="Las lecciones, las respuestas, las reflexiones y las notas de su mentor quedan entre Sofía y su mentor.",
        loading="Cargando la página de Sofía",
    ),
    "fr": dict(
        back="Retour à votre famille", heading="Sofía", intro="Un aperçu en lecture seule de la façon dont Sofía progresse à Harbourview Youth Collective.",
        programs="After‑School Tutoring · Saturday Sports",
        schedule="Horaire", schedule_cap="Les quatre prochaines semaines.",
        s1=("Tutoring night", "jeu. 5 nov. · 16 h 00–18 h 00 · Harbourview Community Centre, Room 2", "Aujourd’hui"),
        s2=("Saturday Sports", "sam. 7 nov. · 10 h 00–12 h 00 · Bennetto School gym", ""),
        s3=("Royal Botanical Gardens trip", "sam. 14 nov. · 9 h 00–15 h 00 · Royal Botanical Gardens", ""),
        cancelled="Annulée", today="Aujourd’hui",
        consents="Consentements", c1=("Participer à Learning et au mentorat", "Signé par Carmen Rivera (Parent) · 5 nov. 2026 · GC‑4F7A2C", "Donné"),
        c2=("Royal Botanical Gardens trip", "Signé par Carmen Rivera · 3 nov. 2026", "Signé"),
        c3=("Saturday Sports field day", "Signez avant le ven. 13 nov. avec le lien envoyé par texto.", "Pas encore signé"),
        attendance="Présences", att_value="92 %", att_cap="11 sur 12 séances",
        a=[("Tutoring night", "jeu. 29 oct.", "Présente", "success"), ("Tutoring night", "jeu. 22 oct.", "En retard", "info"),
           ("Tutoring night", "jeu. 15 oct.", "Excusée", ""), ("Saturday Sports", "sam. 10 oct.", "Absente", "warning")],
        learning="Learning", overall="Progrès global", overall_cap="4 leçons sur 9", badges_label="Badges", badges_value="2", badges_cap="sur 6 badges",
        modules="Progrès par module",
        m=[("Knowing Yourself", 2, 2, "Terminé", "success"), ("Leading by Serving", 1, 3, "En cours", "info"),
           ("Speaking Up", 0, 2, "Pas commencé", ""), ("Web Basics", 0, 2, "Pas commencé", "")],
        of="sur", lessons="leçons", earned="Badges obtenus par Sofía",
        private="Les leçons, les réponses aux quiz, les réflexions et les notes du mentor restent entre Sofía et son mentor.",
        loading="Chargement de la page de Sofía",
    ),
}
LANG = {"en": "English", "es": "Español", "fr": "Français"}


def back(t: dict) -> str:
    return f'<p><a href="{page("guardian-home", "portal")}">← {t["back"]}</a></p>'


def hdr(t: dict, name: str = "Sofía", intro: str | None = None) -> str:
    return back(t) + f'<div><h1>{name}</h1><p class="text-muted">{intro or t["intro"]}</p><p class="hint">{t["programs"]}</p></div>'


def schedule(t: dict, *, cancelled: bool = False, empty_: bool = False) -> str:
    if empty_:
        return card(f'<p>{ {"en": "Nothing scheduled in the next four weeks.", "es": "No hay nada programado en las próximas cuatro semanas.", "fr": "Rien de prévu dans les quatre prochaines semaines."}[t["_lang"]] }</p>',
                    title=t["schedule"], tid="schedule")
    rows = []
    for i, (n, meta, today) in enumerate([t["s1"], t["s2"], t["s3"]]):
        end = badge(t["cancelled"], "danger") if cancelled and i == 1 else (badge(today, "info") if today else "")
        rows.append(list_item(esc(n), esc(meta), end=end))
    return card(ul_list(rows, card=False, label=t["schedule"]), title=t["schedule"], tid="schedule", cls="card--flush", footer=t["schedule_cap"])


def consents(t: dict, *, empty_: bool = False, participation: bool = True) -> str:
    if empty_:
        return card(f'<p>{ {"en": "Nothing to sign right now.", "es": "No hay nada que firmar por ahora.", "fr": "Rien à signer pour le moment."}[t["_lang"]] }</p>', title=t["consents"], tid="consents")
    items = []
    if participation:
        items.append(list_item(esc(t["c1"][0]), esc(t["c1"][1]), end=badge(t["c1"][2], "success")))
    items.append(list_item(esc(t["c2"][0]), esc(t["c2"][1]), end=badge(t["c2"][2], "success")))
    items.append(list_item(esc(t["c3"][0]), esc(t["c3"][1]), end=badge(t["c3"][2], "warning")))
    return card(ul_list(items, card=False, label=t["consents"]), title=t["consents"], tid="consents", cls="card--flush")


def attendance(t: dict, *, empty_: bool = False) -> str:
    if empty_:
        return card(f'<p>{ {"en": "No sessions marked yet.", "es": "Todavía no hay sesiones registradas.", "fr": "Aucune séance notée pour l’instant."}[t["_lang"]] }</p>', title=t["attendance"], tid="attendance")
    rows = "".join(list_item(esc(n), esc(d), end=badge(s, k)) for n, d, s, k in t["a"])
    return (f'<section class="stack" aria-labelledby="attendance"><h2 id="attendance">{t["attendance"]}</h2>'
            + kpis([(t["attendance"], t["att_value"], t["att_cap"])]) + ul_list([rows], label=t["attendance"]) + "</section>")


def learning(t: dict, *, empty_: bool = False) -> str:
    if empty_:
        return card(f'<p>{ {"en": "Sofía hasn’t started a lesson yet. Her progress and badges show here once she does.", "es": "Sofía todavía no ha empezado una lección. Su progreso y sus insignias aparecerán aquí.", "fr": "Sofía n’a pas encore commencé de leçon. Ses progrès et ses badges s’afficheront ici."}[t["_lang"]] }</p>',
                    title=t["learning"], tid="learning")
    mods = "".join(f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(n)}</div>{progress(d, tot, f"{n}: {d} {t["of"]} {tot} {t["lessons"]}", show=f"{d} {t["of"]} {tot}")}</div>{badge(s, k)}</li>'
                   for n, d, tot, s, k in t["m"])
    earned = medals([medal(n, ic, "") for n, ic, _, _ in EARNED], t["earned"])
    return (f'<section class="stack" aria-labelledby="learning"><h2 id="learning">{t["learning"]}</h2>'
            + kpis([(t["overall"], "44%" if t["_lang"] == "en" else "44 %", t["overall_cap"]), (t["badges_label"], t["badges_value"], t["badges_cap"])])
            + card(f'<ul class="list" aria-label="{esc(t["modules"])}">{mods}</ul>', title=t["modules"], tid="modules", cls="card--flush")
            + card(earned, title=t["earned"], tid="earned")
            + f'<p class="hint">{icon("lock", "icon--sm")} {t["private"]}</p></section>')


def child_page(lang: str, **kw) -> str:
    t = dict(T[lang], _lang=lang)
    return (hdr(t) + schedule(t, cancelled=kw.get("cancelled", False)) + consents(t) + attendance(t)
            + ("" if kw.get("no_learning") else learning(t)) + g_footer())


@screen("guardian-child", "page", "Guardian: your child", route="/g/home/:token/children/:child", reqs=R_CHILD, shell="guardian", na={})
def guardian_child(S):
    S.add("default", "Carmen opens Sofía from her family page on a verified device: her schedule for the next four weeks, her consents, her attendance and, because Learning is on and Sofía has a youth account, read-only Learning progress. No edit controls, no lesson content, no answers.",
          main=child_page("en"), notes=note("One read: GET /g/home/{token}/children/{childId}. A child of another household or organization answers 404. Sections of modules that are off are not sent.", "top: 4rem; right: 1rem;"))
    S.add("es", "The same page in Spanish, Carmen’s household language: headings, dates and statuses translated; program and session names as staff wrote them.",
          lang="Español", html_lang="es", main=child_page("es"))
    S.add("fr", "The same page in French, as the Haddad household sees it.", lang="Français", html_lang="fr", main=child_page("fr"))
    t = dict(T["en"], _lang="en")
    S.add("no-learning", "Mateo (9) has no youth account, or Learning is off: there is no Learning section and nothing mentions it. His consents have no participation consent.",
          main=back(t) + '<div><h1>Mateo</h1><p class="text-muted">A read-only look at how Mateo is doing at Harbourview Youth Collective.</p><p class="hint">After‑School Tutoring</p></div>'
          + schedule(t) + consents(t, participation=False) + attendance(t) + g_footer())
    S.add("cancelled", "Staff cancelled Saturday Sports: it stays on the schedule, marked Cancelled.", main=hdr(t) + schedule(t, cancelled=True) + consents(t) + attendance(t) + learning(t) + g_footer())
    S.add("empty", "A child just enrolled: nothing scheduled, nothing to sign, no sessions marked and no lesson started; each section says so in words.",
          main=hdr(t) + schedule(t, empty_=True) + consents(t, empty_=True) + attendance(t, empty_=True) + learning(t, empty_=True) + g_footer())
    S.add("loading", "Loading: the back link stays; skeletons hold the sections’ place.",
          main=back(t) + '<h1>Loading…</h1>' + skeleton_list(3, t["loading"]) + skeleton_list(2, t["loading"]) + skeleton_kpis(2))
    S.add("error", "The page failed to load: say so and offer Try again.",
          main=back(t) + card(empty("We couldn’t load this page", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle", heading="h1"), cls="card--flush") + g_footer())
    S.add("expired", "The household’s link was revoked (a new mobile number, say): the page says so and how to get a new one.",
          main='<h1>This link has expired</h1>' + card(f'<div class="stack"><p>Ask Harbourview Youth Collective for a new one.</p><div>{btn("Call 905-555-0100", "primary", icon_name="phone", href="tel:+19055550100")}</div></div>') + g_footer())
    S.add("not-found", "The child is not in this household (another family’s, another organization’s), or Roster is off: not available, nothing about the child.",
          main=empty("This page isn’t available", "Ask the organization that sent you the link.", icon_name="lock", heading="h1"))


# ------------------------------------------------------------------ announcements
N = {
    "en": dict(heading="Announcements", intro="Updates for your family from Harbourview Youth Collective.", mark="Mark all read", new="New",
               items=[("Tutoring night moves to Room 2 this Thursday", "The gym floor is being redone. Same time, 4:00 pm. Pickup is at the main entrance.", "Marisol Delgado · Thu 5 Nov", True),
                      ("Royal Botanical Gardens trip: slips due Friday", "Please sign the permission slip we texted by Friday 13 November. Lunch is provided.", "Marisol Delgado · Mon 2 Nov", True),
                      ("Halloween party photos", "Thanks to every family who came. Photos are on the board in the lobby.", "Priya Raman · Sat 31 Oct", False)],
               read_all="All caught up. New announcements show here."),
    "es": dict(heading="Anuncios", intro="Novedades para su familia de Harbourview Youth Collective.", mark="Marcar todos como leídos", new="Nuevo",
               items=[("Tutoring night moves to Room 2 this Thursday", "The gym floor is being redone. Same time, 4:00 pm. Pickup is at the main entrance.", "Marisol Delgado · jue 5 nov", True),
                      ("Royal Botanical Gardens trip: slips due Friday", "Please sign the permission slip we texted by Friday 13 November. Lunch is provided.", "Marisol Delgado · lun 2 nov", True),
                      ("Halloween party photos", "Thanks to every family who came. Photos are on the board in the lobby.", "Priya Raman · sáb 31 oct", False)],
               read_all="Está al día. Los anuncios nuevos aparecerán aquí."),
    "fr": dict(heading="Annonces", intro="Les nouvelles de Harbourview Youth Collective pour votre famille.", mark="Tout marquer comme lu", new="Nouveau",
               items=[("Tutoring night moves to Room 2 this Thursday", "The gym floor is being redone. Same time, 4:00 pm. Pickup is at the main entrance.", "Marisol Delgado · jeu. 5 nov.", True),
                      ("Royal Botanical Gardens trip: slips due Friday", "Please sign the permission slip we texted by Friday 13 November. Lunch is provided.", "Marisol Delgado · lun. 2 nov.", True),
                      ("Halloween party photos", "Thanks to every family who came. Photos are on the board in the lobby.", "Priya Raman · sam. 31 oct.", False)],
               read_all="Vous êtes à jour. Les nouvelles annonces s’afficheront ici."),
}


def news_list(n: dict, *, all_read: bool = False) -> str:
    rows = []
    for title, body, meta, unread in n["items"]:
        end = badge(n["new"], "info") if unread and not all_read else ""
        rows.append(f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(title)}</div><div class="list__meta">{esc(meta)}</div><p>{esc(body)}</p></div>{end}</li>')
    return f'<ul class="list card card--flush" aria-label="{esc(n["heading"])}">{"".join(rows)}</ul>'


def news(lang: str, *, all_read: bool = False, busy: bool = False, failed: bool = False) -> str:
    n = N[lang]
    t = T[lang]
    action = "" if all_read else f'<div>{btn(n["mark"], "", icon_name="check", busy=busy)}</div>'
    fail = alert("danger", "That didn’t go through", "Nothing changed. Try again.") if failed else ""
    done = alert("success", n["read_all"]) if all_read else ""
    return back(t) + f'<div><h1>{n["heading"]}</h1><p class="text-muted">{n["intro"]}</p></div>' + fail + done + action + news_list(n, all_read=all_read) + g_footer()


@screen("guardian-announcements", "page", "Guardian: announcements", route="/g/home/:token/announcements", reqs=R_NEWS, shell="guardian", na={"invalid": "Nothing to type."})
def guardian_announcements(S):
    S.add("default", "Carmen opens Announcements from her family page: the messages staff sent her household from Messages, newest first, two marked New, each with who sent it and when.",
          main=news("en"), notes=note("GET /g/home/{token}/announcements: messages from the Messages module delivered to this household. Slip, no-show and enrollment texts are not announcements.", "top: 4rem; right: 1rem;"))
    S.add("es", "The page in Spanish; the announcements themselves read as staff wrote them.", lang="Español", html_lang="es", main=news("es"))
    S.add("fr", "The page in French.", lang="Français", html_lang="fr", main=news("fr"))
    S.add("busy", "Marking all read.", main=news("en", busy=True))
    S.add("success", "After Mark all read: no New badges, and the family page’s count goes to none.", main=news("en", all_read=True))
    S.add("error", "Marking read failed: nothing changed, try again.", main=news("en", failed=True))
    t = T["en"]
    S.add("empty", "No announcements sent to the household yet.",
          main=back(t) + '<div><h1>Announcements</h1><p class="text-muted">Updates for your family from Harbourview Youth Collective.</p></div>'
          + card(empty("No announcements yet", "Updates from Harbourview Youth Collective will show here.", icon_name="message"), cls="card--flush") + g_footer())
    S.add("loading", "Loading the announcements.", main=back(t) + '<h1>Loading…</h1>' + skeleton_list(3, "Loading announcements"))
    S.add("load-error", "The page failed to load.",
          main=back(t) + card(empty("We couldn’t load this page", "Check your connection and try again.", action=btn("Try again", "primary", icon_name="refresh"), error=True, icon_name="alert-triangle", heading="h1"), cls="card--flush") + g_footer())
    S.add("expired", "The household’s link was revoked.",
          main='<h1>This link has expired</h1>' + card(f'<div class="stack"><p>Ask Harbourview Youth Collective for a new one.</p><div>{btn("Call 905-555-0100", "primary", icon_name="phone", href="tel:+19055550100")}</div></div>') + g_footer())
    S.add("not-found", "Messages is off for the organization (or Roster): not available.",
          main=empty("This page isn’t available", "Ask the organization that sent you the link.", icon_name="lock", heading="h1"))
