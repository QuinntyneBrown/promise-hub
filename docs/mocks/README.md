# PromiseHub mocks

Static HTML mocks for every page, dialog and notification of PromiseHub phase 1, in every state, built from the PromiseHub PRD (`C:\Users\quinn\Downloads\PromiseHub PRD.md`, 24 Oct 2026) and styled with the [PromiseHub design system](../design-system/index.html). The inherited tokens and component kit are preserved, with PromiseHub components promoted into the shared stylesheet.

## How to open

- Open [`index.html`](index.html) from disk in Chrome: the gallery of every screen and state.
- `?theme=dark` / `?theme=light` forces a theme; `t` toggles it. `?chrome=0` hides the mock bar and the yellow notes so the page looks exactly like the product.
- Each mock's bottom bar links its sibling states and the gallery.
- A button that opens another mock (Check in opens the check-in sheet, say) stays a `<button type="button">` and names its target in `data-href`; `assets/mock.js` follows it.
- Everything is static HTML; nothing loads from the network.

## Regenerate

The HTML is generated from `tools/*.py` so the cast, shell and components stay identical across the mock inventory. Edit the generator, not the HTML.

```sh
python docs/mocks/tools/build.py --clean
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```

The first writes `pages/`, `dialogs/`, `notifications/` and `manifest.json`; the second regenerates `index.html` and the coverage block below and fails on any gap; the third writes PNGs and a contact sheet to `.cache/mocks/` (never commit it).

## Assets

| File | Source |
|---|---|
| `../design-system/tokens/tokens.css` | Shared design tokens, inherited values plus extracted semantic dimensions |
| `../design-system/assets/components.css` | Shared component kit including rosters, Quick Cards, guardian pages, SMS/push previews, bulk actions and import mapping |
| `assets/ui.css` | Empty compatibility file; component styles were promoted to the shared design system |
| `assets/mock.css`, `assets/mock.js` | Mock chrome from the skill, plus `data-href` button navigation |

## Cast and catalog

"Today" is **Thursday 5 November 2026**, a tutoring night, about **4:12 pm** on Jaylen's phone. The organization is **Harbourview Youth Collective** ("Harbourview Youth" in texts), Hamilton, Ontario, Canada; 184 active children, 112 households, 5 staff, Standard plan.

| Person | Role | Avatar | Used as |
|---|---|---|---|
| Jaylen Okafor | Site lead (phone) | sky | Default signed-in user: check-in, Quick Cards, incident report |
| Marisol Delgado | Program director (laptop) | lilac | Programs, slips, messages, reports, incident review, privacy settings |
| Tom Nguyen | Admin / office manager | sun | Families, import, roster review, staff, billing, modules; platform admin on the organizations list |
| Priya Raman | Volunteer coordinator | mint | Sent the cancellation message; role-change dialog; covers two organizations (org switcher) |
| Aisha Bello | Youth worker | rose | The restricted view (`forbidden` states): no medical, no incident log |
| Sam Lee | Invited youth worker | sage | Accept-invitation flow and the staff onboarding wizard |

| Household | Guardian(s) | Children | Notes |
|---|---|---|---|
| Rivera | Carmen Rivera (Spanish, 905-555-0142), Luis Rivera (uncle) | Mateo (9, peanut allergy, EpiPen), Sofía (12, asthma) | The story the mocks follow: enrollment, slip, Quick Card, pickup. Approved pickups: Luis Rivera, Rosa Alvarez |
| Thompson | Dana Thompson | Jordan (11) | Tonight's incident (fall on the stairs) |
| Tran | Linh Tran | Kevin (8), Emily (10) | Unsigned slips; tablet sign-on at the bus |
| Haddad | Nour Haddad (French) | Yusuf (13, medication at noon) | Medication flag |
| Okonkwo | Chidi Okonkwo | Amara (7, lactose intolerant) | Absent tonight; refused-pickup incident in October |
| Petrov | Elena Petrova | Nikolai (10) | Waiting review / waitlisted |
| Adeyemi | Bola Adeyemi (email bounced, no mobile) | Grace (11) | The unreachable guardian |
| Fitzgerald-Vanderbroucke | Mary-Katherine and Bartholomew Fitzgerald-Vanderbroucke | Alexander-Christopher … III (9) and four siblings | `edge` states: longest names, most allergies, most pickups |

- **Programs:** After-School Tutoring (Mon–Thu 4–6 pm, 48/50, 3 waitlisted), Saturday Sports (62/80), One-to-one Mentoring (19/25), Winter Camp 2026 (21–23 Dec, 35/60), Summer Camp 2026 (archived, 112).
- **Events:** Tutoring night (today, no slip needed), Fall field trip: Royal Botanical Gardens (Sat 14 Nov, slip 41/48 signed, due Thu 12 Nov), Saturday Sports (Sat 7 Nov), Swim trip (Sat 28 Nov, slip not written yet), Winter Camp Day 1 (slip 12/35), Saturday Sports 31 Oct (cancelled).
- **Numbers that recur:** 1,212 of 2,000 SMS segments used this month; no-show alert 15 minutes after start; median time to sign 9 hours; 93% of slips signed digitally; attendance 89%.
- **Avatar colours** are stable per person (one of the design system's seven tints); the name, never the colour, identifies someone. Children never have photos.

## Shells

- **Staff app:** the design system's top bar (capsule) with Today, Check-in, Families, Events, Programs, Messages, Reports and a More menu; a bottom tab bar on phones (Today, Check-in, Families, Events, More). Programs, Messages and Reports wait for 1024px and search for 1280px so the capsule never overflows.
- **Guardian pages** (`/g/…`): no account, no app. A thin bar with the organization's name and a language select; one column; one primary action per page; English, Spanish and French (one Spanish example per flow). Reached only through links in texts and emails.
- **Auth pages:** the design system's centred auth card.
- **Onboarding wizards** (`/welcome/…`, `onboard-*`): a stripped bar (brand, the organization once it has a name, one "Finish later" link, no navigation) over the design system's `wizard-layout`: a step list beside the card from 1024px, a compact "Step n of m" bar below. One question per screen, at most three fields, one primary action. Two flows: the organization flow (welcome → organization → modules → first program → children → staff → first slip → done) takes a new admin from a confirmed email to a configured organization with the first slip sent; the staff flow (phone → sessions → ready) takes an invited staff member from their name to tonight's check-in. The `setup` checklist is the hub to resume from; Today's empty state and the accept-invitation success lead into them.

## Modules and tenants

Every feature is a module an organization can switch on or off (`settings-modules`, chosen first in `onboard-modules`): Roster, Permission slips, Roll Call, Quick Cards, Pickup, Messages, Incident log, Reports. What is off disappears from navigation, menus, the phone tab bar and guardian pages (`today/single-module` shows the app as a pure check-in tool). PromiseHub is multi-tenant: each organization is a tenant with its own data, staff, modules and plan; a person who covers several organizations switches with the org switcher in the top bar (`switch-organization`), and platform admins manage tenants from `organizations` (`add-organization`, `suspend-organization`). The rules are in `AGENTS.md` under "Modules are configurable" and "Multi-tenant".

## Spacing

Every section of a staff page (header, filters, numbers, cards, tables, pagination) sits one gutter apart (`--layout-gutter`: 16px on phones, 24px on tablets, 32px on desktops), the same value the grids use between columns; components carry no outer margins. The top bar never shows the organization name or the secondary links inline; Incidents and Settings stay in More at every width so the capsule cannot overflow.

## Assumptions and open questions

Phase 1 only (Enroll, Slips, Roll Call, Quick Card, Pickup, Notify, Incident Log) plus Reports, which the PRD says may ship early because it reads phase-1 data. Phase 2–4 modules (volunteers, donors, operations) are not mocked; the PRD's phase gate says no phase-2 work until phase-1 metrics are met.

Requirement tags are L1 ids from `docs/specs/L1.md` (L2 acceptance criteria reference the screen ids in turn).

- [ ] **E-signature** is a typed name plus timestamp, device and the slip text shown (`slip-sign`, `enroll-review`). The PRD asks whether insurers accept this; the mocks assume yes and note it on the page.
- [ ] **Guardian identity** is a 6-digit code texted or emailed to the contact on file, no password (`enroll`). A link opened on a new device asks for a code again (`guardian-update/expired`).
- [ ] **No-show alert** defaults to 15 minutes after start and is a per-event switch and an organization setting; replies "1" / "2" update the roster (`guardian-sms/warning`).
- [ ] **Offline:** check-in and Quick Cards work from the roster cached for today's sessions; actions queue and sync in order (`check-in/offline`, `offline-queue`). Everything else shows the offline page.
- [ ] **SMS cap:** a monthly cap per organization (2,000 segments on Standard, 200 on Free); at the cap texts pause and email continues (`new-message/over-cap`, `banner/danger`).
- [ ] **Pricing** is mocked as Free (up to 50 active children) and Standard ($89/month, up to 500 children), flat per organization; the PRD leaves flat vs tiered open.
- [ ] **Jurisdiction:** Canada first (PIPEDA, Ontario examples, data residency Canada); the country select in Settings keeps US possible.
- [ ] **Incident access:** reporter plus supervisors (program director); youth workers can report but not read others' reports.
- [ ] **Small counts** in funder exports are masked under 5.
- [ ] **Brand:** the violet accent and rounded type are the inherited design system; PromiseHub brand colours are not decided.
- [ ] **Help / about** pages are not mocked; help is a phone number and email in each footer.

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | partial | single-module | offline | no-results | day-of | complete | long | forbidden | edge | upcoming | cancelled | archived | waitlist | selected | invalid | submitting | success | edit | over-cap | scheduled | reviewed | mapping | free | limit-reached | payment-failed | mfa-off | read | mfa | expired | locked | single | status | declined | none | code | closed | new | waitlisted | already-signed | es | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Today (`today`) | [✅](pages/today/default.html) | [✅](pages/today/loading.html) | [✅](pages/today/empty.html) | [✅](pages/today/error.html) | [✅](pages/today/partial.html) | [✅](pages/today/single-module.html) | [✅](pages/today/offline.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-007`, `L1-006`, `L1-010` |
| Check-in (`check-in`) | [✅](pages/check-in/default.html) | [✅](pages/check-in/loading.html) | [✅](pages/check-in/empty.html) | [✅](pages/check-in/error.html) |  |  | [✅](pages/check-in/offline.html) | [✅](pages/check-in/no-results.html) | [✅](pages/check-in/day-of.html) | [✅](pages/check-in/complete.html) | [✅](pages/check-in/long.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-007`, `L1-009`, `L1-014` |
| Quick Card (`quick-card`) | [✅](pages/quick-card/default.html) | [✅](pages/quick-card/loading.html) | [✅](pages/quick-card/empty.html) | [✅](pages/quick-card/error.html) |  |  | [✅](pages/quick-card/offline.html) |  |  |  |  | [✅](pages/quick-card/forbidden.html) | [✅](pages/quick-card/edge.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-008`, `L1-015`, `L1-014` |
| Events (`events`) | [✅](pages/events/default.html) | [✅](pages/events/loading.html) | [✅](pages/events/empty.html) | [✅](pages/events/error.html) |  |  |  | [✅](pages/events/no-results.html) |  |  | [✅](pages/events/long.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-006`, `L1-007` |
| Event (`event`) | [✅](pages/event/default.html) | [✅](pages/event/loading.html) | [✅](pages/event/empty.html) | [✅](pages/event/error.html) | [✅](pages/event/partial.html) |  |  |  |  |  |  |  |  | [✅](pages/event/upcoming.html) | [✅](pages/event/cancelled.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-006`, `L1-007`, `L1-010` |
| Families (`families`) | [✅](pages/families/default.html) | [✅](pages/families/loading.html) | [✅](pages/families/empty.html) | [✅](pages/families/error.html) |  |  |  | [✅](pages/families/no-results.html) |  |  | [✅](pages/families/long.html) |  | [✅](pages/families/edge.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-015` |
| Household (`household`) | [✅](pages/household/default.html) | [✅](pages/household/loading.html) | [✅](pages/household/empty.html) | [✅](pages/household/error.html) |  |  |  |  |  |  |  | [✅](pages/household/forbidden.html) | [✅](pages/household/edge.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-015`, `L1-005` |
| Child (`child`) | [✅](pages/child/default.html) | [✅](pages/child/loading.html) | [✅](pages/child/empty.html) | [✅](pages/child/error.html) |  |  |  |  |  |  |  | [✅](pages/child/forbidden.html) | [✅](pages/child/edge.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-008`, `L1-009`, `L1-015`, `L1-005` |
| Programs (`programs`) | [✅](pages/programs/default.html) | [✅](pages/programs/loading.html) | [✅](pages/programs/empty.html) | [✅](pages/programs/error.html) |  |  |  | [✅](pages/programs/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005` |
| Program (`program`) | [✅](pages/program/default.html) | [✅](pages/program/loading.html) | [✅](pages/program/empty.html) | [✅](pages/program/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/program/archived.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-012` |
| Program roster (`roster`) | [✅](pages/roster/default.html) | [✅](pages/roster/loading.html) | [✅](pages/roster/empty.html) | [✅](pages/roster/error.html) |  |  |  | [✅](pages/roster/no-results.html) |  |  | [✅](pages/roster/long.html) |  |  |  |  |  | [✅](pages/roster/waitlist.html) | [✅](pages/roster/selected.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005` |
| Program form (`program-form`) | [✅](pages/program-form/default.html) | [✅](pages/program-form/loading.html) | ➖ | [✅](pages/program-form/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/program-form/invalid.html) | [✅](pages/program-form/submitting.html) | [✅](pages/program-form/success.html) | [✅](pages/program-form/edit.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005` |
| Event form (`event-form`) | [✅](pages/event-form/default.html) | [✅](pages/event-form/loading.html) | ➖ | [✅](pages/event-form/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/event-form/invalid.html) | [✅](pages/event-form/submitting.html) | [✅](pages/event-form/success.html) | [✅](pages/event-form/edit.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-006`, `L1-007` |
| Slips (`slips`) | [✅](pages/slips/default.html) | [✅](pages/slips/loading.html) | [✅](pages/slips/empty.html) | [✅](pages/slips/error.html) |  |  |  | [✅](pages/slips/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-006` |
| Slip editor (`slip-editor`) | [✅](pages/slip-editor/default.html) | [✅](pages/slip-editor/loading.html) | ➖ | [✅](pages/slip-editor/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/slip-editor/invalid.html) | [✅](pages/slip-editor/submitting.html) | [✅](pages/slip-editor/success.html) | [✅](pages/slip-editor/edit.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-006`, `L1-010`, `L1-020` |
| Messages (`messages`) | [✅](pages/messages/default.html) | [✅](pages/messages/loading.html) | [✅](pages/messages/empty.html) | [✅](pages/messages/error.html) |  |  |  | [✅](pages/messages/no-results.html) |  |  | [✅](pages/messages/long.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-010`, `L1-020` |
| New message (`new-message`) | [✅](pages/new-message/default.html) | ➖ | ➖ | [✅](pages/new-message/error.html) |  |  |  | [✅](pages/new-message/no-results.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/new-message/invalid.html) | [✅](pages/new-message/submitting.html) | [✅](pages/new-message/success.html) |  | [✅](pages/new-message/over-cap.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-010`, `L1-020`, `L1-019` |
| Message (`message`) | [✅](pages/message/default.html) | [✅](pages/message/loading.html) | ➖ | [✅](pages/message/error.html) | [✅](pages/message/partial.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/message/scheduled.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-010` |
| Incidents (`incidents`) | [✅](pages/incidents/default.html) | [✅](pages/incidents/loading.html) | [✅](pages/incidents/empty.html) | [✅](pages/incidents/error.html) |  |  |  | [✅](pages/incidents/no-results.html) |  |  |  | [✅](pages/incidents/forbidden.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-011`, `L1-015` |
| Report incident (`new-incident`) | [✅](pages/new-incident/default.html) | ➖ | ➖ | [✅](pages/new-incident/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/new-incident/invalid.html) | [✅](pages/new-incident/submitting.html) | [✅](pages/new-incident/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-011` |
| Incident (`incident`) | [✅](pages/incident/default.html) | [✅](pages/incident/loading.html) | ➖ | [✅](pages/incident/error.html) |  |  |  |  |  |  |  | [✅](pages/incident/forbidden.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/incident/reviewed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-011`, `L1-015`, `L1-005` |
| Reports (`reports`) | [✅](pages/reports/default.html) | [✅](pages/reports/loading.html) | [✅](pages/reports/empty.html) | [✅](pages/reports/error.html) |  |  |  | [✅](pages/reports/no-results.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/reports/submitting.html) | [✅](pages/reports/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-012`, `L1-015` |
| Attendance (`attendance`) | [✅](pages/attendance/default.html) | [✅](pages/attendance/loading.html) | [✅](pages/attendance/empty.html) | [✅](pages/attendance/error.html) |  |  |  | [✅](pages/attendance/no-results.html) |  |  | [✅](pages/attendance/long.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-007`, `L1-012` |
| Import roster (`import-roster`) | [✅](pages/import-roster/default.html) | [✅](pages/import-roster/loading.html) | ➖ | [✅](pages/import-roster/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/import-roster/invalid.html) | [✅](pages/import-roster/submitting.html) | [✅](pages/import-roster/success.html) |  |  |  |  | [✅](pages/import-roster/mapping.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-004`, `L1-005` |
| Settings (`settings`) | [✅](pages/settings/default.html) | [✅](pages/settings/loading.html) | ➖ | [✅](pages/settings/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/settings/invalid.html) | [✅](pages/settings/submitting.html) | [✅](pages/settings/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-015`, `L1-004` |
| Staff and roles (`staff`) | [✅](pages/staff/default.html) | [✅](pages/staff/loading.html) | [✅](pages/staff/empty.html) | [✅](pages/staff/error.html) |  |  |  |  |  |  |  | [✅](pages/staff/forbidden.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-015`, `L1-016` |
| Notification settings (`settings-notifications`) | [✅](pages/settings-notifications/default.html) | [✅](pages/settings-notifications/loading.html) | ➖ | [✅](pages/settings-notifications/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/settings-notifications/invalid.html) | [✅](pages/settings-notifications/submitting.html) | [✅](pages/settings-notifications/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-010`, `L1-007`, `L1-020` |
| Privacy and data (`settings-privacy`) | [✅](pages/settings-privacy/default.html) | [✅](pages/settings-privacy/loading.html) | ➖ | [✅](pages/settings-privacy/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/settings-privacy/submitting.html) | [✅](pages/settings-privacy/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-015`, `L1-015`, `L1-016`, `L1-005` |
| Audit log (`audit-log`) | [✅](pages/audit-log/default.html) | [✅](pages/audit-log/loading.html) | [✅](pages/audit-log/empty.html) | [✅](pages/audit-log/error.html) |  |  |  | [✅](pages/audit-log/no-results.html) |  |  | [✅](pages/audit-log/long.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-015`, `L1-016`, `L1-005` |
| Billing (`billing`) | [✅](pages/billing/default.html) | [✅](pages/billing/loading.html) | ➖ | [✅](pages/billing/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/billing/free.html) | [✅](pages/billing/limit-reached.html) | [✅](pages/billing/payment-failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-020` |
| Your account (`account`) | [✅](pages/account/default.html) | [✅](pages/account/loading.html) | ➖ | [✅](pages/account/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/account/invalid.html) | [✅](pages/account/submitting.html) | [✅](pages/account/success.html) |  |  |  |  |  |  |  |  | [✅](pages/account/mfa-off.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-016` |
| Notifications (`notifications`) | [✅](pages/notifications/default.html) | [✅](pages/notifications/loading.html) | [✅](pages/notifications/empty.html) | [✅](pages/notifications/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/notifications/read.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-010`, `L1-006`, `L1-011` |
| Search (`search`) | [✅](pages/search/default.html) | [✅](pages/search/loading.html) | [✅](pages/search/empty.html) | [✅](pages/search/error.html) |  |  |  | [✅](pages/search/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005` |
| Not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Forbidden (`forbidden`) | [✅](pages/forbidden/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-015` |
| Server error (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-014`, `L1-007` |
| Maintenance (`maintenance`) | [✅](pages/maintenance/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/invalid.html) | [✅](pages/sign-in/submitting.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/mfa.html) | [✅](pages/sign-in/expired.html) | [✅](pages/sign-in/locked.html) |  |  |  |  |  |  |  |  |  |  | `L1-016` |
| Forgot password (`forgot-password`) | [✅](pages/forgot-password/default.html) | ➖ | ➖ | [✅](pages/forgot-password/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/forgot-password/invalid.html) | [✅](pages/forgot-password/submitting.html) | [✅](pages/forgot-password/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-016` |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | ➖ | ➖ | [✅](pages/reset-password/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/reset-password/invalid.html) | [✅](pages/reset-password/submitting.html) | [✅](pages/reset-password/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-016` |
| Accept invitation (`accept-invite`) | [✅](pages/accept-invite/default.html) | ➖ | ➖ | [✅](pages/accept-invite/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/accept-invite/invalid.html) | [✅](pages/accept-invite/submitting.html) | [✅](pages/accept-invite/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-016`, `L1-004` |
| Set up (`setup`) | [✅](pages/setup/default.html) | ➖ | ➖ | [✅](pages/setup/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/setup/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-004` |
| Welcome (`onboard-welcome`) | [✅](pages/onboard-welcome/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004` |
| Set up: organization (`onboard-org`) | [✅](pages/onboard-org/default.html) | ➖ | ➖ | [✅](pages/onboard-org/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-org/invalid.html) | [✅](pages/onboard-org/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-010` |
| Set up: modules (`onboard-modules`) | [✅](pages/onboard-modules/default.html) | ➖ | ➖ | [✅](pages/onboard-modules/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-modules/invalid.html) | [✅](pages/onboard-modules/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-002` |
| Set up: first program (`onboard-program`) | [✅](pages/onboard-program/default.html) | ➖ | ➖ | [✅](pages/onboard-program/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-program/invalid.html) | [✅](pages/onboard-program/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-007` |
| Set up: children (`onboard-roster`) | [✅](pages/onboard-roster/default.html) | ➖ | ➖ | [✅](pages/onboard-roster/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-roster/invalid.html) | [✅](pages/onboard-roster/submitting.html) | [✅](pages/onboard-roster/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-005` |
| Set up: staff (`onboard-staff`) | [✅](pages/onboard-staff/default.html) | ➖ | ➖ | [✅](pages/onboard-staff/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-staff/invalid.html) | [✅](pages/onboard-staff/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-016` |
| Set up: first slip (`onboard-first-event`) | [✅](pages/onboard-first-event/default.html) | ➖ | ➖ | [✅](pages/onboard-first-event/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-first-event/invalid.html) | [✅](pages/onboard-first-event/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-006` |
| Set up: done (`onboard-done`) | [✅](pages/onboard-done/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004` |
| Get ready: your phone (`onboard-staff-phone`) | [✅](pages/onboard-staff-phone/default.html) | ➖ | ➖ | [✅](pages/onboard-staff-phone/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-staff-phone/invalid.html) | [✅](pages/onboard-staff-phone/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-010`, `L1-014` |
| Get ready: your sessions (`onboard-staff-sessions`) | [✅](pages/onboard-staff-sessions/default.html) | ➖ | ➖ | [✅](pages/onboard-staff-sessions/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/onboard-staff-sessions/invalid.html) | [✅](pages/onboard-staff-sessions/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-007` |
| Get ready: done (`onboard-staff-ready`) | [✅](pages/onboard-staff-ready/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-004`, `L1-007`, `L1-014` |
| Modules (`settings-modules`) | [✅](pages/settings-modules/default.html) | [✅](pages/settings-modules/loading.html) | ➖ | [✅](pages/settings-modules/error.html) |  |  |  |  |  |  |  | [✅](pages/settings-modules/forbidden.html) |  |  |  |  |  |  | [✅](pages/settings-modules/invalid.html) | [✅](pages/settings-modules/submitting.html) | [✅](pages/settings-modules/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/settings-modules/single.html) |  |  |  |  |  |  |  |  |  | `L1-002`, `L1-015` |
| Organizations (`organizations`) | [✅](pages/organizations/default.html) | [✅](pages/organizations/loading.html) | [✅](pages/organizations/empty.html) | [✅](pages/organizations/error.html) |  |  |  | [✅](pages/organizations/no-results.html) |  |  |  | [✅](pages/organizations/forbidden.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-001`, `L1-016`, `L1-020` |
| Guardian home (`guardian-home`) | [✅](pages/guardian-home/default.html) | ➖ | ➖ | [✅](pages/guardian-home/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/guardian-home/status.html) | [✅](pages/guardian-home/declined.html) | [✅](pages/guardian-home/none.html) |  |  |  |  |  |  | `L1-005`, `L1-015` |
| Enroll: identify (`enroll`) | [✅](pages/enroll/default.html) | ➖ | ➖ | [✅](pages/enroll/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll/invalid.html) | [✅](pages/enroll/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll/expired.html) |  |  |  |  |  | [✅](pages/enroll/code.html) | [✅](pages/enroll/closed.html) |  |  |  |  | `L1-005`, `L1-019`, `L1-015` |
| Enroll: household (`enroll-household`) | [✅](pages/enroll-household/default.html) | [✅](pages/enroll-household/loading.html) | ➖ | [✅](pages/enroll-household/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll-household/invalid.html) | [✅](pages/enroll-household/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll-household/new.html) |  |  |  | `L1-005`, `L1-019` |
| Enroll: children (`enroll-child`) | [✅](pages/enroll-child/default.html) | [✅](pages/enroll-child/loading.html) | [✅](pages/enroll-child/empty.html) | [✅](pages/enroll-child/error.html) |  |  |  |  |  |  |  |  | [✅](pages/enroll-child/edge.html) |  |  |  |  |  | [✅](pages/enroll-child/invalid.html) | [✅](pages/enroll-child/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-009`, `L1-015`, `L1-019` |
| Enroll: review (`enroll-review`) | [✅](pages/enroll-review/default.html) | ➖ | ➖ | [✅](pages/enroll-review/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll-review/invalid.html) | [✅](pages/enroll-review/submitting.html) | [✅](pages/enroll-review/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/enroll-review/waitlisted.html) |  |  | `L1-005`, `L1-006`, `L1-015` |
| Permission slip (`slip-sign`) | [✅](pages/slip-sign/default.html) | [✅](pages/slip-sign/loading.html) | ➖ | [✅](pages/slip-sign/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/slip-sign/invalid.html) | [✅](pages/slip-sign/submitting.html) | [✅](pages/slip-sign/success.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/slip-sign/expired.html) |  |  |  |  |  |  |  |  |  | [✅](pages/slip-sign/already-signed.html) | [✅](pages/slip-sign/es.html) | `L1-006`, `L1-019`, `L1-015` |
| Family page (`guardian-update`) | [✅](pages/guardian-update/default.html) | [✅](pages/guardian-update/loading.html) | [✅](pages/guardian-update/empty.html) | [✅](pages/guardian-update/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/guardian-update/expired.html) |  |  |  |  |  |  |  |  |  |  |  | `L1-005`, `L1-009`, `L1-010`, `L1-015` |
| Survey (`survey`) | [✅](pages/survey/default.html) | ➖ | ➖ | [✅](pages/survey/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/survey/invalid.html) | [✅](pages/survey/submitting.html) | [✅](pages/survey/success.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/survey/expired.html) |  |  |  |  |  |  |  |  |  |  |  | `L1-010` |

### Dialogs

| Screen | default | busy | invalid | failed | success | confirm | decline | director | Requirements |
|---|---|---|---|---|---|---|---|---|---|
| Switch organization (`switch-organization`) | [✅](dialogs/switch-organization/default.html) | ➖ | ➖ |  |  |  |  |  | `L1-001`, `L1-016` |
| Add organization (`add-organization`) | [✅](dialogs/add-organization/default.html) | [✅](dialogs/add-organization/busy.html) | [✅](dialogs/add-organization/invalid.html) | [✅](dialogs/add-organization/failed.html) | [✅](dialogs/add-organization/success.html) |  |  |  | `L1-001`, `L1-020` |
| Suspend organization (`suspend-organization`) | [✅](dialogs/suspend-organization/default.html) | [✅](dialogs/suspend-organization/busy.html) | ➖ | [✅](dialogs/suspend-organization/failed.html) |  |  |  |  | `L1-001`, `L1-016` |
| Check in Kevin Tran (`check-in-sheet`) | [✅](dialogs/check-in-sheet/default.html) | [✅](dialogs/check-in-sheet/busy.html) | ➖ | [✅](dialogs/check-in-sheet/failed.html) |  |  |  |  | `L1-007`, `L1-008` |
| Sign out Mateo Rivera (`confirm-pickup`) | [✅](dialogs/confirm-pickup/default.html) | [✅](dialogs/confirm-pickup/busy.html) | [✅](dialogs/confirm-pickup/invalid.html) | [✅](dialogs/confirm-pickup/failed.html) |  | [✅](dialogs/confirm-pickup/confirm.html) |  |  | `L1-009`, `L1-007` |
| Sign on this tablet (`sign-on-tablet`) | [✅](dialogs/sign-on-tablet/default.html) | [✅](dialogs/sign-on-tablet/busy.html) | [✅](dialogs/sign-on-tablet/invalid.html) | [✅](dialogs/sign-on-tablet/failed.html) | [✅](dialogs/sign-on-tablet/success.html) |  |  |  | `L1-006` |
| End Tutoring night? (`end-session`) | [✅](dialogs/end-session/default.html) | [✅](dialogs/end-session/busy.html) | ➖ | [✅](dialogs/end-session/failed.html) |  |  |  |  | `L1-007`, `L1-012` |
| Session notes (`session-notes`) | [✅](dialogs/session-notes/default.html) | [✅](dialogs/session-notes/busy.html) | ➖ | [✅](dialogs/session-notes/failed.html) |  |  |  |  | `L1-007` |
| Add a walk-in to tonight (`add-walk-in`) | [✅](dialogs/add-walk-in/default.html) | [✅](dialogs/add-walk-in/busy.html) | [✅](dialogs/add-walk-in/invalid.html) | [✅](dialogs/add-walk-in/failed.html) |  |  |  |  | `L1-007`, `L1-005` |
| Open enrollment for After‑School Tutoring (`open-enrollment`) | [✅](dialogs/open-enrollment/default.html) | [✅](dialogs/open-enrollment/busy.html) | [✅](dialogs/open-enrollment/invalid.html) | [✅](dialogs/open-enrollment/failed.html) | [✅](dialogs/open-enrollment/success.html) |  |  |  | `L1-005`, `L1-004` |
| Close enrollment? (`close-enrollment`) | [✅](dialogs/close-enrollment/default.html) | [✅](dialogs/close-enrollment/busy.html) | ➖ | [✅](dialogs/close-enrollment/failed.html) |  |  |  |  | `L1-005` |
| Accept Nikolai Petrov? (`review-enrollment`) | [✅](dialogs/review-enrollment/default.html) | [✅](dialogs/review-enrollment/busy.html) | ➖ | [✅](dialogs/review-enrollment/failed.html) |  |  | [✅](dialogs/review-enrollment/decline.html) |  | `L1-005`, `L1-010` |
| Move Sofía Rivera in? (`move-in`) | [✅](dialogs/move-in/default.html) | [✅](dialogs/move-in/busy.html) | ➖ | [✅](dialogs/move-in/failed.html) |  |  |  |  | `L1-005`, `L1-010` |
| Accept 2 enrollments? (`bulk-review`) | [✅](dialogs/bulk-review/default.html) | [✅](dialogs/bulk-review/busy.html) | ➖ | [✅](dialogs/bulk-review/failed.html) |  |  |  |  | `L1-005`, `L1-010` |
| Add a child to After‑School Tutoring (`enroll-in-program`) | [✅](dialogs/enroll-in-program/default.html) | [✅](dialogs/enroll-in-program/busy.html) | [✅](dialogs/enroll-in-program/invalid.html) | [✅](dialogs/enroll-in-program/failed.html) |  |  |  |  | `L1-005` |
| Remove Lily Chen from Summer Camp 2026? (`remove-from-roster`) | [✅](dialogs/remove-from-roster/default.html) | [✅](dialogs/remove-from-roster/busy.html) | ➖ | [✅](dialogs/remove-from-roster/failed.html) |  |  |  |  | `L1-005`, `L1-005` |
| Add a family (`add-family`) | [✅](dialogs/add-family/default.html) | [✅](dialogs/add-family/busy.html) | [✅](dialogs/add-family/invalid.html) | [✅](dialogs/add-family/failed.html) |  |  |  |  | `L1-005` |
| Add a child to the Rivera household (`add-child`) | [✅](dialogs/add-child/default.html) | [✅](dialogs/add-child/busy.html) | [✅](dialogs/add-child/invalid.html) | [✅](dialogs/add-child/failed.html) |  |  |  |  | `L1-005`, `L1-008` |
| Add a guardian to the Rivera household (`add-guardian`) | [✅](dialogs/add-guardian/default.html) | [✅](dialogs/add-guardian/busy.html) | [✅](dialogs/add-guardian/invalid.html) | [✅](dialogs/add-guardian/failed.html) |  |  |  |  | `L1-005`, `L1-009` |
| Edit Luis Rivera (`edit-guardian`) | [✅](dialogs/edit-guardian/default.html) | [✅](dialogs/edit-guardian/busy.html) | [✅](dialogs/edit-guardian/invalid.html) | [✅](dialogs/edit-guardian/failed.html) |  |  |  |  | `L1-005`, `L1-009` |
| Edit Mateo Rivera (`edit-child`) | [✅](dialogs/edit-child/default.html) | [✅](dialogs/edit-child/busy.html) | [✅](dialogs/edit-child/invalid.html) | [✅](dialogs/edit-child/failed.html) |  |  |  |  | `L1-005`, `L1-005` |
| Edit Mateo’s medical information (`edit-medical`) | [✅](dialogs/edit-medical/default.html) | [✅](dialogs/edit-medical/busy.html) | [✅](dialogs/edit-medical/invalid.html) | [✅](dialogs/edit-medical/failed.html) |  |  |  |  | `L1-008`, `L1-015`, `L1-005` |
| Add an approved adult for Mateo (`add-pickup`) | [✅](dialogs/add-pickup/default.html) | [✅](dialogs/add-pickup/busy.html) | [✅](dialogs/add-pickup/invalid.html) | [✅](dialogs/add-pickup/failed.html) |  |  |  |  | `L1-009` |
| Remove Luis Rivera from Mateo’s approved pickups? (`remove-pickup`) | [✅](dialogs/remove-pickup/default.html) | [✅](dialogs/remove-pickup/busy.html) | ➖ | [✅](dialogs/remove-pickup/failed.html) |  |  |  |  | `L1-009`, `L1-005` |
| More actions for the Rivera household (`household-actions`) | [✅](dialogs/household-actions/default.html) | ➖ | ➖ | ➖ |  |  |  |  | `L1-015`, `L1-005` |
| More actions for Mateo Rivera (`child-actions`) | [✅](dialogs/child-actions/default.html) | ➖ | ➖ | ➖ |  |  |  |  | `L1-005`, `L1-005` |
| More actions for After‑School Tutoring (`program-actions`) | [✅](dialogs/program-actions/default.html) | ➖ | ➖ | ➖ |  |  |  |  | `L1-005`, `L1-012` |
| Archive After‑School Tutoring? (`archive-program`) | [✅](dialogs/archive-program/default.html) | [✅](dialogs/archive-program/busy.html) | [✅](dialogs/archive-program/invalid.html) | [✅](dialogs/archive-program/failed.html) |  | [✅](dialogs/archive-program/confirm.html) |  |  | `L1-005`, `L1-012`, `L1-005` |
| More actions for the field trip (`event-actions`) | [✅](dialogs/event-actions/default.html) | ➖ | ➖ | ➖ |  |  |  |  | `L1-006`, `L1-010` |
| Cancel the field trip? (`cancel-event`) | [✅](dialogs/cancel-event/default.html) | [✅](dialogs/cancel-event/busy.html) | [✅](dialogs/cancel-event/invalid.html) | [✅](dialogs/cancel-event/failed.html) |  | [✅](dialogs/cancel-event/confirm.html) |  |  | `L1-006`, `L1-010` |
| Text the 7 unsigned (`send-reminder`) | [✅](dialogs/send-reminder/default.html) | [✅](dialogs/send-reminder/busy.html) | [✅](dialogs/send-reminder/invalid.html) | [✅](dialogs/send-reminder/failed.html) |  |  |  |  | `L1-006`, `L1-010`, `L1-020` |
| Send “Winter Camp: pack list” now? (`send-now`) | [✅](dialogs/send-now/default.html) | [✅](dialogs/send-now/busy.html) | ➖ | [✅](dialogs/send-now/failed.html) |  |  |  |  | `L1-010` |
| Cancel the scheduled send? (`cancel-send`) | [✅](dialogs/cancel-send/default.html) | [✅](dialogs/cancel-send/busy.html) | ➖ | [✅](dialogs/cancel-send/failed.html) |  |  |  |  | `L1-010` |
| Mateo can’t come? (`decline-slip`) | [✅](dialogs/decline-slip/default.html) | [✅](dialogs/decline-slip/busy.html) | ➖ | [✅](dialogs/decline-slip/failed.html) |  |  |  |  | `L1-006`, `L1-010` |
| Ask for a copy of your family’s data (`guardian-data-request`) | [✅](dialogs/guardian-data-request/default.html) | [✅](dialogs/guardian-data-request/busy.html) | [✅](dialogs/guardian-data-request/invalid.html) | [✅](dialogs/guardian-data-request/failed.html) | [✅](dialogs/guardian-data-request/success.html) |  |  |  | `L1-015`, `L1-015` |
| Mark as reviewed (`review-incident`) | [✅](dialogs/review-incident/default.html) | [✅](dialogs/review-incident/busy.html) | [✅](dialogs/review-incident/invalid.html) | [✅](dialogs/review-incident/failed.html) |  |  |  |  | `L1-011` |
| Add a follow-up (`add-follow-up`) | [✅](dialogs/add-follow-up/default.html) | [✅](dialogs/add-follow-up/busy.html) | [✅](dialogs/add-follow-up/invalid.html) | [✅](dialogs/add-follow-up/failed.html) |  |  |  |  | `L1-011` |
| Reopen this report? (`reopen-incident`) | [✅](dialogs/reopen-incident/default.html) | [✅](dialogs/reopen-incident/busy.html) | ➖ | [✅](dialogs/reopen-incident/failed.html) |  |  |  |  | `L1-011` |
| Export (`export-data`) | [✅](dialogs/export-data/default.html) | [✅](dialogs/export-data/busy.html) | ➖ | [✅](dialogs/export-data/failed.html) | [✅](dialogs/export-data/success.html) |  |  |  | `L1-012`, `L1-015` |
| Invite staff (`invite-staff`) | [✅](dialogs/invite-staff/default.html) | [✅](dialogs/invite-staff/busy.html) | [✅](dialogs/invite-staff/invalid.html) | [✅](dialogs/invite-staff/failed.html) | [✅](dialogs/invite-staff/success.html) |  |  |  | `L1-016`, `L1-015` |
| Change Priya Raman’s role (`change-role`) | [✅](dialogs/change-role/default.html) | [✅](dialogs/change-role/busy.html) | ➖ | [✅](dialogs/change-role/failed.html) |  |  |  |  | `L1-016`, `L1-015` |
| Remove Aisha Bello? (`remove-staff`) | [✅](dialogs/remove-staff/default.html) | [✅](dialogs/remove-staff/busy.html) | [✅](dialogs/remove-staff/invalid.html) | [✅](dialogs/remove-staff/failed.html) |  | [✅](dialogs/remove-staff/confirm.html) |  |  | `L1-016`, `L1-015` |
| Delete the Rivera household? (`delete-household`) | [✅](dialogs/delete-household/default.html) | [✅](dialogs/delete-household/busy.html) | [✅](dialogs/delete-household/invalid.html) | [✅](dialogs/delete-household/failed.html) |  | [✅](dialogs/delete-household/confirm.html) |  |  | `L1-015`, `L1-015`, `L1-005` |
| Move to Standard (`change-plan`) | [✅](dialogs/change-plan/default.html) | [✅](dialogs/change-plan/busy.html) | [✅](dialogs/change-plan/invalid.html) | [✅](dialogs/change-plan/failed.html) | [✅](dialogs/change-plan/success.html) |  |  |  | `L1-020` |
| Recovery codes (`recovery-codes`) | [✅](dialogs/recovery-codes/default.html) | ➖ | ➖ | ➖ |  |  |  |  | `L1-016` |
| Sign out everywhere? (`sign-out-all`) | [✅](dialogs/sign-out-all/default.html) | [✅](dialogs/sign-out-all/busy.html) | ➖ | [✅](dialogs/sign-out-all/failed.html) |  |  |  |  | `L1-016` |
| Main menu (`main-menu`) | [✅](dialogs/main-menu/default.html) | ➖ | ➖ |  |  |  |  | [✅](dialogs/main-menu/director.html) | `L1-014` |
| Account menu (`account-menu`) | [✅](dialogs/account-menu/default.html) | ➖ | ➖ |  |  |  |  |  | `L1-016` |
| Session expired (`session-expired`) | [✅](dialogs/session-expired/default.html) | [✅](dialogs/session-expired/busy.html) | [✅](dialogs/session-expired/invalid.html) | [✅](dialogs/session-expired/failed.html) |  |  |  |  | `L1-016` |
| Waiting to sync (`offline-queue`) | [✅](dialogs/offline-queue/default.html) | [✅](dialogs/offline-queue/busy.html) | ➖ | [✅](dialogs/offline-queue/failed.html) | [✅](dialogs/offline-queue/success.html) |  |  |  | `L1-014`, `L1-007` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | persistent | verify | unread | read | empty | es | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toast (`toast`) | [✅](notifications/toast/info.html) | [✅](notifications/toast/success.html) | [✅](notifications/toast/warning.html) | [✅](notifications/toast/danger.html) | [✅](notifications/toast/with-action.html) | [✅](notifications/toast/stacked.html) |  |  |  |  |  |  | `L1-007`, `L1-006`, `L1-010` |
| Banner (`banner`) | [✅](notifications/banner/info.html) | [✅](notifications/banner/success.html) | [✅](notifications/banner/warning.html) | [✅](notifications/banner/danger.html) |  |  | [✅](notifications/banner/persistent.html) | [✅](notifications/banner/verify.html) |  |  |  |  | `L1-014`, `L1-020`, `L1-005` |
| Bell panel (`bell`) | ➖ | ➖ | ➖ | ➖ |  |  |  |  | [✅](notifications/bell/unread.html) | [✅](notifications/bell/read.html) | [✅](notifications/bell/empty.html) |  | `L1-010`, `L1-006`, `L1-011` |
| Inline alert (`inline-alert`) | [✅](notifications/inline-alert/info.html) | [✅](notifications/inline-alert/success.html) | [✅](notifications/inline-alert/warning.html) | [✅](notifications/inline-alert/danger.html) | [✅](notifications/inline-alert/with-action.html) |  |  |  |  |  |  |  | `L1-006`, `L1-007`, `L1-008` |
| Guardian text (`guardian-sms`) | [✅](notifications/guardian-sms/info.html) | [✅](notifications/guardian-sms/success.html) | [✅](notifications/guardian-sms/warning.html) | [✅](notifications/guardian-sms/danger.html) |  | [✅](notifications/guardian-sms/stacked.html) |  |  |  |  |  | [✅](notifications/guardian-sms/es.html) | `L1-010`, `L1-006`, `L1-007`, `L1-019` |

<!-- coverage:end -->
