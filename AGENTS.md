# PromiseHub

PromiseHub is a phone-first web app, with laptop use for office work and lightweight guardian pages, that helps youth-serving organizations keep their promises to the families they serve.
Staff manage households, children, programs and events, collect digitally signed permission slips, take attendance and check children in and out, and see allergy and medication flags on Quick Cards.
Guardians are reached by SMS, email and push, in their own language, and can enroll, sign and update their details themselves.
Incidents are reported and reviewed, access is role-based, and every sensitive action is audited.
Admins handle staff, billing, reports and privacy settings.
The .NET backend owns persistence, permissions and authentication; the Angular frontend provides the app; Playwright covers end-to-end behavior and accessibility.


## Repository layout (MANDATORY)

**This folder structure and the contents of each folder are mandatory. They are a mandate, not a suggestion.**

- Every file MUST go in the folder this tree assigns it. If no folder fits, stop and ask; do not guess or improvise.
- Do NOT create top-level folders, projects, libraries or alternative layouts that are not in this tree.
- Do NOT move, rename or merge folders or projects in this tree.
- The tree changes only with the user's explicit approval, and this section MUST be updated in the same change, before any code is placed in the new location.
- Work that does not follow this structure is incomplete and MUST be corrected before it is considered done.

```text
promise-hub/
├── AGENTS.md, CLAUDE.md, GEMINI.md   # Agent instructions (AGENTS.md is the source of truth)
├── README.md                         # Product overview, setup and development commands
├── LICENSE                           # MIT
├── CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, SUPPORT.md   # Community health files
├── .github/
│   ├── workflows/                    # CI: build, test, lint, format, container image publish
│   ├── ISSUE_TEMPLATE/               # Bug report and feature request templates
│   ├── pull_request_template.md      # PR checklist
│   └── copilot-instructions.md       # Pointer to AGENTS.md
├── .husky/                           # Git hooks managed by frontend/package.json
├── backend/                          # .NET solution
│   ├── PromiseHub.sln
│   ├── Directory.Build.props         # Shared build settings for every project
│   ├── Directory.Packages.props      # Central NuGet package versions
│   ├── global.json                   # Pinned .NET SDK
│   ├── deploy/                       # Dockerfiles and the local compose file
│   ├── src/
│   │   ├── PromiseHub.Domain/          # Entities, value objects, roles. Zero dependencies.
│   │   │                               # One folder per feature, named as in Application/
│   │   ├── PromiseHub.Application/     # Handlers, validators, DTO contracts, permission checks;
│   │   │                               # one folder per feature (Identity/, Organizations/,
│   │   │                               # Households/, Enrollment/, Programs/, Events/, Slips/,
│   │   │                               # Attendance/, Messaging/, Incidents/, Reports/, Surveys/,
│   │   │                               # Staff/, Billing/, Audit/, Imports/, Search/, Notifications/,
│   │   │                               # Learning/, Curriculum/, Mentoring/, Website/)
│   │   ├── PromiseHub.Infrastructure/  # DbContext, EF migrations, SMS, email and push providers,
│   │   │                               # file storage, auth services, audit log, seeder
│   │   ├── PromiseHub.Api/             # Endpoints, Program.cs, DI composition, middleware.
│   │   │                               # No business logic.
│   │   └── PromiseHub.Cli/             # Database migrate, seed and reset commands
│   └── tests/
│       ├── PromiseHub.Application.Tests/     # Handler and authorization rule tests
│       ├── PromiseHub.Infrastructure.Tests/  # Persistence, messaging, storage
│       ├── PromiseHub.Api.Tests/             # Integration tests against the API
│       └── PromiseHub.Cli.Tests/             # CLI command tests
├── frontend/                         # Angular workspace
│   ├── angular.json, package.json, eslint.config.js, .prettierrc
│   └── projects/
│       ├── promisehub/               # The app: shell, top-level routes that lazy-load the
│       │                             # feature libraries, auth guards. No feature pages.
│       ├── api/                      # API client library: service contracts, injection
│       │                             # tokens, HTTP implementations, auth
│       ├── components/               # Shared accessible UI component library and design tokens
│       ├── account/                  # Feature library: sign in, password reset, invitations
│       ├── today/                    # Feature library: the staff home for the day
│       ├── households/               # Feature library: families, guardians, children
│       ├── enrollment/               # Feature library: guardian self-enrollment, roster import and review
│       ├── programs/                 # Feature library: programs, capacity, waitlists
│       ├── events/                   # Feature library: events and their schedules
│       ├── slips/                    # Feature library: permission slip editor, tracking and signing
│       ├── attendance/               # Feature library: check-in, check-out, Quick Cards, pickup
│       ├── messaging/                # Feature library: compose, send and track guardian messages
│       ├── incidents/                # Feature library: report, review and follow up incidents
│       ├── reports/                  # Feature library: reports and surveys
│       ├── guardian/                 # Feature library: lightweight guardian pages
│       ├── settings/                 # Feature library: organization, notification and privacy settings
│       ├── administration/           # Feature library: staff, roles, billing, audit log
│       ├── learning/                 # Feature library: youth lessons, quizzes, assignments, reflections,
│       │                             # journey and badges
│       ├── curriculum/               # Feature library: tracks, modules, lessons, quizzes, assignments,
│       │                             # badges and progression authoring
│       ├── mentoring/                # Feature library: mentor dashboard, youth records, grading,
│       │                             # check-ins, at-risk flags, assigned work
│       └── website/                  # Feature library: the organization's public pages
├── e2e/                              # Playwright suite (Chromium only)
│   ├── playwright.config.ts
│   ├── pages/                        # Page objects: one per screen, owning selectors
│   ├── fixtures/                     # Test fixtures, the fake backend (routed API + auth) and seeded data
│   └── tests/                        # Specs by feature (one folder per feature, including
│                                     # learning/, curriculum/, mentoring/ and website/),
│                                     # including axe accessibility checks
├── eng/                              # Developer and CI scripts (start stack, run tests, deploy)
│   └── infra/                        # Infrastructure as code
├── tools/                            # Video tooling: narration, build and screen recording
│   ├── video-audio/                  # script.md -> narration MP3 + timing manifest (edge-tts), pronunciations.json
│   ├── video-build/                  # slides.html + narration + background music -> 1080p MP4
│   └── video-record/                 # Screen recordings of the running app for clip slides
└── docs/
    ├── journeys.md                   # User journeys by persona, ordered by value
    ├── specs/                        # L1/L2 requirements with acceptance criteria
    ├── detailed-designs/             # Per-subsystem/feature designs and diagrams (including
    │                                 # learning/, curriculum/, mentoring/ and website/)
    ├── mocks/                        # Static HTML mocks: the design reference
    ├── design-system/                # Tokens, components and patterns taken from the mocks
    ├── estimates/                    # Effort and percent-complete per design (one file per
    │                                 # subsystem, including learning, curriculum, mentoring, website)
    ├── adr/                          # Architecture decision records (NNNN-title.md)
    ├── prompts/                      # Ready-to-run implementation prompts for features
    └── videos/                       # Narrated videos: NN-topic/ (script.md, slides.html, README.md, media)
        └── assets/                   # Shared slides.css, slides.js, mark.svg and music/ (the background track)
```

Rules (MUST be followed):

- Every feature uses the same name in `Application/`, `frontend/projects/`, `docs/specs/`, `docs/detailed-designs/`, `docs/estimates/` and `e2e/tests/`. Where the backend and frontend names differ in the tree (`Households/` and `households/`, `Messaging/` and `messaging/`), they differ only in case.
- EF Core migrations live only in `Infrastructure/Persistence/Migrations/` and are applied by the Cli project, never by the API.
- .NET tests live only under `backend/tests/`. Angular unit tests (`*.spec.ts`) sit next to the code they test. Playwright tests live only in `e2e/`.
- Each frontend feature is its own library project under `frontend/projects/<feature>/`, exposing its routes, pages and dialogs through its public API (`public-api.ts`). The app lazy-loads it from the shell.
- Feature libraries depend only on `components` and `api`, never on each other or on the app. Anything two features share moves into `components` or `api`.
- Feature pages use components from `components` and services from `api`. They never call `HttpClient` directly.

## Components library is mandatory (CRITICAL)

**Every UI component defined in the design system (`docs/design-system/`) MUST be built once in the shared components library and reused everywhere. This is not optional.**

- The components library is the single home of the design system in code: every component in `docs/design-system/`, plus the design tokens.
- The app and every feature library MUST compose their screens from it. Do NOT build, copy, restyle or wrap a design-system component inside a feature library or the app.
- If a screen needs a component the library does not have, add it to the library first, matching the design system, then use it from the feature. Never create a one-off local version.
- If an existing component is missing a variant or state that the design system defines, extend the component in the library. Do not override its styles from a feature.
- Feature libraries contain only feature-specific composition: pages, routes, feature dialogs and the glue between API services and components.
- The components library MUST NOT depend on the API client, the app or any feature library. It contains no business logic and makes no HTTP calls.
- Components MUST meet WCAG 2.2 AA, read tokens by role and expose the design system's variants, sizes and states through inputs.
- A screen that uses a hand-rolled substitute for a library component is incomplete and MUST be corrected before it is considered done.

## Architecture rules

- Business rules live in application handlers and domain services, never in endpoints or controllers.
- Endpoints require authentication by default; anonymous access is opted into explicitly per endpoint.
- Every query, search result and endpoint enforces permissions on the server. Never rely on the UI to hide data.
- The API does not apply database migrations on startup; a CLI project does. Seed data is idempotent and safe to re-run.
- Keep request logging outside the exception-handling middleware so handled response statuses are logged correctly.
- Keep secrets out of the repo; use configuration and environment variables.
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.

## One file per type

- Angular components are never single-file: each has its own `.ts`, `.html` and, when it needs styles, `.css`. No inline `template` or `styles`.
- Backend: one type per file (class, record, interface, enum), named after the type. Small nested or tightly coupled types are the exception, not the rule.
- Frontend: the same applies to services, contracts, models and tokens: one exported type per file.

## Frontend conventions

- Prettier owns formatting and the linter owns lint; CI fails on either.
- WCAG 2.2 AA on every screen: keyboard reachable, visible focus, labelled controls, sufficient contrast.
- Read design tokens by role (for example `var(--color-brand-foreground)`), never as hex values.
- Keep component styles encapsulated; global styles are limited to shared foundations and utilities.
- Declare each `ng-content` slot once. A component that renders `<a>` or `<button>` conditionally puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches.
- API services have a contract and an injection token; pages depend on the token, not the concrete implementation.
- No inline forms in pages. Button-triggered editing opens an Angular CDK Dialog or navigates to a screen.
- Use Angular CDK Dialog/Overlay for modal behavior; never hand-roll modals.

## Naming (MANDATORY)

**The word "Seedling", in any form (Seedlings, seedling, seedlings, Seedling-, seedlings-), MUST NOT appear anywhere in PromiseHub.**

- It is banned in code, identifiers, file and folder names, routes, URLs, database objects, configuration, mocks, design-system pages, specs, designs, estimates, ADRs, prompts, videos, commit messages and user-facing copy in every language.
- Do not introduce it as a module, feature, page, dialog or notification name. If a feature needs a name, ask the user; do not pick a substitute.
- Any file, folder or text that contains it is incomplete and MUST be renamed or rewritten before the work is considered done.

## Modules are configurable (CRITICAL)

**Every feature of PromiseHub is a module that an organization can switch on or off, from a single module to the entire suite. This is a product rule, not a setting to bolt on later.**

- The modules are Roster, Permission slips, Roll Call, Quick Cards, Pickup, Messages, Incident log, Reports, Learning, Mentoring and Public website. Roster is the data every other module reads; a module declares which modules it needs (for example Pickup needs Roll Call; Learning, Mentoring and Public website each need Roster) and the server rejects a configuration that breaks a dependency.
- The configuration lives per organization (`Settings › Modules`, mocked as `settings-modules`; chosen during onboarding in `onboard-modules`) and is read by the backend on every request: an endpoint of a module that is off answers 404 for that organization, never 200 with hidden data.
- The frontend reads the same configuration once per session and composes navigation (top bar, More menu, phone tab bar, search scopes, Today's cards, guardian pages) only from modules that are on. Nothing that is off is rendered, linked, mentioned or prefetched. Routes of a module that is off redirect to Today.
- Each frontend feature library maps to exactly one module and is lazy-loaded only when its module is on (`learning` and `curriculum` map to Learning, `mentoring` to Mentoring, `website` to Public website; ADR 0043). Shared code never assumes a module is present.
- Turning a module off hides it; it never deletes data. Turning it back on restores everything.
- Every acceptance test suite for a feature includes the case where its module is off: the route is unreachable and the API answers 404.

## Multi-tenant (CRITICAL)

**PromiseHub serves many organizations from one deployment. An organization is a tenant: its families, children, staff, settings, modules, plan and audit log belong to it alone.**

- Every tenant-owned table carries the organization id, every query filters by it on the server, and every integration test for a feature includes a cross-tenant case that proves another organization's data is never returned.
- The tenant comes from the signed-in person's membership, never from the URL or the client. A person may belong to several organizations with a different role in each; the org switcher (mocked as `switch-organization`) changes the active organization and reloads, and the active organization is explicit in every request.
- Platform admins manage tenants from the organizations list (`organizations`, `add-organization`, `suspend-organization`); that list is the only screen that spans tenants, and only platform admins can open it. Suspending a tenant blocks access and outbound messages and deletes nothing.
- Background jobs (reminders, no-show alerts, exports) run per tenant and respect that tenant's modules, plan and SMS cap.
- Seed data creates at least two organizations so tests and demos exercise isolation.

## Testing

- Backend tests are integration tests against the API, using a fake database (no Docker, Testcontainers or running database server) and fakes behind abstractions for external dependencies (storage, email, time). Write authorization tests alongside each feature.
- Playwright uses the Page Object Model: one page object per screen, owning its selectors and interactions. Tests state intent; page objects know the DOM. Never put a selector in a test.
- Run frontend tests in Chromium only. Do not configure or run Firefox, WebKit or any other browser.
- Run axe accessibility checks on every screen.
- **The backend is faked in e2e.** The full Playwright suite MUST pass with no backend running. Every HTTP call and the auth flow are intercepted and answered by a fake API in `e2e/fixtures/`, which owns seeded in-memory data and answers the real API's contracts. An unrouted request MUST fail the test loudly. Playwright's `webServer` starts only the frontend. Keep the fake in step with the API in the same change.

## Narrated videos have background music (MANDATORY)

**Every narrated video made in this repository has background music under its narration. It is one fixed track, and it is not optional.**

- The track is `docs/videos/assets/music/on-the-beach-intro-outro.mp3` (_On the Beach Intro Outro_ by NaturesEye, Pixabay Content License). Its provenance lives in `docs/videos/assets/music/README.md`; never swap it for another track or add one without recording the provenance there.
- Every slide deck names it: `<body data-music="../assets/music/on-the-beach-intro-outro.mp3">`. The builder (`tools/video-build/build-video.mjs`) lays it under the narration, looped, at −10.8 dB with a fade in, holds the last slide 3 s so it fades out, and refuses a deck with no `data-music`. Keep that level unless the user asks for another.
- Videos are made with the `creating-narrated-videos` skill and the tooling in `tools/` (`tools/video-audio/`, `tools/video-build/`, `tools/video-record/`) with the shared assets in `docs/videos/assets/`. Do not build a second pipeline.
- A video delivered without the music is incomplete and MUST be rebuilt before it is considered done.

## Incremental implementation and ATDD (MANDATORY)

Mocks and the design system are design artifacts. ATDD does not apply to them; do not write tests for mocks or the design system.

Every new feature or change to production behavior MUST have a requirement (`docs/specs/`), a detailed design (`docs/detailed-designs/`) and a mock (`docs/mocks/`) before implementation begins. This includes behavior changes to existing features. Documentation-only, design-system-only, mock-only and test-only changes are out of scope unless they are part of a production behavior change.

Every production behavior implementation MUST invoke and follow the `implementing-incrementally` skill before any code is written, combined with acceptance test-driven development:

1. Plan small, reviewable slices and complete one at a time.
2. For each slice, write Given-When-Then acceptance criteria, write the acceptance test, and run it to prove it fails for the expected reason BEFORE writing production code.
3. Implement only what satisfies that slice, refactor with tests green, and run the relevant regression checks.
4. Do not move to the next slice until those checks pass.

No bulk implementation, no tests added afterward, and no weakening tests to manufacture a pass. Keep the requirement, design, mock, criteria, tests and implementation aligned until the feature is complete. Keep changes small and match the existing code style.

### Never write architecture tests

Never add a test that asserts the shape of the codebase rather than its behavior: no structure, layout or naming tests, no banned-API scans, and no traceability tests that parse the specifications. Those constraints belong to the compiler, the formatter and review. A test suite exists to prove behavior.
