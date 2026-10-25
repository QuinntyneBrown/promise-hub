# 07 · Read a Quick Card

> **Runtime:** ~2.5 min · **Audience:** contributors and product owners · **Prerequisites:** [06 · Check children in](../06-check-children-in/README.md)

**Video:** [07-read-a-quick-card.mp4](07-read-a-quick-card.mp4) · [Slides](slides.html) · **Audio:** [07-read-a-quick-card.mp3](07-read-a-quick-card.mp3) · [Transcript](script.md)

## Why this video exists

Slice 07 ([prompt](../../prompts/07-read-a-quick-card.md)) puts a child's safety information on a phone at the door.

## Learning objectives

By the end, the viewer can:

- open a Quick Card from check-in and read it in order;
- explain which roles see medical details and why who to call is always shown;
- say what the audit log records for each open.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What comes first on the card? | The severe allergy alert and what to do |
| Who sees medical details? | Admins, program directors and site leads; the server omits them for others |
| What is audited? | Every open, by anyone, with who and when |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Attendance/GetQuickCardHandler.cs` | role filtering and the audit entry |
| `frontend/projects/attendance/src/lib/quick-card-page/quick-card-page.html` | section order |
| `frontend/projects/components/src/lib/call-list/call-list.html` | tel links |
| `clips/quick-card-phone.mp4`, `clips/restricted-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | default and empty cards |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | What the card guarantees |
| 00:40-01:20 | Jaylen opens Mateo's card | Alert, medical, call list |
| 01:20-01:35 | When there is nothing medical | The empty card |
| 01:35-02:05 | What others see | Priya's restricted card |
| 02:05-02:40 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter QuickCardTests
cd e2e; npx playwright test tests/attendance/quick-card.spec.ts
```

## Pitfalls

- The Quick Card routes load from the attendance library but follow the Quick Cards module (ADR 0010).
- The health card is stored masked; the full number is never in PromiseHub.

## References

- [tel: links (RFC 3966)](https://www.rfc-editor.org/rfc/rfc3966)
