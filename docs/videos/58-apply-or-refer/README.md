# 58 · Apply or refer a youth

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [15 · Enroll a child](../15-enroll-a-child/README.md)

**Video:** [58-apply-or-refer.mp4](58-apply-or-refer.mp4) · [Slides](slides.html) · **Audio:** [58-apply-or-refer.mp3](58-apply-or-refer.mp3) · [Transcript](script.md)

## Why this video exists

Slice 58 brings Waypoint's application and referral form into PromiseHub without a second intake: the program's enrollment link asks who is applying, and a young person aged 12 to 18 can apply for themselves or a teacher, counsellor, social worker or coach can refer one, each with the agreement they can give, landing in the same review as guardians' enrollments (`L2-071`, ADR 0052).

## Learning objectives

By the end, the viewer can:

- Name the three paths on the enrollment link and what each person proves and enters.
- Say what each path agrees to, and when the season consent is recorded.
- Explain why a young person's application or a referral always creates a new household.
- Describe how duplicates and repeated codes are refused.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who can apply? | A guardian (default), the young person aged 12 to 18, or a referrer; each verifies a code first |
| What does each agree to? | Guardian or 18-year-old: season consent; under 18: privacy notice, guardian consents later; referrer: the family agrees to be contacted |
| What is recorded? | `EnrollmentRequest` with `AppliedAs`, `Reason`, `SeasonConsent` and the referrer; a new household; audited; no account |
| Why a new household? | A typed or verified contact must never attach a child to another family; staff merge in review |
| What is refused? | 409 `duplicate` for an open request with the same name and birth date; 429 `too-many` after three codes in 15 minutes; Roster off 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/guardian/src/lib/guardian-enroll-page/` | `enroll`, `enroll-referrer`, `enroll-youth`, `enroll-household`, `enroll-review` |
| `frontend/projects/guardian/src/lib/enroll-text.ts` | The strings in English, Spanish and French |
| `backend/src/PromiseHub.Application/Enrollment/GuardianEnrollmentHandler.cs` | Paths, consent, duplicates, code limit, acknowledgement |
| `backend/src/PromiseHub.Application/Enrollment/EnrollmentDraftRules.cs` | Per-path validation |
| `backend/src/PromiseHub.Domain/Enrollment/EnrollmentRequest.cs` | `AppliedAs`, referrer, `Reason`, `SeasonConsent` |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:26 | Introduction | One link, three applicants |
| 00:26-00:55 | Who is applying | The question on a laptop and a phone |
| 00:55-01:30 | A young person applies | Clip: Malik applies; his review and the age rule |
| 01:30-02:09 | A referrer refers | Clip: Rachel refers Zoe; her step and the referral |
| 02:09-02:42 | What is recorded | The request per path; the submitted states |
| 02:42-03:10 | Duplicates and too many codes | Clip and the refused states |
| 03:10-03:45 | How it is tested | Test classes and specs; phone clip |
| 03:45-04:13 | Recap | Three things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/58-apply-or-refer --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/58-apply-or-refer
node tools/video-build/build-video.mjs docs/videos/58-apply-or-refer --no-captions
```

## Pitfalls

- Staff do not yet see who applied, the reason or the referrer; review and placement (prompt 59) show them and merge households.
- No message goes to the guardian at submission; the office contacts the family after review.
- Waypoint's neighbourhood, cohort and track-of-interest fields are not carried over: the program is the link that was opened.

## References

- `docs/specs/L2.md` (`L2-071`, with `L2-013`, `L2-026`, `L2-031`), `docs/adr/0052-applications-and-referrals-through-the-enrollment-link.md`
- `docs/detailed-designs/enrollment/submit-application/README.md`
