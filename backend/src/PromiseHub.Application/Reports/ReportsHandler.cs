using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Reports;

namespace PromiseHub.Application.Reports;

/// <summary>The report page and its exports (L2-024, L2-025). Exports always mask small counts and are audited.</summary>
public sealed class ReportsHandler(IPromiseHubDb db, ITenantContext tenant, ReportCalculator calculator, IAuditWriter audit, TimeProvider clock)
{
    public Task<ReportDto> GetAsync(ReportFilter filter, CancellationToken cancellationToken = default) =>
        calculator.ComputeAsync(filter, !RolePermissions.Has(tenant.Role, Permission.ReadSmallCounts), cancellationToken);

    public async Task<ExportCreatedDto> ExportAsync(ExportReportCommand command, CancellationToken cancellationToken = default)
    {
        var report = await calculator.ComputeAsync(new ReportFilter(command.ProgramId, command.From, command.To), true, cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("Measure,Value");
        csv.AppendLine(CultureInfo.InvariantCulture, $"Children served,{report.ChildrenServed}");
        csv.AppendLine(CultureInfo.InvariantCulture, $"Attendance rate (%),{report.AttendanceRate}");
        csv.AppendLine(CultureInfo.InvariantCulture, $"Sessions delivered,{report.SessionsDelivered}");
        csv.AppendLine(CultureInfo.InvariantCulture, $"Slips signed online,{report.SlipsSigned}");
        csv.AppendLine();
        csv.AppendLine("Age,Children");
        foreach (var band in report.Ages)
        {
            csv.AppendLine(CultureInfo.InvariantCulture, $"{band.Band},{band.Count}");
        }
        csv.AppendLine();
        csv.AppendLine("Program,Attendance rate (%)");
        foreach (var p in report.Programs)
        {
            csv.AppendLine(CultureInfo.InvariantCulture, $"\"{p.Name}\",{p.AttendanceRate?.ToString(CultureInfo.InvariantCulture) ?? ""}");
        }
        csv.AppendLine();
        csv.AppendLine("Language,Households");
        foreach (var l in report.Languages)
        {
            csv.AppendLine(CultureInfo.InvariantCulture, $"{l.Language},{l.Households}");
        }
        var now = clock.GetUtcNow();
        var slug = string.Join('-', organization.Name.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        var fileName = $"{slug}-report-{now:yyyy-MM-dd}.csv";
        var rows = report.Ages.Count + report.Programs.Count + report.Languages.Count + 4;
        var export = new ReportExport(Guid.NewGuid(), tenant.OrganizationId, fileName, csv.ToString(), rows, tenant.ActorName, now);
        db.ReportExports.Add(export);
        audit.Record(new AuditEvent(AuditAction.Created, "ReportExport", export.Id, $"{fileName} · CSV · {rows} rows"));
        await db.SaveChangesAsync(cancellationToken);
        return new ExportCreatedDto(export.Id, fileName, rows, export.ExpiresAt);
    }

    public async Task<ExportFile> DownloadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var export = await db.ReportExports.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (export is null)
        {
            return new ExportFile(ResultStatus.NotFound, null, null);
        }
        return export.ExpiresAt <= clock.GetUtcNow()
            ? new ExportFile(ResultStatus.Conflict, null, null)
            : new ExportFile(ResultStatus.Done, export.FileName, export.Content);
    }
}
