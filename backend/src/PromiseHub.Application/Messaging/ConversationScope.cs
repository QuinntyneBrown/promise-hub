using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// One youth's conversation as the caller stands to it (L2-106, L2-108): the youth, her current mentor (null when she has none), whether the
/// caller writes in it (the youth or that mentor) or supervises it (admins and program directors), and why sending is blocked.
/// </summary>
public sealed record ConversationScope(Membership Youth, Membership? Mentor, bool IsParticipant, bool IsSupervisor, string? Blocked)
{
    public bool CanSend => IsParticipant && Mentor is not null && Blocked is null;
}
