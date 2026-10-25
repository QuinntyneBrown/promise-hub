# Contributing to PromiseHub

Thank you for your interest in contributing! This document explains how to report issues, propose changes and get a pull request merged.

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).
- **Suggest a feature** using the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
- **Improve the documentation**, mocks or design system.
- **Write code** for an issue labelled `good first issue` or `help wanted`.

Security issues follow a different process: see [SECURITY.md](SECURITY.md).

## Before you start

1. Search existing issues to avoid duplicates.
2. For anything larger than a small fix, open an issue first and describe what you want to change. Wait for a maintainer to agree on the approach before investing significant time.
3. Read [AGENTS.md](AGENTS.md). It is the source of truth for architecture and coding conventions, for humans and coding agents alike.

## How changes are made

Every change to production behavior follows the same path, in order:

1. **Requirement:** L1/L2 requirements with acceptance criteria in `docs/specs/`.
2. **Design:** a detailed design in `docs/detailed-designs/`.
3. **Mock:** the screen in every state in `docs/mocks/`.
4. **Acceptance test first:** write a Given-When-Then acceptance test and watch it fail for the expected reason.
5. **Implement in thin slices:** make the test pass, refactor with tests green, run regression checks, then move to the next slice.

Documentation-only, mock-only, design-system-only and test-only changes skip the steps that don't apply.

## Development setup

See [Getting started](README.md#getting-started) in the README. To check the mocks after changing them:

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
```

## Coding conventions

The full list lives in [AGENTS.md](AGENTS.md). The essentials:

- Business rules live in backend handlers, never in endpoints. Enforce every permission on the server.
- Build every design-system component once in the shared components library and reuse it. Read design tokens by role, never hex.
- Prettier and the linter for the frontend, `dotnet format` for the backend. CI fails on either.
- WCAG 2.2 AA on every screen.
- Tests prove behavior. Don't write architecture, layout or naming tests.

## Commit messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) style, and keep each commit focused on one logical change:

```text
feat(attendance): add late-arrival state to check-in
fix(slips): keep signatures when a slip is edited
docs(mocks): add empty state to the incidents list
```

## Pull requests

1. Fork the repository and create a branch from `main` (`feature/<short-name>` or `fix/<short-name>`).
2. Make your change following the workflow above, with tests.
3. Make sure the build, tests, lint and format checks pass locally.
4. Open a pull request and complete the [pull request template](.github/pull_request_template.md). Link the issue it resolves.
5. A maintainer will review it. Address feedback with new commits; we squash on merge.

Pull requests need at least one approving review and a green CI run before they are merged.

## Licensing of contributions

This project is licensed under the [MIT License](LICENSE). By submitting a contribution you agree that it is licensed under the same terms, and you confirm that you have the right to submit it.
