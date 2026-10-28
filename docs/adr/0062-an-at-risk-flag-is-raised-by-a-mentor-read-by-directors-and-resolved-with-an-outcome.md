# 0062: An at-risk flag is raised by a mentor with a severity, read and resolved by directors too, and is not an incident

- Status: accepted
- Date: 2026-10-27

## Context

Prompt 68 ports Waypoint's at-risk flags (`L2-MENTOR-007`) as `L2-091`. Waypoint keeps a `Flag` per youth user with a free-text reason, raised by a mentor or a program administrator, or automatically from inactivity, missed sessions and progress below the cohort; it is resolved with one of four reasons, audited, and "visible to the director" through the audit log. PromiseHub is multi-tenant, keys mentoring on the child record (`MentorScope`, ADR 0049), has in-app notifications (`L2-040`) and a separate Incident log module (`L2-023`), and mentors are a participant role that cannot reach staff endpoints such as incident reporting (ADR 0043).

## Decision

- **Raised by mentors, with a severity.** `AtRiskFlag` (`PromiseHub.Domain/Mentoring/`) carries the organization, the child, who raised it and when, a severity (`Low`, `Medium`, `High`) and a reason of at most 1,000 characters. Only a mentor raises one, on a youth in his scope; outside it answers 403 and is audited as AccessDenied on `Child`, another organization's child 404. Waypoint's administrator raising is not ported.
- **One open flag per youth.** Raising on a youth with an open flag answers 409 `already-flagged`; Waypoint's silent no-op for the same reason is dropped so the mentor sees why nothing changed.
- **Directors read every flag.** A new permission, `ReviewAtRiskFlags`, held by Admin and Program director (the same roles that review incidents), reads every flag of the organization and resolves any. Mentors read the flags on youth in their scope, whichever of the youth's mentors raised them. The endpoints sit in their own group: Mentoring on, and `MentorYouth` or `ReviewAtRiskFlags`. Other staff roles, volunteers, guardians and youth get 403.
- **Notified in app.** Raising notifies every current admin and program director with kind `mentoring`, linking to `/mentoring/flags`, in the same save; the reason is not in the notification. `NotificationsHandler` maps the `mentoring` kind to Mentoring, so these notices hide while it is off.
- **Resolved with an outcome.** Waypoint's four reasons become `AtRiskFlagOutcome` (`Reconnected`, `HandedToDirector`, `LeftProgram`, `FlaggedInError`) with an optional note of at most 1,000 characters. A mentor of the youth or a flag reader resolves; a resolved flag answers 409 `already-resolved`. Resolving makes room for a new flag; flags are never deleted or edited.
- **Audit without words.** Raising is audited as Created on `AtRiskFlag` with the youth's name, who raised it and the severity; resolving as Updated with the outcome. The reason and the note are never written to the audit log.
- **Not an incident.** While the Incident log is on, each open flag offers admins and program directors Report an incident, linking to the existing report form (`/incidents/new`). Mentors cannot report incidents, so the raise dialog tells them not to wait for a flag when someone is hurt or in danger, without naming a module.
- **Directors find it in More.** Navigation gains At-risk flags for Admin and Program director while Mentoring is on; the page lives in the `mentoring` library at `/mentoring/flags`, beside the mentor's pages.

## Consequences

- Turning Mentoring off hides every flag endpoint (404), the page, the More entry and the notifications, and keeps every row; turning it back on restores them.
- When a youth leaves a mentor's scope, her flags stop showing to him and are kept; directors still read them.
- Deferred: Waypoint's automatic signals (they need thresholds per organization and a per-tenant job), messaging a flagged youth (Messages has no youth recipients), the at-risk banner on the youth record (`L2-064`), and prefilling the incident form with the child.
