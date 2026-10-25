using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Audit;

/// <summary>Immutable record of one action. It has no mutators; persistence refuses updates and deletes.</summary>
public sealed class AuditEntry : ITenantOwned
{
    public AuditEntry(
        Guid id,
        Guid organizationId,
        DateTimeOffset occurredAt,
        Guid? actorMembershipId,
        string actorName,
        AuditAction action,
        string recordType,
        Guid? recordId,
        string summary,
        string? beforeJson,
        string? afterJson,
        string? device)
    {
        Id = id;
        OrganizationId = organizationId;
        OccurredAt = occurredAt;
        ActorMembershipId = actorMembershipId;
        ActorName = actorName;
        Action = action;
        RecordType = recordType;
        RecordId = recordId;
        Summary = summary;
        BeforeJson = beforeJson;
        AfterJson = afterJson;
        Device = device;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public Guid? ActorMembershipId { get; private set; }
    public string ActorName { get; private set; }
    public AuditAction Action { get; private set; }
    public string RecordType { get; private set; }
    public Guid? RecordId { get; private set; }
    public string Summary { get; private set; }
    public string? BeforeJson { get; private set; }
    public string? AfterJson { get; private set; }
    public string? Device { get; private set; }
}
