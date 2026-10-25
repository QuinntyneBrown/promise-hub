# Feature 80: Report, export and import learning data

## Goal

Persona: **Program director and Admin**. Waypoint journey 29 Report, export and import, merged into PromiseHub.

A program director runs youth, cohort and staff reports that include learning progress, attendance rates and mentoring activity, views the org-wide progress board, and exports filtered data. An admin imports a roster that can also place youth into cohorts and offer youth invitations. Report sections for modules that are off are not shown. This extends grant reports (prompt 37) and roster import (prompt 14).

Prompt `49` (merge foundation) and prompts `14`, `37`, `63`, `71` in `docs/prompts/` are assumed done; reuse what they built. If something they describe is missing, build only the minimum this journey needs and list it as deferred. Frontend libraries: `frontend/projects/reports/`, `frontend/projects/enrollment/`, `frontend/projects/api/`. Backend feature folders under `backend/src/PromiseHub.*/` with the same names.

Why now: Replaces the spreadsheets programs keep today.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: porting mocks, design system, requirements and design, the estimate, incremental ATDD implementation, the journey video, green tests and a pull request. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR in `docs/adr/` or the detailed design's open-questions section), and keep going.
- If the components library lacks something, that is not a reason to stop. Update the design system and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repository that can't be undone. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory repository layout, as amended by prompt 49; files go only where the tree assigns them.
  - Components library is mandatory: every design-system component is built once in `frontend/projects/components/` and reused; no local copies or restyles in feature libraries.
  - One file per type: Angular components use separate `.ts`, `.html` and (when needed) `.css` files, never inline templates or styles; backend and frontend keep one type per file.
  - Feature libraries depend only on `components` and `api`; pages use API tokens, never `HttpClient`; dialogs use Angular CDK Dialog; no inline forms.
  - Multi-tenant: tenant from membership, every query filtered by organization id, a cross-tenant integration test per endpoint.
  - Module: **Reports**. Include the module-off acceptance case: the route redirects to Today (or, on a guardian or public page, is not found) and the API answers 404.
  - Backend tests are API integration tests with a fake database and fakes for external services; authorization tests alongside each feature.
  - Playwright, Chromium only, Page Object Model, axe on every screen, backend faked in `e2e/fixtures/` (unrouted requests fail loudly); keep the fake in step with the API.
  - Every sensitive action is audited. No architecture tests.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Source: Waypoint (read-only)

- Waypoint lives at `/Users/quinntynebrown/projects/waypoint` on branch `promise-hub`. That branch already uses the PromiseHub tokens and the `ph` prefix. Read it with `git -C /Users/quinntynebrown/projects/waypoint show promise-hub:<path>` (or a worktree of that branch). Never commit to, push or change the Waypoint repository.
- Waypoint is the source of behaviour, copy, states and edge cases. PromiseHub's `AGENTS.md` wins on everything else. Port the behaviour; do not copy the structure.
- Follow the mapping in `docs/adr/0019-merge-waypoint.md` (written by prompt 49): which Waypoint subsystem becomes which PromiseHub feature, module, role and library.
- Rename as you port: no "Waypoint" in namespaces, types, routes, copy or file names. The product is PromiseHub.
- Convert Waypoint's conventions to PromiseHub's:
  - .NET 10 (`backend/global.json`) and Angular 22, not .NET 9 and Angular 21.
  - xUnit API integration tests with the fake database in `backend/tests/PromiseHub.Api.Tests/`, never SQL Server or LocalDB, and not NUnit.
  - Playwright specs in `e2e/tests/<feature>/` with page objects in `e2e/pages/` against the fake API in `e2e/fixtures/`, not `frontend/e2e/` against a live backend.
  - Components from `frontend/projects/components/`, never `@waypoint/components`. A Waypoint component PromiseHub lacks is added to `docs/design-system/` and the library first, using the target name the ADR gives it.
  - Mocks come from the generator in `docs/mocks/tools/`, not Waypoint's hand-written HTML.
  - Requirements go into the single `docs/specs/L1.md` and `docs/specs/L2.md`, not per-subsystem spec folders.
- Waypoint is single-tenant. Every ported table carries the organization id, every query filters by it, and every endpoint is gated by its module.
- Do not port Waypoint's architecture checks (`scripts/check-traceability.mjs`, structure lint rules, traceability tests). PromiseHub never writes architecture tests.
- Use the PromiseHub cast from `docs/mocks/README.md` (Harbourview Youth Collective, the Rivera family and the rest, plus the youth and mentors prompt 49 adds), not Waypoint's cast.

## Phase 1: Mocks (`writing-html-mocks`)
- Waypoint mocks to port (under `/Users/quinntynebrown/projects/waypoint/docs/mocks/` on branch `promise-hub`):
  - `reporting-and-data/admin/dashboard.html`
  - `reporting-and-data/admin/reports.html`
  - `reporting-and-data/admin/report-youth.html`
  - `reporting-and-data/admin/report-cohort.html`
  - `reporting-and-data/admin/report-staff.html`
  - `reporting-and-data/admin/report-attendance.html`
  - `reporting-and-data/admin/data-import.html`
  - `program-administration/admin/cohort-progress.html`
- In PromiseHub: extend the report mocks with `report-youth`, `report-cohort`, `report-staff` and `progress-board`; extend the import mapping with cohort and youth-invite columns. Light and dark, phone, tablet and desktop, every state (default, loading, empty, error, invalid, busy, success, forbidden) that applies.
- Edit `docs/mocks/tools/*.py` (add a `pages_<feature>.py` beside the others if none fits), rebuild with `python docs/mocks/tools/build.py --clean` and re-run `check_mocks.py docs/mocks --write`. Do not hand-edit generated HTML. Update the manifest, gallery and coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)
- Make sure every component these mocks use is in `docs/design-system/`. Where Waypoint had a component PromiseHub lacks, add it under the name the ADR gives it. Change tokens only if a new value is needed.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)
- Port these Waypoint requirements from `/Users/quinntynebrown/projects/waypoint/docs/specs/*/L2.md` into `docs/specs/L2.md` as new entries, numbered after the last one there, with Given/When/Then acceptance criteria rewritten for PromiseHub (module-off, cross-tenant and permission cases included). Cite the Waypoint ID in each new entry's source line:
  - `L2-REPORT-001 Standard reports`
  - `L2-REPORT-003 Data export`
  - `L2-REPORT-004 Data import / roster migration`
  - `L2-ADMIN-004 Org-wide progress board (spreadsheet replacement)`
- Cross-reference the existing PromiseHub requirements instead of copying them:
  - `L2-010 Roster import from spreadsheet`
  - `L2-024 Report numbers and filters`
  - `L2-025 Exports`
- Point each new L2 at its L1 (the Learning, Mentoring and Public website L1 entries come from prompt 49).

## Phase 4: Detailed design (`writing-design-documents`)
- Port these Waypoint designs from `/Users/quinntynebrown/projects/waypoint/docs/detailed-designs/` into `docs/detailed-designs/<feature>/<design>/` in PromiseHub's house style, with tenancy, module gates and PromiseHub types:
  - `reporting-and-data/explore-reports`
  - `reporting-and-data/view-youth-report`
  - `reporting-and-data/view-cohort-report`
  - `reporting-and-data/view-staff-report`
  - `reporting-and-data/export-filtered-data`
  - `reporting-and-data/import-roster`
  - `program-administration/view-progress-board`
- Update these existing designs only where the journey reveals a gap:
  - `docs/detailed-designs/reports/compute-report/README.md`
  - `docs/detailed-designs/reports/export-report/README.md`
  - `docs/detailed-designs/imports/import-roster/README.md`
- Record real decisions as ADRs in `docs/adr/`.

## Phase 5: Estimate update (`estimating-designs`)
- Add the effort to `docs/estimates/` and the journey's row in `docs/journeys.md` (prompt 49 added it at 0%). When done, update percent complete from evidence, then re-run the rollup and the check.

## Phase 6: Incremental implementation (ATDD, `implementing-incrementally`)
- Read Waypoint's implementation first, for behaviour and edge cases only:
  - `frontend/projects/admin/src/lib/reports/`
  - `frontend/projects/admin/src/lib/progress/`
  - `frontend/projects/admin/src/lib/import-roster/`
  - `backend/src/Waypoint.Application/ReportingAndData/`
- Plan thin vertical slices, for example:
  1. Youth and cohort reports with learning progress (module-aware)
  2. Staff report with mentoring activity
  3. Progress board
  4. Filtered export
  5. Import with cohort placement and youth invitations
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test (Playwright page objects, API integration tests), traced to its requirement.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`npm run check`, `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test`, the Playwright suite), then commit.
- When all slices are green, keep the mocks, design system, screen composition and designs aligned with what was built.

## Phase 7: Journey video (`creating-narrated-videos`, MANDATORY)
- When the journey works end to end, make a narrated video of it in `docs/videos/80-report-export-and-import/` (`script.md`, `slides.html`, `README.md` outline, `clips/clips.mjs`). Use only the existing pipeline in `tools/video-audio/`, `tools/video-record/` and `tools/video-build/` and the shared assets in `docs/videos/assets/`.
- On brand: the PromiseHub logo (`docs/videos/assets/mark.svg`) on the title and closing slides, the shared `slides.css` with the design-system tokens, and the cast from `docs/mocks/README.md`.
- Show the real app: record screen clips of the program director and admin doing this journey in the running frontend (with the fake API), and include screenshots of the key states (default, empty, error, success; phone and desktop).
- Background music is mandatory: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays it under the narration. No captions unless asked.
- Run `build-video.mjs --check`, look at the slides, encode, watch the result, and add a row to `docs/videos/README.md`.

## Done means
- Program director and Admin can do this end to end in PromiseHub: report, export and import learning data.
- All the new and existing tests pass, including module-off, cross-tenant, permission and axe checks.
- Every presentation component the screens use that the design system (`docs/design-system/`) defines is implemented once in `frontend/projects/components/` and reused from there by the app and every feature library. No feature library or the app re-implements, copies, wraps or restyles one; a component or variant the library lacked was added to the library first.
- Nothing in PromiseHub imports, references or loads files from the Waypoint repository, and no "Waypoint" name remains in code or copy.
- The documentation agrees with the code, and the estimate and `docs/journeys.md` show the true percent complete.
- `docs/videos/80-report-export-and-import/80-report-export-and-import.mp4` exists, with narration, the PromiseHub logo, real screen clips and screenshots, and background music.
- The work is on a branch with a pull request to the default branch, and its checks are green. Fetch and rebase first.
- At the end, `docs/journeys.md` is updated for this journey (status, percent complete and video link), and every change is committed and pushed to `origin`. Nothing is left uncommitted or unpushed.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
