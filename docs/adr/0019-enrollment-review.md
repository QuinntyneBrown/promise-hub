# 0019: Enrollment requests are reviewed on the program roster, one by one or in bulk, and the guardian is texted

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 16 lets office staff accept, waitlist or decline the children submitted through the enrollment link (`L2-013`, ADR 0018), one by one or in bulk, and tell the guardian.

## Decision

- **Who.** Reviewing needs the new `ReviewEnrollments` permission, held by admins and program directors, and the Roster module.
- **Decisions.** `POST /enrollments/{id}/review` and `POST /enrollments/review` (several ids) take `Accept`, `Waitlist` or `Decline` with a note. Accepting adds the child to the program's roster and is refused past capacity; waitlisting gives the next position; declining needs a reason. A request already accepted or declined answers 409. A bulk review is all or nothing.
- **Notification.** Each decision queues one SMS or email to the household through the existing message path with the new `MessageSource.Enrollment`, gated by the Roster module, in the guardian's words: enrolled, waitlisted with the number, or not enrolled with the reason.
- **Screen.** The roster review is a page of the `enrollment` library at `/programs/:programId/roster`, with in-page tabs (a tablist mode of `ph-tabs`), a selection checkbox per row (`ph-checkbox`), a `ph-bulk-action-bar` and two CDK dialogs: review one, review the selected.

- **Waitlist moves (prompt 18).** Moving a waitlisted child in is the Accept decision on that request, from a Move in button on the roster's Waitlist tab (dialog: `move-in`); the children behind it move up one place, so positions stay 1, 2, 3 with no gaps. Declining a waitlisted child closes the gap the same way.

## Consequences

The guardian's own view of the status is a later journey. Decline texts are sent in English until messages are translated per household.
