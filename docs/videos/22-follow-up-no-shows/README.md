# 22 · Follow up no-shows

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [06 · Check children in](../06-check-children-in/README.md)

**Video:** [22-follow-up-no-shows.mp4](22-follow-up-no-shows.mp4) · [Slides](slides.html) · **Audio:** [22-follow-up-no-shows.mp3](22-follow-up-no-shows.mp3) · [Transcript](script.md)

## Why this video exists

Slice 22 ([prompt](../../prompts/22-follow-up-no-shows.md)) texts guardians of children not checked in fifteen minutes after start and shows their replies to the site lead.

## Learning objectives

By the end, the viewer can:

- explain when a no-show text is sent and to whom;
- read the replies on the roster;
- explain how replies are kept safe.

## Key questions

| Question | What a strong answer includes |
|---|---|
| When does the text go? | Fifteen minutes after start, once per household, while the session runs |
| What does "2" do? | Marks every alerted child of that household absent, audited |
| How is the reply trusted? | The provider's shared secret; the organization from the alert |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/SendNoShowAlertsHandler.cs` | the job |
| `backend/src/PromiseHub.Application/Attendance/NoShowReplyHandler.cs` | the reply |
| `docs/adr/0022-no-show-alerts.md` | the decision |
| `clips/no-shows-phone.mp4` | the running app with the fake API |
| `shots/desktop-roster.png` | the replies on desktop |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | One text, two replies |
| 00:45-01:10 | The roster | Texted, on the way, absent |
| 01:10-01:30 | Safe replies | Secret, organization, switches |
| 01:30-02:10 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter NoShowTests
cd e2e; npx playwright test tests/attendance/no-show.spec.ts
```

## Pitfalls

- The delay is fixed at 15 minutes until notification settings exist (ADR 0022).
- Texts are in English for now.

## References

- [OWASP: Webhook security](https://cheatsheetseries.owasp.org/cheatsheets/Web_Service_Security_Cheat_Sheet.html)
