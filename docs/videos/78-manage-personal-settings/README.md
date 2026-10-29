# 78 · Manage personal settings

> **Runtime:** ~5.2 min · **Audience:** youth workers, youth, mentors, program directors, developers · **Prerequisites:** [75 · Receive notifications](../75-receive-notifications/README.md), [77 · Reset a password](../77-reset-a-password/README.md)

**Video:** [78-manage-personal-settings.mp4](78-manage-personal-settings.mp4) · [Slides](slides.html) · **Audio:** [78-manage-personal-settings.mp3](78-manage-personal-settings.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 78 brings Waypoint's personal settings (`L2-PLATFORM-002`, `-003`, `-004`, `-013`) to PromiseHub as `L2-117` to `L2-121` (ADR 0072). Your account becomes the hub for everything that is a person's own: the profile of this membership, the password, the theme, text size and reduced motion, and notification choices that follow their modules.

## Learning objectives

By the end, the viewer can:

- Edit a profile and say why the email and a youth's name are read-only.
- Explain why the profile belongs to the membership while the password and display belong to the person.
- Change a password and say what happens to other sessions.
- Choose a theme and text size, and say when the device's preference applies instead.
- Say what a module that is off means for notification choices.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Whose name changes? | Only the active membership's; the request names none; another organization keeps its own; audited without values |
| What does changing a password do? | Proves the current one, one policy, session version raised so other sessions end everywhere, this cookie reissued, audited in one organization |
| Where does the theme live? | On the person (`StaffUser`), carried by `GET /me`, applied as `data-theme`, `data-text-size` and `data-motion` on the root; signed-out pages follow the device |
| What if Messages is off? | Messages and Announcements are not offered; saving either answers 404; a kind the role never receives answers 422 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Identity/ProfileHandler.cs` | The active membership only, a youth's name |
| `backend/src/PromiseHub.Application/Identity/ChangePasswordHandler.cs` | The current password, the policy, the session version |
| `backend/src/PromiseHub.Application/Identity/DisplayPreferencesHandler.cs` | The person's own, the known values |
| `frontend/projects/components/src/lib/display-root/display-root.ts` | The three root attributes |
| `frontend/projects/account/src/lib/profile-page/`, `display-page/`, `change-password-dialog/` | The screens |
| `shots/desktop-account.png`, `desktop-profile.png`, `desktop-profile-saved.png`, `phone-youth-profile.png` | Your account and the profile |
| `shots/desktop-password.png`, `desktop-password-invalid.png`, `desktop-password-changed.png` | Change password |
| `shots/phone-display.png`, `phone-dark.png`, `phone-larger.png`, `phone-account-dark.png` | Display and theme |
| `shots/desktop-notifications.png`, `desktop-messages-off.png`, `desktop-profile-invalid.png`, `desktop-display-failed.png` | Notifications and other states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:22 | Introduction | What is a person's own |
| 00:22-00:51 | Your account | The cards; nothing edited inline |
| 00:51-01:21 | Profile | Jaylen edits his name and mobile (clip) |
| 01:21-01:58 | Tenancy | Priya at two organizations; Sofía's managed name |
| 01:58-02:35 | Password | Wrong current password, then changed (clip) |
| 02:35-03:21 | Display | Sofía picks Dark and Larger on her phone (clip) |
| 03:21-03:57 | Notifications | Messages on and off (clip) |
| 03:57-04:04 | States | Off, invalid, failed |
| 04:04-04:44 | Testing | API and browser tests |
| 04:44-05:12 | Recap | Things to remember |

## Demo commands

```sh
npm --prefix frontend run start -- --port 4317
node tools/video-record/record-clips.mjs docs/videos/78-manage-personal-settings --base http://localhost:4317
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/78-manage-personal-settings
node tools/video-build/build-video.mjs docs/videos/78-manage-personal-settings --no-captions
```

## Pitfalls

- The profile is per membership: renaming at one organization does not rename the person everywhere.
- Display is per person: it follows them to every organization and device.
- A preview on Display is not saved until Save changes; leaving puts the saved choice back.
- Larger text narrows the top bar in rem: its links move into More rather than overflowing.

## References

- `docs/specs/L2.md`: L2-117 to L2-121, L2-111
- `docs/adr/0072-personal-settings-hang-off-your-account-display-belongs-to-the-person.md`
- `docs/detailed-designs/identity/edit-profile/`, `change-password/`, `configure-display/`, `switch-theme/`
