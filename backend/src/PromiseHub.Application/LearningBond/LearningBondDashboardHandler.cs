using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Application.Reports;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Reports;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The Learning Bond dashboard and the funder export (L2-141, L2-143), for ViewReports: the organization's figures and one row per covered
/// program, filtered by program and by the last 30 or 90 days or all time; the export writes the same rows and a total to a CSV kept 7 days,
/// with "&lt;5" and blank dollars where suppressed, audited. Never a family's name, contact or amount.
/// </summary>
public sealed class LearningBondDashboardHandler(IPromiseHubDb db, ITenantContext tenant, LearningBondCoverage coverage, LearningBondFigures figures, IAuditWriter audit,
    TimeProvider clock)
{
    public async Task<LearningBondDashboardDto> GetAsync(Guid? program, string? period, CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var (programs, _) = await coverage.CountAsync(cancellationToken);
        var since = Since(period);
        var chosen = program is { } id && programs.Any(p => p.Id == id) ? new[] { id } : null;
        var all = await figures.ComputeAsync(chosen, since, organization.TimeZone, cancellationToken);
        var rows = new List<LearningBondFiguresDto>();
        foreach (var p in programs.Where(p => chosen is null || chosen.Contains(p.Id)))
        {
            rows.Add(LearningBondFigures.Dto(p.Name, await figures.ComputeAsync([p.Id], since, organization.TimeZone, cancellationToken)));
        }
        return new LearningBondDashboardDto(programs, PeriodName(period), chosen?.Single(), LearningBondFigures.Dto(null, all), rows,
            all.Invited == 0 && all.Started == 0 && all.Completed == 0);
    }

    public async Task<ExportCreatedDto> ExportAsync(LearningBondExportRequest request, CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var (programs, _) = await coverage.CountAsync(cancellationToken);
        var since = Since(request.Period);
        var csv = new StringBuilder();
        csv.AppendLine("Program,Households invited,Started,Completed,Children with a Learning Bond application,Estimated Learning Bond,Estimated benefits,Confirmed Learning Bond,Confirmed benefits,Confirmed per completed household");
        foreach (var p in programs)
        {
            csv.AppendLine(Row($"\"{p.Name.Replace("\"", "\"\"", StringComparison.Ordinal)}\"", await figures.ComputeAsync([p.Id], since, organization.TimeZone, cancellationToken)));
        }
        csv.AppendLine(Row("Total", await figures.ComputeAsync(null, since, organization.TimeZone, cancellationToken)));
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone)).DateTime);
        var from = since is { } s ? DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(s, TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone)).DateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "all";
        var slug = string.Join('-', organization.Name.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        var fileName = $"{slug}-learning-bond-{from}-{today:yyyy-MM-dd}.csv";
        var rows = programs.Count + 1;
        var export = new ReportExport(Guid.NewGuid(), tenant.OrganizationId, fileName, csv.ToString(), rows, tenant.ActorName, now);
        db.ReportExports.Add(export);
        audit.Record(new AuditEvent(AuditAction.Created, "ReportExport", export.Id, $"{fileName} · Learning Bond · CSV · {rows} rows"));
        await db.SaveChangesAsync(cancellationToken);
        return new ExportCreatedDto(export.Id, fileName, rows, export.ExpiresAt);
    }

    // Counts read "<5" and dollars are blank where the row rests on fewer than 5 households (L2-143 criterion 2).
    private static string Row(string label, LearningBondFigureSet set)
    {
        static string Count(int n) => n is > 0 and < LearningBondFigures.Smallest ? "<5" : n.ToString(CultureInfo.InvariantCulture);
        var suppressed = LearningBondFigures.Suppressed(set);
        string Dollars(int n) => suppressed ? string.Empty : n.ToString(CultureInfo.InvariantCulture);
        var perHousehold = suppressed || set.Completed == 0 ? string.Empty
            : ((set.ConfirmedLearningBond + set.ConfirmedBenefits) / set.Completed).ToString(CultureInfo.InvariantCulture);
        return string.Join(',', label, Count(set.Invited), Count(set.Started), Count(set.Completed), Count(set.Children), Dollars(set.EstimatedLearningBond),
            Dollars(set.EstimatedBenefits), Dollars(set.ConfirmedLearningBond), Dollars(set.ConfirmedBenefits), perHousehold);
    }

    private DateTimeOffset? Since(string? period) => period switch
    {
        "30" => clock.GetUtcNow().AddDays(-30),
        "90" => clock.GetUtcNow().AddDays(-90),
        _ => null,
    };

    private static string PeriodName(string? period) => period is "30" or "90" ? period : "all";
}
