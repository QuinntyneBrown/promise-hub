# Supporting slice 49: Merge Waypoint: foundation

## Goal

Persona: **Everyone**. Get PromiseHub ready to take in Waypoint (`/Users/quinntynebrown/projects/waypoint`), a youth leadership platform with lessons, quizzes, mentoring and a public site, one journey at a time (prompts `50` to `81`). This slice builds no journey screens. It does five things:

1. It records the merge mapping in an ADR.
2. It amends the repository tree in `AGENTS.md`.
3. It adds three switchable modules: **Learning**, **Mentoring** and **Public website**.
4. It adds the **Youth**, **Mentor** and **Volunteer** roles, and links a youth account to a child record.
5. It seeds the new cast and adds the new journeys to `docs/journeys.md`.

Everything PromiseHub does today stays unchanged.

Prompts `01` to `03` in `docs/prompts/` are assumed done (tenancy, sign-in, module configuration); reuse what they built. Backend: `backend/src/PromiseHub.Domain/Organizations/ModuleId.cs`, `ModuleCatalog.cs` and `Role.cs`, the seeder in `PromiseHub.Infrastructure`, and the new empty feature folders. Frontend: `frontend/projects/promisehub/` (module-aware navigation) and the new empty feature libraries.

Why now: Every Waypoint journey needs the modules, roles, folders and mapping in place first. Deciding them once keeps prompts 50 to 81 small and consistent.

## Finish the whole slice in one run. Do not stop. (CRITICAL)

- You are authorised to take this slice all the way: the ADR, the tree change, mocks, design system, requirements and design, the estimate, incremental ATDD implementation, the video, green tests and a pull request. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- **Tree change approval.** `AGENTS.md` lets the tree change only with the user's explicit approval. Running this prompt is that approval, for exactly the additions listed under Phase 0 and nothing more. Update the tree in `AGENTS.md` in the same change, before any code goes into the new folders.
- Where `AGENTS.md` says "stop and ask" about anything else in scope here, treat this prompt as the confirmation in advance. Choose the simplest option that fits the existing architecture, record it in the ADR, and keep going.
- If the components library lacks something, that is not a reason to stop. Update the design system and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repository that can't be undone. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory repository layout. Add only the folders listed in Phase 0; move, rename or merge nothing.
  - Modules are configurable: each new module declares its dependencies; the server rejects a configuration that breaks one; a module that is off answers 404 and is never rendered, linked or prefetched; turning it off never deletes data.
  - Each frontend feature library maps to exactly one module and is lazy-loaded only when that module is on.
  - Multi-tenant: tenant from membership, every query filtered by organization id, a cross-tenant integration test per endpoint; seed at least two organizations.
  - Components library is mandatory; one file per type; feature libraries depend only on `components` and `api`.
  - Backend tests are API integration tests with a fake database and fakes for external services; authorization tests alongside each feature.
  - Playwright, Chromium only, Page Object Model, axe on every screen, backend faked in `e2e/fixtures/`; keep the fake in step with the API.
  - Every sensitive action is audited. No architecture tests.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Source: Waypoint (read-only)

- Waypoint lives at `/Users/quinntynebrown/projects/waypoint` on branch `promise-hub`. That branch already uses the PromiseHub tokens and the `ph` prefix (Waypoint `docs/DECISIONS.md` #25, `docs/detailed-designs/non-functional/promise-hub-design-system/`). Read it with `git -C /Users/quinntynebrown/projects/waypoint show promise-hub:<path>`. Never commit to, push or change the Waypoint repository, and never load anything from it at build or run time.
- Read these first: `docs/PRD.md`, `docs/journeys.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/specs/README.md`, `docs/screen-composition.md`, and the component list in `frontend/projects/components/src/lib/`.

## Phase 0: Merge mapping and tree change

- Write `docs/adr/0019-merge-waypoint.md` in the house style of `docs/adr/`. Decide and record the mapping below. It is the default; change a line only if reading Waypoint shows it cannot work, and say why.

  | Waypoint | PromiseHub |
  |---|---|
  | Youth (signs in) | New role **Youth**. One youth account links to one existing child record in Roster. A youth sees only their own data. |
  | Mentor | New staff role **Mentor**. Sees only the youth and cohorts assigned to them. |
  | Volunteer | New staff role **Volunteer**. Sees only their assigned sessions. Composed into the existing shell; no separate portal app. |
  | Admin | Existing **Admin** and **Program director** roles. |
  | Guardian accounts | No guardian accounts (L1-013). The guardian portal and consent become verified-link guardian pages (ADR 0015). |
  | Cohort | A **program** with a term and, once curriculum exists, a track (`Programs/`). |
  | Session | An **event** (`Events/`); RSVP is added to events. |
  | Attendance | **Roll Call**. One attendance system; Waypoint's statuses fold into it. |
  | Application / referral | **Enrollment** (`Enrollment/`), through the open enrollment link. |
  | Announcements, direct messages | **Messages** module (`Messaging/`). |
  | Notifications | Existing in-app notifications (`Notifications/`), made near-real-time. |
  | Lessons, quizzes, assignments, reflections, journey, badges | New **Learning** module: youth pages in `learning`, authoring in `curriculum`. |
  | Mentor dashboard, grading, check-ins, at-risk flags, assign work | New **Mentoring** module (`mentoring`). Grading and assign work need Learning content and render only when Learning is on. |
  | Public site | New **Public website** module (`website`). Anonymous, read-only, published content only; the organization comes from a public website slug, the one place a tenant is chosen without a membership. |
  | Audit log, privacy, roster import, reports | Existing `Audit/`, `Organizations/` privacy, `Imports/` and `Reports/`. |
  | Help, support, error and maintenance pages | Existing shell error pages; anything missing is deferred. |

  Module dependencies: Learning needs Roster. Mentoring needs Roster. Public website needs Roster.

- Record the convention changes in the same ADR: .NET 10 and Angular 22; xUnit and the fake database instead of NUnit and SQL Server; Playwright in `e2e/` against the fake API; requirements in the single `docs/specs/L1.md` and `L2.md`; no traceability script or architecture tests; PromiseHub names and cast.
- Add a component mapping table to the ADR. For each Waypoint component in `frontend/projects/components/src/lib/` (alert, avatar, badge, brand, button, button-group, card, checkbox, chip, deployment, description-list, dialog, divider, empty-state, footer, form-field, icon, icon-button, link, list, marketing-nav, message-thread, offline, pagination, progress, quiz-option, radio, scripture, select, shell, skeleton, skip-link, stat, states, switch, table, tabs, text-field, textarea, timeline, toast, video-player), name the PromiseHub component it becomes. Use an existing one where it fits (for example `progress` becomes `progress-bar`, `form-field` becomes `text-field`). Otherwise name the new component the first journey that needs it will add. Do not build the new components here.
- Amend the tree in `AGENTS.md` with exactly these additions, and update the feature list comments to match:
  - `backend/src/PromiseHub.Domain/` and `PromiseHub.Application/`: `Learning/`, `Curriculum/`, `Mentoring/`, `Website/`.
  - `frontend/projects/`: `learning/` (Feature library: youth lessons, quizzes, assignments, reflections, journey and badges), `curriculum/` (Feature library: tracks, modules, lessons, quizzes, assignments, badges and progression authoring), `mentoring/` (Feature library: mentor dashboard, youth records, grading, check-ins, at-risk flags, assigned work), `website/` (Feature library: the organization's public pages).
  - The same feature names in `docs/detailed-designs/`, `docs/estimates/` and `e2e/tests/`.
  - In the "Modules are configurable" section, add Learning, Mentoring and Public website to the module list with their dependencies.

## Phase 1: Mocks (`writing-html-mocks`)
- Update `settings-modules` and `onboard-modules` with the three new modules, their dependency notes and the dependency-blocked state.
- Add a Youth and a Mentor variant of the shell (top bar, phone tab bar, More menu) composed only from modules that are on, and a Learning-off variant.
- Extend the cast in `docs/mocks/README.md`: youth with accounts (for example Sofía Rivera, 12, who needs guardian consent, and an older teen who does not), two mentors and a volunteer at Harbourview Youth Collective, and at least one youth and mentor in the second seeded organization.
- Edit `docs/mocks/tools/*.py`, rebuild with `python docs/mocks/tools/build.py --clean` and re-run `check_mocks.py docs/mocks --write`. Do not hand-edit generated HTML.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)
- Make sure the shell variants use only design-system components. Change tokens only if a new value is needed.
- Update `docs/screen-composition.md` for the changed shell and module screens.

## Phase 3: Requirements (`writing-requirements`)
- Add L1 entries after `L1-022`: Learning, Mentoring and Public website, each tracing to Waypoint's L1 in `/Users/quinntynebrown/projects/waypoint/docs/specs/{learning-experience,curriculum-authoring,mentoring,public-site}/L1.md`. Amend `L1-002` and `L1-003` for the new modules and roles.
- Amend these existing L2 entries with Given/When/Then criteria for the new modules and roles, instead of copying them: `L2-004` Module configuration per organization, `L2-005` Modules that are off are unreachable, `L2-007` Role-based authorization on the server, `L2-038` Shell navigation and overflow, `L2-042` Database migrations and seed data.
- Add a new L2 only for youth-account-to-child linking if no existing entry covers it, numbered after the last one in `docs/specs/L2.md`.

## Phase 4: Detailed design (`writing-design-documents`)
- Update `docs/detailed-designs/organizations/configure-modules/README.md`, `organizations/enforce-module-gates/README.md`, `identity/authorize-request/README.md`, `shell/compose-navigation/README.md` and `platform/migrate-and-seed/README.md` for the new modules, roles and seed.
- Add `docs/detailed-designs/learning/`, `curriculum/`, `mentoring/` and `website/` with a short `README.md` each that names the designs the journey prompts will add, so the layout is visible.

## Phase 5: Estimate update (`estimating-designs`)
- Add the foundation to `docs/estimates/` at 0% and the new feature folders to the rollup.
- Add one row to `docs/journeys.md` for each journey in prompts 50 to 81, under its persona (add the Youth, Mentor, Volunteer and Visitor personas), at 0% with its effort taken from the Waypoint design and estimate in `/Users/quinntynebrown/projects/waypoint/docs/estimates/`. Add the foundation as a supporting row.

## Phase 6: Incremental implementation (ATDD, `implementing-incrementally`)
- Plan thin vertical slices, for example:
  1. `ModuleId` gains `Learning`, `Mentoring` and `PublicWebsite` in `ModuleCatalog` with their dependencies; the configuration API rejects a broken dependency; off by default for existing organizations.
  2. Module gates: a placeholder endpoint per new module answers 404 when the module is off and 200 when it is on, with a cross-tenant case. Remove nothing PromiseHub needs.
  3. `Role` gains `Youth`, `Mentor` and `Volunteer`; authorization rules: a youth reaches only their own records; a mentor reaches only assigned youth (no assignments yet means none); a volunteer reaches only assigned sessions.
  4. A youth account links to exactly one child record in the same organization; linking across organizations is rejected.
  5. Empty `learning`, `curriculum`, `mentoring` and `website` libraries with a `public-api.ts` and a placeholder page from the components library, lazy-loaded from the shell only when their module is on; routes of a module that is off redirect to Today. Navigation for Youth and Mentor is composed from the modules that are on.
  6. Idempotent seed: the cast from Phase 1 in both organizations, Learning and Mentoring on for Harbourview, off for the second organization. Keep the e2e fake API in step.
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test (Playwright page objects, API integration tests), traced to its requirement.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`npm run check`, `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test`, the Playwright suite), then commit.
- When all slices are green, keep the mocks, design system, screen composition and designs aligned with what was built.

## Phase 7: Video (`creating-narrated-videos`, MANDATORY)
- Make a short narrated video in `docs/videos/49-merge-waypoint-foundation/` (`script.md`, `slides.html`, `README.md` outline, `clips/clips.mjs`) explaining what Waypoint brings and how it maps onto PromiseHub, with clips of Settings › Modules turning Learning and Mentoring on and off and the shell changing with them. Use only the existing pipeline in `tools/` and the shared assets in `docs/videos/assets/`.
- On brand: the PromiseHub logo (`docs/videos/assets/mark.svg`) on the title and closing slides, the shared `slides.css`, and the cast from `docs/mocks/README.md`.
- Background music is mandatory: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. No captions unless asked.
- Run `build-video.mjs --check`, look at the slides, encode, watch the result, and add a row to `docs/videos/README.md`.

## Done means
- `docs/adr/0019-merge-waypoint.md` records the subsystem, role, module and component mapping and the convention changes.
- `AGENTS.md` shows the amended tree and module list, and the new folders exist with nothing outside them.
- An admin can turn Learning, Mentoring and Public website on and off in Settings › Modules, dependencies are enforced, an off module's endpoints answer 404 and its navigation is gone, and turning it back on restores everything.
- Youth, Mentor and Volunteer roles exist with server-side scoping; a youth account links to one child in its own organization.
- The seed creates the new cast in both organizations and is safe to re-run.
- `docs/journeys.md` lists every Waypoint journey (prompts 50 to 81) at 0%, plus the foundation row.
- All the new and existing tests pass, including module-off, cross-tenant, permission and axe checks.
- `docs/videos/49-merge-waypoint-foundation/49-merge-waypoint-foundation.mp4` exists, with narration, the PromiseHub logo, real screen clips and background music.
- The work is on a branch with a pull request to the default branch, and its checks are green. Fetch and rebase first.
- Every change is committed and pushed to `origin`. Nothing is left uncommitted or unpushed.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
