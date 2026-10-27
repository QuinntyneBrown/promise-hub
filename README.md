<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/design-system/assets/promisehub-mark-white.svg">
    <img src="docs/design-system/assets/promisehub-mark-mono-teal-amber.svg" alt="PromiseHub logo" width="128" height="128">
  </picture>
</p>

<h1 align="center">PromiseHub</h1>

<p align="center">
  Help youth-serving organizations keep their promises to the families they serve.
</p>

<p align="center">
  <a href="https://github.com/QuinntyneBrown/promise-hub/actions/workflows/scaffold.yml"><img src="https://github.com/QuinntyneBrown/promise-hub/actions/workflows/scaffold.yml/badge.svg" alt="Checks"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4" alt=".NET 10">
  <img src="https://img.shields.io/badge/Angular-22-DD0031" alt="Angular 22">
  <img src="https://img.shields.io/badge/Playwright-Chromium-2EAD33" alt="Playwright">
  <img src="https://img.shields.io/badge/WCAG-2.2%20AA-005A9C" alt="WCAG 2.2 AA">
</p>

PromiseHub is a multi-tenant web application for after-school programs, camps, clubs and youth ministries. Staff use it on a phone at the door and on a laptop in the office. Guardians reach it through texted links in their own language, with no account to create. Every feature is a module an organization can switch on or off, every sensitive action is audited, and the backend enforces permissions and tenant isolation on every request.

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Build and test](#build-and-test)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [Code of conduct](#code-of-conduct)
- [License](#license)

## Features

| Module               | What it does                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roster**           | Households, guardians, children, medical details and approved pickups. Guardian self-enrollment through a verified link, CSV/XLSX roster import with review, programs with capacity and waitlists, events and sessions. |
| **Permission slips** | Write, send or schedule slips; guardians sign on a phone with a typed name; scheduled reminders, day-of clearance and tablet signing on site.                                                                           |
| **Roll Call**        | One-tap check-in and sign-out, walk-ins, absences, no-show alerts with guardian replies, end-of-session reconciliation and offline check-in that syncs when connectivity returns.                                       |
| **Quick Cards**      | Allergy and medication flags first, tap-to-call contacts and pickup rules, with restricted details limited by role and every open audited.                                                                              |
| **Pickup**           | Approved adults, exceptional pickups confirmed by the guardian, and a record of who collected each child.                                                                                                               |
| **Messages**         | SMS, email and push to guardians by program or event, in each family's language, with per-household delivery status and a plan-level SMS cap.                                                                           |
| **Incident log**     | Structured reports from any staff member, routed to the program director, visible only to supervisors and the reporter.                                                                                                 |
| **Reports**          | Attendance, demographic and outcome reports exported for funders, plus translated guardian surveys.                                                                                                                     |

Across modules:

- **Multi-tenant.** Each organization's data, staff, settings, plan and audit log are isolated on the server. People can belong to several organizations and switch between them.
- **Role-based access.** Admin, program director, site lead, youth worker and volunteer coordinator roles per organization, plus platform admins, all enforced in application handlers rather than the UI.
- **Secure sign-in.** Cookie sessions, lockout, a one-time code step, session management and password recovery.
- **Administration.** Setup wizard, module configuration, staff invitations, billing and usage, privacy and retention settings, guardian data requests, in-app notifications and a searchable audit log.
- **Accessible by design.** Every screen meets WCAG 2.2 AA and is checked with axe in the end-to-end suite.

## Getting started

### Prerequisites

| Tool                                              | Version                                     |
| ------------------------------------------------- | ------------------------------------------- |
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0.402 (pinned in `backend/global.json`)  |
| [Node.js](https://nodejs.org/)                    | 22.x LTS (24 and 26 also supported) and npm |
| Google Chrome or Chromium                         | Any recent version                          |

### Run the backend

From the repository root:

```sh
dotnet restore backend/PromiseHub.sln
dotnet build backend/PromiseHub.sln --no-restore

export ASPNETCORE_ENVIRONMENT=Development          # PowerShell: $env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project backend/src/PromiseHub.Cli -- migrate
dotnet run --project backend/src/PromiseHub.Cli -- seed
dotnet run --project backend/src/PromiseHub.Api -- --urls http://localhost:5080
```

The CLI owns the database schema. `migrate` applies pending migrations (`--check` exits 3 when any are pending), `seed` is idempotent and creates two organizations with staff, families, programs and events, and `reset` drops the local database (Development only, or `--force`). The API refuses to start when migrations are pending. Local data is a SQLite file at `backend/promisehub.dev.db` (see [ADR 0001](docs/adr/0001-sqlite-for-persistence.md)).

### Run the frontend

```sh
cd frontend
npm ci
npm start
```

The app is served at `http://localhost:4200` and proxies `/api` to `http://localhost:5080`. To sign in as seeded staff, set `Seed:StaffPassword` (and `Seed:MfaSecret`) in configuration or user secrets before running `seed`; without them the seeded accounts exist but cannot sign in.

Installing frontend dependencies also installs the Git hooks in `.husky/`. Before each commit the hook checks frontend formatting and lint and backend formatting; it needs Node and the .NET SDK on `PATH`. Set `HUSKY=0` to skip it.

## Build and test

| Check                           | Command                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| Backend tests                   | `dotnet test backend/PromiseHub.sln`                       |
| Backend format                  | `dotnet format backend/PromiseHub.sln --verify-no-changes` |
| Frontend format, lint and build | `cd frontend && npm run check`                             |
| Frontend format fix             | `cd frontend && npm run format`                            |
| Frontend unit tests             | `cd frontend && npx ng test`                               |
| End-to-end and accessibility    | `cd e2e && npm ci && npm run install-browser && npm test`  |

Backend tests are integration tests against the API with an in-memory SQLite database and fakes for storage, email, SMS and time; no Docker or database server is needed. The Playwright suite runs in Chromium only and starts just the frontend on port 4317: every API call and the auth flow are answered by the fake backend in `e2e/fixtures/`, so the suite passes with nothing else running. Performance budgets run against a production build on a second port.

CI runs all of these on every push and pull request through [`.github/workflows/scaffold.yml`](.github/workflows/scaffold.yml).

## Project structure

```text
promise-hub/
├── backend/            .NET solution: Domain, Application, Infrastructure, Api, Cli and tests
├── frontend/           Angular workspace: the app shell, the api and components libraries,
│                       and one lazy-loaded library per feature
├── e2e/                Playwright suite with page objects, fixtures and the fake backend
├── eng/                Developer and CI scripts
├── tools/              Narrated-video tooling (narration, build, screen recording)
├── docs/
│   ├── journeys.md     User journeys by persona, with effort, progress and videos
│   ├── specs/          L1/L2 requirements with acceptance criteria
│   ├── detailed-designs/   Per-subsystem designs with C4, class and sequence diagrams
│   ├── mocks/          Static HTML mocks of every screen and state, light and dark
│   ├── design-system/  Design tokens and the component kit the UI is built from
│   ├── estimates/      Effort and percent complete per design
│   ├── adr/            Architecture decision records
│   ├── prompts/        Ready-to-run implementation prompts
│   └── videos/         48 narrated walkthroughs of the product
└── AGENTS.md           Architecture rules and conventions for contributors and coding agents
```

The backend follows a layered design: `Domain` has no dependencies, `Application` holds handlers, validators and permission checks, `Infrastructure` owns EF Core, messaging providers, storage and the audit log, and `Api` is composition and endpoints only. On the frontend, feature libraries depend only on the shared `components` and `api` libraries and never on each other.

## Documentation

- [User journeys](docs/journeys.md): what each persona does, ordered by value, linked to designs and videos.
- [Requirements](docs/specs/): high-level (L1) and detailed (L2) requirements with acceptance criteria.
- [Detailed designs](docs/detailed-designs/) and [architecture decision records](docs/adr/README.md).
- [Mocks](docs/mocks/index.html): open in Chrome for a gallery of every screen and state. Add `?theme=dark` to force a theme or `?chrome=0` to hide the mock bar. The HTML is generated; edit `docs/mocks/tools/` and run `python docs/mocks/tools/build.py --clean`.
- [Design system](docs/design-system/): tokens, components and patterns, with verified contrast.
- [Estimates](docs/estimates/README.md): effort and progress per subsystem.
- [Videos](docs/videos/README.md): narrated walkthroughs, one per journey.
- [AGENTS.md](AGENTS.md): the rules every change must follow, including the mandatory repository layout, module and tenancy rules, and the acceptance-test-driven workflow.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, and [AGENTS.md](AGENTS.md) for the architecture rules that pull requests are reviewed against. Every production change starts with a requirement, a design and a mock, and lands in small slices with acceptance tests written first.

For help, see [SUPPORT.md](SUPPORT.md).

## Security

Please do not report security vulnerabilities through public GitHub issues. See [SECURITY.md](SECURITY.md) for how to report one responsibly.

## Code of conduct

This project has adopted a [Code of Conduct](CODE_OF_CONDUCT.md). By participating you are expected to uphold it.

## License

Copyright (c) PromiseHub contributors. Licensed under the [MIT License](LICENSE).
