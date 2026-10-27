# 0060: A reflection is one row per youth and lesson, private unless she shares it, read only by her and her mentor; drafts stay on the device

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 66 ports Waypoint's reflections (`L2-LEARN-003`) as `L2-089` and applies unsaved-changes protection (`L2-NFR-007`, already ported as `L2-079`) to the reflection page. Waypoint keeps a `ReflectionEntry` per youth and lesson with a mood, text, a dictionary of secondary answers, a visibility and an `IsDraft` flag saved on the server, lets an assigned mentor and a program administrator list shared reflections, and validates submitted reflections only. PromiseHub is multi-tenant, keeps assignment drafts on the device (ADR 0056), and the journey says mentors see only shared reflections and nobody else sees them.

## Decision

- **One row per youth and lesson.** `Reflection` (`PromiseHub.Domain/Learning/`) belongs to the organization, the youth's membership and a lesson, unique per membership and lesson. It holds the mood (`Hopeful`, `Thoughtful`, `Unsure`, `Challenged`), her words (up to 5,000 characters), one thing she'll do this week (optional, up to 1,000), whether it is shared, and when it was created and last saved. Saving replaces it in place; there is no history.
- **One secondary answer, not a dictionary.** Waypoint's free-form secondary answers become one optional field, "One thing I’ll do this week", the only secondary prompt its youth page offered.
- **Saving always validates.** `PUT /learning/lessons/{id}/reflection` requires the mood and the words every time; it sits behind the Learning module, the Learn permission, the consent and placement gates, and the lesson's visibility and lock (ADR 0051), like every youth write.
- **Drafts stay on the device.** As for assignments (ADR 0056), a draft (mood, words, action, sharing choice) is kept in `localStorage` under the membership and the lesson through a `ReflectionDraftStore` contract and `REFLECTION_DRAFT_STORE` token; it never reaches the server, so a mentor can never see an unfinished reflection, and the server needs no draft state. A successful save clears it.
- **Private by default, shared per save.** The share switch starts off. A shared reflection is read by her mentor only: `GET /mentoring/youth/{childId}/reflections` needs Mentoring and Learning on and the Mentor role, answers the shared reflections of the youth memberships of that child, newest first, and uses `MentorScope` (403 audited as AccessDenied outside it, 404 for another organization's child). The read is audited as Viewed. No endpoint answers reflections to admins, program directors, staff or guardians; Waypoint's program-administrator read is not ported.
- **Audit without content.** Saving is audited as Created or Updated on `Reflection` with whether it is shared before and after; the words and the mood are never written to the audit log.

## Consequences

- Turning Learning off hides the youth's and the mentor's reflection endpoints (404) and keeps every row; turning it on restores them.
- A youth who switches devices does not carry an unsaved draft with her; her saved reflection is on the server.
- Reflections are not yet part of a data export or of mentor check-ins; check-ins (prompt 67) can read the shared reflections through the same scope.
