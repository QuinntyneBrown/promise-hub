namespace PromiseHub.Application.Learning;

/// <summary>The signed-in youth and the child record their account links to; <see cref="Child"/> is null until an admin links one.</summary>
public sealed record LearnerDto(string PersonName, LearnerChildDto? Child);
