using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>Who a message is for (a program, or an event's program, optionally one household language) and how it is sent.</summary>
public sealed record AudienceRequest(Guid? ProgramId, Guid? EventId, string? Language, string? Body, ChannelChoice Channel);
