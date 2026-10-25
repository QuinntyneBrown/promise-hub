using System.Text.Json;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Infrastructure.Audit;

public sealed class AuditWriter(PromiseHubDbContext db, ITenantContext tenant, TimeProvider clock) : IAuditWriter
{
    public void Record(AuditEvent auditEvent)
    {
        db.AuditEntries.Add(new AuditEntry(
            Guid.NewGuid(),
            tenant.OrganizationId,
            clock.GetUtcNow(),
            tenant.IsResolved ? tenant.MembershipId : null,
            tenant.ActorName,
            auditEvent.Action,
            auditEvent.RecordType,
            auditEvent.RecordId,
            auditEvent.Summary,
            Serialize(auditEvent.Before),
            Serialize(auditEvent.After),
            auditEvent.Device));
    }

    private static string? Serialize(object? value) => value is null ? null : JsonSerializer.Serialize(value);
}
