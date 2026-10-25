# 0016: Reminders fall in slots, and the tablet signs in the guardian's record format

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 13 asks for automatic reminders before the sign-by date, a day-of view of who lacks consent, signing on a staff tablet and a manual reminder (`L2-016`). Slices 10 to 12 built the message path, the per-tenant job, guardian links and the signature record.

## Decision

- **Slots.** A reminder slot is 6 pm in the organization's time zone on the slip's schedule (Tuesday and Thursday, daily, or once two days before), from the send to the sign-by date. The per-tenant job finds the latest slot that has come for each sent slip.
- **Once per slot.** `SlipReminder` records each household reminded, with the slot key, unique per slip, household and slot, so a rerun never reminds twice. A household with no mobile and no working email is recorded as unreachable and listed for staff instead of retried.
- **Messages.** Reminders, manual ones included, go through the message path with fresh guardian links for each family's unsigned children. A staff-written reminder must keep `{link}`; `{child}` becomes the family's unsigned children ("Kevin and Emily").
- **Day of.** `GET /sessions/{id}/clearance` (Permission slips module) answers for a session whose event needs a sent slip: cleared, missing and declined, missing first. Check-in reads it through the `api` library only while Slips is on, so the attendance library never imports the slips library.
- **Tablet.** Signing on the tablet is a screen in the `slips` library that the app mounts at `/check-in/:sessionId/sign-on-tablet/:householdId` under the Slips module, rather than a dialog, so no feature library opens another's component. It signs every unsigned child of the family with the same signature record as the guardian's page, records the device as "Staff tablet · <staff member>" as the witness, needs `RunSessions`, and texts the family a copy.

## Consequences

Reminder copy is English until translation arrives; the household's language is still recorded on every signature. A notification centre entry for unreachable families and a "link opened, not signed" signal come later.
