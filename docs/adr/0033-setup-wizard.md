# 0033: Setup progress is read from the organization's data, and each step reuses its feature's screen

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 39 asks a new organization's admin to choose modules and create the first program, roster, staff and slip through an onboarding wizard, and to be able to finish later (`L2-008`). Every one of those features already has its own screen and API.

## Decision

- **Progress from data.** `GET /setup` (`ManageSettings`) marks each step done when its data exists: `Organization.ProfileConfirmedAt` set, a module configuration saved, a program, children, more than one current member or an invitation, and a sent slip. Nothing extra is stored, so "Finish later" simply returns to the checklist and progress survives.
- **Organization step.** `PUT /settings/organization` saves the name and city, sets `ProfileConfirmedAt` once and is audited. Harbourview is seeded as confirmed; Northgate is part way through.
- **Reuse.** The other steps link to the existing screens: Settings › Modules, New program, Import a roster, Staff and Events. The first-slip step exists only while Permission slips is on, and a step whose screen's module is off has no link.
- **Where.** `SetupPage` and `SetupOrganizationPage` live in the `settings` library as `setupRoutes`, mounted at `/setup`; Today's "Start setup" opens it.

## Consequences

The wizard chrome from the mocks (`onboard-*`: one step per screen, a stepper, no navigation) is not built; the checklist and the reused screens cover the journey. A sign-up flow that creates the organization is prompt 47.
