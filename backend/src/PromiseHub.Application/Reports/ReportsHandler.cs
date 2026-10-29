using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Reports;

namespace PromiseHub.Application.Reports;

/// <summary>The report page and its exports (L2-024, L2-025). Exports always mask small counts and are audited.</summary>
public sealed class ReportsHandler(IPromiseHubDb db, ITenantContext tenant, ReportCalculator calculator, DetailedReportsHandler detailed, IModuleGate modules,
    IAuditWriter audit, TimeProvider clock)
{
    public Task<ReportDto> GetAsync(ReportFilter filter, CancellationToken cancellationToken = default) =>
        calculator.ComputeAsync(filter, !RolePermissions.Has(tenant.Role, Permission.ReadSmallCounts), cancellationToken);

    /// <summary>Writes the export the command names (L2-025, L2-129): the summary, or exactly what a detailed report shows.</summary>
    public async Task<Gated<ExportCreatedDto>> ExportAsync(ExportReportCommand command, CancellationToken cancellationToken = default)
    {
        var kind = command.Kind?.Trim() ?? "Summary";
        if (kind.Equals("Summary", StringComparison.OrdinalIgnoreCase))
        {
            return Gated<ExportCreatedDto>.Found(await ExportSummaryAsync(command, cancellationToken));
        }
        var known = new[] { "Cohort", "Progress", "Staff" }.FirstOrDefault(k => k.Equals(kind, StringComparison.OrdinalIgnoreCase));
        if (known is null)
        {
            return Gated<ExportCreatedDto>.Invalid(new Dictionary<string, string> { ["kind"] = "Choose Summary, Cohort, Progress or Staff." });
        }
        if (known is "Cohort" or "Progress" && command.ProgramId is null)
        {
            return Gated<ExportCreatedDto>.Invalid(new Dictionary<string, string> { ["programId"] = "Choose a cohort." });
        }
        var on = await modules.OnAsync(cancellationToken);
        if ((known == "Progress" && !on.Contains(ModuleId.Learning)) || (known == "Staff" && !on.Contains(ModuleId.Mentoring)))
        {
            return Gated<ExportCreatedDto>.NotFound();
        }
        var lines = new List<string>();
        string? programName = null;
        switch (known)
        {
            case "Cohort":
                var cohort = await detailed.CohortAsync(command.ProgramId!.Value, cancellationToken);
                if (cohort is null)
                {
                    return Gated<ExportCreatedDto>.NotFound();
                }
                programName = cohort.Name;
                var rollCall = on.Contains(ModuleId.RollCall);
                var learning = cohort.Learning is not null;
                var mentoring = cohort.AtRisk is not null;
                var head = new List<string?> { "Youth" };
                if (learning)
                {
                    head.Add("Learning (%)");
                }
                if (rollCall)
                {
                    head.Add("Attendance (%)");
                }
                if (mentoring)
                {
                    head.Add("Check-ins");
                }
                head.Add("Status");
                lines.Add(ReportCsv.Line([.. head]));
                foreach (var y in cohort.Youth)
                {
                    var values = new List<string?> { y.Name };
                    if (learning)
                    {
                        values.Add(y.HasAccount ? ReportCsv.Number(y.Learning) : "No account");
                    }
                    if (rollCall)
                    {
                        values.Add(ReportCsv.Number(y.AttendanceRate));
                    }
                    if (mentoring)
                    {
                        values.Add(ReportCsv.Number(y.CheckIns));
                    }
                    values.Add(y.Status switch { "AtRisk" => "At risk", "Ended" => "Ended", _ => "On track" });
                    lines.Add(ReportCsv.Line([.. values]));
                }
                break;
            case "Progress":
                var board = await detailed.ProgressAsync(command.ProgramId!.Value, cancellationToken);
                if (board is null)
                {
                    return Gated<ExportCreatedDto>.NotFound();
                }
                programName = board.ProgramName;
                lines.Add(ReportCsv.Line(["Youth", .. board.Modules.Select(m => m.Title), "Quiz average (%)", "Overall (%)"]));
                foreach (var y in board.Youth)
                {
                    lines.Add(ReportCsv.Line([y.Name, .. y.Cells.Select(CellText), ReportCsv.Number(y.QuizAverage), ReportCsv.Number(y.Overall)]));
                }
                lines.Add(ReportCsv.Line(["Cohort average", .. board.Average.Modules.Select(ReportCsv.Number), ReportCsv.Number(board.Average.QuizAverage), ReportCsv.Number(board.Average.Overall)]));
                break;
            default:
                var staff = await detailed.StaffAsync(command.Days, cancellationToken);
                if (staff.Value is not { } report)
                {
                    return Gated<ExportCreatedDto>.Invalid(staff.Errors!);
                }
                var reviews = report.Reviews is not null;
                lines.Add(ReportCsv.Line([.. new[] { "Mentor", "Cohorts", "Youth", "Check-ins", reviews ? "Reviews" : null, "Load" }.OfType<string>()]));
                foreach (var m in report.Mentors)
                {
                    var cohorts = string.Join("; ", m.Cohorts.Select(c => $"{c.Name} ({(c.Lead ? "lead" : "supporting")})"));
                    var values = new List<string?> { m.Name, cohorts, ReportCsv.Number(m.Caseload), ReportCsv.Number(m.CheckIns) };
                    if (reviews)
                    {
                        values.Add(ReportCsv.Number(m.Reviews));
                    }
                    values.Add(m.Load);
                    lines.Add(ReportCsv.Line([.. values]));
                }
                break;
        }
        var rows = lines.Count - 1;
        var created = await StoreAsync(known.ToLowerInvariant(), programName, string.Join('\n', lines) + "\n", rows, $" · {known}", cancellationToken);
        return Gated<ExportCreatedDto>.Found(created);
    }

    private static string CellText(string cell) => cell switch
    {
        "Done" => "Done",
        "InProgress" => "In progress",
        "NoAccount" => "No account",
        _ => "Not started",
    };

    /// <summary>Stores the CSV for 7 days and audits it; the file is named for the organization, the kind, the program and the date.</summary>
    private async Task<ExportCreatedDto> StoreAsync(string kind, string? programName, string content, int rows, string auditSuffix, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var now = clock.GetUtcNow();
        var fileName = string.Join('-', new[] { Slug(organization.Name), kind, programName is null ? null : Slug(programName), now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) }
            .Where(p => !string.IsNullOrEmpty(p))) + ".csv";
        var export = new ReportExport(Guid.NewGuid(), tenant.OrganizationId, fileName, content, rows, tenant.ActorName, now);
        db.ReportExports.Add(export);
        audit.Record(new AuditEvent(AuditAction.Created, "ReportExport", export.Id, $"{fileName} · CSV · {rows} rows{auditSuffix}"));
        await db.SaveChangesAsync(cancellationToken);
        return new ExportCreatedDto(export.Id, fileName, rows, export.ExpiresAt);
    }

    private static string Slug(string name) =>
        string.Join('-', new string([.. name.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : ' ')]).Split(' ', StringSplitOptions.RemoveEmptyEntries));

    private async Task<ExportCreatedDto> ExportSummaryAsync(ExportReportCommand command, CancellationToken cancellationToken)
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
