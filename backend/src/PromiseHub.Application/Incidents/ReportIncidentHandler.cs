using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Incidents;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Incidents;

/// <summary>
/// Records an incident from the structured form (page: new-incident): every required fact is named when missing and nothing
/// is saved; a complete report needs review, is audited and is emailed at once to the program directors (L2-023 criterion 1).
/// </summary>
public sealed class ReportIncidentHandler(IPromiseHubDb db, ITenantContext tenant, IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(ReportIncidentCommand command, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (command.Category is null)
        {
            errors["category"] = "Choose the type.";
        }
        var child = command.ChildId is { } childId ? await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken) : null;
        if (child is null)
        {
            errors["childId"] = "Choose the child involved.";
        }
        if (command.OccurredAt is null)
        {
            errors["occurredAt"] = "Enter when it happened.";
        }
        if (string.IsNullOrWhiteSpace(command.WhatHappened))
        {
            errors["whatHappened"] = "Describe what happened.";
        }
        if (string.IsNullOrWhiteSpace(command.ActionTaken))
        {
            errors["actionTaken"] = "Describe what you did.";
        }
        if (command.GuardianContact is null)
        {
            errors["guardianContact"] = "Say whether the guardian was contacted.";
        }
        if (command.Severity is null)
        {
            errors["severity"] = "Choose the severity.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var incident = new Incident(Guid.NewGuid(), tenant.OrganizationId, command.Category!.Value, child!.Id, command.OccurredAt!.Value,
            string.IsNullOrWhiteSpace(command.Place) ? "Other" : command.Place.Trim(), command.WhatHappened!.Trim(), command.ActionTaken!.Trim(),
            command.GuardianContact!.Value, command.Severity!.Value, tenant.MembershipId, tenant.ActorName, clock.GetUtcNow());
        db.Incidents.Add(incident);
        audit.Record(new AuditEvent(AuditAction.Created, "Incident", incident.Id, $"{incident.Category} · {child.FullName} · reported by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        var supervisors = await db.Memberships.AsNoTracking().Where(m => m.Role == Role.ProgramDirector && m.RemovedAt == null).Select(m => m.Email).ToListAsync(cancellationToken);
        foreach (var to in supervisors)
        {
            await email.SendAsync(to, $"New incident to review: {incident.Category} · {child.FirstName}",
                $"{tenant.ActorName} reported an incident ({incident.Severity}). Open PromiseHub to review it.", cancellationToken);
        }
        return Result.Created(incident.Id);
    }
}
