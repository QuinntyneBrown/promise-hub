using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>An announcement as staff compose it (L2-105): a null program is all programs, a null send time is now.</summary>
public sealed record ComposeAnnouncementRequest(string? Title, string? Body, Guid? ProgramId, AnnouncementAudience? Audience, DateTimeOffset? SendAt);
