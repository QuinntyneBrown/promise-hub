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
    public string? ReviewedBy { get; private set; }
    public DateTimeOffset? ReviewedAt { get; private set; }

    /// <summary>The note or reason the guardian reads.</summary>
    public string? Note { get; private set; }

    public bool Open => Status is EnrollmentRequestStatus.WaitingReview or EnrollmentRequestStatus.Waitlisted;

    public void Accept(string reviewer, DateTimeOffset now, string? note) => Decide(EnrollmentRequestStatus.Accepted, null, reviewer, now, note);

    public void Waitlist(int position, string reviewer, DateTimeOffset now, string? note) => Decide(EnrollmentRequestStatus.Waitlisted, position, reviewer, now, note);

    public void Decline(string reviewer, DateTimeOffset now, string reason) => Decide(EnrollmentRequestStatus.Declined, null, reviewer, now, reason);

    /// <summary>Moves up one place when a child ahead leaves the waitlist.</summary>
    public void MoveUp() => Position = Position - 1;

    private void Decide(EnrollmentRequestStatus status, int? position, string reviewer, DateTimeOffset now, string? note)
    {
        Status = status;
        Position = position;
        ReviewedBy = reviewer;
        ReviewedAt = now;
        Note = note;
    }
}
