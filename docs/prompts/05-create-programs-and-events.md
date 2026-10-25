# Feature 05: Create programs and events

## Goal

Persona: **Program director**. A program director creates programs with schedule and capacity, enrolls children onto the roster, and creates events with their schedule. Programs can be archived and restored; events can be cancelled.

Prompts `01` to `04` in `docs/prompts/` are assumed done; reuse what they built. Frontend libraries: `frontend/projects/programs/`, `frontend/projects/events/`, `frontend/projects/api/`. Backend feature folders under `backend/src/PromiseHub.*/` with the same names.

Why now: Today's sessions, check-in and slips all hang off programs and events.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: aligning mocks, design system, requirements and design, the estimate, incremental ATDD implementation, the journey video, green tests and a pull request. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR in `docs/adr/` or the detailed design's open-questions section), and keep going.
- If the components library lacks something, that is not a reason to stop. Update the design system and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repository that can't be undone. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory repository layout; files go only where the tree assigns them.
  - Components library is mandatory: every design-system component is built once in `frontend/projects/components/` and reused; no local copies or restyles in feature libraries.
  - One file per type: Angular components use separate `.ts`, `.html` and (when needed) `.css` files, never inline templates or styles; backend and frontend keep one type per file.
  - Feature libraries depend only on `components` and `api`; pages use API tokens, never `HttpClient`; dialogs use Angular CDK Dialog; no inline forms.
  - Multi-tenant: tenant from membership, every query filtered by organization id, a cross-tenant integration test per endpoint.
  - Module: **Roster**. Include the module-off acceptance case: the route redirects to Today and the API answers 404.
  - Backend tests are API integration tests with a fake database and fakes for external services; authorization tests alongside each feature.
  - Playwright, Chromium only, Page Object Model, axe on every screen, backend faked in `e2e/fixtures/` (unrouted requests fail loudly); keep the fake in step with the API.
  - Every sensitive action is audited. No architecture tests.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Phase 1: Mocks (`writing-html-mocks`)
- The mocks exist: `programs`, `program`, `program-form`, `program-actions`, `archive-program`, `roster`, `events`, `event`, `event-form`, `event-actions`, `cancel-event`, `enroll-in-program`, `remove-from-roster`. Check them against this journey. Add any missing state (default, loading, empty, error, invalid, busy, success, forbidden) by editing `docs/mocks/tools/*.py`, rebuilding with `python docs/mocks/tools/build.py --clean` and re-running `check_mocks.py docs/mocks --write`. Do not hand-edit generated HTML.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)
- Make sure every component these mocks use is in `docs/design-system/`. Change tokens only if a new value is needed.
- Create or update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)
- Existing requirements this journey must satisfy:
  - `L2-001` Tenant isolation on every query
  - `L2-005` Modules that are off are unreachable
  - `L2-007` Role-based authorization on the server
  - `L2-012` Programs and events
  - `L2-027` Guardian pages in the household's language
  - `L2-032` Audit trail
- Add Given/When/Then acceptance criteria where they are missing (module-off, cross-tenant and permission cases included). Add a new L2 entry only for behaviour none of these cover, numbered after the last one in `docs/specs/L2.md`.

## Phase 4: Detailed design (`writing-design-documents`)
  - `docs/detailed-designs/programs/manage-programs/README.md`
  - `docs/detailed-designs/events/manage-events/README.md`
- Update only where the journey reveals a gap. Record real decisions as ADRs.

## Phase 5: Estimate update (`estimating-designs`)
- Keep the effort in `docs/estimates/` and the journey's row in `docs/journeys.md`. When done, update percent complete from evidence, then re-run the rollup and the check.

## Phase 6: Incremental implementation (ATDD, `implementing-incrementally`)
- Plan thin vertical slices, for example:
  1. Create a program with schedule and capacity
  2. Enroll and remove children from a program roster, respecting capacity
  3. Archive and restore a program
  4. Create an event for a program
  5. Cancel an event with a reason
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test (Playwright page objects, API integration tests), traced to its requirement.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`npm run check`, `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test`, the Playwright suite), then commit.
- When all slices are green, keep the mocks, design system, screen composition and designs aligned with what was built.

## Phase 7: Journey video (`creating-narrated-videos`, MANDATORY)
- When the journey works end to end, make a narrated video of it in `docs/videos/05-create-programs-and-events/` (`script.md`, `slides.html`, `README.md` outline, `clips/clips.mjs`). Use only the existing pipeline in `tools/video-audio/`, `tools/video-record/` and `tools/video-build/` and the shared assets in `docs/videos/assets/`.
- On brand: the PromiseHub logo (`docs/videos/assets/mark.svg`) on the title and closing slides, the shared `slides.css` with the design-system tokens, and the cast from `docs/mocks/README.md` (Harbourview Youth Collective, the Rivera family and the rest).
- Show the real app: record screen clips of the program director doing this journey in the running frontend (with the fake API), and include screenshots of the key states (default, empty, error, success; phone and desktop).
- Background music is mandatory: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder lays it under the narration. No captions unless asked.
- Run `build-video.mjs --check`, look at the slides, encode, watch the result, and add a row to `docs/videos/README.md`.

## Done means
- Program director can do this end to end: create programs and events.
- All the new and existing tests pass, including module-off, cross-tenant, permission and axe checks.
- Every presentation component the screens use that the design system (`docs/design-system/`) defines is implemented once in `frontend/projects/components/` and reused from there by the app and every feature library. No feature library or the app re-implements, copies, wraps or restyles one; a component or variant the library lacked was added to the library first.
- The documentation agrees with the code, and the estimate and `docs/journeys.md` show the true percent complete.
- `docs/videos/05-create-programs-and-events/05-create-programs-and-events.mp4` exists, with narration, the PromiseHub logo, real screen clips and screenshots, and background music.
- The work is on a branch with a pull request to the default branch, and its checks are green. Fetch and rebase first.
- At the end, `docs/journeys.md` is updated for this journey (status, percent complete and video link), and every change is committed and pushed to `origin`. Nothing is left uncommitted or unpushed.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
