# 0032: Surveys ride on guardian links and belong to the Reports module

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 38 asks a guardian to submit feedback through a translated, verified page, with results feeding reports. Guardian links, code verification and trusted devices already exist for slips and the home page (ADR 0017, ADR 0020).

## Decision

- **Model.** `Survey` (an event, who sent it, closes seven days later) and `SurveyResponse` (one per survey and child, rating 1 to 5, optional comment). `GuardianLink` gains a nullable `SurveyId`; `GuardianLinkIssuer.IssueSurvey` mints `/g/survey/<token>`.
- **Module.** Surveys are part of Reports: `POST /events/{id}/survey` needs Reports on and `ViewReports`; messages use the new `MessageSource.Survey`, sent only while Reports is on; the guardian page answers 404 with Reports off.
- **Guardian page.** `GET`/`POST /g/survey/{token}` use the same verification as slips, return the household's language, and accept one answer per child while open.
- **Reports.** The report adds the number of answers and the average rating for its program.
- **Frontend.** `GuardianSurveyPage` in the `guardian` library with its own `survey-text.ts` in English, Spanish and French; `SendSurveyDialog` and a Guardian feedback stat in the `reports` library.

## Consequences

Questions are fixed (a rating and a comment); custom questions and per-language custom text are later work.
