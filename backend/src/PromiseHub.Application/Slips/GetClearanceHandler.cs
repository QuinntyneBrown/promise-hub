using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>The day-of view of a session whose event needs a slip: cleared, missing and declined, missing first (L2-016 criterion 2).</summary>
public sealed class GetClearanceHandler(IPromiseHubDb db, SlipReader reader)
{
    private static readonly Dictionary<string, int> Order = new() { ["Missing"] = 0, ["Declined"] = 1, ["Cleared"] = 2 };

    public async Task<ClearanceDto?> HandleAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == sessionId, cancellationToken);
        var slip = e is null || !e.RequiresSlip ? null : await db.PermissionSlips.AsNoTracking().FirstOrDefaultAsync(s => s.EventId == sessionId, cancellationToken);
        if (e is null || slip is null || slip.Status != SlipStatus.Sent)
        {
            return null;
        }
        var responses = await reader.ResponsesAsync(slip, e.ProgramId, cancellationToken);
        var households = await db.Children.AsNoTracking().Where(c => responses.Select(r => r.ChildId).Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.HouseholdId, cancellationToken);
        var children = responses
            .Select(r => new ClearanceChildDto(r.ChildId, households[r.ChildId], r.Child, r.Status switch { "Signed" => "Cleared", "Declined" => "Declined", _ => "Missing" }))
            .OrderBy(c => Order[c.Status]).ThenBy(c => c.Name)
            .ToList();
        return new ClearanceDto(slip.Id, string.IsNullOrEmpty(slip.Title) ? e.Name : slip.Title, children.Count(c => c.Status == "Cleared"),
            children.Count(c => c.Status == "Missing"), children.Count(c => c.Status == "Declined"), children);
    }
}
