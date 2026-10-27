# 0045: Youth, mentors and volunteers are invited with the same staff invitation; resend reissues it and an expired link can ask for a new one

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 51 ports Waypoint's invitation journey (`L2-AUTH-003`, `-004`, `-008`, `L2-PLATFORM-011`) as `L2-051` to `L2-054`. PromiseHub already has staff invitations (ADR 0025, prompts 29 and 30): a `StaffInvitation` row per email and role with a hashed token that lasts 14 days, accepted at `/invite/{token}`. Waypoint has one `Invitation` entity with a status, a cohort and a mentor, bulk invites and a request form on its expired page.

## Decision

- **One invitation.** `StaffInvitation` serves every role. A youth invitation is one with the Youth role and a `ChildId`; accepting it creates a Youth membership and links it to that child (`Membership.LinkChild`, ADR 0043). No second table, endpoint family or accept page.
- **Youth are invited from the child record.** `GET /children/{id}/youth-account` and `POST /children/{id}/youth-invitation` require the Learning module and `ManageStaff`. Only children aged 12 to 18 (Waypoint's youth) with no youth account and no invitation waiting can be invited. A Youth invitation from Staff and roles is refused, so every youth account links to a child.
- **Mentors only while Mentoring is on.** Staff and roles offers Mentor only while Mentoring is on and the server refuses it otherwise; Volunteer is always offered.
- **Resend reissues.** Resend replaces the token hash and sets the expiry to 14 days from now on the same row, so the earlier link stops working and history stays on one invitation. Expired invitations stay listed (not accepted, not withdrawn) so they can be resent.
- **Asking for a new link needs only the expired token.** `POST /invitations/{token}/request-new` is anonymous and works only for an expired invitation; it sets `ReplacementRequestedAt` once, notifies members with `ManageStaff` (notification kind `staff`, shown while Roster is on) and is audited. Waypoint's name, email and note form is reduced to one button. Open, withdrawn, used and unknown tokens answer 404.
- **Gone reasons.** `GET` and `accept` of a link that no longer works answer 410 with `reason` `expired`, `withdrawn` or `used`; an unknown token answers `used` with no inviter, so a guessed token reveals nothing.
- **Password policy.** `PasswordPolicy` applies to accepting and to resetting: 12 to 128 characters and not containing the email's local part (three characters or more). PromiseHub keeps its 12-character minimum rather than Waypoint's eight characters with a letter and a number; hashing stays PBKDF2 (ADR 0005).
- **After joining.** Staff roles continue to the phone step (`L2-009`); Youth, Mentor and Volunteer go to `roleHome` (ADR 0044), since the phone step is a staff endpoint.

## Consequences

- Bulk invites, cohort and mentor scope on an invitation, the community-guidelines checkbox and the youth welcome wizard are deferred (prompts 53, 54 and 76).
- A child whose youth invitation is waiting cannot be invited again until it is accepted, withdrawn or expires; an expired one is resent rather than replaced by a new row.
- An existing PromiseHub account accepting a youth or mentor invitation confirms with its current password, as staff do.
