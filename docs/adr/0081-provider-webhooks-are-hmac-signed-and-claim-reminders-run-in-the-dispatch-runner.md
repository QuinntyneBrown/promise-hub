# 0081: Provider webhooks are HMAC-signed, and claim reminders run in the dispatch runner

- Status: accepted
- Date: 2026-10-30

## Context

Prompt 87 follows a submitted Learning Bond application and pauses a claim that cannot go on (`L2-150`, `L2-151`). The design named an `IWebhookSignatureVerifier` with only a fake, a daily `LearningBondReminderJob` and a separate `LearningBondDestructionJob`. The codebase has no daily scheduler: every timed send is found by `MessageDispatchRunner` on its polling pass, per organization (ADR 0079). There is no inbound STOP handling yet, so no number is known to have opted out.

## Decision

- **A provider's webhook is signed with HMAC-SHA256.** `POST /learning-bond/webhooks/providers/{channel}` is anonymous. It is trusted only when `X-PromiseHub-Signature` is `sha256=` followed by the hex HMAC of the raw body under that provider's secret (`LearningBond:Webhooks:{channel}`). `HmacProviderWebhookVerifier` compares in constant time. A provider with no secret configured is never trusted.
- **An event is applied once by its id.** `LearningBondProviderEvent` is unique per provider and event id. A repeat answers 200 and changes nothing. The application is found across organizations by the provider's reference and that provider's name, and its organization becomes the tenant. With the module off there, the webhook answers 404.
- **Claim work rides the dispatch runner.** `LearningBondClaimJob.RunAsync` sends due reminders and closes claims paused for 180 days. The runner calls it for organizations that have an open reminder or a paused claim, in that organization's scope, skipping suspended ones. A reminder is texted once, and none is texted after I'm not interested or once the consent ends. Closing a claim destroys its SIN, closes its consent (`LearningBondConsent.ClosedAt`, distinct from a withdrawal), and destroys the guardian's SIN once no other claim needs it.
- **Texts go through Messages to every guardian with a mobile.** `LearningBondGuardianTexter` queues the fixed wording, the same way as the invitation. The SMS cap, the email fallback and suspension apply.

## Consequences

- Each provider must be given its secret before its webhook is accepted. Rotating a secret means a configuration change.
- STOP is honoured only by the SMS provider until inbound STOP handling exists. The "never to a STOP number" rule in `L2-151` waits for that work.
- A reminder missed for days is sent once, not once per missed day.
