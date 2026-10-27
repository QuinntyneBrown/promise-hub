# 55 · Use the mentor dashboard

> **Runtime:** ~4 min · **Audience:** contributors, product owners and mentors · **Prerequisites:** [54 · Manage cohorts and assign mentors](../54-manage-cohorts/README.md)

**Video:** [55-use-the-mentor-dashboard.mp4](55-use-the-mentor-dashboard.mp4) · [Slides](slides.html) · **Audio:** [55-use-the-mentor-dashboard.mp3](55-use-the-mentor-dashboard.mp3) · [Transcript](script.md)

## Why this video exists

Slice 55 brings Waypoint's mentor dashboard into PromiseHub: a mentor opens Mentoring on a dashboard of their own youth and cohorts, searches My youth, opens a mentor-safe record of a youth and the page of a cohort they are on, and the server never returns anything outside their scope (`L2-063`, `L2-064`, `L2-065`, ADR 0049).

## Learning objectives

By the end, the viewer can:

- Name what the mentor dashboard shows and where each number comes from.
- Explain which youth and cohorts are in a mentor's scope, and that one service decides it.
- List what a mentor's record of a youth holds, and what it never holds.
- Describe the forbidden, not-found, empty, error, Roll Call off and Mentoring off cases.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Which youth does a mentor see? | Direct `YouthMentor` rows plus the active rosters of non-archived cohorts they lead or support (`MentorScope`) |
| Where does recent activity come from? | Roll Call attendance of those youth in the last 14 days; null while Roll Call is off |
| What is never in the record? | Date of birth, allergies, medication, conditions, doctor, alert, health card, notes, pickups |
| What happens for a youth who is not theirs? | 403, audited as AccessDenied on Child; another organization's child is 404 |
| Who may call the endpoints? | Mentors only; staff, youth and volunteers 403; Mentoring off 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/mentoring/src/lib/mentor-dashboard-page/` | `mentor-dashboard` |
| `frontend/projects/mentoring/src/lib/mentor-youth-page/` | `mentor-youth` with search |
| `frontend/projects/mentoring/src/lib/mentor-youth-detail-page/` | `mentor-youth-detail` with `ph-call-list` |
| `frontend/projects/mentoring/src/lib/mentor-group-page/` | `mentor-group` |
| `backend/src/PromiseHub.Api/Endpoints/MentoringEndpoints.cs` | The Mentoring gate and `MentorYouth` |
| `backend/src/PromiseHub.Application/Mentoring/MentorScope.cs` | The one scope query |
| `docs/adr/0049-mentor-scope-and-mentor-safe-records.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:23 | Introduction | What the video covers |
| 00:23-01:03 | Dashboard | Clip: Daniel's dashboard; screenshot |
| 01:03-01:30 | Server scope | The scope table; Roll Call off |
| 01:30-01:44 | My youth | Search and no results |
| 01:44-02:22 | Youth record | Clip on a phone: Mateo's record; screenshots |
| 02:22-02:40 | Not assigned | Amara: 403 and audited |
| 02:40-03:05 | Cohort | Clip: After-School Tutoring and Jordan; screenshot |
| 03:05-03:30 | States | Clip: empty, failed, Roll Call off; who gets what |
| 03:30-03:58 | Testing | What the tests prove |
| 03:58-04:23 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/55-use-the-mentor-dashboard --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/55-use-the-mentor-dashboard
node tools/video-build/build-video.mjs docs/videos/55-use-the-mentor-dashboard --no-captions
```

## Pitfalls

- Every Mentoring read must ask `MentorScope`; a handler that writes its own query can drift from L2-062 criterion 5.
- The record is a separate contract built field by field, so a new field on `Child` never reaches a mentor by accident.
- Attendance figures are null, not zero, while Roll Call is off, so the page renders nothing about check-in.
- Progress, reviews, check-ins and at-risk flags arrive with prompts 57, 63, 67 and 68 (ADR 0049).

## References

- `docs/specs/L2.md` (`L2-063`, `L2-064`, `L2-065`)
- `docs/detailed-designs/mentoring/manage-mentor-roster`, `mentoring/view-youth-record`, `identity/scope-data-by-role`
