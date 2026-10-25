# 17 · Track enrollment status

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [16 · Review enrollment](../16-review-enrollment/README.md)

**Video:** [17-track-enrollment-status.mp4](17-track-enrollment-status.mp4) · [Slides](slides.html) · **Audio:** [17-track-enrollment-status.mp3](17-track-enrollment-status.mp3) · [Transcript](script.md)

## Why this video exists

Slice 17 ([prompt](../../prompts/17-track-enrollment-status.md)) lets a guardian see whether each child is accepted or waitlisted, from the link in the decision text.

## Learning objectives

By the end, the viewer can:

- follow a guardian from the decision text to the status page;
- explain each status and what the guardian reads for it;
- explain how the link is scoped and revoked.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Where does the link come from? | Every enrollment decision text, minted for the household |
| How is it protected? | Hashed token, a code on a new device, revoked on a contact change |
| What does a waitlisted family see? | The number and a promise to be texted first |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Guardian/GuardianHomeHandler.cs` | statuses per child |
| `frontend/projects/guardian/src/lib/guardian-home-page/guardian-home-page.html` | the page |
| `docs/adr/0020-guardian-home-link.md` | the decision |
| `clips/linh-home-phone.mp4` | the running app with the fake API |
| `shots/*.png` | Spanish and expired |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:40 | Introduction, promises | The link and the code |
| 00:40-01:00 | Linh's page | Code to statuses |
| 01:00-01:15 | Other answers | Spanish, declined, expired |
| 01:15-01:50 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter GuardianHomeTests
cd e2e; npx playwright test tests/guardian/home.spec.ts
```

## Pitfalls

- A slip link never opens the home page; only a home link does (ADR 0020).
- The decision texts themselves are in English for now (ADR 0019).

## References

- [WCAG 2.2: Language of page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page)
