# 50 · Sign in as a youth or mentor

> **Runtime:** ~4 min · **Audience:** contributors, product owners and program staff supporting youth and mentors · **Prerequisites:** [02 · Sign in securely](../02-sign-in-securely/README.md), [49 · Merge Waypoint: foundation](../49-merge-waypoint-foundation/README.md)

**Video:** [50-sign-in-as-youth-or-mentor.mp4](50-sign-in-as-youth-or-mentor.mp4) · [Slides](slides.html) · **Audio:** [50-sign-in-as-youth-or-mentor.mp3](50-sign-in-as-youth-or-mentor.mp3) · [Transcript](script.md)

## Why this video exists

Slice 50 lets youth and mentors sign in and land on the home of their role, and gives every account a lock with an audited unlock, a sign-out that ends the session on the server and clears the device, and its own timed-out and inactive states (`L2-046` to `L2-050`, ADR 0044).

## Learning objectives

By the end, the viewer can:

- Say where a youth, a mentor and everyone else lands after signing in, and what happens when that module is off.
- Explain the consecutive lock, where it is audited and how a password reset ends it.
- Explain why a copied cookie stops working after sign-out and what the device forgets.
- Tell the timed-out state from the inactive state, and why the inactive state needs the right password.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does Sofía land? | Learning while it is on; Today when it is off; a deep link wins |
| What ends a lock? | Fifteen minutes, or a reset by emailed link, audited as an unlock |
| What does Sign out do? | Records the ended session id, audits, clears the offline store, shows `signed-out` |
| When is "inactive" shown? | Every membership removed, and only after the right password |

## Code / assets on screen

| File | What to show |
|---|---|
| `frontend/projects/api/src/lib/session/role-home.ts` | The role home |
| `backend/src/PromiseHub.Application/Identity/SignInLock.cs` | Consecutive failures |
| `backend/src/PromiseHub.Application/Identity/SessionSignOutHandler.cs` | Ending a session on the server |
| `backend/src/PromiseHub.Api/Middleware/TenantContextMiddleware.cs` | Ended sessions and `account-deactivated` |
| `frontend/projects/account/src/lib/signed-out/`, `account-deactivated/` | The two new pages |
| `clips/clips.mjs` | The recordings and screenshots, against a faked API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:20 | Introduction | Why youth and mentors need to sign in |
| 00:20-01:04 | Role home | One sign-in; Sofía lands on Learning, Daniel on Mentoring |
| 01:04-01:23 | Module off | Lucía at Northgate lands on Today |
| 01:23-02:06 | Lockout | Fifth try, then paused; audited lock and unlock |
| 02:06-02:27 | Sign out | Ended on the server; Back shows sign-in |
| 02:27-03:02 | States | Timed out; account inactive; default and empty shots |
| 03:02-03:34 | Testing | Laptop shots and the cases |
| 03:34-03:56 | Recap | What to remember, what comes next |

## Demo commands

```sh
dotnet test backend/PromiseHub.sln --filter "ParticipantSignInTests|LockoutTests|SessionEndingTests|DeactivatedAccountTests"
cd e2e && npx playwright test tests/account
node tools/video-record/record-clips.mjs docs/videos/50-sign-in-as-youth-or-mentor --base http://localhost:4317
node tools/video-build/build-video.mjs docs/videos/50-sign-in-as-youth-or-mentor --no-captions
```

## Pitfalls

- The role home is presentation only; the server still answers 403 or 404 for anything the role or module does not allow.
- Signing out clears check-ins still queued offline along with the saved rosters; sync before handing a phone on.
- Cookies issued before session ids existed cannot be ended one by one; they expire within 12 hours.

## References

- [Cookie authentication in ASP.NET Core (Microsoft Learn)](https://learn.microsoft.com/aspnet/core/security/authentication/cookie)
- [OWASP Authentication Cheat Sheet: account lockout](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
