using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Imports;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Roster import from a spreadsheet: upload, map, run (Roster module; admins and program directors).</summary>
public static class ImportEndpoints
{
    /// <summary>A little over 5,000 rows of a generous spreadsheet.</summary>
    private const long MaxUpload = 10 * 1024 * 1024;

    public static IEndpointRouteBuilder MapImportEndpoints(this IEndpointRouteBuilder app)
    {
        var imports = app.MapGroup("/imports").RequireModule(ModuleId.Roster).RequirePermission(Permission.WriteHouseholds);
        imports.MapPost("/", async (HttpRequest request, UploadImportHandler handler, CancellationToken ct) =>
        {
            if (!request.HasFormContentType || request.ContentLength > MaxUpload)
            {
                return Results.Json(new { errors = new { file = "Choose a CSV or XLSX file of up to 10 MB." } }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }
            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file");
            if (file is null)
            {
                return Results.Json(new { errors = new { file = "Choose a CSV or XLSX file." } }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }
            using var buffer = new MemoryStream();
            await file.CopyToAsync(buffer, ct);
            var (result, upload) = await handler.HandleAsync(Path.GetFileName(file.FileName), buffer.ToArray(), ct);
            return upload is not null ? Results.Created($"/imports/{upload.Id}", upload) : result.ToHttp();
        }).DisableAntiforgery();
        imports.MapPut("/{id:guid}/mapping", async (Guid id, SaveMappingCommand command, SaveMappingHandler handler, CancellationToken ct) =>
        {
            var (result, preview) = await handler.HandleAsync(id, command, ct);
            return preview is not null ? Results.Ok(preview) : result.ToHttp();
        });
        imports.MapPost("/{id:guid}/run", async (Guid id, RunImportCommand command, RunImportHandler handler, CancellationToken ct) =>
        {
            var (result, summary) = await handler.HandleAsync(id, command, ct);
            return summary is not null ? Results.Ok(summary) : result.ToHttp();
        });
        return app;
    }
}
