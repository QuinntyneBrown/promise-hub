using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Events;

/// <summary>Roster sizes and slip states shared by the event list and the event page.</summary>
public static class EventQueries
{
    public static async Task<Dictionary<Guid, int>> RosterSizesAsync(IPromiseHubDb db, CancellationToken cancellationToken) =>
        (await db.Enrollments.AsNoTracking().Where(e => e.EndedAt == null).Select(e => e.ProgramId).ToListAsync(cancellationToken))
            .GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count());

    public static async Task<Dictionary<Guid, string>> SlipStatusesAsync(IPromiseHubDb db, CancellationToken cancellationToken) =>
        await db.PermissionSlips.AsNoTracking().ToDictionaryAsync(s => s.EventId, s => s.Status.ToString(), cancellationToken);

    /// <summary>"NotNeeded", "Draft" (slip not written yet) or "Sent".</summary>
    public static string SlipStatus(Event e, IReadOnlyDictionary<Guid, string> slips) =>
        !e.RequiresSlip ? "NotNeeded" : slips.GetValueOrDefault(e.Id, "Draft");
}
