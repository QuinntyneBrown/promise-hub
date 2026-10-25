# 0017: Roster import reads CSV and XLSX itself, keeps the rows on the session, and runs in one request

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 14 asks an admin to upload a spreadsheet, map its columns, review duplicates and gaps, and create households and children in one go (`L2-010`). The design mentions file storage, a spreadsheet library and a background run with progress.

## Decision

- **Reading.** `SpreadsheetReader` (Infrastructure) detects the format by content: a zip with an XLSX worksheet, or UTF-8 text with a comma, semicolon or tab header; anything else is refused with the accepted formats and nothing is created. XLSX is read with `System.IO.Compression` and LINQ to XML (first sheet, shared or inline strings), so no package is added. Files are capped at 10 MB and 5,000 rows.
- **Session.** `ImportSession` keeps the header and rows as JSON for the life of the import, then the mapping and target program, then the summary; the uploaded file itself is not stored. Columns are matched by header synonyms (`ColumnMatcher`); unmatched ones default to Skip for the admin to decide.
- **Rules.** The mapping needs the child's name, the guardian's name, and a guardian phone or email. A duplicate is a child of this organization with the same normalized name and date of birth; it is skipped unless the admin merges it, which updates the existing child. Rows of the same guardian (by phone, then email, then name) share one household; a guardian whose phone is already on file updates that household. Rows with no child name or no contact are left to fix; email-only rows are imported and counted as needing a look. Children can be enrolled in a program on the way in.
- **Run.** The import runs in the request and writes one audit entry with the file name, row count and importer. A 5,000-row file stays within a request on the target hardware; progress polling through the job runner can come later without changing the contract.
- **Access.** `WriteHouseholds` (admins and directors) and the Roster module. The wizard is in the `enrollment` library at `/import`, with "Import a roster" on Families.

## Consequences

Approved pickups and medical columns beyond allergies are kept as notes for now. Very large files and progress feedback, and keeping the uploaded file, can be added with file storage and the job runner.
