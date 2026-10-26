namespace PromiseHub.Application.Organizations;

/// <summary>Guardian data requests, open first.</summary>
public sealed record DataRequestListDto(IReadOnlyList<DataRequestDto> Requests);
