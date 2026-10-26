# 0020: Enrollment decisions text a household home link, verified like a slip link

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 17 lets a guardian see whether each child is accepted or waitlisted (`L2-013` criterion 12). Guardians have no account (ADR 0015); the enrollment session (ADR 0018) belongs to one program and ends with the submission.

## Decision

- **Link.** A `GuardianLink` with no slip and no child is a household home link. Every enrollment decision text ends with "See where things stand:" and a new home link at `/g/home/<token>`; only the token's hash is stored, and a contact change revokes it like every other link of the household.
- **Access.** The home reuses the link's code check and the 30-day trusted device (`/g/auth/code`, `/g/auth/verify`); the organization and household come from the link only. A slip link never opens the home. The page needs the Roster module.
- **Content.** `GET /g/home/{token}` lists each child's programs: the latest enrollment request per program (Enrolled, Waiting review, Waitlisted with the position, Declined with the reason) and any roster place without a request as Enrolled, with the program's start date and the staff note.
- **Page.** `GuardianHomePage` in the `guardian` library, in English, Spanish or French by household language, composed from `ph-guardian-shell`, `ph-list`, `ph-list-item` and `ph-badge`.

- **Corrections (prompt 28).** The family page shows the primary guardian's contact and each child's allergies and medication, with dialogs to correct them (`PUT /g/home/{token}/household`, `PUT /g/home/{token}/children/{childId}/medical`) after the code check. A new mobile revokes every link and device of the household, as a staff change does. Corrections are audited as made by the guardian. Other medical fields, pickups aside, stay with staff.

## Consequences

The landing page at `/g` without a token stays static. Joining a waitlist from a full program page and moving up the waitlist are prompt 18.
