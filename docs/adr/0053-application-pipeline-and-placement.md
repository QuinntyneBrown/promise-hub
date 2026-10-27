# 0053: The application pipeline is the organization's enrollment requests, and placing accepts a request into the chosen program

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 59 ports Waypoint's admin applications pipeline (`L2-INTAKE-002`) as `L2-072`. Waypoint lists its `YouthApplication` rows with New, In review, Needs consent, Approved and Declined, and approving requires a cohort and a mentor, provisions a youth user and emails the decision. PromiseHub already records every application as an `EnrollmentRequest` (ADR 0052) with Waiting review, Waitlisted, Accepted and Declined, reviews them per program on the roster page (L2-013), and a cohort is a program (ADR 0043). Youth accounts come only from an invitation linked to a child (ADR 0045).

## Decision

- **One pipeline, no new status.** `/applications` in the `enrollment` library lists the organization's enrollment requests by status (`GET /applications?status=`, default Waiting review) with the count of each. Waypoint's New and In review are Waiting review; its Needs consent is the request's `SeasonConsent` shown as a badge, not a status. The program roster review (L2-013) stays as it is.
- **Where it lives.** Applications is a section in More for admins and program directors while Roster is on, and Today's "enrollments to review" leads to it (before, it led to Programs, which follows Permission slips). Endpoints carry `RequireModule(Roster)` and `ReviewEnrollments`.
- **Placing.** `POST /applications/{id}/place` takes a `programId` and an optional note. The handler moves the request to that program (`EnrollmentRequest.MoveTo`), then accepts it through the same review logic as L2-013: capacity, the plan's child limit, the enrollment row, the family text, the audit event and moving the old waitlist up. An archived or another organization's program is not found (422 "Choose a cohort."). The household and child already exist since submission (ADR 0052), so placing creates only the enrollment.
- **Waitlist and decline** reuse `POST /enrollments/{id}/review` and the review-enrollment dialog, limited to Waitlist and Decline.
- **Notes.** A tenant-owned `EnrollmentNote` row (organization, request, author name, text up to 2,000 characters, created at) per note, added with `POST /applications/{id}/notes`, audited as Created on `EnrollmentNote` without the text in the summary. Notes are staff-only: no guardian endpoint reads them.
- **Youth invitation.** The place dialog offers it only to admins (`ManageStaff`) while Learning is on, for ages 12 to 18, and calls the existing `POST /children/{id}/youth-invitation` after the placement succeeds. A refused invitation leaves the placement in place and says why. This keeps one invitation path (ADR 0045) instead of a second one inside placement.

## Consequences

- Choosing a mentor at placement is not ported: mentors are assigned from the cohort's roster (ADR 0048).
- Merging a new household from a youth application or referral into an existing family (ADR 0052) is deferred; staff can see "new household" on the application.
- Placement is not atomic with the invitation; the dialog reports the two outcomes separately.
