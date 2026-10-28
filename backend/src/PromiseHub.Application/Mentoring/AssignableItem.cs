using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Mentoring;

/// <summary>A lesson, quiz or assignment as assigning sees it: its module and track, and whether it is published all the way up.</summary>
public sealed record AssignableItem(Guid Id, AssignedWorkKind Kind, string Title, Guid ModuleId, string ModuleTitle, int ModulePosition, int Position,
    Guid TrackId, string TrackName, bool Published);
