namespace PromiseHub.Application.Messaging;

/// <summary>One announcement in a youth's or mentor's feed (L2-105 criterion 5): who sent it, their role, when, the program and whether she read it.</summary>
public sealed record MyAnnouncementDto(Guid Id, string Title, string Body, string From, string FromRole, DateTimeOffset SentAt, string? Program, bool Read);
