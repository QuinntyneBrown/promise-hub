using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Enrollment;

/// <summary>
/// A child a guardian asked to enroll through the program's link: waiting for staff review, or waitlisted with a position
/// when the program was full. The child joins the roster only when staff accept it.
/// </summary>
public sealed class EnrollmentRequest : ITenantOwned
{
    public EnrollmentRequest(Guid id, Guid organizationId, Guid programId, Guid childId, Guid householdId, EnrollmentRequestStatus status, int? position,
        string submittedBy, DateTimeOffset submittedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ProgramId = programId;
        ChildId = childId;
        HouseholdId = householdId;
        Status = status;
        Position = position;
        SubmittedBy = submittedBy;
        SubmittedAt = submittedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ProgramId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public EnrollmentRequestStatus Status { get; private set; }

    /// <summary>The place on the waitlist, from 1.</summary>
    public int? Position { get; private set; }

    public string SubmittedBy { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
}
