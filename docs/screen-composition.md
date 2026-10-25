# Screen composition

Each screen from `docs/mocks/` and the components-library components it is composed of. Anything not listed under a library component is feature composition only. Updated as screens are built.

## Shell

| Part | Mock | Library components | Built locally |
|---|---|---|---|
| Skip link | every page | `ph-skip-link` | — |
| Top bar | every staff page | `ph-top-bar` (`ph-brand-mark`, `ph-avatar`, `ph-icon`) | Navigation list (`shell/navigation.ts`) |
| Phone tab bar | every staff page | `ph-bottom-navigation` | — |
| Account menu | `account-menu` | `ph-top-bar` (CDK Menu) | Sign out calls `AUTH_API` |
| More menu | `main-menu` | `ph-nav-drawer` via `NavDrawerService` | Drawer data from the session |

## Pages

| Screen | Mock | Library components | Built locally |
|---|---|---|---|
| Today | `today` (sessions), `today/empty` | `ph-page-header`, `ph-card` (titled), `ph-empty-state`, `ph-button` | Greeting, date and session counts |
| Not found | `not-found` | `ph-error-page`, `ph-button` | — |
| Forbidden | `forbidden` | `ph-error-page`, `ph-button` | — |
| Server error | `server-error` | `ph-error-page`, `ph-button` | Retry reloads |
| Offline | `offline` | `ph-error-page`, `ph-button` | Retry reloads |
| Maintenance | `maintenance` | `ph-error-page`, `ph-button` | Retry reloads |

| Sign in | `sign-in` (default, invalid, submitting, error, expired, locked) | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | Return-path handling |
| Enter your code | `sign-in/mfa` | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | — |
| Settings › Modules | `settings-modules` (default, single, invalid, success, error, forbidden) | `ph-page-header`, `ph-tabs`, `ph-chip`, `ph-list`, `ph-list-item`, `ph-switch`, `ph-button`, `ph-card`, `ph-empty-state`, toast via `ToastService` | Presets and dependency captions from `MODULE_CATALOG` |
| Families | `families` (default, empty, no-results, error) | `ph-page-header`, `ph-text-field` (search), `ph-chip`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-flag`, `ph-card`, `ph-empty-state`, `ph-button` | Row meta text |
| Household | `household` (default, forbidden) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-list`, `ph-list-item`, `ph-flag`, `ph-badge`, `ph-button` | — |
| Child | `child` (default, forbidden) | `ph-breadcrumb`, `ph-page-header`, `ph-card` (titled), `ph-description-list`, `ph-button` | Medical facts |
| Programs | `programs` (default, empty, error) | `ph-page-header`, `ph-chip`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | — |
| Program | `program` (default, archived) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-stat`, `ph-card` (titled), `ph-list`, `ph-list-item`, `ph-button` | Season and roster text |
| Program form | `program-form` (default, invalid) | `ph-breadcrumb`, `ph-page-header`, `ph-card`, `ph-text-field`, `ph-radio-group`, `ph-switch`, `ph-alert`, `ph-button` | — |
| Events | `events` (default, no-results, error) | `ph-page-header`, `ph-text-field` (search), `ph-chip`, `ph-select`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | Times via `formatWhen` |
| Event | `event` (default, empty, cancelled) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-badge`, `ph-description-list`, `ph-button` | — |
| Event form | `event-form` (default, invalid) | `ph-breadcrumb`, `ph-page-header`, `ph-card`, `ph-text-field`, `ph-select`, `ph-radio-group`, `ph-switch`, `ph-textarea`, `ph-alert`, `ph-button` | Local time conversion |
| Check-in | `check-in` (default, empty, no-results, error, forbidden, day-of) | `ph-page-header`, `ph-stat`, `ph-text-field` (search), `ph-chip`, `ph-roster`, `ph-roster-item`, `ph-flag`, `ph-badge` (no-show: warning, info, neutral), `ph-card`, `ph-empty-state`, `ph-error-page` (forbidden), `ph-button`, toast | Optimistic roster state |
| Quick Card | `quick-card` (default, empty, forbidden, error) | `ph-avatar`, `ph-quick-card-alert`, `ph-alert`, `ph-card` (titled), `ph-description-list`, `ph-call-list`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-empty-state`, `ph-button` | Section order, overline heading for the call list |
| Messages | `messages` (default, empty, error, forbidden) | `ph-page-header`, `ph-alert` (danger, cap reached), `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-error-page`, `ph-button` | — |
| New message | `new-message` (default, invalid, error, no-results, over-cap) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-select`, `ph-recipient-count`, `ph-textarea` (help, counter), `ph-radio-group` (disabled options), `ph-sms-preview`, `ph-button` | Debounced preview |
| Message | `message` (default, error) | `ph-breadcrumb`, `ph-page-header`, `ph-stat`, `ph-card` (titled, flush), `ph-table` (badge cells), `ph-sms-preview`, `ph-empty-state`, `ph-button` | Refresh while sending |
| Permission slips | `slips` (default, empty, error) | `ph-page-header`, `ph-progress-bar`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-button` | Slip rows with a progress bar |
| Slip editor | `slip-editor` (default, error, invalid, submitting, success, edit) | `ph-breadcrumb`, `ph-page-header`, `ph-error-summary`, `ph-alert`, `ph-card` (titled), `ph-text-field`, `ph-textarea` (counter), `ph-select`, `ph-switch`, `ph-radio-group`, `ph-progress-bar`, `ph-stat`, `ph-table`, `ph-button` | Draft, scheduled and sent modes |
| Guardian home | `guardian-home` (status, declined, none, error) | `ph-guardian-shell`, `ph-list`, `ph-list-item`, `ph-badge` (success, warning, danger, neutral), `ph-card`, `ph-text-field`, `ph-alert`, `ph-empty-state`, `ph-button` | Code check, language strings |
| Guardian slip | `slip-sign` (default, invalid, submitting, success, error, expired, already-signed, es) | `ph-guardian-shell`, `ph-card` (titled), `ph-description-list`, `ph-radio-group`, `ph-text-field`, `ph-alert`, `ph-empty-state`, `ph-button` | Code check, language strings |
| Sign on this tablet | `sign-on-tablet` | `ph-page-header`, `ph-card` (titled), `ph-text-field`, `ph-radio-group`, `ph-alert`, `ph-empty-state`, `ph-button` | A screen, mounted under check-in |
| Roster review | `roster` (default, empty, error, forbidden, selected, waitlist) | `ph-breadcrumb`, `ph-page-header`, `ph-tabs` (tablist), `ph-list`, `ph-list-item` (with lead), `ph-checkbox`, `ph-bulk-action-bar`, `ph-card`, `ph-empty-state`, `ph-error-page` (forbidden), `ph-button`, toast | Selection set |
| Import a roster | `import-roster` (default, mapping, invalid, success, error) | `ph-breadcrumb`, `ph-page-header`, `ph-stepper`, `ph-file-upload`, `ph-roster-mapping`, `ph-select`, `ph-error-summary`, `ph-alert`, `ph-switch`, `ph-stat`, `ph-card`, `ph-error-page`, `ph-button` | Wizard state |
| Guardian enrollment | `enroll` (default, code, closed), `enroll-household`, `enroll-child`, `enroll-review` (default, success, waitlisted) | `ph-guardian-shell`, `ph-text-field`, `ph-select`, `ph-switch`, `ph-card`, `ph-description-list`, `ph-alert`, `ph-empty-state`, `ph-button` | Steps and language strings |
| Incident log | `incidents` (default, empty, error, forbidden) | `ph-page-header`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-error-page` (forbidden), `ph-card`, `ph-empty-state`, `ph-button` | Log or own reports |
| Report an incident | `new-incident` (default, invalid, submitting, error) | `ph-page-header`, `ph-error-summary`, `ph-card`, `ph-radio-group`, `ph-select`, `ph-text-field` (datetime-local), `ph-textarea`, `ph-alert` (info, danger), `ph-button`, toast | Form state |
| Incident | `incident` (default, reviewed, error, forbidden) | `ph-breadcrumb`, `ph-page-header`, `ph-badge`, `ph-alert` (success, info), `ph-card` (titled), `ph-description-list`, `ph-timeline` (follow-up, trail), `ph-empty-state`, `ph-button` | — |

## Dialogs

| Dialog | Mock | Library components |
|---|---|---|
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
| Bulk review | `bulk-review` | `ph-dialog`, `ph-list`, `ph-list-item`, `ph-textarea`, `ph-alert`, `ph-button` |
| Program actions / Event actions | `program-actions`, `event-actions` | `ph-dialog`, `ph-action-menu`, `ph-button` |
| Archive program | `archive-program` | `ph-dialog`, `ph-text-field`, `ph-button` |
| Cancel event | `cancel-event` | `ph-dialog`, `ph-textarea`, `ph-switch`, `ph-button` |
| Check-in sheet | `check-in-sheet` | `ph-dialog`, `ph-radio-group`, `ph-text-field` (time), `ph-button` |
| Sign out | `confirm-pickup` (default, invalid, failed, confirm) | `ph-dialog`, `ph-radio-group` (with error), `ph-alert` (warning, danger), `ph-button` (tel: link), `ph-text-field`, `ph-switch` (with error) |
| Send now | `send-now` | `ph-dialog`, `ph-button` |
| Cancel send | `cancel-send` | `ph-dialog`, `ph-button` (danger) |
| Decline slip | `decline-slip` | `ph-dialog`, `ph-textarea`, `ph-button` (danger) |
| Send reminder | `send-reminder` | `ph-dialog`, `ph-list`, `ph-list-item`, `ph-badge` (danger), `ph-textarea`, `ph-alert`, `ph-button` |
| Open enrollment | `open-enrollment` (default, success) | `ph-dialog`, `ph-alert`, `ph-button` |
| Close enrollment | `close-enrollment` | `ph-dialog`, `ph-alert`, `ph-button` (danger) |
| Add a walk-in | `add-walk-in` (default, invalid) | `ph-dialog`, `ph-text-field`, `ph-textarea`, `ph-button` |

The toast region (`ph-toast-region`) sits once in the app root.

Deferred: `toast` and `banner` (first used by later slices); the account menu's theme switch.
