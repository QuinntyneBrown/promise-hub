using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>Stores the mapping and target program and previews duplicates and rows that need a look (L2-010 criteria 2 and 3).</summary>
public sealed class SaveMappingHandler(IPromiseHubDb db, ImportRows rows)
{
    public async Task<(Result Result, ImportPreviewDto? Preview)> HandleAsync(Guid id, SaveMappingCommand command, CancellationToken cancellationToken = default)
    {
        var session = await db.ImportSessions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (session is null)
        {
            return (Result.NotFound, null);
        }
        if (session.Status == ImportStatus.Completed)
        {
            return (Result.Conflict, null);
        }
        var headers = JsonSerializer.Deserialize<List<string>>(session.Headers)!;
        var mapping = new Dictionary<string, ImportField>();
        foreach (var (column, value) in command.Mapping ?? [])
        {
            if (headers.Contains(column) && Enum.TryParse<ImportField>(value, out var field) && field != ImportField.Skip)
            {
                mapping[column] = field;
            }
        }
        var errors = new Dictionary<string, string>();
        if (!mapping.ContainsValue(ImportField.ChildName))
        {
            errors["ChildName"] = "Map the child’s name.";
        }
        if (!mapping.ContainsValue(ImportField.GuardianName))
        {
            errors["GuardianName"] = "Map the guardian’s name.";
        }
        if (!mapping.ContainsValue(ImportField.GuardianPhone) && !mapping.ContainsValue(ImportField.GuardianEmail))
        {
            errors["GuardianContact"] = "Map the guardian’s phone or email.";
        }
        string? programName = null;
        if (command.ProgramId is { } programId)
        {
            programName = (await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken))?.Name;
            if (programName is null)
            {
                errors["programId"] = "Choose one of your programs.";
            }
        }
        if (errors.Count > 0)
        {
            return (Result.Invalid(errors), null);
        }
        session.Map(JsonSerializer.Serialize(mapping), command.ProgramId);
        await db.SaveChangesAsync(cancellationToken);

        var read = ImportRows.Read(session);
        var duplicates = await rows.DuplicatesAsync(read, cancellationToken);
        return (Result.Done, new ImportPreviewDto(
            read.Count,
            [.. read.Where(r => duplicates.ContainsKey(r.Line)).Select(r => new ImportRowIssueDto(r.Line, r.ChildName, "Already in PromiseHub: same name and date of birth"))],
            [.. read.Where(r => ImportRows.Problem(r) is not null).Select(r => new ImportRowIssueDto(r.Line, r.ChildName, ImportRows.Problem(r)!))],
            programName));
    }
}
