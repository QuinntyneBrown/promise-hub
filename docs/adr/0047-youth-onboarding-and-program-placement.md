# 0047: Youth onboarding is a server-saved Learning setup behind the consent gate, and placement is an active program enrollment checked by an endpoint filter

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 53 ports Waypoint's youth onboarding wizard (`L2-AUTH-011`) and its no-cohort state (`L2-PLATFORM-011` criterion 3) as `L2-059` and `L2-060`. Waypoint stores the display name and pronouns on its `User`, keeps no wizard progress (the steps live in the page), redirects every youth to the wizard after sign-in and treats a youth with no `CohortId` as unplaced. PromiseHub has no per-person profile beyond `Membership` and `StaffUser`, a youth's cohort is a program (ADR 0043), and a youth under the consent age is gated from youth work (ADR 0046).

## Decision

- **Where.** The wizard is `YouthWelcomePage` at `/learning/welcome` in the `learning` library, inside the shell, so it is lazy-loaded only while Learning is on and redirects to Today when it is off. The endpoints are `GET`/`PUT /learning/onboarding` and `POST /learning/onboarding/complete` under Learning and `Learn`. The `account` library is not used, because it is not tied to a module.
- **What is stored.** One tenant-owned `YouthOnboarding` row per youth membership holds the step to resume at, the preferred name (1 to 60 characters), pronouns (`she/her`, `he/him`, `they/them` or none; a fixed list keeps the value safe to show to mentors), the three notification choices (lesson reminders and mentor messages on, announcements off by default) and when it started and completed. The child record keeps the legal name. Every Continue saves the answers with the next step, so leaving at any point resumes there.
- **First run and resume.** Learning reads the setup: `not-started` (no row) opens the wizard once; `in-progress` shows a resume alert instead of redirecting again, so "Finish later" is honoured; `completed` shows nothing. Finishing is audited (new audit action `Completed` on `YouthOnboarding`); saving a step is not, as it changes only the youth's own display preferences.
- **Consent first.** The onboarding endpoints carry `RequireGuardianConsent()`, so no personal detail of a gated youth is stored before a guardian consents; the youth sees the consent-required state first and the setup after consent.
- **Placement.** A youth is placed when their linked child has an active enrollment (no end date) in a program that is not archived, in their own organization. `RequirePlacement()` is an endpoint filter, added after the consent filter, that answers 403 `{ code: "no-cohort" }` to an unplaced youth; it is applied to `GET /learning/lessons` and every later endpoint that returns program content. `/learning/me`, the consent request and the onboarding endpoints stay open. The wizard's program step reads the same placement, earliest start first.

## Consequences

- The profile photo, the mentor on the program step and "Message your mentor" from the waiting state are deferred (photo storage for youth, prompt 54 mentor assignments, prompt 74 messaging). The notification choices take effect when Learning sends reminders (prompt 57).
- Prompt 57 and later add `RequirePlacement()` next to `RequireGuardianConsent()` on content endpoints.
- Nadia Haddad (18) is seeded without an enrollment, so she shows the waiting state until staff enroll her; tests that need her lessons enroll her first.
