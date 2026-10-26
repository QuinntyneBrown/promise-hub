namespace PromiseHub.Application.Surveys;

public sealed record SurveySentDto(Guid Id, int Households, DateTimeOffset ClosesAt);
