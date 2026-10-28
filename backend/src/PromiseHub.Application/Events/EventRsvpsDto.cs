namespace PromiseHub.Application.Events;

/// <summary>A session's RSVPs: the counts, no reply being roster youth who sign in and have not answered, and each answer, newest first.</summary>
public sealed record EventRsvpsDto(int Going, int Maybe, int CantMake, int NoReply, IReadOnlyList<EventRsvpDto> Responses);
