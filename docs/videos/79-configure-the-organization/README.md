# 79 · Configure the organization

> **Runtime:** ~6.1 min · **Audience:** admins and office managers, program directors, mentors, developers · **Prerequisites:** [03 · Configure modules](../03-configure-modules/README.md), [52 · Give guardian consent](../52-give-guardian-consent/README.md), [78 · Manage personal settings](../78-manage-personal-settings/README.md)

**Video:** [79-configure-the-organization.mp4](79-configure-the-organization.mp4) · [Slides](slides.html) · **Audio:** [79-configure-the-organization.mp3](79-configure-the-organization.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 79 brings Waypoint's organization settings (`L2-ADMIN-006`, journey 31) to PromiseHub as `L2-122` to `L2-126` (ADR 0073). Settings now opens on Organization: the profile and logo of the signed-in membership's organization, and below them the defaults of Learning (the guardian consent policy), Mentoring (how often mentors check in, which drives Check-ins due on each mentor's dashboard) and Public website (address, tagline, about and public email), each shown only while its module is on.

## Learning objectives

By the end, the viewer can:

- Edit the organization's profile and say which screens follow the name, phone and time zone.
- Upload and remove a logo, and say how the server checks the file.
- Say where the consent policy, the check-in cadence and the website profile are edited, and when their cards appear.
- Explain how the cadence decides who is due a mentor check-in.
- Say what a module that is off and a role without `ManageSettings` get from these endpoints.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Whose profile changes? | The signed-in membership's organization only; the request names none; Northgate's save never touches Harbourview; audited with the changed fields |
| How is a logo checked? | PNG or JPEG by its first bytes, up to 1 MB, SVG refused, stored under `logos/{organization}/{random}`, the old file deleted, audited |
| When does a module card show? | Only while the module is on; its settings are never requested otherwise and its endpoint answers 404 |
| Who is due a mentor check-in? | His youth with no mentor check-in from him within 7, 14, 21 or 30 days of the organization's today, never-checked-in first, then the oldest |
| Can two organizations share an address? | No; a taken address answers 422 without saying whose it is |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/OrganizationProfileHandler.cs` | Field rules, the changed fields in the audit |
| `backend/src/PromiseHub.Application/Organizations/OrganizationLogoHandler.cs` | First bytes, 1 MB, the key, replace and delete |
| `backend/src/PromiseHub.Application/Organizations/MentoringSettingsHandler.cs`, `WebsiteProfileHandler.cs` | The cadence and the unique address |
| `backend/src/PromiseHub.Application/Mentoring/MentorDashboardHandler.cs` | `CheckInsDueAsync` |
| `frontend/projects/settings/src/lib/organization/`, `organization-profile-dialog/`, `mentoring-defaults-dialog/`, `website-profile-dialog/` | The page and its dialogs |
| `frontend/projects/components/src/lib/org-logo/` | `PhOrgLogo` |
| `shots/desktop-organization.png`, `desktop-profile-dialog.png`, `desktop-profile-saved.png` | Organization and the profile |
| `shots/desktop-no-logo.png`, `desktop-logo.png`, `desktop-logo-invalid.png` | The logo |
| `shots/desktop-mentoring-dialog.png`, `desktop-defaults-saved.png`, `phone-check-ins-due.png`, `phone-check-ins-due-7.png` | Learning, Mentoring and Check-ins due |
| `shots/desktop-website-dialog.png`, `desktop-website-saved.png`, `desktop-website-taken.png` | The website profile |
| `shots/desktop-northgate.png`, `desktop-forbidden.png`, `desktop-profile-invalid.png` | Off, forbidden, invalid |
| `clips/profile-desktop.mp4`, `logo-desktop.mp4`, `defaults-desktop.mp4`, `mentor-phone.mp4`, `states-desktop.mp4` | Screen recordings of the running app against the fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:27 | Introduction | What an organization says about itself |
| 00:27-00:55 | Organization | Settings opens on Organization; cards and dialogs |
| 00:55-01:29 | Profile | Edit profile; who follows the name, phone and time zone |
| 01:29-02:03 | Server rules | Field rules, tenancy, audit, roles |
| 02:03-02:44 | Logo | Upload, first bytes, a PDF refused |
| 02:44-03:08 | Learning | The one consent policy |
| 03:08-03:51 | Mentoring | The cadence and Check-ins due |
| 03:51-04:25 | Website | Address, tagline, about, public email |
| 04:25-04:58 | Modules off | Northgate, forbidden, invalid, taken |
| 04:58-05:32 | Testing | API and browser tests |
| 05:32-06:05 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/79-configure-the-organization --base http://localhost:4200
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/79-configure-the-organization
node tools/video-build/build-video.mjs docs/videos/79-configure-the-organization --no-captions
```

## Pitfalls

- `/settings` lands on Organization now, not Modules.
- The Learning card and Privacy and data edit the same consent policy; there is only one.
- The cadence counts only the mentor's own check-ins; another mentor's never make a youth not due.
- Changing the website address stops the old one answering at once.
- The tagline, about and public email reach the public pages with prompt 81.

## References

- `docs/specs/L2.md`: L2-122 to L2-126, L2-056, L2-005
- `docs/adr/0073-settings-open-on-organization-with-module-defaults-only-while-their-module-is-on.md`
- `docs/detailed-designs/organizations/configure-organization-profile/`, `configure-module-defaults/`, `configure-consent-policy/`
