# 42 · Configure privacy

Families trust an organization with their children's details. This video shows Privacy and data: where the organization's data lives, how long consent records are kept, and how the nightly job keeps that promise without anyone remembering to.

## What privacy promises

Every organization has a region where its data is stored; Harbourview's is Canada, in the Toronto region. The region is shown but can't be changed from settings; that takes PromiseHub support. Consent records and signed slips are kept for seven years after the event by default. An admin can choose three years, or keep them until a family asks for deletion. Every night, for each organization on its own, a job removes who signed and the signature details from slips older than the period. The answer itself stays, so the counts in reports don't change. Saving the setting is recorded in the audit log.

## Tom shortens retention

Here is Privacy and data on Tom's laptop. The region is Canada, Toronto region. He picks three years after the event and saves. From tonight, signatures on slips for events more than three years old lose their personal details.

## Who can change it

Site leads who open the page are told admins set privacy. Each organization keeps its own setting. Requests from guardians open Families for now.

## How it is tested

Backend tests cover the region and the seven-year default, saving three years with an audit entry and refusing other periods, the job keeping a signature at two years and removing its details at four while keeping the status, until-deleted keeping everything, and site leads refused while each organization keeps its own. The browser tests cover the page, saving, a failed load and the forbidden state, with accessibility checks.

## Recap

Things to remember. The region is fixed. Retention is a choice. The nightly job keeps the promise, and counts stay. Next, guardian data requests.
