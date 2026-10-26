# 43 · Request household data

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [42 · Configure privacy](../42-configure-privacy/README.md)

**Video:** [43-request-household-data.mp4](43-request-household-data.mp4) · [Slides](slides.html) · **Audio:** [43-request-household-data.mp3](43-request-household-data.mp3) · [Transcript](script.md)

## Why this video exists

Slice 43 ([prompt](../../prompts/43-request-household-data.md)) lets a guardian ask for an export or deletion of household information, and staff fulfil it.

## Learning objectives

By the end, the viewer can:

- describe how a guardian asks and who is told;
- explain what an export contains and what deletion does;
- say why a link only opens what it was issued for.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does a guardian ask? | Their family page, on a verified link |
| What does an export hold? | Only the household's guardians, children and enrollments |
| What happens on deletion? | Soft delete now, purge after 30 days |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/DataRequestHandler.cs` | ask and fulfil |
| `frontend/projects/guardian/src/lib/guardian-data-request-dialog/guardian-data-request-dialog.html` | the request |
| `docs/adr/0037-guardian-data-requests.md` | the decision |
| `clips/*.mp4` | the running app with the fake API |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | How requests work |
| 00:55-01:15 | Asking | Carmen in Spanish |
| 01:15-01:35 | Fulfilling | Tom sends the copy |
| 01:35-02:10 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter DataRequestTests
cd e2e; npx playwright test tests/guardian/data-request.spec.ts
```

## Pitfalls

- The copy is downloaded by staff and announced by email; a verified guardian download link is later work.

## References

- [Office of the Privacy Commissioner of Canada: access to personal information](https://www.priv.gc.ca/en/privacy-topics/access-to-personal-information/)
