# 0043: Waypoint merges into PromiseHub as three modules, three roles and existing features

- Status: accepted
- Date: 2026-10-26

## Context

Waypoint (`/Users/quinntynebrown/projects/waypoint`, branch `promise-hub`) is a youth leadership platform: lessons, quizzes, assignments, reflections, badges, mentoring, cohorts, sessions, a guardian portal, a volunteer portal and a public site. Prompts 50 to 81 bring its journeys into PromiseHub one at a time. Prompt 49 decides, once, where each Waypoint subsystem, role and component lands, so that the journey prompts stay small and consistent. Waypoint is read only; nothing from it is loaded at build or run time.

Prompt 49 asked for this record as `0019-merge-waypoint.md`. ADR 0019 already records enrollment review, so this record takes the next free number, 0043, and the journey prompts 50 to 81 point here.

## Decision

### Subsystems and roles

| Waypoint | PromiseHub |
|---|---|
| Youth (signs in) | New role **Youth**. One youth account links to one existing child record in Roster (`Membership.ChildId`). A youth sees only their own data. |
| Mentor | New staff role **Mentor**. Sees only the youth and cohorts assigned to them; with no assignments yet, that is nobody. |
| Volunteer | New staff role **Volunteer**. Sees only their assigned sessions. Composed into the existing shell; no separate portal app. |
| Admin | Existing **Admin** and **Program director** roles. |
| Guardian accounts | No guardian accounts (`L1-013`). The guardian portal and consent become verified-link guardian pages (ADR 0015). |
| Cohort | A **program** with a term and, once curriculum exists, a track (`Programs/`). |
| Session | An **event** (`Events/`); RSVP is added to events. |
| Attendance | **Roll Call**. One attendance system; Waypoint's statuses fold into it. |
| Application / referral | **Enrollment** (`Enrollment/`), through the open enrollment link. |
| Announcements, direct messages | **Messages** module (`Messaging/`). |
| Notifications | Existing in-app notifications (`Notifications/`), made near-real-time. |
| Lessons, quizzes, assignments, reflections, journey, badges | New **Learning** module: youth pages in `learning`, authoring in `curriculum`. |
| Mentor dashboard, grading, check-ins, at-risk flags, assign work | New **Mentoring** module (`mentoring`). Grading and assign work need Learning content and render only when Learning is on. |
| Public site | New **Public website** module (`website`). Anonymous, read-only, published content only; the organization comes from a public website slug (`Organization.WebsiteSlug`), the one place a tenant is chosen without a membership. |
| Audit log, privacy, roster import, reports | Existing `Audit/`, `Organizations/` privacy, `Imports/` and `Reports/`. |
| Help, support, error and maintenance pages | Existing shell error pages; anything missing is deferred. |

### Modules

- `ModuleId` gains `Learning`, `Mentoring` and `PublicWebsite`, after Reports in catalog order. Each needs Roster, and the existing dependency check rejects a configuration that turns Roster off while one of them is on.
- A module is on only when listed in the organization's `ModuleConfiguration`, so the three new modules are off for every existing organization until an admin turns them on. The "Whole suite" preset in Settings › Modules does not include them; they are switched on one at a time.
- Placeholder endpoints prove the gates until the journeys add real ones: `GET /learning/me` (Learning, the youth's own record), `GET /curriculum` (Learning, authors), `GET /mentoring/youth` (Mentoring, the mentor's assigned youth) and the anonymous `GET /website/{slug}` (Public website). An off module answers 404.
- The public website reads the module configuration of the organization its slug names, not of a signed-in membership, and answers 404 for an unknown slug, a suspended organization or a module that is off, so a visitor cannot tell them apart.

### Roles and server-side scoping

- `Role` gains `Youth`, `Mentor` and `Volunteer`. The five existing roles are the **staff roles**; they hold the new `UseStaffApp` permission. The three new roles are **participant roles** and do not.
- The fallback authorization policy now requires `UseStaffApp`, so every existing endpoint that declared no permission (families, children, events, programs, Today, search and the rest) stays closed to participants with 403. Endpoints every member may use opt in with `AllowAnyMember()`: the session (`/me` and its children), notifications and sign-out.
- New permissions: `Learn` (Youth), `MentorYouth` (Mentor) and `AuthorCurriculum` (Admin, Program director). A youth's placeholder reads only the child linked to their own membership; a mentor's lists only youth assigned to them, and there are no assignments yet.
- A volunteer holds `RunSessions` without `RunAnySession`, so `SessionAccess` limits them to the sessions they are assigned to, exactly as it limits youth workers (ADR 0012). `/sessions/today` and `/sessions/{id}/roster` accept `UseStaffApp` or `RunSessions`.
- Only an admin (`ManageStaff`) links a youth account to a child, with `PUT /staff/{membershipId}/child`. The membership must be a Youth membership and the child must be in the same organization (another organization's child is not found, so the answer is 404). A child links to at most one youth account. Linking is audited.

### Frontend

- New feature libraries `learning`, `curriculum`, `mentoring` and `website`, each with a `public-api.ts` and a placeholder page composed from `components`. The first three load inside the shell through `moduleRoute` (Learning for `learning` and `curriculum`, Mentoring for `mentoring`). `website` loads at `/site/:slug`, outside the shell, through a `canMatch` that asks the server whether the site is published, so its library is never downloaded while the module is off.
- `curriculum` maps to the Learning module: authoring has no meaning without the lessons it writes. It is the one library that shares a module with another.
- Navigation sections declare the roles they serve. Staff roles keep today's sections, plus Curriculum for admins and program directors while Learning is on. Youth see Today, Learning, Notifications and Your account; mentors see Today, Mentoring, Notifications and Your account; volunteers see Today, Check-in, Notifications and Your account. Search, the More menu's Settings and staff-only sections are not rendered for participant roles.
- Today for a participant role is a welcome with one card per module that is on and serves the role. It does not call the staff summary endpoint.

### Conventions Waypoint code follows when it moves

| Waypoint | PromiseHub |
|---|---|
| .NET 9, MediatR, FluentValidation, controllers | .NET 10, plain handlers (ADR 0003), minimal API endpoints |
| Angular 21, `portal` and `public-site` apps, one library per role | Angular 22, one app, one library per feature |
| NUnit against SQL Server | xUnit integration tests against the fake (SQLite in-memory) database (ADR 0001) |
| Playwright against the real API | Playwright in `e2e/` against the fake API (ADR 0004), Chromium only |
| Requirements per subsystem (`L1-LEARN-001`) | The single `docs/specs/L1.md` and `L2.md` (`L1-023`, `L2-NNN`) |
| `check-traceability.mjs` and architecture tests | None; behavior tests only |
| JWT bearer with refresh tokens | Cookie sessions (ADR 0005) |
| Waypoint names and cast | PromiseHub names and the cast in `docs/mocks/README.md` |

### Components

Each Waypoint component in `frontend/projects/components/src/lib/` becomes the PromiseHub component below. "New" components are built in the components library by the first journey prompt that needs them, matching the design system; none is built here.

| Waypoint | PromiseHub |
|---|---|
| alert | `alert` |
| avatar | `avatar` |
| badge | `badge` |
| brand | `brand-mark` |
| button | `button` |
| button-group | New `button-group` (design-system page exists), prompt 57 |
| card | `card` |
| checkbox | `checkbox` |
| chip | `chip` |
| deployment | Not carried over; version and maintenance information use `error-page` |
| description-list | `description-list` |
| dialog | `dialog` (Angular CDK Dialog) |
| divider | Design-system divider foundation; no component |
| empty-state | `empty-state` |
| footer | `guardian-shell` footer on guardian pages; new `site-footer` for the public website, prompt 81 |
| form-field | `text-field` |
| icon | `icon` |
| icon-button | `button` (icon-only variant) |
| link | Design-system link foundation; no component |
| list | `list` |
| marketing-nav | New `site-nav`, prompt 81 |
| message-thread | New `message-thread`, prompt 74 |
| offline | `error-page` (offline) and `sync-chip` |
| pagination | New `pagination` (design-system page exists), prompt 76 |
| progress | `progress-bar` |
| quiz-option | New `quiz-option`, prompt 61 |
| radio | `radio-group` |
| scripture | New `scripture-block`, prompt 57 |
| select | `select` |
| shell | `top-bar`, `bottom-navigation`, `drawer` and `navigation` |
| skeleton | `skeleton` |
| skip-link | `skip-link` |
| stat | `stat` |
| states | `empty-state`, `error-page`, `inline-message` and `skeleton` |
| switch | `switch` |
| table | `table` |
| tabs | `tabs` |
| text-field | `text-field` |
| textarea | `textarea` |
| timeline | `timeline` |
| toast | `toast` |
| video-player | New `video-player`, prompt 57 |

## Consequences

- Prompts 50 to 81 add their endpoints with `RequireModule` and a permission, never relying on the fallback; their tests include the module-off, cross-tenant and participant-role cases.
- Any endpoint added without a permission is closed to participant roles by default. Opening one to every member is an explicit `AllowAnyMember()`.
- Mentor assignments, cohort tracks, RSVP and near-real-time notifications are built by the journeys that need them (54, 70, 75); until then a mentor's list is empty.
- Seed data adds youth accounts for Sofía Rivera (12, needs guardian consent) and Nadia Haddad (18, a new child record in the Haddad household, does not), mentors Daniel Osei and Hana Kim and volunteer Leo Martins at Harbourview, and at Northgate a new child record Lucía Rivera (14) with a youth account and mentor Samuel Boateng. Waypoint youth are 12 to 18, so the existing younger children get no accounts. Learning and Mentoring are on for Harbourview and off for Northgate; Public website is off for both until prompt 81.
