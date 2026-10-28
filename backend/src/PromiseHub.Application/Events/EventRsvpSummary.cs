using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Events;

/// <summary>The RSVPs of one session for the staff who run it (L2-094 criterion 4, ADR 0064).</summary>
public static class EventRsvpSummary
{
    public static async Task<EventRsvpsDto> ForAsync(IPromiseHubDb db, Event e, CancellationToken cancellationToken)
    {
        var answers = await db.EventRsvps.AsNoTracking().Where(r => r.EventId == e.Id).ToListAsync(cancellationToken);
        var childIds = answers.Select(a => a.ChildId).ToList();
        var names = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => $"{c.FirstName} {c.LastName}", cancellationToken);
        var roster = await db.Enrollments.AsNoTracking().Where(x => x.ProgramId == e.ProgramId && x.EndedAt == null).Select(x => x.ChildId).ToListAsync(cancellationToken);
        var signIn = await db.Memberships.AsNoTracking()
            .Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null && roster.Contains(m.ChildId.Value))
            .Select(m => m.ChildId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);
        var answered = childIds.ToHashSet();
        return new EventRsvpsDto(
            answers.Count(a => a.Response == RsvpResponse.Going),
            answers.Count(a => a.Response == RsvpResponse.Maybe),
            answers.Count(a => a.Response == RsvpResponse.CantMake),
            signIn.Count(id => !answered.Contains(id)),
            [.. answers.OrderByDescending(a => a.AnsweredAt).ThenBy(a => names.GetValueOrDefault(a.ChildId, ""), StringComparer.Ordinal)
                .Select(a => new EventRsvpDto(a.ChildId, names.GetValueOrDefault(a.ChildId, ""), a.Response.ToString(), a.Note, a.AnsweredAt))]);
    }
}
