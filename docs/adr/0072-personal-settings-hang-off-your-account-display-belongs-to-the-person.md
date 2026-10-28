# 0072: Personal settings hang off Your account; the profile belongs to the membership, display to the person

- Status: accepted
- Date: 2026-10-28

## Context

Prompt 78 ports Waypoint's personal settings (`L2-PLATFORM-002`, `-003`, `-004`, `-013`) as `L2-117` to `L2-121`. Waypoint has one settings shell with Profile, Display & accessibility and Notifications tabs; it edits a single-tenant user row, changes the password through the profile form, keeps a display row per user with text scale, high contrast, reduced motion, underline links, reading font and theme, and uploads a profile photo. PromiseHub already has Your account (`account`, prompt 45), notification preferences per membership (prompt 75, ADR 0069) and one password policy (ADR 0045). A person's name and mobile live on each `Membership`; the email, password and session version live on `StaffUser`, shared by every organization. Pages never edit inline (`AGENTS.md`).

## Decision

- **Your account is the hub.** It lists Profile, Password, Display, Two-step sign-in, Notifications and Devices as cards. Edit profile opens `/account/profile`, Change display `/account/display`, Change password the `change-password` dialog. Personal settings belong to no module and are always on, for every role.
- **The profile belongs to the membership.** `PUT /me/profile` changes the name and mobile of the active membership only, so a person's name at one organization never changes another's; the request names no membership. The email is read-only: it is the sign-in identity of every membership, and changing it needs a verified change-of-email flow (deferred). A youth's name comes from the child record and is read-only to them; a change answers 422. A profile change is audited without its values.
- **Change password proves the current one.** `POST /me/password` checks the current password, applies `PasswordPolicy` with the person's email and the repeat, stores the new hash, raises `StaffUser.SessionVersion` (ending every other session in every organization, ADR 0039) and reissues this device's cookie, so this session carries on. A wrong current password answers 422 on its field; it does not count toward the sign-in lock (deferred). The change is audited in the active organization only.
- **Display belongs to the person.** `StaffUser` gains `Theme` (`system`, `light`, `dark`), `TextSize` (`default`, `large`, `larger`) and `ReduceMotion` (migration `DisplayPreferences`). `GET` and `PUT /me/display` read and write only the caller's own; any other value answers 422. Like the password, they are not tenant-owned, so they follow the person to every organization and device. `GET /me` carries them, so the shell applies them once per session. Display choices are not sensitive and are not audited.
- **The root carries the choice.** A components-library service, `PhDisplayRoot`, sets `data-theme`, `data-text-size` and `data-motion` on `<html>`; the tokens define what each means (`L2-119`, `L2-120`). `system`, `default` and off remove the attribute, so the device's preference applies. Display previews by applying a choice at once and puts the saved one back when left unsaved. Signing out resets the root, so signed-out and guardian pages follow the device.
- **Notification choices follow their modules.** Saving a kind the role receives whose module is off answers 404 instead of 422, as every endpoint of an off module does (`L2-121`, amending `L2-111` criterion 3).
- **Deferred.** The profile photo, pronouns, changing the email, high contrast, underline links and the reading font, an email channel per notification kind (ADR 0069), and counting wrong current passwords toward the sign-in lock.

## Consequences

- `ProfileHandler`, `ChangePasswordHandler` and `DisplayPreferencesHandler` in `Application/Identity/`; `SessionEndpoints` maps the new `/me/*` routes for any member.
- The account library gains `ProfilePage`, `DisplayPage` and `ChangePasswordDialog`; the api library gains `DISPLAY_API` and two methods on `ACCOUNT_API`; the components library gains `PhDisplayRoot` and a read-only text field.
- The fake API mirrors the profile overlay per membership, the password check, the display row per person and the 404 for an off module's kind.
