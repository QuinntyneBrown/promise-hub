using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Guardian;

/// <summary>
/// A link texted or emailed to one household for one purpose: signing a child's slip, or the household's home page when
/// there is no slip. Only the token's hash is stored;
/// three wrong codes lock it for 15 minutes; a contact change revokes it (L2-026).
/// </summary>
public sealed class GuardianLink : ITenantOwned
{
    public const int MaxFailedCodes = 3;

    public GuardianLink(Guid id, Guid organizationId, Guid householdId, Guid? slipId, Guid? childId, string tokenHash, DateTimeOffset createdAt, Guid? surveyId = null)
    {
        SurveyId = surveyId;
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        SlipId = slipId;
        ChildId = childId;
        TokenHash = tokenHash;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid? SlipId { get; private set; }
    public Guid? ChildId { get; private set; }

    /// <summary>The survey this link answers, for a survey link.</summary>
    public Guid? SurveyId { get; private set; }
    public string TokenHash { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public int FailedCodes { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }

    public bool IsLocked(DateTimeOffset now) => LockedUntil > now;

    /// <summary>Counts a wrong code; true when this one locks the link.</summary>
    public bool WrongCode(DateTimeOffset now)
    {
        FailedCodes++;
        if (FailedCodes < MaxFailedCodes)
        {
            return false;
        }
        FailedCodes = 0;
        LockedUntil = now.AddMinutes(15);
        return true;
    }

    public void Verified() => FailedCodes = 0;

    public void Revoke(DateTimeOffset now) => RevokedAt ??= now;
}
