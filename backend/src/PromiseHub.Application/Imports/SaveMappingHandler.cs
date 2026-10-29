using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>
/// Stores the mapping and target program and previews duplicates and rows that need a look (L2-010 criteria 2 and 3), cohort places and youth
/// invitations (L2-130): a Youth email column needs Learning and an admin.
/// </summary>
public sealed class SaveMappingHandler(IPromiseHubDb db, ImportRows rows, Organizations.ITenantContext tenant, Organizations.IModuleGate modules)
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
        if (mapping.ContainsValue(ImportField.YouthEmail))
        {
            if (!await modules.IsOnAsync(Domain.Organizations.ModuleId.Learning, cancellationToken))
            {
                errors["YouthEmail"] = "Youth invitations need Learning, which is off.";
            }
            else if (!Identity.RolePermissions.Has(tenant.Role, Identity.Permission.ManageStaff))
            {
                errors["YouthEmail"] = "Only an admin sends youth invitations.";
            }
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
        var cohorts = await rows.CohortsAsync(cancellationToken);
        var invitations = await rows.InvitationsAsync(read, duplicates, cancellationToken);
        var importable = read.Where(r => ImportRows.Problem(r) is not ("No child name" or "No phone or email")).ToList();
        var needLook = new List<ImportRowIssueDto>();
        foreach (var row in read)
        {
            if (ImportRows.Problem(row) is { } problem)
            {
                needLook.Add(new ImportRowIssueDto(row.Line, row.ChildName, problem));
            }
            if (importable.Contains(row) && row.Cohort is { } cohort && !cohorts.ContainsKey(ImportRows.CohortKey(cohort)))
            {
                needLook.Add(new ImportRowIssueDto(row.Line, row.ChildName, $"No cohort called “{cohort}”; imported, not placed"));
            }
            if (invitations.TryGetValue(row.Line, out var why) && why is not null)
            {
                needLook.Add(new ImportRowIssueDto(row.Line, row.ChildName, why));
            }
        }
        return (Result.Done, new ImportPreviewDto(
            read.Count,
            [.. read.Where(r => duplicates.ContainsKey(r.Line)).Select(r => new ImportRowIssueDto(r.Line, r.ChildName, "Already in PromiseHub: same name and date of birth"))],
            needLook,
            programName,
            importable.Count(r => r.Cohort is { } c && cohorts.ContainsKey(ImportRows.CohortKey(c))),
            invitations.Count(i => i.Value is null)));
    }
}
