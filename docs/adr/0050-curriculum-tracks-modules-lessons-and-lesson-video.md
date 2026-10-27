# 0050: Curriculum is tracks of ordered modules and lessons; a program follows one track; lesson video goes through a file-storage port without transcoding

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 56 ports Waypoint's curriculum authoring (`L2-CURRIC-001`, `L2-CURRIC-002`) as `L2-066` and `L2-067`. Waypoint keeps tracks, modules and lessons with a publish status, assigns cohorts to modules, uploads lesson video in resumable 8 MiB chunks and transcodes it with `ffmpeg` into an HLS ladder in a background worker. PromiseHub is multi-tenant, has no file storage yet, treats a cohort as a program (ADR 0043) and runs its tests without external binaries.

## Decision

- **Model.** `Track` (name, key unique per organization, description, Draft or Published), `CurriculumModule` (track, position, title, description, prerequisite module, anchor passage, Draft, InReview or Published) and `Lesson` (module, position, title, reading, minutes, objectives, body, prompts, leader notes, Draft or Published, soft delete) in `PromiseHub.Domain/Curriculum/`, all tenant-owned. `CurriculumModule` avoids a clash with `ModuleId`, the feature-module switch.
- **Visibility.** Content reaches youth only when the lesson, its module and its track are Published and the youth's program follows the track. Publishing a module needs a lesson; publishing a lesson needs teaching content. Leader notes are returned only by authoring endpoints.
- **Cohorts.** A program follows at most one track (`Program.TrackId`, nullable). The track-cohorts dialog sets the full list of programs for a track: a chosen program moves from its former track, an unchosen one follows none. Only active programs of the organization can be chosen. Waypoint's per-module cohort assignment is not ported: a module reaches every cohort that follows its track.
- **Order.** Reordering sends the whole ordered list of ids; the server refuses a list that is not the exact set. The UI uses Move up and Move down, the accessible alternative to drag.
- **Endpoints.** One `/curriculum` group with `RequireModule(Learning)` and `RequirePermission(AuthorCurriculum)`; `GET /curriculum` moves there from the participant placeholder endpoints.
- **File storage.** `IFileStore` (`SaveAsync`, `DeleteAsync`, `ExistsAsync`) in `PromiseHub.Application`, `LocalFileStore` under `Storage:RootPath` in `PromiseHub.Infrastructure/Storage/`, an in-memory fake in the API tests. Keys are generated (`lessons/{org}/{lesson}/{guid}{ext}`), never taken from the file name.
- **Video.** One multipart request of up to `Lessons:MaxVideoBytes` (1 GB) on that endpoint only; MP4, MOV or WebM checked by extension, content type and signature; stored as uploaded. Chunked resumable upload, `ffmpeg` transcoding, HLS, the Queued, Processing and Failed states, retry and streaming to youth are deferred; streaming arrives with prompt 57's video player.
- **Audit.** Every write is audited: Created, Updated with before and after, Deleted; video uploads and removals on `LessonVideo`.

## Consequences

- Prompt 57 reads published content through the visibility rule above and serves the stored video to youth of a following program.
- A hosted deployment needs shared storage for `Storage:RootPath`, or an object-storage adapter behind `IFileStore`.
- Large recordings above 1 GB must be exported smaller until chunked upload is built.
