namespace PromiseHub.Application.Guardian;

/// <summary>The guardian announcements page (`guardian-announcements`, L2-103): newest first, with how many are unread.</summary>
public sealed record GuardianAnnouncementsDto(string Language, string Organization, string? Phone, int Unread, IReadOnlyList<GuardianAnnouncementDto> Announcements);
