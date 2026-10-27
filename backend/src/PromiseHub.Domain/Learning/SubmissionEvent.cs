using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>A step of a submission's history (L2-078 criterion 1, ADR 0056): what happened, who did it, any note, and when. Never changes.</summary>
public sealed class SubmissionEvent : ITenantOwned
{
    public SubmissionEvent(Guid id, Guid organizationId, Guid submissionId, SubmissionEventKind kind, string actorName, string? note, DateTimeOffset at)
    {
        Id = id;
        OrganizationId = organizationId;
        SubmissionId = submissionId;
        Kind = kind;
        ActorName = actorName;
        Note = note;
        At = at;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid SubmissionId { get; private set; }
    public SubmissionEventKind Kind { get; private set; }
    public string ActorName { get; private set; }
    public string? Note { get; private set; }
    public DateTimeOffset At { get; private set; }
}
