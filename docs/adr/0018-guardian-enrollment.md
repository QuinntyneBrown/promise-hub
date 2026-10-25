# 0018: Enrollment links are per program, contacts are verified by code, and submissions wait as requests

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 15 lets staff open a program's enrollment and a guardian enroll children through one shared link (`L2-013`). Guardian links so far were per household (ADR 0015); an enrollment link reaches families PromiseHub may not know yet. Reviewing and accepting enrollments is prompt 16.

## Decision

- **Link.** Opening enrollment gives the program a slug (its name plus six random characters) and the link `/g/enroll/<slug>`; closing keeps the slug, so the shared link never changes and shows a closed message with the organization's number. The link picks the organization, like a guardian link, and needs the Roster module.
- **Verification.** The guardian types a phone or email; a code goes to that contact (it need not be on file, since new families enroll too) and expires in 10 minutes; three wrong codes lock it for 15 minutes. Verifying sets an HttpOnly cookie for that program's `EnrollmentSession`, whose token is stored hashed. When the verified contact matches a guardian of this organization, last season's household and children are filled in; another organization's families are never matched.
- **Draft and submit.** The household and children are saved on the session as a draft; submitting needs the season consent, creates or updates the household, guardian, children and medical details, and records one `EnrollmentRequest` per child: waiting review, or waitlisted with the next position when accepted enrollments have reached the program's capacity. Children join the roster only when staff accept them, so the roster, attendance and messaging queries are unchanged.
- **Pages.** The guardian steps live in the `guardian` library at `/g/enroll/:slug` in English, Spanish and French: the identify and code steps in English, then the household's language once known. Open and close enrollment are CDK dialogs on the program page, which also shows the children waiting for review.

## Consequences

Staff review, bulk review and guardian notifications are prompt 16; waitlist management is prompt 18. Approved pickups and a second adult are collected on the family page later.
