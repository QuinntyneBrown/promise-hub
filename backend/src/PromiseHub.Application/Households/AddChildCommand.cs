namespace PromiseHub.Application.Households;

public sealed record AddChildCommand(string Name, DateOnly? DateOfBirth, string? School, string? Allergies);
