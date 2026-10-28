using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// One announcement on the staff list (L2-105 criterion 7): Sent or Scheduled, how many youth and mentors it reaches in the app, how many
/// of them have read it, and how many households were sent the guardians' copy.
/// </summary>
public sealed record AnnouncementRowDto(Guid Id, string Title, string Body, string? Program, AnnouncementAudience Audience, string Status,
    DateTimeOffset SendAt, string SentBy, int Recipients, int Reads, int Households);
