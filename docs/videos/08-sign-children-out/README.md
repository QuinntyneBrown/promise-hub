# 08 · Sign children out

> **Runtime:** ~2.5 min · **Audience:** contributors and product owners · **Prerequisites:** [07 · Read a Quick Card](../07-read-a-quick-card/README.md)

**Video:** [08-sign-children-out.mp4](08-sign-children-out.mp4) · [Slides](slides.html) · **Audio:** [08-sign-children-out.mp3](08-sign-children-out.mp3) · [Transcript](script.md)

## Why this video exists

Slice 08 ([prompt](../../prompts/08-sign-children-out.md)) closes the safety loop that check-in starts: every child leaves with an adult who may take them.

## Learning objectives

By the end, the viewer can:

- sign a child out to an approved adult from the roster;
- explain what happens when someone not on the list arrives;
- say how the server enforces the rules and what the tests prove.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Who can collect a child? | The guardians allowed to pick up, or someone else the primary guardian okays by phone |
| What does the record keep? | Who collected the child, when, whether ID was checked and whether it was a phone okay |
| What happens when Pickup is off? | No Sign out button; the endpoints answer 404 |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/SignOutHandler.cs` | the approved-list check and the messages |
| `frontend/projects/attendance/src/lib/sign-out-dialog/sign-out-dialog.html` | the dialog states |
| `docs/adr/0011-sign-out-and-approved-adults.md` | the decision |
| `clips/sign-out-phone.mp4`, `clips/someone-else-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | default and blocked |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | What sign-out guarantees |
| 00:40-01:10 | Jaylen signs Mateo out | Approved list, toast, row |
| 01:10-01:40 | Someone not on the list | Warning, call link, phone okay |
| 01:40-01:55 | States | Default and blocked |
| 01:55-02:35 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SignOutTests
cd e2e; npx playwright test tests/attendance/sign-out.spec.ts
```

## Pitfalls

- Approved adults are the guardians allowed to pick up until slice 26 adds other adults (ADR 0011).
- Telling the household about a someone-else pickup waits for Messages; reporting a refusal waits for the incident log.

## References

- [Angular CDK Dialog](https://material.angular.dev/cdk/dialog/overview)
