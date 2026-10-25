using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Households;

/// <summary>Families: the organization's households, searchable by child, guardian or phone, with filter counts.</summary>
public sealed class ListHouseholdsHandler(IPromiseHubDb db, TimeProvider clock)
{
    public async Task<HouseholdListDto> HandleAsync(string? q, string? filter, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var households = await db.Households.AsNoTracking().OrderBy(h => h.Name).ToListAsync(cancellationToken);
        var guardians = (await db.Guardians.AsNoTracking().ToListAsync(cancellationToken)).ToLookup(g => g.HouseholdId);
        var children = (await db.Children.AsNoTracking().ToListAsync(cancellationToken)).ToLookup(c => c.HouseholdId);

        var rows = households.Select(h =>
        {
            var hg = guardians[h.Id].OrderByDescending(g => g.IsPrimary).ToList();
            var hc = children[h.Id].OrderBy(c => c.AgeOn(today) ?? 99).ToList();
            var summary = new HouseholdSummaryDto(
                h.Id,
                h.Name,
                hg.FirstOrDefault()?.Name,
                [.. hc.Select(c => c.AgeOn(today) is { } age ? $"{c.FirstName} ({age})" : c.FirstName)],
                h.Language,
                hc.Count(c => c.HasMedicalFlag),
                !hg.Any(g => g.Reachable));
            var text = string.Join(' ', [h.Name, .. hg.Select(g => $"{g.Name} {g.Mobile} {g.Email}"), .. hc.Select(c => c.FullName)]);
            return (summary, text);
        }).ToList();

        var counts = new HouseholdCountsDto(
            rows.Count,
            rows.Count(r => r.summary.MissingInfo),
            rows.Count(r => r.summary.Language == "Spanish"),
            rows.Count(r => r.summary.Language == "French"),
            rows.Sum(r => r.summary.Children.Count));

        var matches = rows
            .Where(r => string.IsNullOrWhiteSpace(q) || r.text.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
            .Where(r => filter switch
            {
                "missing-info" => r.summary.MissingInfo,
                "spanish" => r.summary.Language == "Spanish",
                "french" => r.summary.Language == "French",
                _ => true,
            })
            .Select(r => r.summary)
            .ToList();
        return new HouseholdListDto(matches, counts);
    }
}
