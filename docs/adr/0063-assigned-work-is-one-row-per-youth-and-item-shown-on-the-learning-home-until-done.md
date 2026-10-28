# 0063: Assigned work is one row per youth and item, shown on her Learning home until she has done it

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 69 ports Waypoint's assign work (`L2-MENTOR-008`) as `L2-092`. Waypoint saves an `AssignedWork` per youth user for a lesson, a whole module or a project, to chosen youth or a whole cohort, with a due date, a reminder cadence that schedules notifications, and a message sent as an in-app message; a mentor may assign only to his youth and a program administrator to anyone; the item must be in every recipient's journey. PromiseHub is multi-tenant, keys mentoring on the child record (`MentorScope`, ADR 0049), calls a cohort a program with a track (ADR 0050), has lessons, quizzes and assignments as Learning content (ADR 0051, 0054), and Messages reaches guardians only.

## Decision

- **What can be assigned.** A published lesson, quiz or assignment (`AssignedWorkKind`: `Lesson`, `Quiz`, `Assignment`) of a published module of a published track that an active, non-archived program of the mentor's youth follows. Waypoint's whole module and project map to these (a project is an assignment); assigning a whole module is deferred.
- **One row per youth and item.** `AssignedWork` (`PromiseHub.Domain/Mentoring/`) carries the organization, the child, the kind and item id, the cohort it went through (null for chosen youth), the due date (required, not before the organization's today), an optional message of at most 500 characters, who assigned it and when. Assigning the same item to a youth again updates her row (due date, message, who, when) instead of adding one, so her list never repeats.
- **Mentors only, in scope.** `POST /mentoring/assigned-work` and `GET /mentoring/assign-work` need Mentoring and Learning on and `MentorYouth`. Chosen youth must be in his scope and a cohort must be one he leads or supports (else 403, audited as AccessDenied); another organization's child, cohort or item answers 404. Waypoint's program-administrator path is not ported. Every recipient must follow the item's track (422 naming the youth).
- **The youth sees it on her Learning home.** `GET /learning/home` gains `assigned`, only while Mentoring is on: her rows whose item is still visible to her through `LearnerProgress`, not yet done (a lesson completed, a quiz with an attempt scored or awaiting approval, an assignment with a submission), soonest due first, with days left, who assigned it and the message. Work is done when she does the item itself; there is no separate "mark done".
- **Audit without words.** Each assignment is audited once as Created on `AssignedWork` with the title, how many youth and who, the kind and the due date; never the message.
- **Reminders and messages deferred.** The reminder cadence needs a per-tenant scheduled job and the message thread needs youth messaging; both are deferred. The message is shown with the work on her Learning home instead.

## Consequences

- Turning Mentoring or Learning off answers 404 on both mentor endpoints and hides the Assigned to you card (Mentoring off) or the whole Learning home (Learning off); every row is kept and comes back.
- A youth who leaves the cohort or the track stops seeing work whose item she can no longer open; the rows are kept.
- Deferred: assigning a whole module, reminders before the due date, notifying the youth, sending the message as a message thread, program directors assigning, and a mentor's list of what he assigned and who has done it.
