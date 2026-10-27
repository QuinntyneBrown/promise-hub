# 59 · Review and place applicants

> **Runtime:** ~4.5 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [16 · Review enrollment](../16-review-enrollment/README.md), [58 · Apply or refer a youth](../58-apply-or-refer/README.md)

**Video:** [59-review-and-place-applicants.mp4](59-review-and-place-applicants.mp4) · [Slides](slides.html) · **Audio:** [59-review-and-place-applicants.mp3](59-review-and-place-applicants.mp3) · [Transcript](script.md)

## Why this video exists

Slice 59 brings Waypoint's admin applications pipeline into PromiseHub: admins and program directors see every application of the organization by status, read who applied and why, keep staff-only notes, and place a young person into a cohort with an optional youth invitation, or waitlist or decline with a message to the family (`L2-072`, ADR 0053).

## Learning objectives

By the end, the viewer can:

- Find Applications and filter the pipeline by status.
- Read an application: the young person, who applied, the referrer and the family.
- Explain who sees notes and how they are audited.
- Say what placing does, and how the youth invitation follows it.
- Describe what waitlisting, declining and a decided application look like.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where is the pipeline? | Applications in More for admins and program directors while Roster is on; Today's count leads to it; `GET /applications?status=` |
| What does an application show? | Date of birth, program, status, season consent; the referrer's role, organization and verified contact; the family and household |
| Who sees notes? | Staff only; `EnrollmentNote`, up to 2,000 characters, audited without the text |
| What does placing do? | Moves the request to the chosen program, enrolls the child, texts the family, audited as placed; full or archived cohorts answer 422 |
| How does the invitation work? | Admins while Learning is on, ages 12 to 18; sent after placing through the existing youth invitation; a refusal leaves the placement |
| What is refused? | A second decision 409; other roles 403; Roster off and another organization 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/enrollment/src/lib/applications-page/` | `applications`: status tabs and rows |
| `frontend/projects/enrollment/src/lib/application-page/` | `application`: facts, notes, decisions, outcome |
| `frontend/projects/enrollment/src/lib/place-applicant-dialog/` | `place-applicant`: cohorts, youth invitation, note |
| `backend/src/PromiseHub.Application/Enrollment/ApplicationsHandler.cs` | List, detail, notes |
| `backend/src/PromiseHub.Application/Enrollment/ReviewEnrollmentHandler.cs` | `PlaceAsync` and the shared accept path |
| `backend/src/PromiseHub.Domain/Enrollment/EnrollmentNote.cs` | The staff note |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:24 | Introduction | Three kinds of application, one place to work them |
| 00:24-01:03 | One pipeline | Clip: Applications and its tabs; who applied at a glance |
| 01:03-01:36 | Reading an application | Zoe's referral; Malik's own application |
| 01:36-01:55 | Staff notes | The note dialog and the new note |
| 01:55-02:40 | Placing a young person | Clip: Tom places Zoe and invites her; what placing does |
| 02:40-03:09 | Waitlist or decline | Clip: Malik waitlisted, Kevin declined |
| 03:09-03:32 | Every state | Clip: all caught up, Try again, not found, a site lead |
| 03:32-04:04 | How it is tested | Test classes and specs; phone clip |
| 04:04-04:32 | Recap | Four things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/59-review-and-place-applicants --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/59-review-and-place-applicants
node tools/video-build/build-video.mjs docs/videos/59-review-and-place-applicants --no-captions
```

## Pitfalls

- Choosing a mentor at placement is not ported; mentors are assigned from the cohort's roster (ADR 0048).
- Merging a new household from a referral into an existing family is deferred; the application says "new household".
- Placement and the youth invitation are two calls; a refused invitation never undoes the placement.

## References

- `docs/specs/L2.md` (`L2-072`, with `L2-013`, `L2-012`, `L2-021`, `L2-051`), `docs/adr/0053-application-pipeline-and-placement.md`
- `docs/detailed-designs/enrollment/review-application/README.md`, `docs/detailed-designs/enrollment/decide-and-enroll-applicant/README.md`
