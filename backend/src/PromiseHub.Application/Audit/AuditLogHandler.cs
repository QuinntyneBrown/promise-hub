using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Audit;

/// <summary>
/// The organization's audit log (L2-032): who viewed or changed what, when and from where, searchable by person, record
/// and action within a period, and exportable. Exporting is itself logged.
/// </summary>
public sealed class AuditLogHandler(IPromiseHubDb db, IAuditWriter audit, TimeProvider clock)
{
    public const int PageSize = 50;

    public async Task<AuditLogDto> SearchAsync(AuditLogQuery query, CancellationToken cancellationToken = default)
    {
        var matches = await MatchesAsync(query, cancellationToken);
        var page = Math.Max(1, query.Page ?? 1);
        return new AuditLogDto([.. matches.Skip((page - 1) * PageSize).Take(PageSize).Select(ToDto)], matches.Count, page, PageSize);
    }

    public async Task<string> ExportAsync(AuditLogQuery query, CancellationToken cancellationToken = default)
    {
        var matches = await MatchesAsync(query, cancellationToken);
        var csv = new StringBuilder("When,Who,Action,Record,Summary,Device\n");
        foreach (var e in matches.Select(ToDto))
        {
            csv.AppendLine(CultureInfo.InvariantCulture, $"{e.When:yyyy-MM-dd HH:mm},{Cell(e.Who)},{e.Action},{Cell(e.Record)},{Cell(e.Summary)},{Cell(e.Device)}");
        }
        audit.Record(new AuditEvent(AuditAction.Exported, "AuditLog", null, $"{matches.Count} entries{(string.IsNullOrWhiteSpace(query.Q) ? "" : $" matching “{query.Q.Trim()}”")}"));
        await db.SaveChangesAsync(cancellationToken);
        return csv.ToString();
    }

    private async Task<List<AuditEntry>> MatchesAsync(AuditLogQuery query, CancellationToken cancellationToken)
    {
        var since = clock.GetUtcNow().AddDays(-Math.Clamp(query.Days ?? 7, 1, 3660));
        var entries = (await db.AuditEntries.AsNoTracking().ToListAsync(cancellationToken)).Where(e => e.OccurredAt >= since);
        if (Enum.TryParse<AuditAction>(query.Action, out var action))
        {
            entries = entries.Where(e => e.Action == action);
        }
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var text = query.Q.Trim();
            entries = entries.Where(e => e.ActorName.Contains(text, StringComparison.OrdinalIgnoreCase)
                || e.RecordType.Contains(text, StringComparison.OrdinalIgnoreCase)
                || e.Summary.Contains(text, StringComparison.OrdinalIgnoreCase));
        }
        return [.. entries.OrderByDescending(e => e.OccurredAt)];
    }

    private static AuditLogEntryDto ToDto(AuditEntry e) => new(e.OccurredAt, e.ActorName, e.Action.ToString(), e.RecordType, e.Summary, e.Device);

    private static string Cell(string? value) => value is null ? "" : $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}
