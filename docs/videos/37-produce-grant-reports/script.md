# 37 · Produce grant reports

Funders want numbers, and nobody wants to retype them from a clipboard. This video shows how Marisol, the program director, reads the season's numbers straight from enrollment and check-in, narrows them to one program, and exports a funder-ready file with small counts protected.

## What reports promise

Every number comes from data the organization already keeps: children enrolled, sessions that have happened, who was checked in or marked absent, and slips signed online. The report shows children served, the attendance rate, sessions delivered, children by age, attendance by program and households by language. Choosing a program narrows every number. Any count under five could identify a child, so exports always write it as less than five, and only directors and admins see the exact figure on screen. Exports are recorded in the audit log, and their download link stops working after seven days.

## Marisol builds a report

Here is Reports on Marisol's laptop. Six children served, ninety percent attendance, and the age table beside attendance by program. She narrows the report to After-School Tutoring, and the numbers follow. Then she exports a CSV. The file is ready, named for the organization and the date, and the link works for seven days.

## Masked counts and who can see reports

A site lead sees the same report with small counts masked. Youth workers are told reports are for directors and site leads.

## How it is tested

Backend tests cover the numbers from real check-ins, the program filter, masking for site leads, an export written with masked counts and audited, an expired link answering gone, youth workers refused, another organization's export not found, and the endpoints answering not found with Reports off. The browser tests cover the report, the filter, the export, masking, a failure and the forbidden page, with accessibility checks.

## Recap

Things to remember. Numbers come from the data, never retyped. Small counts are protected. Export links expire in a week. Next, completing a survey.
