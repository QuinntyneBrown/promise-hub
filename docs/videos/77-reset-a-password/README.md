# 77 · Reset a password as a youth or mentor

> **Runtime:** ~4.6 min · **Audience:** youth workers, program directors, developers · **Prerequisites:** [46 · Recover account access](../46-recover-account-access/README.md), [50 · Sign in as a youth or mentor](../50-sign-in-as-youth-or-mentor/README.md)

**Video:** [77-reset-a-password.mp4](77-reset-a-password.mp4) · [Slides](slides.html) · **Audio:** [77-reset-a-password.mp3](77-reset-a-password.mp3) · [Transcript](script.md)

## Why this video exists

Prompt 77 brings Waypoint's password reset (`L2-AUTH-005`, `L2-AUTH-008`) to PromiseHub's youth and mentors as `L2-115` and `L2-116` (ADR 0071). The staff reset from prompt 46 now serves every role: the answer never reveals whether an address has an account, an account gets at most three links an hour, only the newest link works, one password rule applies, every other session ends, and the reset opens the home of the person's role.

## Learning objectives

By the end, the viewer can:

- Ask for a reset link as a youth or mentor and say what the page shows for an address with no account.
- Explain the limit of three links an hour and why only the newest link works.
- Say which passwords the policy refuses and what happens to other sessions.
- Say where Sofía, Daniel and Lucía land after a reset, and why.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Does the answer reveal an account? | No: 202 and the same page for an unknown, deactivated or removed address; no email to them; the throttle answers the same way |
| Which link works? | Only the newest, once, for one hour, and only while the account has a current membership; otherwise 410 |
| What happens after the reset? | New hash, the session version raised so every other session ends in every organization, audited in one organization, the role home with Password updated |
| What never reaches the log? | The token and the password; the request log keeps the route template |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Identity/PasswordResetHandler.cs` | The throttle, the newest link, the current-membership check |
| `backend/src/PromiseHub.Domain/Identity/PasswordReset.cs` | `PerHour`, `Replace` |
| `frontend/projects/account/src/lib/forgot-password/` | The masked address and Resend the email |
| `frontend/projects/account/src/lib/reset-password/` | The Password updated toast and the role home |
| `shots/phone-forgot.png`, `phone-sent.png`, `phone-resent.png` | Asking and resending |
| `shots/phone-reset.png`, `phone-weak.png`, `phone-learning-updated.png`, `desktop-reset-daniel.png`, `desktop-mentoring-updated.png` | Choosing a password and the role homes |
| `shots/desktop-today-learning-off.png`, `desktop-invalid.png`, `desktop-expired.png`, `desktop-failed.png` | Module off and other states |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 0:00-0:27 | Introduction | What the journey covers |
| 0:27-0:58 | Ask | Sofía asks on her phone; the masked address |
| 0:58-1:16 | Same answer | No enumeration |
| 1:16-1:41 | Resend | Sent again, the newest link, three an hour |
| 1:41-2:21 | New password | The policy, other sessions, Learning |
| 2:21-2:30 | Mentor | Daniel lands on Mentoring |
| 2:30-3:14 | States | Lucía at Northgate, invalid, expired, failed |
| 3:14-3:33 | Secrets | Hashes and the request log |
| 3:33-4:12 | Testing | API and browser tests |
| 4:12-4:37 | Recap | Things to remember |

## Demo commands

```sh
cd frontend && npm run start -- --port 4200
node tools/video-record/record-clips.mjs docs/videos/77-reset-a-password
PYTHON=python3 node tools/video-audio/generate-audio.mjs docs/videos/77-reset-a-password
node tools/video-build/build-video.mjs docs/videos/77-reset-a-password --no-captions
```

## Pitfalls

- The throttle is per account and silent; per-address limits at the network edge are a hosting concern.
- A password belongs to the person, not the organization, so a reset ends sessions in every organization they belong to.
- An admin sending a reset from the person record, change password while signed in, and clearing the token from the address bar are deferred (ADR 0071).

## References

- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
