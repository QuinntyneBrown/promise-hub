# 0061: A mentor check-in belongs to the mentor who wrote it, private notes never leave him, and follow-ups come from the latest one

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 67 ports Waypoint's mentor check-ins (`L2-MENTOR-006`) as `L2-090`. Waypoint keeps a `CheckIn` per mentor and youth user with a free-text engagement, goals, prayer requests, action items, a next follow-up, a visibility and a guardian-informed flag, lets a mentor or a program administrator log one, and lists only the caller's own check-ins. PromiseHub is multi-tenant, keys mentoring on the child record (`MentorScope`, ADR 0049), is not a faith product, and calls Roll Call's arrival of a child a "check-in" already.

## Decision

- **Named mentor check-ins.** The entity is `MentorCheckIn` (`PromiseHub.Domain/Mentoring/`), the routes are `/mentoring/check-ins`, and every word of copy says "mentor check-in".
- **On the child, by its author.** A row carries the organization, the child, the author's membership, the date (a calendar date), the kind (`OneToOne`, `Call`, `Session`), how it went (`Struggling` to `Thriving`, required, replacing Waypoint's free text so it can be read at a glance), topics, action items and private notes (optional, up to 2,000 characters each), an optional follow-up date, `Shared` and `GuardianInformed`, and when it was logged. The date can't be after the organization's today and the follow-up can't be before the date.
- **Mentors only, within scope.** `GET` and `POST /mentoring/check-ins` sit behind Mentoring and `MentorYouth`. Logging for a child outside `MentorScope` answers 403 and is audited as AccessDenied; another organization's child answers 404. Waypoint's program-administrator logging is not ported.
- **Read only by the author.** The history answers the caller's own check-ins of youth still in his scope; a second mentor of the same youth does not read them, and no other role reads any. Private notes (Waypoint's prayer requests) are shown to the author and never part of a shared view.
- **Shared is recorded, read later.** The switch is off by default; a shared check-in is marked Shared in his history. The youth and guardian view arrives with the guardian portal (prompt 73), which must leave private notes out.
- **Follow-ups from the latest.** The dashboard's Follow-ups take, per youth in scope, the caller's latest check-in (by date, then when logged) when it has a follow-up date, soonest first, Overdue before the organization's today. A later check-in without a follow-up clears that youth's follow-up.
- **Audit without content.** Logging is audited as Created on `MentorCheckIn` with the youth's name, the author and `Kind`, `Shared`, `GuardianInformed` and `HasFollowUp`; topics, action items and private notes are never written to the audit log. Reading his own history is not audited; it holds nothing he did not write.
- **No edits yet.** A mentor check-in is not edited or deleted; Waypoint's journey has neither.

## Consequences

- Turning Mentoring off hides both endpoints and the dashboard's Follow-ups (404) and keeps every row; turning it back on restores them.
- When a youth leaves a mentor's scope, his check-ins of her stop showing to him and are kept.
- Prompt 73 adds the shared reader; prompt 68's at-risk flags can sit beside check-ins on the record.
