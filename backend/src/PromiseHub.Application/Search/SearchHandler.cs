using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Households;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Search;

/// <summary>
/// Finds the organization's children, households and events by name, email or phone fragment (L2-039). Results respect
/// the caller's permitted children (<see cref="RosterAccess"/>) and the modules that are on.
/// </summary>
public sealed class SearchHandler(IPromiseHubDb db, IModuleGate modules, RosterAccess access, TimeProvider clock)
{
    private const int Limit = 10;

    public async Task<SearchResultsDto> HandleAsync(string? q, CancellationToken cancellationToken = default)
    {
        var text = q?.Trim() ?? "";
        if (text.Length == 0)
        {
            return new SearchResultsDto([], [], (await modules.IsOnAsync(ModuleId.Slips, cancellationToken)) ? [] : null);
        }
        var digits = new string([.. text.Where(char.IsDigit)]);
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var permitted = await access.PermittedChildrenAsync(cancellationToken);

        var children = (await db.Children.AsNoTracking().ToListAsync(cancellationToken))
            .Where(c => permitted is null || permitted.Contains(c.Id)).ToList();
        var households = await db.Households.AsNoTracking().ToListAsync(cancellationToken);
        var guardians = (await db.Guardians.AsNoTracking().ToListAsync(cancellationToken)).ToLookup(g => g.HouseholdId);
        var visibleHouseholds = permitted is null ? households : [.. households.Where(h => children.Any(c => c.HouseholdId == h.Id))];
        var names = households.ToDictionary(h => h.Id, h => h.Name);

        var childHits = children
            .Where(c => Matches(c.FullName, text))
            .OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Take(Limit)
            .Select(c => new ChildHitDto(c.Id, c.FullName, c.AgeOn(today), c.HouseholdId, names.GetValueOrDefault(c.HouseholdId, "")))
            .ToList();
        var householdHits = visibleHouseholds
            .Where(h => Matches(h.Name, text) || guardians[h.Id].Any(g =>
                Matches(g.Name, text) || Matches(g.Email, text) || (digits.Length >= 3 && Digits(g.Mobile).Contains(digits, StringComparison.Ordinal))))
            .OrderBy(h => h.Name)
            .Take(Limit)
            .Select(h =>
            {
                var hg = guardians[h.Id].OrderByDescending(g => g.IsPrimary).ToList();
                return new HouseholdHitDto(h.Id, h.Name, string.Join(", ", hg.Select(g => g.Name)), hg.FirstOrDefault(g => g.Mobile is not null)?.Mobile, h.Language);
            })
            .ToList();

        List<EventHitDto>? eventHits = null;
        if (await modules.IsOnAsync(ModuleId.Slips, cancellationToken))
        {
            eventHits = [.. (await db.Events.AsNoTracking().ToListAsync(cancellationToken))
                .Where(e => Matches(e.Name, text))
                .OrderBy(e => e.StartsAt)
                .Take(Limit)
                .Select(e => new EventHitDto(e.Id, e.Name, e.StartsAt, e.Place))];
        }
        return new SearchResultsDto(childHits, householdHits, eventHits);
    }

    private static bool Matches(string? value, string text) => value is not null && value.Contains(text, StringComparison.OrdinalIgnoreCase);

    private static string Digits(string? value) => value is null ? "" : new string([.. value.Where(char.IsDigit)]);
}
