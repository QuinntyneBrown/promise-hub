using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Events;

public static class EventRules
{
    public static async Task<Dictionary<string, string>> CheckAsync(IPromiseHubDb db, SaveEventCommand c, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(c.Name))
        {
            errors["name"] = "Enter the event name.";
        }
        if (!await db.Programs.AnyAsync(p => p.Id == c.ProgramId && p.Status == ProgramStatus.Active, cancellationToken))
        {
            errors["programId"] = "Choose an active program.";
        }
        if (c.StartsAt is null)
        {
            errors["startsAt"] = "Enter when it starts.";
        }
        if (c.EndsAt is null)
        {
            errors["endsAt"] = "Enter when it ends.";
        }
        else if (c.StartsAt is { } start && c.EndsAt <= start)
        {
            errors["endsAt"] = "End after it starts.";
        }
        return errors;
    }

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
