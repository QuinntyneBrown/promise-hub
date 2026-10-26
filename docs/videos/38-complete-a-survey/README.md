# 38 · Complete a survey

> **Runtime:** ~2 min · **Audience:** contributors and product owners · **Prerequisites:** [37 · Produce grant reports](../37-produce-grant-reports/README.md)

**Video:** [38-complete-a-survey.mp4](38-complete-a-survey.mp4) · [Slides](slides.html) · **Audio:** [38-complete-a-survey.mp3](38-complete-a-survey.mp3) · [Transcript](script.md)

## Why this video exists

Slice 38 ([prompt](../../prompts/38-complete-a-survey.md)) lets a guardian answer a short survey through a translated, verified page, with answers feeding reports.

## Learning objectives

By the end, the viewer can:

- describe how a survey is sent and what each household receives;
- explain verification and language on the survey page;
- say how answers reach the report.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What does a household receive? | One text with a link per child |
| Which language is the page in? | The household's language |
| When can a survey be answered? | Once per child, within a week of sending |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Application/Surveys/GuardianSurveyHandler.cs` | verification and one answer |
| `frontend/projects/guardian/src/lib/survey-text.ts` | the three languages |
| `docs/adr/0032-surveys.md` | the decision |
| `clips/survey-phone.mp4` | the running app with the fake API |
| `shots/*.png` | sending and closed |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:50 | Introduction, promises | How surveys work |
| 00:50-01:10 | Answering | Carmen in Spanish |
| 01:10-01:20 | Sending | Dialog and closed |
| 01:20-02:00 | Testing, recap | Cases |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter SurveyTests
cd e2e; npx playwright test tests/guardian/survey.spec.ts tests/reports
```

## Pitfalls

- Questions are fixed: a rating and a comment.

## References

- [WCAG 2.2: Language of page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page)
