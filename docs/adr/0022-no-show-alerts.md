# 0022: No-show texts run in the send job fifteen minutes after start, and replies arrive by a signed webhook

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 22 texts guardians when an expected child is not checked in after the start of a session, and lets the site lead see the replies (`L2-018`). The design left the job's interval and the delay setting open; the notification settings page is a later prompt.

## Decision

- **When.** The delay is 15 minutes (`NoShowRules.Delay`) until the notification settings page makes it configurable. A session is due from its start plus the delay until its end, when its event's no-show switch is on and it isn't cancelled.
- **Job.** `SendNoShowAlertsHandler` runs inside the per-tenant send job (`MessageDispatchRunner`) before queued deliveries are sent, and only when Roll Call is on. For each child on the roster with no attendance record other than not-yet and no alert yet, it records a `NoShowAlert` and queues one message per household with the new `MessageSource.NoShow`; the existing delivery path applies the SMS cap, the email fallback and retries. A unique index on event and child keeps a retried job from texting twice.
- **Replies.** `POST /webhooks/sms/inbound` is anonymous but requires the provider's shared secret (`Sms:InboundSecret`, from configuration, compared in constant time). The sender's number is matched to the households of open alerts from the last twelve hours, and the latest alert sets the organization. "1" records on the way; "2" marks every alerted child of that household absent and audits it. Anything else, or an unmatched number, changes nothing; the answer is always 200.
- **Screen.** The check-in roster shows the alert and reply as a badge on each row.

- **Page answer (prompt 23).** Each no-show text ends with a household home link (ADR 0020). The guardian home lists the household's unanswered alerts, and `POST /g/home/{token}/no-show` applies "on the way" or "absent" through the same `NoShowReplyHandler.ApplyAsync` as a texted reply, after the code check.

## Consequences

Texts are English only until messages are translated per household. Unmatched replies are not yet stored for staff; ending a session, attendance history and the configurable delay are later prompts.
