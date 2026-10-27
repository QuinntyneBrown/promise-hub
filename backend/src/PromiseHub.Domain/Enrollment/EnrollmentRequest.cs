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

    /// <summary>Who applied: a guardian, the young person, or a referrer (L2-071).</summary>
    public EnrollmentApplicant AppliedAs { get; private set; }

    public string? ReferrerName { get; private set; }
    public string? ReferrerRole { get; private set; }
    public string? ReferrerOrganization { get; private set; }

    /// <summary>The phone digits or email the referrer verified.</summary>
    public string? ReferrerContact { get; private set; }

    /// <summary>Why the young person is interested, or why the referrer refers them.</summary>
    public string? Reason { get; private set; }

    /// <summary>Whether the season consent was given at submission; false for a young person under 18 and for a referral.</summary>
    public bool SeasonConsent { get; private set; } = true;

    public bool Open => Status is EnrollmentRequestStatus.WaitingReview or EnrollmentRequestStatus.Waitlisted;

    /// <summary>Records who applied and what they agreed to.</summary>
    public void Applied(EnrollmentApplicant appliedAs, string? reason, bool seasonConsent, EnrollmentReferral? referral)
    {
        AppliedAs = appliedAs;
        Reason = reason;
        SeasonConsent = seasonConsent;
        ReferrerName = referral?.Name;
        ReferrerRole = referral?.Role;
        ReferrerOrganization = referral?.Organization;
        ReferrerContact = referral?.Contact;
    }

    public void Accept(string reviewer, DateTimeOffset now, string? note) => Decide(EnrollmentRequestStatus.Accepted, null, reviewer, now, note);

    public void Waitlist(int position, string reviewer, DateTimeOffset now, string? note) => Decide(EnrollmentRequestStatus.Waitlisted, position, reviewer, now, note);

    public void Decline(string reviewer, DateTimeOffset now, string reason) => Decide(EnrollmentRequestStatus.Declined, null, reviewer, now, reason);

    /// <summary>Moves the request to the cohort chosen at placement (L2-072); it leaves any place it held on the old waitlist.</summary>
    public void MoveTo(Guid programId)
    {
        ProgramId = programId;
        Position = null;
    }

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
