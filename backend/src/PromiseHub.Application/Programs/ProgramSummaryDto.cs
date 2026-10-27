namespace PromiseHub.Application.Programs;

public sealed record ProgramSummaryDto(Guid Id, string Name, string? Schedule, DateOnly StartsOn, DateOnly EndsOn, int Enrolled, int Capacity, bool EnrollmentOpen, string Status, string? Term = null);
