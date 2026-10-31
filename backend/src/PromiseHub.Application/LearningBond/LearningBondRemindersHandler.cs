using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>The household's date reminders still ahead and Turn off (L2-157 criteria 1 and 3). Only the household's own.</summary>
public sealed class LearningBondRemindersHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> ListAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var reminders = (await db.LearningBondDateReminders.AsNoTracking().Where(r => r.HouseholdId == scope!.Household.Id).ToListAsync(cancellationToken))
            .Where(r => r.SentAt is null && r.MissedAt is null).OrderBy(r => r.DueOn).ToList();
        var names = await db.Children.AsNoTracking().Where(c => c.HouseholdId == scope!.Household.Id).ToDictionaryAsync(c => c.Id, c => c.FirstName, cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondRemindersDto(GuardianLanguage.Code(scope!.Household.Language), scope.Organization.Name,
            [.. reminders.Select(r => new LearningBondDateReminderDto(r.Id, r.Kind.ToString(), Subject(r, names), r.DueOn, r.EventOn, r.TurnedOffAt is not null))]));
    }

    public async Task<GuardianResult> TurnOffAsync(GuardianRequest request, Guid reminderId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var reminder = await db.LearningBondDateReminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.HouseholdId == scope!.Household.Id, cancellationToken);
        if (reminder is null)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        reminder.TurnOff(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondDateReminder), reminder.Id, $"Learning Bond reminder turned off: {reminder.Kind}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    /// <summary>What a reminder is about: the tax year, the child's first name, or the benefit's name.</summary>
    public static string Subject(LearningBondDateReminder r, IReadOnlyDictionary<Guid, string> names) => r.Kind switch
    {
        LearningBondDateReminderKind.Taxes => (r.EventOn.Year - 1).ToString(System.Globalization.CultureInfo.InvariantCulture),
        LearningBondDateReminderKind.Renewal => BenefitCatalogue.Named(r.BenefitKey ?? string.Empty)?.Name ?? string.Empty,
        _ => r.ChildId is { } id ? names.GetValueOrDefault(id, string.Empty) : string.Empty,
    };
}
