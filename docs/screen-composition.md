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
| Check-in | `check-in` (default, empty, no-results, error, forbidden) | `ph-page-header`, `ph-stat`, `ph-text-field` (search), `ph-chip`, `ph-roster`, `ph-roster-item`, `ph-flag`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-error-page` (forbidden), `ph-button`, toast | Optimistic roster state |
| Quick Card | `quick-card` (default, empty, forbidden, error) | `ph-avatar`, `ph-quick-card-alert`, `ph-alert`, `ph-card` (titled), `ph-description-list`, `ph-call-list`, `ph-list`, `ph-list-item`, `ph-badge`, `ph-empty-state`, `ph-button` | Section order, overline heading for the call list |
| Messages | `messages` (default, empty, error, forbidden) | `ph-page-header`, `ph-alert` (danger, cap reached), `ph-list`, `ph-list-item`, `ph-badge`, `ph-card`, `ph-empty-state`, `ph-error-page`, `ph-button` | — |
| New message | `new-message` (default, invalid, error, no-results, over-cap) | `ph-breadcrumb`, `ph-page-header`, `ph-alert`, `ph-card` (titled), `ph-select`, `ph-recipient-count`, `ph-textarea` (help, counter), `ph-radio-group` (disabled options), `ph-sms-preview`, `ph-button` | Debounced preview |
| Message | `message` (default, error) | `ph-breadcrumb`, `ph-page-header`, `ph-stat`, `ph-card` (titled, flush), `ph-table` (badge cells), `ph-sms-preview`, `ph-empty-state`, `ph-button` | Refresh while sending |

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
| Program actions / Event actions | `program-actions`, `event-actions` | `ph-dialog`, `ph-action-menu`, `ph-button` |
| Archive program | `archive-program` | `ph-dialog`, `ph-text-field`, `ph-button` |
| Cancel event | `cancel-event` | `ph-dialog`, `ph-textarea`, `ph-switch`, `ph-button` |
| Check-in sheet | `check-in-sheet` | `ph-dialog`, `ph-radio-group`, `ph-text-field` (time), `ph-button` |
| Sign out | `confirm-pickup` (default, invalid, failed, confirm) | `ph-dialog`, `ph-radio-group` (with error), `ph-alert` (warning, danger), `ph-button` (tel: link), `ph-text-field`, `ph-switch` (with error) |
| Add a walk-in | `add-walk-in` (default, invalid) | `ph-dialog`, `ph-text-field`, `ph-textarea`, `ph-button` |

The toast region (`ph-toast-region`) sits once in the app root.

Deferred: `toast` and `banner` (first used by later slices); the account menu's theme switch.
