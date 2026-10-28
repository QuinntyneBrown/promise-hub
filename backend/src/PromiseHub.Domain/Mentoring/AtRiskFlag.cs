using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Mentoring;

/// <summary>
/// A mentor's worry about one of his youth, on record until it is resolved (L2-091, ADR 0062): who raised it and when, how serious it is
/// and why; once resolved, who resolved it, when, the outcome and an optional note. A youth has at most one open flag. Never deleted.
/// </summary>
public sealed class AtRiskFlag : ITenantOwned
{
    public const int MaximumText = 1000;

    public AtRiskFlag(Guid id, Guid organizationId, Guid childId, Guid raisedByMembershipId, AtRiskFlagSeverity severity, string reason,
        DateTimeOffset raisedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        RaisedByMembershipId = raisedByMembershipId;
        Severity = severity;
        Reason = reason;
        RaisedAt = raisedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid RaisedByMembershipId { get; private set; }
    public AtRiskFlagSeverity Severity { get; private set; }
    public string Reason { get; private set; }
    public DateTimeOffset RaisedAt { get; private set; }
    public Guid? ResolvedByMembershipId { get; private set; }
    public AtRiskFlagOutcome? Outcome { get; private set; }
    public string? ResolutionNote { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }

    public bool IsOpen => ResolvedAt is null;

    public void Resolve(Guid resolvedByMembershipId, AtRiskFlagOutcome outcome, string? note, DateTimeOffset at)
    {
        ResolvedByMembershipId = resolvedByMembershipId;
        Outcome = outcome;
        ResolutionNote = note;
        ResolvedAt = at;
    }
}
