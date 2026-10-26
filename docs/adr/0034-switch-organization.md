# 0034: Switching moves the session cookie to another membership and reloads the app

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 40 lets a person with several memberships switch the active organization (`L2-002`). The tenant already comes from the membership in the session cookie (ADR 0002); people are their memberships with the same email.

## Decision

- **List.** `GET /me/organizations` returns the person's current memberships with organization name and role, the active one marked.
- **Switch.** `POST /me/organization` accepts only one of the caller's own current memberships, re-issues the session cookie with that membership (keeping the user and "remember me"), and audits `Switched` in the organization joined. The tenant still never comes from the request.
- **Removed while active.** When the session's membership has been removed, the tenant middleware moves the session to the person's first remaining membership by name; with none left, the request answers 401 as before.
- **Frontend.** The top bar (components library) gains an organization switcher, shown only with two or more organizations, styled from the design system's `org-switcher`. Choosing one calls `switchTo` and reloads the page at Today, so nothing of the previous tenant stays in memory.

## Consequences

"Set up a new organization" in the switcher menu waits for platform sign-up (prompt 47).
