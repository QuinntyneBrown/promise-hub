using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Enrollment;

/// <summary>A staff-only note on an application (L2-072): who wrote it, when, and the text. No guardian page reads it.</summary>
public sealed class EnrollmentNote : ITenantOwned
{
    public const int MaxLength = 2000;

    public EnrollmentNote(Guid id, Guid organizationId, Guid enrollmentRequestId, string author, string text, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        EnrollmentRequestId = enrollmentRequestId;
        Author = author;
        Text = text;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EnrollmentRequestId { get; private set; }
    public string Author { get; private set; }
    public string Text { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
