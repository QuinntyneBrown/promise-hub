# 0079: Learning Bond launches are due rows the dispatch runner sends

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 85 schedules Learning Bond invitations for a chosen day at 10:00 in the organization's time zone (`L2-140`). The design named an `IJobScheduler` that enqueues `LearningBondLaunchJob` for that time and removes it on cancel, but the codebase has no scheduler: every timed send (slips, reminders, no-show alerts) is a row that `MessageDispatchRunner` finds due on its polling pass, per organization, skipping suspended ones, and then queues through `MessageWriter`. The invitation also needs a guardian link of its own, and the design assumed STOP replies are already honoured, but no inbound SMS or opt-out exists yet.

## Decision

- **A launch is a due row, not a scheduled job.** `LearningBondSettings` gains `LaunchMode` (`Scheduled` or `AtTheDoor`), `LaunchDate`, `LaunchedAt` and `CancelledAt`. `MessageDispatchRunner` asks `LearningBondLaunchHandler` on each pass, per organization, in that organization's scope: a scheduled launch whose date has come and whose local time is 10:00 or later, not cancelled and not yet launched, sends. Changing the date moves the row; cancelling stamps it. Nothing needs removing.
- **Each household gets one invitation row before its message.** `LearningBondInvitation` (household, sent at, how) is written in the same save as the queued message, so a retry or a second pass never sends twice, and the 7-day rule and "Invited {date}" read it.
- **Invitations go through Messages with their own source.** `MessageSource.LearningBond` is gated by the Learning Bond module in `SendQueuedDeliveriesHandler`, so the SMS cap and the email fallback apply and an organization that turns Learning Bond off sends nothing still queued. The text already starts with the sender name, so it is not prefixed again.
- **The link is a guardian link for the household.** `GuardianLinkIssuer.IssueLearningBond(householdId)` stores the token's hash and answers `/g/learning-bond/{token}`, which `GuardianAccess` already resolves.
- **STOP is deferred.** There is no inbound SMS or opt-out record in PromiseHub yet; the text carries "STOP to opt out" for the provider's own handling, and honouring STOP inside PromiseHub arrives with inbound messaging.

## Consequences

- No new hosted service: the existing runner, its tests' `RunOnceAsync` and `FakeTimeProvider` drive launches.
- A launch due while the runner is down goes out on its next pass the same day or later; it is never sent twice.
- `L2-140` criterion 5's STOP clause is open until inbound messaging exists; the estimate and the design say so.
