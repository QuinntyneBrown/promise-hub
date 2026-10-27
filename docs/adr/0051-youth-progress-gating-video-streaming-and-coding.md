# 0051: Youth progress is per membership and gated on the server; lesson video streams under the session; coding lessons are lesson kinds with steps

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 57 ports Waypoint's youth learning journey (`L2-LEARN-001`, `L2-LEARN-002`, `L2-LEARN-008` and the `stream-lesson-video` design) as `L2-068` to `L2-070`. Waypoint stores progress per user, gates lessons in a progress calculator, streams HLS ladders through signed, expiring URLs because its access token lives in browser memory, and models coding lessons as lessons flagged `IsCodingLesson` with steps, a workspace and an assignment. PromiseHub is multi-tenant, signs people in with a cookie session (ADR 0005), stores lesson video as uploaded without transcoding (ADR 0050), and has no assignment or badge model yet.

## Decision

- **Who a youth is.** Progress belongs to the youth's membership (`LessonProgress`, `CodingWorkspace`, `ProjectSubmission`, all tenant-owned with `MembershipId`). A youth's tracks are the Published tracks followed by the active, non-archived programs their linked child is enrolled in (`Program.TrackId`, ADR 0047 and 0050), read on every request.
- **Gating.** One `LearnerProgress` service computes, for a track, each Published module's status and each Published, live lesson's status. A module is locked while its prerequisite module is Published and not done; a module is done when every one of its published lessons is done. A lesson is locked while its module is locked or an earlier published lesson of the module is not done. Every read and write of a lesson asks the same service, so a locked lesson answers 403 `{ code: "locked", unlockAfter }` whether it is opened, streamed, saved or completed. Content that is not visible (draft, deleted, a track the youth's programs do not follow, another organization) answers 404.
- **Endpoints.** `/learning/home`, `/learning/tracks/{id}`, `/learning/modules/{id}`, `/learning/lessons/{id}`, `/learning/lessons/{id}/complete`, `/learning/lessons/{id}/video`, `/learning/coding/{id}`, `/learning/coding/{id}/progress` and `/learning/coding/{id}/submission`, each with `RequireModule(Learning)`, `RequirePermission(Learn)`, the consent gate and the placement gate. `GET /learning/home` replaces the placeholder `GET /learning/lessons`; the gates and their codes are unchanged.
- **Video.** `GET /learning/lessons/{id}/video` reads the stored file through `IFileStore.OpenReadAsync` and answers it with its content type and range processing (206 for `Range`), under the youth's cookie session. A `<video>` element sends the session cookie, so no signed URL, token renewal or HLS is needed. Adaptive bitrate streaming waits for transcoding (ADR 0050).
- **Lesson kinds.** `Lesson.Kind` is Reading, Scripture, Coding or Project. A scripture lesson shows `Lesson.Passage` in the scripture block with its reading as the reference. A coding lesson has ordered `CodingStep`s (title, instructions, code sample, checklist label) and starter code; ticking every step completes it. A project completes when it is submitted. Reading and scripture lessons complete with `POST …/complete`; coding kinds answer 409 there. Authoring the kind, passage, starter code and steps in the lesson editor is deferred: existing lessons are Reading, and the e2e fake and the API tests set the other kinds directly.
- **Code preview.** Run renders the youth's code in an `iframe` with `srcdoc` and `sandbox="allow-scripts"` (no same-origin access: the frame has an opaque origin), wrapped in a document whose Content-Security-Policy is `default-src 'none'; style-src 'unsafe-inline'; img-src data:`, so no script the youth writes runs and nothing is requested or sent. An empty `sandbox` was tried first; it also blocks the accessibility checker, which cannot run in a frame where scripts are disabled, so the policy does the blocking instead.
- **Projects.** A submission stores the code and an optional note as Submitted, once per youth and project (a second answers 409). Mentor review, feedback, revision and the cohort gallery wait for assignment review (prompts 62 and 68).
- **Text size.** A− and A+ are a reading control on the page; saving the size and a bookmark on the server waits for reflections (prompt 58).
- **Audit.** Completing a lesson is audited once as Completed on `LessonProgress`; submitting a project as Created on `ProjectSubmission`. Saving coding progress that does not complete the lesson is not audited.

## Consequences

- Turning Learning off hides every youth page and endpoint; progress rows stay and return with the module.
- Authors cannot yet create scripture, coding or project lessons from the app; the lesson editor gains the kind, passage, starter code and steps in a later prompt.
- A hosted deployment that moves `IFileStore` to object storage needs an adapter that supports seekable reads or redirects.
