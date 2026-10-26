# 39 · Set up an organization

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [38 · Complete a survey](../38-complete-a-survey/README.md)

**Video:** [39-set-up-an-organization.mp4](39-set-up-an-organization.mp4) · [Slides](slides.html) · **Audio:** [39-set-up-an-organization.mp3](39-set-up-an-organization.mp3) · [Transcript](script.md)

## Why this video exists

Slice 39 ([prompt](../../prompts/39-set-up-an-organization.md)) gives a new organization's admin a setup checklist that reuses each feature's screen and can be finished later.

## Learning objectives

By the end, the viewer can:

- name the setup steps and when each counts as done;
- explain why Finish later needs no saved state;
- say who can open setup.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How is a step marked done? | From the organization's data, such as a program or a sent slip |
| When is the slip step shown? | Only while Permission slips is on |
| Who can set up? | Admins and program directors (`ManageSettings`) |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Organizations/SetupHandler.cs` | steps from data |
| `frontend/projects/settings/src/lib/setup/setup-page.html` | the checklist |
| `docs/adr/0033-setup-wizard.md` | the decision |
| `clips/setup-desktop.mp4` | the running app with the fake API |
| `shots/*.png` | invalid and phone |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | Steps from data |
| 00:50-01:10 | Naming | Grace saves the name |
| 01:10-01:20 | Mistakes | Empty name, forbidden |
| 01:20-01:55 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SetupTests
cd e2e; npx playwright test tests/settings/setup.spec.ts
```

## Pitfalls

- The one-step-per-screen wizard chrome from the mocks is not built; steps open the existing screens.

## References

- [WCAG 2.2: Consistent help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help)
