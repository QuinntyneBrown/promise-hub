# 14 · Import a roster

> **Runtime:** ~3 min · **Audience:** contributors and product owners · **Prerequisites:** [13 · Resolve missing slips](../13-resolve-missing-slips/README.md)

**Video:** [14-import-a-roster.mp4](14-import-a-roster.mp4) · [Slides](slides.html) · **Audio:** [14-import-a-roster.mp3](14-import-a-roster.mp3) · [Transcript](script.md)

## Why this video exists

Slice 14 ([prompt](../../prompts/14-import-a-roster.md)) lets an admin bring a whole roster in from a spreadsheet: upload, map, review, import.

## Learning objectives

By the end, the viewer can:

- import a CSV or XLSX roster and read the mapping;
- explain how duplicates and rows without contact are handled;
- say what the audit log records for an import.

## Key questions

| Question | What a strong answer includes |
|---|---|
| What counts as a duplicate? | A child of this organization with the same name and date of birth |
| What happens to a returning family? | Matched by the guardian's phone and updated, not duplicated |
| What is audited? | One entry per import: file name, row count and importer |

## Code / assets on screen

| File | What to show |
|---|---|
| `backend/src/PromiseHub.Infrastructure/Imports/SpreadsheetReader.cs` | CSV and XLSX by content |
| `backend/src/PromiseHub.Application/Imports/RunImportHandler.cs` | households, children and the audit entry |
| `docs/adr/0017-roster-import.md` | the decision |
| `clips/import-desktop.mp4`, `clips/wrong-file-phone.mp4` | the running app with the fake API |
| `shots/*.png` | mapping and results |

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:55 | Introduction, promises | What the import guarantees |
| 00:55-01:40 | Tom imports | Upload to results |
| 01:40-02:00 | A file it can't read | The error |
| 02:00-02:10 | The screens | Mapping and results |
| 02:10-02:55 | Testing, recap | Coverage |

## Demo commands

```powershell
dotnet test backend/PromiseHub.sln --filter ImportTests
cd e2e; npx playwright test tests/enrollment
```

## Pitfalls

- The import runs in one request; progress polling comes with the job runner (ADR 0017).
- Approved pickups in the spreadsheet are kept as notes for now.

## References

- [RFC 4180: CSV](https://www.rfc-editor.org/rfc/rfc4180)
- [ECMA-376: Office Open XML](https://ecma-international.org/publications-and-standards/standards/ecma-376/)
