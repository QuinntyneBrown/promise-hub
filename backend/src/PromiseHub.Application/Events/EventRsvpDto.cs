namespace PromiseHub.Application.Events;

/// <summary>One youth's answer for a session, with her note for staff (L2-094 criterion 4).</summary>
public sealed record EventRsvpDto(Guid ChildId, string ChildName, string Response, string? Note, DateTimeOffset AnsweredAt);
