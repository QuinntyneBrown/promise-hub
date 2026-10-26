# 0036: Region is fixed per organization; consent retention is a setting applied by a nightly per-tenant job

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 42 asks an admin to see data residency, set retention and know how guardian data requests are handled (`L2-030`). Everything runs in one deployment today.

## Decision

- **Region.** `Organization.Region` (default "Canada (Toronto region)") is shown read-only; changing it is a platform-admin task, not a setting.
- **Retention.** `PrivacySettings` (tenant-owned, optional) holds consent retention: 7 years (default), 3 years, or until deleted by request (null). `GET`/`PUT /settings/privacy` under `ManageSettings`; saving is audited.
- **Job.** `RetentionRunner` runs daily (`RetentionHostedService`, off in tests) and, per tenant, `ApplyRetentionHandler` purges who signed and the signature details on slips whose event is older than the period. The signature's status stays so counts are unchanged.
- **Frontend.** `PRIVACY_API`; `SettingsPrivacyPage` at `/settings/privacy` in the `settings` library, linked from the Settings tabs. Guardian requests link to Families until prompt 43 builds the request flow.

## Consequences

Anonymizing inactive families after two seasons, the full data export and the security-review summary in the mock are not built. Multi-region storage is out of scope for one deployment.
