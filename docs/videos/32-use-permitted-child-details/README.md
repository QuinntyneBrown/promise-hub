# 32 · Use permitted child details

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [31 · Coordinate staff coverage](../31-coordinate-staff-coverage/README.md)

**Video:** [32-use-permitted-child-details.mp4](32-use-permitted-child-details.mp4) · [Slides](slides.html) · **Audio:** [32-use-permitted-child-details.mp3](32-use-permitted-child-details.mp3) · [Transcript](script.md)

## Why this video exists

Slice 32 ([prompt](../../prompts/32-use-permitted-child-details.md)) lets a youth worker see only the roster details her role permits, and never sends her restricted records.

## Learning objectives

By the end, the viewer can:

- say which children a youth worker can open;
- name the fields withheld from her;
- explain what happens when she opens anyone else.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Which children can a youth worker read? | Those enrolled in programs of the sessions she works |
| What is withheld? | Medical details and the date of birth; guardian phone stays |
| What about other children? | 403 with an audit entry; left out of Families and search |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Households/RosterAccess.cs` | the row scope |
| `backend/src/PromiseHub.Application/Households/GetChildHandler.cs` | 403 and the date of birth |
| `docs/adr/0026-permitted-child-details.md` | the decision |
| `clips/permitted-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | Families and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, permitted | What she sees |
| 00:40-01:10 | Rivera household | Mateo, then Kevin refused |
| 01:10-01:20 | Lists | Families and search |
| 01:20-02:00 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter PermittedDetailsTests
cd e2e; npx playwright test tests/households/permitted-details.spec.ts
```

## Pitfalls

- A youth worker with no assigned session sees an empty Families list.

## References

- [OWASP API Security: Broken object level authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
