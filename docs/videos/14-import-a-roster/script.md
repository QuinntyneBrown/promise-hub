# 14 · Import a roster

Most organizations arrive with their families already in a spreadsheet. Typing them in again would take days, so PromiseHub reads the spreadsheet instead. This video shows Tom, the admin, importing a fall roster in three steps, how duplicates and gaps are caught before anything is created, and what happens with a file PromiseHub can't read.

## What the import promises

Tom can upload a CSV or an Excel file of up to five thousand rows, one row per child. PromiseHub matches the columns by their names and lists any it couldn't place. Before anything is created, it shows the children who are already in PromiseHub, matched by name and date of birth, and the rows that need a look, like a family with only an email or no contact at all. Then the whole file is created in one go, families who are already on file are updated instead of duplicated, and the import is one entry in the audit log, naming the file, the number of rows and who imported it.

## Tom imports the fall roster

Here is the import on Tom's laptop. He chooses the spreadsheet exported from the old sign-up sheet. Seven of eight columns match automatically: student, date of birth, parent, cell, email, allergies and language. The T-shirt size has nowhere to go, so it is skipped. He chooses to enroll everyone in Saturday Sports and reviews. Mateo Rivera is already in PromiseHub, so that row will be skipped unless Tom merges it. Zoe's family has only an email, and Sam's row has no contact at all. Tom imports. Three children are created in two new families, and the results say exactly which row still needs a phone or email.

## A file it can't read

On a phone, Tom first picks a Numbers file by mistake. PromiseHub says it couldn't read it, explains which formats work, and creates nothing. He picks the CSV and is straight back at the mapping.

## The screens

Two screens to remember: the column mapping, and the results with the row left to fix.

## How it is tested

Backend tests cover matching the columns of a CSV, reading an Excel file, refusing a file that isn't a spreadsheet, the required mapping, duplicates and rows that need a look, creating households, children and enrolments with one audit entry, matching a returning family by phone and merging a duplicate, site leads refused, another organization's import and children, and the roster module switched off. The browser tests repeat the wizard on phone and desktop, with an accessibility check on every step.

## Recap

Things to remember. Three steps: upload, map, review. Nothing is created until the review, and duplicates are skipped unless merged. One audit entry records the whole import. Next, families enrolling their children themselves.
