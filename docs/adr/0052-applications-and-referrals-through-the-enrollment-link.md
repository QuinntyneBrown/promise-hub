# 0052: Applications and referrals go through the enrollment link, as enrollment requests, with a new household per applicant

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 58 ports Waypoint's public application and referral form (`L2-INTAKE-001`) as `L2-071`. Waypoint has a separate `YouthApplication` table filled from an anonymous public form: who is filling it in (self, guardian or referrer), the youth's name and age, guardian contact, neighbourhood, cohort and track of interest, a reason and two acknowledgements. PromiseHub already has guardian self-enrollment through a program's open link (L2-013, ADR 0018): a code-verified session, a draft, and a submission that creates the household and child and an `EnrollmentRequest` waiting for review. ADR 0043 maps Waypoint's applications to Enrollment, through the open enrollment link.

## Decision

- **One intake.** The application is the enrollment flow with a first question, "Who is applying?": a parent or guardian (unchanged), the young person, or a referrer. The page stays in the `guardian` library at `/g/enroll/:slug`, where prompt 15 built it; the `enrollment` library remains the staff side. The tenant is the organization of the program whose slug was opened, read with the Roster gate as before.
- **Verification first.** Every path verifies its own contact with a code before any details step (L2-026). The young person verifies their own phone or email; the referrer their work contact. That contact is kept on the request as the referrer's contact and receives the acknowledgement.
- **Draft shape.** `EnrollmentDraft` gains `ApplyingAs` (`Guardian`, `Youth`, `Referrer`; missing means Guardian, so existing drafts and clients keep working), `Referrer` (name, role, organization) and `Reason`. For a young person or a referral, the household draft is the guardian's details and the children list holds exactly the one young person, without medical details (staff and the guardian add those later).
- **New household per applicant.** A young person's application or a referral always creates a new household and child, never one matched from the session's contact or a typed guardian contact, so a stranger cannot attach a child to an existing family. Staff merge duplicates during review (prompt 59). A guardian's application keeps the returning-family match.
- **Consent.** One agreement switch per path: the season consent for a guardian or a young person aged 18; for a young person under 18 a privacy acknowledgement that a guardian must consent; for a referrer that the family agrees to be contacted. `EnrollmentRequest.SeasonConsent` records whether the season consent was given, so review knows to collect it. Guardian consent for youth accounts stays L2-056 (ADR 0046).
- **Eligibility.** A young person applying for themselves must be 12 to 18 on the day (Waypoint's range, ADR 0043). Guardians and referrers have no age rule beyond the program's own.
- **Duplicates.** A submission is refused with 409 `duplicate` when the program already has an open request (Waiting review or Waitlisted) for a child of the organization with the same first name, last name and date of birth, compared trimmed and case-insensitively.
- **Contact shown back.** The draft answers the verified contact as `contact`; the referrer's step shows it as a fact rather than a read-only field.
- **Rate limiting.** The enrollment session counts codes: a fourth code for the same contact and program within 15 minutes answers 429 `too-many` and sends nothing. Wrong codes keep their own lock (three, 15 minutes). This is per session in the database rather than ASP.NET rate-limiting middleware, so it holds across API instances and is testable with the fake clock.
- **Acknowledgement.** After the submission is saved, one text or email to the verified contact says the organization received the application. It uses the same senders as the code and does not count against the SMS cap, like codes.
- **Audit.** The submission stays one Created audit event on `Enrollment`, its summary naming who applied ("Malik Johnson applying for themselves", "Zoe Campbell referred by Rachel Ellis").

## Consequences

- Staff see applications and referrals in the existing roster review; showing who applied, the reason and the referrer, and merging a new household into an existing one, arrive with review and placement (prompt 59).
- Waypoint's neighbourhood, cohort and track-of-interest fields are not carried over: the program is the link that was opened, and placement chooses the track.
- No message goes to the guardian of a young person or referral at submission; the office contacts them after review.
