# 54 · Manage cohorts and assign mentors

> **Runtime:** ~5 min · **Audience:** contributors, product owners and program directors who run cohorts · **Prerequisites:** [53 · Complete first-run onboarding](../53-complete-first-run-onboarding/README.md)

**Video:** [54-manage-cohorts.mp4](54-manage-cohorts.mp4) · [Slides](slides.html) · **Audio:** [54-manage-cohorts.mp3](54-manage-cohorts.mp3) · [Transcript](script.md)

## Why this video exists

Slice 54 brings Waypoint's cohorts and mentor assignments into PromiseHub: a cohort is a program with a term, youth are placed by enrolling them, and while Mentoring is on a program director sets a cohort's lead and supporting mentors and each youth's one mentor (`L2-061`, `L2-062`, ADR 0048).

## Learning objectives

By the end, the viewer can:

- Say what a cohort is in PromiseHub and where its term lives.
- Set a cohort's mentor team and assign a youth's mentor, and name the rules each enforces.
- Explain which youth a mentor sees.
- Describe what the Mentoring and Roster modules, roles, tenancy and archiving do to the assignment endpoints.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What is a cohort? | A program; `Program.Term` (up to 40 characters) is the only addition; its dates bound the term |
| How is a youth placed? | Enrolling the child record with `POST /programs/{id}/enrollments`; capacity, plan limit, archived and duplicate checks apply |
| What makes a valid team? | One lead, any supporting, the lead never supporting, only active Mentor memberships of the organization |
| Which youth does a mentor see? | Direct `YouthMentor` assignments plus the active rosters of non-archived programs whose team includes them |
| What does Mentoring off do? | 404 on every assignment endpoint, nothing requested or rendered, data kept |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/programs/src/lib/program-page/program-page.html` | The Mentors card and the Mentor button on each roster row |
| `frontend/projects/programs/src/lib/assign-mentor-dialog/` | `assign-mentor` |
| `frontend/projects/programs/src/lib/cohort-mentors-dialog/` | `cohort-mentors` with `ph-checkbox-group` |
| `backend/src/PromiseHub.Api/Endpoints/MentorAssignmentEndpoints.cs` | The Roster and Mentoring gates and `ManagePrograms` |
| `backend/src/PromiseHub.Application/Mentoring/` | `AssignYouthMentorHandler`, `SetCohortMentorsHandler`, `MentoringHandler` |
| `docs/adr/0048-cohort-terms-and-mentor-assignments.md` | The decisions |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:37 | Introduction | What the video covers |
| 00:37-01:12 | Cohorts | Clip: the term on the form, the header and Programs; screenshots |
| 01:12-01:36 | Placing | Enrolling youth and what it refuses |
| 01:36-02:22 | Cohort mentors | Clip: no mentors, invalid, Daniel lead and Hana supporting; screenshots |
| 02:22-02:58 | Youth mentor | Clip on a phone: invalid, failed, assigned; screenshots |
| 02:58-03:25 | Mentor view | Clip: Daniel's youth |
| 03:25-04:03 | Mentoring off | Mentoring off and the error state; who gets what |
| 04:03-04:41 | Testing | What the tests prove |
| 04:41-05:08 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/54-manage-cohorts --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/54-manage-cohorts
node tools/video-build/build-video.mjs docs/videos/54-manage-cohorts --no-captions
```

## Pitfalls

- The assignment endpoints need both Roster and Mentoring; the program page must not even request `/programs/{id}/mentoring` while Mentoring is off.
- A youth's mentor is set from a cohort's roster, so the child must be on that program's active roster (otherwise 404); the assignment itself belongs to the child, not the program.
- Removing a staff member or changing a mentor's role keeps their rows but drops them from every read.
- Caseload balance on the staff report and clearing a cohort's whole team are deferred (ADR 0048).

## References

- `docs/specs/L2.md` (`L2-061`, `L2-062`)
- `docs/detailed-designs/programs/manage-cohorts/README.md`, `programs/manage-terms-and-tracks`, `mentoring/assign-mentors`
