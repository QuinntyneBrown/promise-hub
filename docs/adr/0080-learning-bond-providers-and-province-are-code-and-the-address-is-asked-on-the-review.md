# 0080: Learning Bond providers and the province live in code, and the review asks for the address

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 86 prepares a child's RESP and Learning Bond application (`L2-148`) and submits it (`L2-149`). The design assumed three things the codebase does not have: a seeded `RespProvider` table, a province on the household, and an address on the household record. ADR 0076 calls the provider list platform data that no organization can edit. Households hold a name, a language and guardians, but no postal address and no province. There is also no provider integration yet.

## Decision

- **The provider list is a static catalogue in code.** `RespProviders.All` lists name, provinces and channel for each provider, with no organization id. It is the same for every organization, and no endpoint changes it. The recommendation is the first entry that serves the application's province. A new provider is a code change, reviewed like one. The table and its versioning wait until the list changes often enough to need them.
- **The province comes from the organization's time zone, and the guardian can correct it.** `RespProviders.ProvinceOf(timeZone)` sets the province when the application is prepared. `PATCH .../fields/province` changes it for that application only, keeping the provider while it still serves the new province. A province no provider serves answers `NoProvider`, the page offers the Government of Canada link, and the claim stays Started.
- **The address is asked on the review.** While the household record has none, the address row says "Add your address before you submit." The application stays `Draft`, and Submit answers 409 `incomplete`. An address the guardian enters belongs to the application only and never changes the household record.
- **Submit keeps its key and the status follows the channel.** `SubmissionKey` is written and saved before `IRespProviderChannel` is called, and a retry reuses it so the provider can recognise a repeat. The status turns `Submitted` only when the channel says the application was sent. A repeat after that answers 202 and calls nothing. A refusal leaves the application `ReadyToSubmit` and answers 502 `not-sent`.
- **Until a provider is integrated, the channel sends nothing.** `UnconfiguredRespProviderChannel` answers not sent, so nothing leaves a deployment and the guardian sees "Nothing was sent". Tests replace it with `FakeRespProviderChannel` in `PromiseHub.Api.Tests`, which records each submission.

## Consequences

- Adding or changing a provider needs a release, not a data change.
- The province is a best guess for organizations near a provincial border. The guardian can correct it, but there is no screen for that yet.
- A household address is asked for once per application. When households gain an address, it pre-fills here.
