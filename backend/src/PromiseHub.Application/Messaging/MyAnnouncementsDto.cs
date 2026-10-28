namespace PromiseHub.Application.Messaging;

/// <summary>A member's announcements, newest first, and how many she has not read.</summary>
public sealed record MyAnnouncementsDto(int Unread, IReadOnlyList<MyAnnouncementDto> Announcements);
