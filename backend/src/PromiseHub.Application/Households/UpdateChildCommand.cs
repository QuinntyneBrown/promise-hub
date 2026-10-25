namespace PromiseHub.Application.Households;

public sealed record UpdateChildCommand(string Name, DateOnly? DateOfBirth, string? School);
