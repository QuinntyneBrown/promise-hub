# 0073: Settings open on Organization; module defaults show only while their module is on

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 79 ports Waypoint's organization settings (`L2-ADMIN-006`, journey 31) as `L2-122` to `L2-126`. Waypoint edits one single-tenant `OrgSettings` row on one long form: name, display name, logo URL, city, contact email, the consent statement with "re-consent each term" and "media consent", plus terms, tracks and integrations. PromiseHub already has the setup wizard's organization step (`PUT /settings/organization`, name and city, L2-008), the consent policy on Privacy and data (`/settings/consent`, Roster-gated, L2-056), `Organization.Phone`, `Organization.TimeZone` and `Organization.WebsiteSlug`, and file storage keyed by the caller (ADR 0050). Pages never edit inline (`AGENTS.md`), and an off module's endpoints answer 404.

## Decision

- **Settings opens on Organization.** `/settings` redirects to `/settings/organization` (`settings-organization`), the first Settings tab. The page reads cards (Profile, then Learning, Mentoring and Public website) and each Edit opens a CDK dialog; the logo uploads from the Profile card like a lesson video. The setup wizard's `GET`/`PUT /settings/organization` stay as they are.
- **The profile lives on `Organization`.** `GET`/`PUT /settings/organization/profile` (`OrganizationProfileHandler`, `ManageSettings`) read and change the name, city, a new `ContactEmail`, `Phone` and `TimeZone` of the signed-in membership's organization only; the request names no organization. The time zone is one of eight Canadian IANA zones. A save is audited as Updated on `Organization` with the names of the changed fields. The session refreshes so the shell shows the new name.
- **The logo is a stored file.** `POST`/`GET`/`DELETE /settings/organization/logo` (`OrganizationLogoHandler`) accept a PNG or JPEG recognised by its first bytes, up to 1 MB, stored under `logos/{organizationId}/{random}.{ext}`; `Organization` keeps the key, file name, content type, when and by whom. Replacing deletes the earlier file. SVG is refused because it can carry script. Uploads and removals are audited on `OrganizationLogo`.
- **Module defaults show only while their module is on.** Each card has its own endpoint behind `RequireModule`, so an off module answers 404 and the page does not request or render it:
  - Learning: `GET`/`PUT /settings/learning` read and write the one consent policy through `ConsentPolicyHandler`; the card opens the existing `consent-policy` dialog. Privacy and data keeps its Roster-gated card on the same row.
  - Mentoring: `GET`/`PUT /settings/mentoring` read and write `Organization.MentorCheckInDays` (7, 14, 21 or 30; 14 by default), audited on `MentoringSettings`. The mentor dashboard lists **Check-ins due**: youth in the mentor's scope with no mentor check-in from him within that many days of the organization's today.
  - Public website: `GET`/`PUT /settings/website` read and write the address (`WebsiteSlug`, unique across organizations, refused with 422 when taken), `WebsiteTagline`, `WebsiteAbout` and `WebsiteEmail`; `GET /website/{slug}` answers them for prompt 81.
- **Columns on the tenant root.** Four migrations, one per slice (`OrganizationContactEmail`, `OrganizationLogo`, `MentorCheckInCadence`, `WebsiteProfile`), add the contact email, the logo columns, the check-in cadence and the website profile columns to `Organizations`. They belong to the tenant root, so no new tenant-owned table is needed.
- **Deferred.** Waypoint's terms and tracks (programs already carry a term; tracks are curriculum), re-consent each term and media consent, integrations, a display name separate from the name, per-organization colours (the palette is fixed), showing the logo and contact email on guardian pages, the public website and the top bar, and showing the tagline and about on the public pages (prompt 81).

## Consequences

- `OrganizationProfileHandler`, `OrganizationLogoHandler`, `MentoringSettingsHandler` and `WebsiteProfileHandler` in `Application/Organizations/`; `SettingsEndpoints` maps the new routes.
- The settings library gains `SettingsOrganizationPage` and the `OrganizationProfileDialog`, `MentoringDefaultsDialog` and `WebsiteProfileDialog`; the consent dialog takes where it saves (`ConsentPolicyDialogData`); the api library gains `ORGANIZATION_SETTINGS_API`; the components library gains `PhOrgLogo`.
- The fake API mirrors the profile, logo, Learning, Mentoring and website settings per organization and the dashboard's Check-ins due.
