using PromiseHub.Api.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Staff;

namespace PromiseHub.Api.Endpoints;

/// <summary>People administration (L2-112 to L2-114, ADR 0070): admins only; always part of the product, not a module.</summary>
public static class PeopleEndpoints
{
    public static IEndpointRouteBuilder MapPeopleEndpoints(this IEndpointRouteBuilder app)
    {
        var people = app.MapGroup("/people").RequirePermission(Permission.ManageStaff);
        people.MapGet("", async (string? q, string? role, string? status, Guid? programId, int? page, PeopleHandler handler, CancellationToken ct) =>
        {
            var result = await handler.ListAsync(new PeopleQuery(q, role, status, programId, page ?? 1), ct);
            return result.Page is { } list ? Results.Ok(list) : Results.Json(new { errors = result.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity);
        });
        people.MapGet("/{id:guid}", async (Guid id, PeopleHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) is { } person ? Results.Ok(person) : Results.NotFound());
        people.MapPost("/{id:guid}/deactivate", async (Guid id, AccountLifecycleHandler handler, CancellationToken ct) =>
            (await handler.DeactivateAsync(id, ct)).ToHttp());
        people.MapPost("/{id:guid}/reactivate", async (Guid id, AccountLifecycleHandler handler, CancellationToken ct) =>
            (await handler.ReactivateAsync(id, ct)).ToHttp());
        return app;
    }
}
