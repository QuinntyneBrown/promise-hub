# Screen composition

Each screen from `docs/mocks/` and the components-library components it is composed of. Anything not listed under a library component is feature composition only. Updated as screens are built.

## Shell

| Part | Mock | Library components | Built locally |
|---|---|---|---|
| Skip link | every page | `ph-skip-link` | — |
| Top bar | every staff page; participant variants `today/youth`, `today/mentor`, `today/volunteer`, `today/youth-learning-off` | `ph-top-bar` (`ph-brand-mark`, `ph-avatar`, `ph-icon`); search hidden for participant roles | Navigation list filtered by module and role (`shell/navigation.ts`, ADR 0043) |
| Phone tab bar | every staff page and the participant variants | `ph-bottom-navigation` | — |
| Account menu | `account-menu` | `ph-top-bar` (CDK Menu) | Sign out calls `AUTH_API` |
| More menu | `main-menu` (default, director, youth, mentor, volunteer) | `ph-nav-drawer` via `NavDrawerService` | Drawer data from the session and role |

## Pages

| Screen | Mock | Library components | Built locally |
|---|---|---|---|
| Today | `today` (sessions), `today/empty`, `today/roster-only`, `today/loading` | `ph-page-header`, `ph-card` (titled), `ph-empty-state`, `ph-button`, `ph-stat`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-skeleton` | Greeting, date and session counts |
| Today for a participant | `today` (youth, youth-learning-off, mentor, volunteer) | `ph-page-header`, `ph-card` (titled, flush), `ph-list`, `ph-list-item` (link), `ph-empty-state` | One card item per module that is on and serves the role, from the session |
| Learning | `learning` (default, loading, error) | `ph-page-header`, `ph-card`, `ph-empty-state`, `ph-button` (link), `ph-skeleton` | — |
| Consent required | `consent-required` (default, loading, busy, sent, no-guardian, error); rendered by the Learning page when the server answers `consent-required` | `ph-page-header`, `ph-card` (flush), `ph-empty-state`, `ph-button` (busy), `ph-alert` (error), `ph-skeleton` | — |
| Curriculum | `curriculum` (default, loading, error, forbidden) | `ph-page-header`, `ph-card`, `ph-empty-state`, `ph-button`, `ph-skeleton` | — |
| Mentoring | `mentoring` (default, loading, error) | `ph-page-header`, `ph-card`, `ph-empty-state`, `ph-skeleton` | — |
| Public website | `website` (default, loading, error, not-found) | `ph-guardian-shell` (organization bar), `ph-page-header`, `ph-card`, `ph-empty-state`, `ph-skeleton` | Slug from the route; the not-found state is the app's `SiteNotFoundPage`, shown when the server answers 404 so the library never loads |
| Your account | `account` (default, loading, error) | `ph-page-header`, `ph-card`, `ph-description-list`, `ph-badge`, `ph-button`, `ph-empty-state`, `ph-skeleton`; `recovery-codes` and `sign-out-all` dialogs with `ph-dialog`, `ph-alert`, `ph-button` | Recovery code list |
| Audit log | `audit-log` (default, loading, empty, error, no-results, long, forbidden) | `ph-page-header`, `ph-text-field` (search), `ph-select`, `ph-table`, `ph-button` (paging, export link), `ph-card`, `ph-empty-state`, `ph-skeleton` | — |
| Organizations | `organizations` (default, loading, empty, error, no-results, forbidden); `add-organization` (default, busy, invalid, failed, success); `suspend-organization` (default, busy, failed) | `ph-page-header`, `ph-text-field` (search), `ph-chip` (filters), `ph-table` (with `#rowActions`), `ph-badge`, `ph-button`, `ph-card`, `ph-empty-state`, `ph-skeleton`, toast; dialogs with `ph-dialog`, `ph-text-field`, `ph-select`, `ph-radio-group`, `ph-alert` | — |
| Billing | `billing` (default, loading, error, free, limit-reached, payment-failed, forbidden) | `ph-page-header`, `ph-card`, `ph-description-list`, `ph-progress-bar`, `ph-alert`, `ph-button`, `ph-empty-state`, `ph-skeleton`; change-plan dialog with `ph-dialog`, `ph-radio-group`, `ph-alert`, `ph-inline-message` | — |
| Privacy and data | `settings-privacy` (default, loading, error, submitting, success, consent-saved, forbidden) | `ph-page-header`, `ph-tabs`, `ph-card`, `ph-description-list`, `ph-radio-group`, `ph-button`, `ph-empty-state`, `ph-skeleton`, toast, `ph-inline-message`; Guardian consent card: `ph-card`, `ph-description-list`, `ph-button` opening the consent-policy dialog via `PhDialogs` | — |
| Notification settings | `settings-notifications` (default, loading, error, invalid, submitting, success, forbidden) | `ph-page-header`, `ph-tabs`, `ph-card` (titled), `ph-text-field` (number), `ph-switch`, `ph-error-summary`, `ph-button`, `ph-empty-state`, `ph-skeleton`, toast | — |
| Notifications | `notifications` (default, read, loading, empty, error) | `ph-page-header`, `ph-card`, `ph-list`, `ph-list-item` (muted when read), `ph-button`, `ph-empty-state`, `ph-skeleton` | — |
| Reports | `reports` (default, loading, error, forbidden) | `ph-page-header`, `ph-select`, `ph-stat`, `ph-card`, `ph-table`, `ph-progress-bar`, `ph-button`, `ph-empty-state`, `ph-error-page`, `ph-skeleton`; export dialog with `ph-dialog`, `ph-alert`, `ph-button` (download link), `ph-inline-message` | — |
| Set up | `setup` (default, error, success, forbidden) | `ph-page-header`, `ph-progress-bar`, `ph-card`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-button`, `ph-empty-state`, `ph-skeleton` | — |
| Set up: modules | `onboard-modules` (default, invalid, custom, blocked, submitting, error) | `ph-page-header`, `ph-card`, `ph-radio-group` (presets), `ph-list`, `ph-list-item`, `ph-switch`, `ph-button` | Dependency captions from `MODULE_CATALOG`; not built yet (setup reuses Settings › Modules, ADR 0033) |
| Set up: organization | `onboard-org` (default, invalid) | `ph-page-header`, `ph-card`, `ph-text-field`, `ph-error-summary`, `ph-alert`, `ph-button` | — |
| Search | `search` (default, loading, empty, error, no-results) | `ph-page-header`, `ph-text-field` (search), `ph-list`, `ph-list-item`, `ph-card`, `ph-empty-state`, `ph-button`, `ph-skeleton` | Result group headings |
| Forgot password | `forgot-password` (default, invalid, submitting, success, error) | `ph-skip-link`, `ph-auth-card`, `ph-text-field`, `ph-button`, `ph-alert` | — |
| Reset password | `reset-password` (default, invalid, submitting, success, error) | `ph-skip-link`, `ph-auth-card`, `ph-text-field`, `ph-button`, `ph-alert` | — |
| Not found | `not-found` | `ph-error-page`, `ph-button` | — |
| Forbidden | `forbidden` | `ph-error-page`, `ph-button` | — |
| Server error | `server-error` | `ph-error-page`, `ph-button` | Retry reloads; Go to Today; the reference from the failed request, passed by the shell in navigation state, in the `phEmptyStateDetail` slot with `.text-caption` |
| Offline | `offline` | `ph-error-page`, `ph-button` | Retry reloads |
| Maintenance | `maintenance` | `ph-error-page`, `ph-button` | Retry reloads |

| Sign in | `sign-in` (default, youth, invalid, submitting, error, expired, locked) | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | Return-path handling; the role home after sign-in (`roleHome` from `api`: Learning for youth, Mentoring for mentors, Today otherwise or when that module is off) |
| Signed out | `signed-out` (default) | `ph-skip-link`, `ph-auth-card`, `ph-button` | — |
| Account inactive | `account-deactivated` (default) | `ph-skip-link`, `ph-auth-card`, `ph-button` | — |
| Enter your code | `sign-in/mfa` | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | — |
| Settings › Modules | `settings-modules` (default, single, invalid, blocked, success, error, forbidden) | `ph-page-header`, `ph-tabs`, `ph-chip`, `ph-list`, `ph-list-item`, `ph-switch`, `ph-button`, `ph-card`, `ph-empty-state`, toast via `ToastService` | Presets and dependency captions from `MODULE_CATALOG` |
| Families | `families` (default, empty, no-results, error) | `ph-page-header`, `ph-text-field` (search), `ph-chip`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-flag`, `ph-card`, `ph-empty-state`, `ph-button` | Row meta text |
| Household | `household` (default, forbidden) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-list`, `ph-list-item`, `ph-flag`, `ph-badge`, `ph-button`, `ph-error-page` (outside sessions) | — |
| Child | `child` (default, forbidden, outside-sessions, youth-account, youth-invited, youth-active, consent-needed, consent-sent, consent-given, consent-withdrawn) | `ph-breadcrumb`, `ph-page-header`, `ph-card` (titled), `ph-description-list`, `ph-button`, `ph-error-page` (outside sessions); Youth account card: `ph-card`, `ph-empty-state` (no account), `ph-list`, `ph-list-item`, `ph-badge` (invited, active), toast via `ToastService`; Guardian consent card: `ph-card` (titled, flush), `ph-list`, `ph-list-item`, `ph-badge` (needed, given, withdrawn), `ph-button` (Send consent link), toast via `ToastService` | Medical facts; the Youth account card renders only for admins, while Learning is on, for ages 12 to 18 |
| Programs | `programs` (default, empty, error) | `ph-page-header`, `ph-chip`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | — |
| Program | `program` (default, archived) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-stat`, `ph-card` (titled), `ph-list`, `ph-list-item`, `ph-button` | Season and roster text |
| Program form | `program-form` (default, invalid) | `ph-breadcrumb`, `ph-page-header`, `ph-card`, `ph-text-field`, `ph-radio-group`, `ph-switch`, `ph-alert`, `ph-button` | — |
| Events | `events` (default, no-results, error) | `ph-page-header`, `ph-text-field` (search), `ph-chip`, `ph-select`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | Times via `formatWhen` |
| Event | `event` (default, empty, cancelled) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-badge`, `ph-description-list`, `ph-button` | — |
| Event form | `event-form` (default, invalid) | `ph-breadcrumb`, `ph-page-header`, `ph-card`, `ph-text-field`, `ph-select`, `ph-radio-group`, `ph-switch`, `ph-textarea`, `ph-alert`, `ph-button` | Local time conversion |
| Check-in | `check-in` (default, empty, no-results, error, forbidden, day-of, complete, offline) | `ph-page-header`, `ph-stat`, `ph-text-field` (search), `ph-chip`, `ph-roster`, `ph-roster-item` (queued), `ph-sync-chip`, `ph-flag`, `ph-badge` (no-show: warning, info, neutral), `ph-card`, `ph-empty-state`, `ph-error-page` (forbidden), `ph-button`, toast | Optimistic roster state |
| Quick Card | `quick-card` (default, empty, forbidden, error, offline) | `ph-quick-card` (head with avatar, name and status), `ph-quick-card-section`, `ph-quick-card-alert`, `ph-alert`, `ph-card` (titled), `ph-description-list`, `ph-call-list`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-empty-state`, `ph-button` | Section order, overline heading for the call list |
| Messages | `messages` (default, empty, error, forbidden) | `ph-page-header`, `ph-alert` (danger, cap reached), `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-error-page`, `ph-button` | — |
| New message | `new-message` (default, invalid, error, no-results, over-cap) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-select`, `ph-recipient-count`, `ph-textarea` (help, counter), `ph-radio-group` (disabled options), `ph-sms-preview`, `ph-button` | Debounced preview |
| Message | `message` (default, error) | `ph-breadcrumb`, `ph-page-header`, `ph-stat`, `ph-card` (titled, flush), `ph-table` (badge cells), `ph-sms-preview`, `ph-empty-state`, `ph-button` | Refresh while sending |
| Permission slips | `slips` (default, empty, error) | `ph-page-header`, `ph-progress-bar`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | Slip rows with a progress bar |
| Slip editor | `slip-editor` (default, error, invalid, submitting, success, edit) | `ph-breadcrumb`, `ph-page-header`, `ph-error-summary`, `ph-alert`, `ph-card` (titled), `ph-text-field`, `ph-textarea` (counter), `ph-select`, `ph-switch`, `ph-radio-group`, `ph-progress-bar`, `ph-stat`, `ph-table`, `ph-button` | Draft, scheduled and sent modes |
| Guardian home | `guardian-home` (status, declined, none, no-show, no-show-answered, pickup-request, error), `guardian-update` | `ph-guardian-shell`, `ph-card` (details, health), `ph-select`, `ph-textarea`, `ph-list`, `ph-list-item`, `ph-badge` (success, warning, danger, neutral), `ph-card`, `ph-text-field`, `ph-alert`, `ph-empty-state`, `ph-button` | Code check, language strings |
| Guardian slip | `slip-sign` (default, invalid, submitting, success, error, expired, already-signed, es) | `ph-guardian-shell`, `ph-card` (titled), `ph-description-list`, `ph-radio-group`, `ph-text-field`, `ph-alert`, `ph-empty-state`, `ph-button` | Code check, language strings |
| Guardian consent | `guardian-consent` (default, loading, verify, invalid, submitting, error, signed, given, withdrawn, expired, not-found, es) | `ph-guardian-shell`, `ph-card` (titled), `ph-description-list`, `ph-select`, `ph-checkbox`, `ph-text-field`, `ph-alert`, `ph-empty-state`, `ph-button` | Code check (shared with the slip page), consent strings in English, Spanish and French |
| Sign on this tablet | `sign-on-tablet` | `ph-page-header`, `ph-card` (titled), `ph-text-field`, `ph-radio-group`, `ph-alert`, `ph-empty-state`, `ph-button` | A screen, mounted under check-in |
| Roster review | `roster` (default, empty, error, forbidden, selected, waitlist) | `ph-breadcrumb`, `ph-page-header`, `ph-tabs` (tablist), `ph-list`, `ph-list-item` (with lead), `ph-checkbox`, `ph-bulk-action-bar`, `ph-card`, `ph-empty-state`, `ph-error-page` (forbidden), `ph-button`, toast | Selection set |
| Import a roster | `import-roster` (default, mapping, invalid, success, error) | `ph-breadcrumb`, `ph-page-header`, `ph-stepper`, `ph-file-upload`, `ph-roster-mapping`, `ph-select`, `ph-error-summary`, `ph-alert`, `ph-switch`, `ph-stat`, `ph-card`, `ph-error-page`, `ph-button` | Wizard state |
| Guardian enrollment | `enroll` (default, code, closed), `enroll-household`, `enroll-child`, `enroll-review` (default, success, waitlisted) | `ph-guardian-shell`, `ph-text-field`, `ph-select`, `ph-switch`, `ph-card`, `ph-description-list`, `ph-alert`, `ph-empty-state`, `ph-button` | Steps and language strings |
| Incident log | `incidents` (default, empty, error, forbidden) | `ph-page-header`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-error-page` (forbidden), `ph-card`, `ph-empty-state`, `ph-button` | Log or own reports |
| Report an incident | `new-incident` (default, invalid, submitting, error) | `ph-page-header`, `ph-error-summary`, `ph-card`, `ph-radio-group`, `ph-select`, `ph-text-field` (datetime-local), `ph-textarea`, `ph-alert` (info, danger), `ph-button`, toast | Form state |
| Incident | `incident` (default, reviewed, error, forbidden) | `ph-breadcrumb`, `ph-page-header`, `ph-badge`, `ph-alert` (success, info), `ph-card` (titled), `ph-description-list`, `ph-timeline` (follow-up, trail), `ph-empty-state`, `ph-button` | — |
| Staff and roles | `staff` (default, resent, forbidden) | `ph-page-header`, `ph-list`, `ph-list-item`, `ph-badge` (role; "Expired", "Asked for a new link"), `ph-button` (Resend, Withdraw), `ph-error-page` (forbidden), `ph-card`, `ph-empty-state`, toast | Invitation meta line (role, child, inviter, expiry) |
| Accept an invitation | `accept-invite` (default, youth, mentor, invalid, weak, submitting, error: withdrawn or used) | `ph-skip-link`, `ph-auth-card`, `ph-text-field` (password with Show password), `ph-alert`, `ph-button` | Where to go after joining: `/welcome/phone` for staff roles, `roleHome` for youth, mentors and volunteers |
| Invitation expired | `invite-expired` (default, submitting, success, error) | `ph-skip-link`, `ph-auth-card`, `ph-alert` (error), `ph-button` | Built as the expired state of `AcceptInvitePage` at `/invite/:token`; the "I already have an account" link |
| Onboarding: phone / ready | `onboard-staff-phone`, `onboard-staff-ready` | `ph-auth-card`, `ph-stepper`, `ph-text-field`, `ph-list`, `ph-list-item`, `ph-button` | — |
| Staff coverage | `coverage` (default, error, forbidden) | `ph-page-header`, `ph-list`, `ph-list-item`, `ph-badge` (gap), `ph-button`, `ph-error-page`, `ph-card`, `ph-empty-state`; assign dialog with `ph-dialog`, `ph-checkbox` | — |

| Survey | `survey` (default, invalid, submitting, success, error, expired) | `ph-guardian-shell`, `ph-card`, `ph-radio-group` (1 to 5), `ph-textarea`, `ph-button`, `ph-alert`, `ph-text-field` (code), `ph-empty-state`, `ph-inline-message` | — |

## Dialogs

| Dialog | Mock | Library components |
|---|---|---|
| Guardian data request | `guardian-data-request` | `ph-dialog`, `ph-radio-group`, `ph-text-field`, `ph-alert`, `ph-button` |
| Switch organization | `switch-organization` | `ph-top-bar` (organization switcher menu, `ph-avatar`, `ph-icon`) |
| Add a family | `add-family` (default, invalid, busy) | `ph-dialog` via `PhDialogs`, `ph-text-field`, `ph-select`, `ph-button` |
| Add a child | `add-child` | `ph-dialog`, `ph-text-field`, `ph-textarea`, `ph-button` |
| Add a guardian / Edit a guardian | `add-guardian`, `edit-guardian` | `ph-dialog`, `ph-text-field`, `ph-select`, `ph-switch`, `ph-button` |
| Edit a child | `edit-child` | `ph-dialog`, `ph-text-field`, `ph-button` |
| Edit medical | `edit-medical` | `ph-dialog`, `ph-textarea`, `ph-text-field`, `ph-radio-group`, `ph-button` |
| Household actions | `household-actions` | `ph-dialog`, `ph-action-menu`, `ph-button` |
| Delete household | `delete-household` (default, invalid, busy) | `ph-dialog`, `ph-radio-group`, `ph-text-field`, `ph-button` |
| Add a child to a program | `enroll-in-program` | `ph-dialog`, `ph-text-field`, `ph-list`, `ph-list-item`, `ph-button` |
| Remove from roster | `remove-from-roster` | `ph-dialog`, `ph-radio-group`, `ph-button` |
| Review enrollment | `review-enrollment` (default, invalid, full) | `ph-dialog`, `ph-radio-group`, `ph-textarea`, `ph-alert` (danger), `ph-button` |
| Move in | `move-in` | `ph-dialog`, `ph-textarea`, `ph-alert` (danger), `ph-button` |
| Review incident | `review-incident` (default, invalid, busy, failed) | `ph-dialog`, `ph-textarea`, `ph-radio-group`, `ph-alert`, `ph-button` |
| Add a follow-up | `add-follow-up` | `ph-dialog`, `ph-textarea`, `ph-alert`, `ph-button` |
| Reopen incident | `reopen-incident` | `ph-dialog`, `ph-alert`, `ph-button` |
| End session | `end-session` (default, busy, failed) | `ph-dialog`, `ph-radio-group`, `ph-alert`, `ph-button` |
| Session notes | `session-notes` (default, busy, failed) | `ph-dialog`, `ph-textarea`, `ph-alert`, `ph-button` |
| Add an approved adult | `add-pickup` (default, busy, invalid, failed) | `ph-dialog`, `ph-text-field`, `ph-radio-group`, `ph-alert`, `ph-button` |
| Remove an approved adult | `remove-pickup` (default, busy, failed) | `ph-dialog`, `ph-alert`, `ph-button` (danger) |
| Invite staff | `invite-staff` | `ph-dialog`, `ph-text-field`, `ph-radio-group` (Mentor only while Mentoring is on), `ph-alert`, `ph-button` |
| Invite a youth | `invite-youth` (default, busy, invalid, failed, success) | `ph-dialog`, `ph-text-field`, `ph-alert`, `ph-button` |
| Change role | `change-role` | `ph-dialog`, `ph-radio-group`, `ph-alert`, `ph-button` |
| Remove staff | `remove-staff` | `ph-dialog`, `ph-alert`, `ph-button` (danger) |
| Bulk review | `bulk-review` | `ph-dialog`, `ph-list`, `ph-list-item`, `ph-textarea`, `ph-alert`, `ph-button` |
| Program actions / Event actions | `program-actions`, `event-actions` | `ph-dialog`, `ph-action-menu`, `ph-button` |
| Archive program | `archive-program` | `ph-dialog`, `ph-text-field`, `ph-button` |
| Cancel event | `cancel-event` | `ph-dialog`, `ph-textarea`, `ph-switch`, `ph-button` |
| Check-in sheet | `check-in-sheet` | `ph-dialog`, `ph-radio-group`, `ph-text-field` (time), `ph-button` |
| Sign out | `confirm-pickup` (default, invalid, failed, confirm, ask) | `ph-dialog`, `ph-radio-group` (with error), `ph-alert` (warning, danger), `ph-button` (tel: link), `ph-text-field`, `ph-switch` (with error) |
| Send now | `send-now` | `ph-dialog`, `ph-button` |
| Cancel send | `cancel-send` | `ph-dialog`, `ph-button` (danger) |
| Decline slip | `decline-slip` | `ph-dialog`, `ph-textarea`, `ph-button` (danger) |
| Withdraw consent | `withdraw-consent` (default, busy, failed) | `ph-dialog` via `PhDialogs`, `ph-alert`, `ph-button` (danger) |
| Edit consent policy | `consent-policy` (default, busy, invalid, failed) | `ph-dialog` via `PhDialogs`, `ph-select`, `ph-textarea`, `ph-alert`, `ph-button` |
| Send reminder | `send-reminder` | `ph-dialog`, `ph-list`, `ph-list-item`, `ph-badge` (danger), `ph-textarea`, `ph-alert`, `ph-button` |
| Open enrollment | `open-enrollment` (default, success) | `ph-dialog`, `ph-alert`, `ph-button` |
| Close enrollment | `close-enrollment` | `ph-dialog`, `ph-alert`, `ph-button` (danger) |
| Add a walk-in | `add-walk-in` (default, invalid) | `ph-dialog`, `ph-text-field`, `ph-textarea`, `ph-button` |

The toast region (`ph-toast-region`) sits once in the app root.

Deferred: `toast` and `banner` (first used by later slices); the account menu's theme switch.
