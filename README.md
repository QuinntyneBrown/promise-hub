<p align="center">
  <img src="docs/design-system/assets/promisehub-mark-white.svg" alt="PromiseHub logo" width="128" height="128">
</p>

# PromiseHub

PromiseHub is a web app that helps youth-serving organizations keep their promises to the families they serve. It is phone-first for staff on site, works on a laptop for office tasks, and gives guardians lightweight pages to enroll, sign and stay informed.

> **Status:** scaffold only. The application and tooling are scaffolded; no product logic is implemented. Placeholder files and folders are expected to be overwritten or deleted as implementation requires. This notice also covers JSON configuration and generated files that cannot contain comments.

## Features

- **Families and programs:** households, guardians, children, approved pickups, programs with capacity and waitlists, and events.
- **Permission slips:** write, send and track digitally signed slips.
- **On-site operations:** attendance, check-in and check-out, and Quick Cards that surface allergy and medication flags.
- **Communication:** SMS, email and push messages to guardians, in their own language.
- **Safety and accountability:** incident reporting and review, role-based access, and an audit log.
- **Administration:** staff, billing, reports and privacy settings.

## Getting started

### Prerequisites

- [Python 3](https://www.python.org/downloads/) (to regenerate and check the mocks)
- A recent version of Google Chrome (to view the mocks)

The scaffold also requires .NET SDK 10.0.402 (pinned in `backend/global.json`), Node.js 22.22.3 or newer in the 22.x line (24 and 26 are also supported), and npm.

### Scaffold setup and checks

```sh
cd frontend
npm ci
npm run check
npm start
```

The Angular app starts at `http://localhost:4200` and renders a blank router outlet. All feature routes and shared library exports are placeholders. `npm run check` checks Prettier formatting, runs angular-eslint across all projects and builds every library and the app. Use `npm run format` to apply formatting.

Installing frontend dependencies also installs root `.husky/` hooks. Before commits, the hook checks frontend formatting and lint and backend formatting. It requires Node and the .NET SDK on PATH. CI sets `HUSKY=0` and runs checks directly.

From the repository root:

```sh
dotnet restore backend/PromiseHub.sln
dotnet build backend/PromiseHub.sln --no-restore
dotnet test backend/PromiseHub.sln --no-build
dotnet format backend/PromiseHub.sln --verify-no-changes --no-restore
dotnet run --project backend/src/PromiseHub.Api -- --urls http://localhost:5000
```

The API host has no endpoints and returns 404. No persistence, authentication, migrations or external providers are wired. The CLI has no commands and exits with code 1. The four test projects contain no tests; a successful test command provides no behavior coverage. Angular unit tests and Playwright setup will be added with implementation and must use Chromium only.

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for scaffold boundaries.

### View the mocks

Open [`docs/mocks/index.html`](docs/mocks/index.html) in Chrome for a gallery of every screen and state. Add `?theme=dark` to force a theme, or `?chrome=0` to hide the mock bar. See [`docs/mocks/README.md`](docs/mocks/README.md) for details.

### Regenerate the mocks

The mock HTML is generated, so edit the generator in `docs/mocks/tools/`, not the HTML.

```sh
python docs/mocks/tools/build.py --clean
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
```

## Repository layout

| Path | Contents |
|---|---|
| `backend/` | .NET solution, empty application layers and test projects |
| `frontend/` | Angular shell, feature libraries, Prettier and angular-eslint |
| `.husky/` | Git hooks installed through the frontend package |
| `eng/` | Developer build scripts |
| `docs/mocks/` | Static HTML mocks of every page, dialog and notification in every state |
| `docs/design-system/` | Design tokens and the component kit |
| `AGENTS.md` | Architecture, conventions and workflow for contributors and coding agents |

## Technology

A .NET backend owns persistence, permissions and authentication. An Angular frontend provides the app. Playwright covers end-to-end behavior and accessibility.

## Contributing

We welcome contributions. Read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) first. To report a vulnerability, see [SECURITY.md](SECURITY.md). For help, see [SUPPORT.md](SUPPORT.md).

## License

PromiseHub is licensed under the [MIT License](LICENSE).
