using System.Text;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Reports;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Reports and exports: the Reports module.</summary>
public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var reports = app.MapGroup("/reports").RequireModule(ModuleId.Reports).RequirePermission(Permission.ViewReports);
        reports.MapGet(string.Empty, (Guid? programId, DateOnly? from, DateOnly? to, ReportsHandler handler, CancellationToken ct) =>
            handler.GetAsync(new ReportFilter(programId, from, to), ct));
        // The detailed reports (L2-127, ADR 0074): computed on read, a section per module.
        reports.MapGet("/cohorts/{programId:guid}", async (Guid programId, DetailedReportsHandler handler, CancellationToken ct) =>
            await handler.CohortAsync(programId, ct) is { } report ? Results.Ok(report) : Results.NotFound());
        reports.MapGet("/youth/{childId:guid}", async (Guid childId, DetailedReportsHandler handler, CancellationToken ct) =>
            await handler.YouthAsync(childId, ct) is { } report ? Results.Ok(report) : Results.NotFound());
        reports.MapGet("/staff", async (int? days, DetailedReportsHandler handler, CancellationToken ct) =>
            (await handler.StaffAsync(days, ct)).ToHttp()).RequireModule(ModuleId.Mentoring);
        reports.MapGet("/progress/{programId:guid}", async (Guid programId, DetailedReportsHandler handler, CancellationToken ct) =>
            await handler.ProgressAsync(programId, ct) is { } board ? Results.Ok(board) : Results.NotFound()).RequireModule(ModuleId.Learning);
        reports.MapPost("/exports", async (ExportReportCommand command, ReportsHandler handler, CancellationToken ct) =>
        {
            var export = await handler.ExportAsync(command, ct);
            return export.Value is { } created ? Results.Created($"/reports/exports/{created.Id}", created) : export.ToHttp();
        });
        reports.MapGet("/exports/{id:guid}", async (Guid id, ReportsHandler handler, CancellationToken ct) =>
        {
            var file = await handler.DownloadAsync(id, ct);
            return file.Status switch
            {
                ResultStatus.Done => Results.File(Encoding.UTF8.GetBytes(file.Content!), "text/csv", file.FileName),
                ResultStatus.Conflict => Results.StatusCode(StatusCodes.Status410Gone),
                _ => Results.NotFound(),
            };
        });
        app.MapPost("/events/{id:guid}/survey", async (Guid id, Application.Surveys.SendSurveyHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } sent ? Results.Created($"/surveys/{sent.Id}", sent) : Results.NotFound())
            .RequireModule(ModuleId.Reports).RequirePermission(Permission.ViewReports);
        return app;
    }
}
