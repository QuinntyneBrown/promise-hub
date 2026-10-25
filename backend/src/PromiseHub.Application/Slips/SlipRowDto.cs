namespace PromiseHub.Application.Slips;

public sealed record SlipRowDto(Guid Id, Guid EventId, string Title, string ProgramName, DateOnly SignBy, string Status, int Children, int Signed, int Declined);
