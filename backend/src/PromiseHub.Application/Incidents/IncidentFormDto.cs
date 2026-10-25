namespace PromiseHub.Application.Incidents;

/// <summary>What the new-incident form needs: the children to choose from and the supervisor the report goes to.</summary>
public sealed record IncidentFormDto(string? Supervisor, IReadOnlyList<IncidentChildDto> Children);
