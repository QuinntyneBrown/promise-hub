namespace PromiseHub.Application.Programs;

public sealed record SaveProgramCommand(string Name, DateOnly? StartsOn, DateOnly? EndsOn, string? Schedule, int Capacity, string? Ages, bool EnrollmentOpen, bool SeasonConsent, string? Term = null);
