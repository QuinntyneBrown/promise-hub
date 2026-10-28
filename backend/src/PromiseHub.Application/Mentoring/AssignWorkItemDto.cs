namespace PromiseHub.Application.Mentoring;

/// <summary>A published lesson, quiz or assignment a mentor may assign (L2-092 criterion 1), with its module and track.</summary>
public sealed record AssignWorkItemDto(Guid Id, string Kind, string Title, string ModuleTitle, Guid TrackId, string TrackName);
