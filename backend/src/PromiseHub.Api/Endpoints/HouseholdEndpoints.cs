using Microsoft.AspNetCore.Mvc;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Households;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Households, guardians and children: the Roster module.</summary>
public static class HouseholdEndpoints
{
    public static IEndpointRouteBuilder MapHouseholdEndpoints(this IEndpointRouteBuilder app)
    {
        var roster = app.MapGroup(string.Empty).RequireModule(ModuleId.Roster);

        roster.MapGet("/households", (string? q, string? filter, ListHouseholdsHandler handler, CancellationToken ct) => handler.HandleAsync(q, filter, ct));
        roster.MapGet("/households/{id:guid}", async (Guid id, GetHouseholdHandler handler, CancellationToken ct) =>
        {
            var (status, household) = await handler.HandleAsync(id, ct);
            return household is not null ? Results.Ok(household) : new Application.Result(status).ToHttp();
        });
        roster.MapPost("/households", async (CreateHouseholdCommand command, CreateHouseholdHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(command, ct)).ToHttp("/households")).RequirePermission(Permission.WriteHouseholds);
        roster.MapPost("/households/{id:guid}/children", async (Guid id, AddChildCommand command, AddChildHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp("/children")).RequirePermission(Permission.WriteHouseholds);
        roster.MapPost("/households/{id:guid}/guardians", async (Guid id, AddGuardianCommand command, AddGuardianHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp("/guardians")).RequirePermission(Permission.WriteHouseholds);
        roster.MapDelete("/households/{id:guid}", async (Guid id, [FromBody] DeleteHouseholdCommand command, DeleteHouseholdHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.DeleteHouseholds);
        roster.MapPut("/guardians/{id:guid}", async (Guid id, UpdateGuardianCommand command, UpdateGuardianHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.WriteHouseholds);
        roster.MapGet("/children", (string? q, FindChildrenHandler handler, CancellationToken ct) => handler.HandleAsync(q, ct));
        roster.MapGet("/children/{id:guid}", async (Guid id, GetChildHandler handler, CancellationToken ct) =>
        {
            var (status, child) = await handler.HandleAsync(id, ct);
            return child is not null ? Results.Ok(child) : new Application.Result(status).ToHttp();
        });
        roster.MapPut("/children/{id:guid}", async (Guid id, UpdateChildCommand command, UpdateChildHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.WriteHouseholds);
        roster.MapPut("/children/{id:guid}/medical", async (Guid id, MedicalRequest request, UpdateMedicalHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, new MedicalDetails(request.Allergies, request.Medication, request.Conditions, request.Doctor, request.RedAlert, request.AlertInstruction), ct)).ToHttp())
            .RequirePermission(Permission.WriteMedical);
        // Guardian consent on the child record (L2-058, ADR 0046): any staff role reads, admins and program directors send.
        roster.MapGet("/children/{id:guid}/consent", async (Guid id, ChildConsentHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) is { } consent ? Results.Ok(consent) : Results.NotFound());
        roster.MapPost("/children/{id:guid}/consent-request", async (Guid id, ChildConsentHandler handler, CancellationToken ct) =>
            ConsentRequestHttp.ToHttp(await handler.SendAsync(id, ct))).RequirePermission(Permission.WriteHouseholds);
        return app;
    }
}
