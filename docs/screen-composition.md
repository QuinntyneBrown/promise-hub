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
| Today (empty) | `today/empty` | `ph-page-header`, `ph-card`, `ph-empty-state`, `ph-button` | Greeting and date |
| Not found | `not-found` | `ph-error-page`, `ph-button` | — |
| Forbidden | `forbidden` | `ph-error-page`, `ph-button` | — |
| Server error | `server-error` | `ph-error-page`, `ph-button` | Retry reloads |
| Offline | `offline` | `ph-error-page`, `ph-button` | Retry reloads |
| Maintenance | `maintenance` | `ph-error-page`, `ph-button` | Retry reloads |

| Sign in | `sign-in` (default, invalid, submitting, error, expired, locked) | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | Return-path handling |
| Enter your code | `sign-in/mfa` | `ph-auth-card`, `ph-text-field`, `ph-switch`, `ph-alert`, `ph-button`, `ph-skip-link` | — |

Deferred: `toast` and `banner` (first used by later slices); the account menu's theme switch.
