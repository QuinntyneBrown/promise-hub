# 42 · Configure privacy

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [41 · Manage billing](../41-manage-billing/README.md)

**Video:** [42-configure-privacy.mp4](42-configure-privacy.mp4) · [Slides](slides.html) · **Audio:** [42-configure-privacy.mp3](42-configure-privacy.mp3) · [Transcript](script.md)

## Why this video exists

Slice 42 ([prompt](../../prompts/42-configure-privacy.md)) lets an admin see data residency and set consent retention, which a nightly job applies.

## Learning objectives

By the end, the viewer can:

- say where an organization's region comes from and who can change it;
- name the retention choices;
- explain what the retention job removes and what it keeps.

## Key questions

| Question | What a strong answer includes |
|---|---|
| Can an admin change the region? | No; it is shown read-only, a platform task |
| What does the job remove? | Who signed and the signature details, after the period |
| Do reports change? | No; each answer's status stays |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/ApplyRetentionHandler.cs` | the purge |
| `backend/src/PromiseHub.Infrastructure/Privacy/RetentionRunner.cs` | per tenant |
| `docs/adr/0036-privacy-retention.md` | the decision |
| `clips/privacy-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | forbidden and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | Region and retention |
| 00:55-01:15 | Retention | Three years |
| 01:15-01:25 | Who | Forbidden and phone |
| 01:25-02:00 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter PrivacyTests
cd e2e; npx playwright test tests/settings/privacy.spec.ts
```

## Pitfalls

- Anonymizing inactive families and the full data export are not built.

## References

- [Office of the Privacy Commissioner of Canada: PIPEDA in brief](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/)
