# 0067: The guardian portal is the household link, with read-only child pages and Messages as announcements

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 73 ports Waypoint's guardian portal (`L2-GUARDIAN-001` to `L2-GUARDIAN-003`) as `L2-102` to `L2-104`. Waypoint's guardians sign in to an account linked to their youth (`GuardianUserId`) and read a child-progress view, announcements with per-user reads, and a consent and contact page with media consent. PromiseHub has no guardian accounts (`L1-013`, ADR 0015, ADR 0043): guardians reach pages through verified links, and the household home (`/g/home/{token}`) already shows enrollments, details, health and pickups.

## Decision

- **No accounts.** The portal is the household link's family page. It lists each child and links to `/g/home/{token}/children/{childId}`; the household and the tenant come from the link, and the child id only selects among the household's children (a child elsewhere answers 404).
- **One read per child page.** `GuardianChildHandler` answers the schedule (28 days, like the youth's schedule), consents, attendance while Roll Call is on, and Learning progress while Learning is on and an active Youth membership links the child. A module that is off is absent from the answer, not hidden by the page. Learning reads `LearnerProgress` and `LearnerBadges` for the youth's membership (`ForMembership`), so a guardian's numbers equal the youth's. The answer has no field for lesson content, quiz answers, reflections, mentor notes or check-ins.
- **Announcements are Messages.** An announcement is a Messages-module message with a sent delivery to the household. Reads are per household: `Delivery.ReadAt`, set by Mark all read. Reading is not audited; it changes no record anyone relies on. The page and the family page's count need Messages on; slip, no-show, enrollment, pickup and survey texts are not listed.
- **Consents are read only.** Participation consent is given and withdrawn from its own consent link (ADR 0046) and slips from the slip link; the child page shows what is on record. Contact stays the family page's Update your details (prompt 28).
- **Deferred.** Waypoint's media-consent options, emailing a copy of the e-sign record, shared mentor check-ins, quiz history and competencies on the guardian page.

## Consequences

- One new column (`Deliveries.ReadAt`) and its migration; no new table.
- Guardian pages stay anonymous endpoints guarded by the link and the device cookie; every new endpoint answers 401 until the device verifies, 410 for a revoked link and 404 when Roster (or Messages for announcements) is off.
- Turning Learning, Roll Call, Slips or Messages off removes that section or page for guardians and deletes nothing.
