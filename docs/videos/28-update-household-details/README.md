# 28 · Update household details

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [27 · Confirm an exceptional pickup](../27-confirm-an-exceptional-pickup/README.md)

**Video:** [28-update-household-details.mp4](28-update-household-details.mp4) · [Slides](slides.html) · **Audio:** [28-update-household-details.mp3](28-update-household-details.mp3) · [Transcript](script.md)

## Why this video exists

Slice 28 ([prompt](../../prompts/28-update-household-details.md)) lets a guardian correct contact, language and children's health information through a verified link.

## Learning objectives

By the end, the viewer can:

- correct contact details, language and a child's health information as a guardian;
- explain what a new mobile number does to links.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What can a guardian change? | Their mobile, email and language; each child's allergies and medication |
| Who sees it? | Staff at once, on the household and the Quick Card; audited as the guardian |
| What does a new mobile do? | Revokes every link and trusted device of the household |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Guardian/GuardianHomeHandler.cs` | the two updates |
| `frontend/projects/guardian/src/lib/guardian-details-dialog/guardian-details-dialog.html` | the dialog |
| `docs/adr/0020-guardian-home-link.md` | the decision |
| `clips/update-details-phone.mp4` | the running app with the fake API |
| `shots/*.png` | French page and invalid email |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:45 | Introduction, promises | What can change |
| 00:45-01:10 | Linh corrects | Email and allergy |
| 01:10-01:25 | Language and number | French, revoked link |
| 01:25-02:00 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter GuardianUpdateTests
cd e2e; npx playwright test tests/guardian/update-household.spec.ts
```

## Pitfalls

- Conditions, doctor and the red alert stay with staff (ADR 0020).

## References

- [WCAG 2.2: Redundant entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry)
