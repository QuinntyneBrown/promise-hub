# 0013: Guardian messages send through a per-tenant dispatcher behind provider abstractions

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 10 asks that a program director send a message by text and email, track delivery and failures, and stay within a monthly SMS cap, with sending as a per-tenant background job behind provider abstractions. The designs (`messaging/compose-and-send-message`, `messaging/enforce-sms-cap`, `platform/run-background-jobs`) describe a generic job table, webhook delivery reports, scheduling and machine translation. The SMS and email providers are not chosen yet.

## Decision

- **Model.** `Message` (one per send) and `Delivery` (one per household) in `PromiseHub.Domain/Messaging/`. The audience is a program, or an event's program, optionally narrowed to one household language. Each household is reached through its primary guardian: text when they have a mobile, email otherwise for "text, email for households without a mobile"; a household the chosen channel cannot reach gets a `Failed` delivery with the reason, so failures are visible without provider reports.
- **Job.** `SendQueuedDeliveriesHandler` is the send job for one tenant. `MessageDispatchRunner` (Infrastructure) finds organizations with queued deliveries and runs the handler in each organization's own tenant scope, skipping any whose Messages module is off; `MessageDispatchHostedService` (Api) runs it every 15 seconds and is switched off in tests, which run it by hand. Each delivery is saved after its send, so a retry never sends it twice; a refused send is retried after 2 and 4 minutes and then failed. A generic `Job` table, dead-lettering and admin notification wait for the platform jobs slice.
- **Providers.** `ISmsSender` and `IEmailSender` in Application. Until providers are chosen, Infrastructure logs that a send was accepted, never its content; tests use fakes.
- **SMS cap.** `SmsUsagePeriod` holds an organization's segments for its local calendar month, so the count starts again on the first without a reset job. The cap is set by plan (Free 200, Standard 2,000, Plus 5,000, the mocks' figures). Every text reserves its segments first; a refused reservation sends the email fallback when there is one and otherwise pauses the delivery. Email never consults the cap. Segments follow GSM-7 (160/153) or UCS-2 (70/67), counted on the text as sent, which starts with the organization's name.
- **Access.** `SendMessages` belongs to admins, program directors and site leads, for every endpoint, including reads. Enums travel as their names in JSON.

## Consequences

Scheduling and cancelling a send, delivery and bounce webhooks, replies, translation per household language, raising the cap, resuming paused texts and the shell-wide cap banner arrive in later slices; the Messages page and the composer show the cap state meanwhile. The Pickup someone-else notice and absence texts can now use the same send path.
