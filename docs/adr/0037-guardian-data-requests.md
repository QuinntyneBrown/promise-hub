# 0037: Guardian data requests are recorded from the family page and fulfilled once by staff

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 43 lets a guardian ask for an export or deletion of household information, and staff fulfil it (`L2-030` criterion 4). Households already soft-delete with a 30-day purge (ADR 0007), and the family page already sits behind verified guardian links (ADR 0020).

## Decision

- **Asking.** `POST /g/home/{token}/data-requests` (verified home link only) records a `DataRequest` (Export or Delete, an email), audits it and notifies everyone who manages settings.
- **Fulfilling.** `GET /settings/data-requests` and `POST /settings/data-requests/{id}/fulfil` under `ManageSettings`. An export is a CSV of the household's own guardians, children and enrollments, kept on the request for download (`GET .../export`) and announced to the guardian by email; a deletion soft-deletes the household, its guardians and children. Each request is fulfilled once (409 after); every step is audited.
- **Link scope.** Fixing a gap found here: the family page and its writes now refuse survey links as well as slip links, so a link only ever opens what it was issued for.
- **Frontend.** The guardian family page gains a "Your data" card and `GuardianDataRequestDialog` (with `data-request-text.ts` in three languages); Settings › Privacy lists requests with Send copy or Delete, and Download once done.

## Consequences

The export is delivered by email notice plus staff download, not yet as a verified guardian download link.
