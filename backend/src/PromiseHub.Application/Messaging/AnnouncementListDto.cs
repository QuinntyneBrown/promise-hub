namespace PromiseHub.Application.Messaging;

/// <summary>The organization's announcements, newest send time first.</summary>
public sealed record AnnouncementListDto(IReadOnlyList<AnnouncementRowDto> Announcements);
