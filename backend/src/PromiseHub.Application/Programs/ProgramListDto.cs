namespace PromiseHub.Application.Programs;

public sealed record ProgramListDto(IReadOnlyList<ProgramSummaryDto> Programs, int Active, int Archived, int Enrolled);
