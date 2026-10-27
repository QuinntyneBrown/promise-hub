# 62 · Submit assignments

> **Runtime:** ~5.1 min · **Audience:** contributors, product owners and program staff · **Prerequisites:** [60 · Author quizzes and assignments](../60-author-quizzes-and-assignments/README.md), [61 · Take quizzes](../61-take-quizzes/README.md)

**Video:** [62-submit-assignments.mp4](62-submit-assignments.mp4) · [Slides](slides.html) · **Audio:** [62-submit-assignments.mp3](62-submit-assignments.mp3) · [Transcript](script.md)

## Why this video exists

Slice 62 brings Waypoint's assignment submission into PromiseHub: a youth reads an assignment's brief, sends a reflection, link, photo or file with an attestation, follows it through Submitted, In review, Needs revision and Accepted, revises and resubmits when asked, and keeps unsent work as a draft on her device (`L2-077`, `L2-078`, `L2-079`, ADR 0056).

## Learning objectives

By the end, the viewer can:

- Say when an assignment opens and what its brief shows.
- Describe how the work and its file are sent, checked and stored.
- Explain the status lifecycle and when a submission can be resubmitted.
- Describe how unsent work is protected and where drafts are kept.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When is an assignment open? | A lesson assignment once its lesson is done, a whole-module one once the module is unlocked; otherwise 403 `locked` with `unlockAfter` |
| How is work sent? | One multipart `POST /learning/assignments/{id}/submission`; the file through `IFileStore` under the organization; audited as Submitted without the text |
| Which files are accepted? | Photo: JPG or PNG; File: PDF, JPG or PNG; up to 10 MB; extension, type and first bytes agree; otherwise 422 `file` |
| What about due dates? | Late after due date plus grace when late work is allowed (marked Late), otherwise 409 `closed` |
| When can she resubmit? | Only from Needs revision, through `POST /learning/submissions/{id}/resubmit`; otherwise 409 `not-revisable` |
| Where do drafts live? | On the device, `promisehub.draft.{membership}.{assignment}`, through `DRAFT_STORE`; never a file; cleared once sent |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/learning/src/lib/assignment-page/` | `learn-assignment` |
| `frontend/projects/learning/src/lib/submit-page/`, `submit-assignment-dialog/`, `unsaved-changes-dialog/` | `learn-submit`, `submit-assignment`, `unsaved-changes` |
| `frontend/projects/learning/src/lib/submission-page/` | `learn-submission` |
| `frontend/projects/api/src/lib/drafts/` | `DraftStore`, `DRAFT_STORE`, `LocalDraftStore` |
| `backend/src/PromiseHub.Application/Learning/SubmissionCommand.cs`, `SubmissionFilePolicy.cs`, `SubmissionViewHandler.cs`, `AssignmentBriefHandler.cs` | Submit, resubmit, file checks, status and brief |
| `backend/src/PromiseHub.Domain/Learning/AssignmentSubmission.cs`, `SubmissionEvent.cs` | The submission, its review steps and its history |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:25 | Introduction | What the journey does |
| 00:25-00:58 | The brief | Due, ways to submit, rubric, reviewer, locks |
| 00:58-01:34 | Sending her work | Clip: module, brief, reflection, photo, dialog, Submitted |
| 01:34-02:15 | What the server checks | File, text, link, promise, second submission, closed |
| 02:15-02:42 | Following it | In review, Needs revision, Accepted |
| 02:42-03:08 | Revising | Clip: the note, photo kept, Resubmit, Accepted |
| 03:08-03:40 | Protecting unsent work | Clip: leave dialog, draft, restore; the draft store |
| 03:40-03:53 | On a phone | Clip |
| 03:53-04:18 | The other states | Clip: invalid, refused file, in review, late, closed, locked, not found, error, Learning off |
| 04:18-04:43 | How it is tested | Test classes and spec |
| 04:43-05:04 | Recap | Three things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/62-submit-assignments --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/62-submit-assignments
node tools/video-build/build-video.mjs docs/videos/62-submit-assignments --check
node tools/video-build/build-video.mjs docs/videos/62-submit-assignments --no-captions
```

## Pitfalls

- The clips use their own fake API in `clips/clips.mjs`; keep it in step with `e2e/fixtures/fake-submissions.ts`.
- The mentor's review is prompt 63: the clips and tests move a submission to In review, Needs revision and Accepted directly.

## References

- [L2-077 to L2-079](../../specs/L2.md), [ADR 0056](../../adr/0056-assignment-submissions-carry-their-file-and-history-and-drafts-stay-on-the-device.md)
- [submit-assignments](../../detailed-designs/learning/submit-assignments/README.md), [track-and-revise-submissions](../../detailed-designs/learning/track-and-revise-submissions/README.md), [protect-unsaved-work](../../detailed-designs/learning/protect-unsaved-work/README.md)
