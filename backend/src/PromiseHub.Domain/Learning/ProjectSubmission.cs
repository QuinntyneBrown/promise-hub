using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>A youth's coding project sent to their mentor (L2-070 criterion 4, ADR 0051): one per youth membership and project.</summary>
public sealed class ProjectSubmission : ITenantOwned
{
    public const int MaximumNote = 1000;

    public ProjectSubmission(Guid id, Guid organizationId, Guid membershipId, Guid lessonId, string code, string? note, DateTimeOffset submittedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        LessonId = lessonId;
        Code = code;
        Note = note;
        SubmittedAt = submittedAt;
        Status = SubmissionStatus.Submitted;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid LessonId { get; private set; }
    public string Code { get; private set; }
    public string? Note { get; private set; }
    public SubmissionStatus Status { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
}
