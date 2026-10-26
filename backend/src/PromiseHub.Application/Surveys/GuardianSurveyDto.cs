namespace PromiseHub.Application.Surveys;

/// <summary>The guardian's survey page: in the household's language, about one child and one event. Status is Open, Answered or Closed.</summary>
public sealed record GuardianSurveyDto(
    string Language,
    string Organization,
    string? OrganizationPhone,
    string GuardianFirstName,
    string EventName,
    string ChildFirstName,
    string SentBy,
    string Status);
