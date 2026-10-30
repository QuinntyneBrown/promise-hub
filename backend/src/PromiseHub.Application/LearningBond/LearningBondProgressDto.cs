namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-submitted (L2-150 criterion 1): where the application went and when, the fields as sent (SINs as their last three digits),
/// the estimate, how many of the three next steps are done, the expected deposit window, and an open document request.
/// </summary>
public sealed record LearningBondProgressDto(string Language, string Organization, string Explanation, Guid ApplicationId, Guid ChildId, string FirstName,
    string Provider, string Status, DateTimeOffset SubmittedAt, int? Estimate, int? DepositAmount, int StepsDone, DateOnly ExpectedFrom, DateOnly ExpectedTo,
    LearningBondApplicationFieldsDto Fields, LearningBondDocumentRequestDto? Document);
