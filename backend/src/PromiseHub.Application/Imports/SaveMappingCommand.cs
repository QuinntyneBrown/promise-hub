namespace PromiseHub.Application.Imports;

public sealed record SaveMappingCommand(Dictionary<string, string>? Mapping, Guid? ProgramId);
