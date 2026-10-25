namespace PromiseHub.Application.Guardian;

/// <summary>A no-show text the household hasn't answered: the session and the children not checked in.</summary>
public sealed record GuardianHomeNoShowDto(Guid EventId, string Event, DateTimeOffset StartsAt, IReadOnlyList<string> Children);
