using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Surveys;

/// <summary>One household's answer about one child: a rating from 1 to 5 and an optional comment.</summary>
public sealed class SurveyResponse : ITenantOwned
{
    public SurveyResponse(Guid id, Guid organizationId, Guid surveyId, Guid childId, Guid householdId, int rating, string? comment, DateTimeOffset answeredAt)
    {
        Id = id;
        OrganizationId = organizationId;
        SurveyId = surveyId;
        ChildId = childId;
        HouseholdId = householdId;
        Rating = rating;
        Comment = comment;
        AnsweredAt = answeredAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid SurveyId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public DateTimeOffset AnsweredAt { get; private set; }
}
