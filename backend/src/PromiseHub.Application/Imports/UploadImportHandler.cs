using System.Text.Json;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Imports;

namespace PromiseHub.Application.Imports;

/// <summary>Reads an uploaded CSV or XLSX, refuses anything else or more than 5,000 rows, and proposes the column mapping (L2-010 criteria 1 and 4).</summary>
public sealed class UploadImportHandler(IPromiseHubDb db, ITenantContext tenant, ISpreadsheetReader reader, TimeProvider clock)
{
    public async Task<(Result Result, ImportUploadDto? Upload)> HandleAsync(string fileName, byte[] content, CancellationToken cancellationToken = default)
    {
        var sheet = content.Length == 0 ? null : reader.Read(content);
        if (sheet is null || sheet.Headers.Count == 0)
        {
            return (Result.Invalid(new Dictionary<string, string> { ["file"] = $"We couldn’t read {fileName}. Export it as CSV or XLSX and try again. Nothing was imported." }), null);
        }
        if (sheet.Rows.Count > ImportSession.MaxRows)
        {
            return (Result.Invalid(new Dictionary<string, string> { ["file"] = $"{fileName} has {sheet.Rows.Count:N0} rows. Split it into files of up to 5,000 rows." }), null);
        }
        var session = new ImportSession(Guid.NewGuid(), tenant.OrganizationId, fileName, JsonSerializer.Serialize(sheet.Headers), JsonSerializer.Serialize(sheet.Rows),
            sheet.Rows.Count, tenant.ActorName, clock.GetUtcNow());
        db.ImportSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
        var columns = sheet.Headers.Select((h, i) => new ImportColumnDto(h, sheet.Rows.Select(r => i < r.Count ? r[i] : null).FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)),
            ColumnMatcher.Match(h)?.ToString())).ToList();
        return (Result.Created(session.Id), new ImportUploadDto(session.Id, fileName, sheet.Rows.Count, columns.Count(c => c.Field is not null), columns));
    }
}
