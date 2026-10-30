using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Sets a household's date reminders once its benefits check is done (L2-157 criterion 1): file the taxes on the next March 15, each child
/// under 18 turning 6 and 18 (30 days before each birthday still ahead), and each received or applied-for benefit's next renewal from the
/// catalogue. Idempotent: an existing reminder for the same thing and day is kept as it is, turned off or not. The caller saves.
/// </summary>
public sealed class LearningBondDatePlanner(IPromiseHubDb db, LearningBondBenefitsAccess access, TimeProvider clock)
{
    public static readonly TimeSpan Ahead = TimeSpan.FromDays(30);

    public async Task SyncAsync(Guid organizationId, Guid householdId, string timeZone, CancellationToken cancellationToken)
    {
        if (await access.AnswersAsync(householdId, cancellationToken) is not { } answers)
        {
            return;
        }
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(timeZone)).DateTime);
        var wanted = new List<(LearningBondDateReminderKind Kind, Guid? Child, string? Benefit, DateOnly Due, DateOnly On)>();
        var taxes = new DateOnly(today.Year, 3, 15);
        taxes = taxes > today ? taxes : taxes.AddYears(1);
        wanted.Add((LearningBondDateReminderKind.Taxes, null, null, taxes, taxes));
        var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == householdId && c.DateOfBirth != null).ToListAsync(cancellationToken);
        foreach (var child in children.Where(c => c.AgeOn(today) is < 18))
        {
            foreach (var (age, kind) in new[] { (6, LearningBondDateReminderKind.TurnsSix), (18, LearningBondDateReminderKind.TurnsEighteen) })
            {
                var birthday = child.DateOfBirth!.Value.AddYears(age);
                var due = birthday.AddDays(-Ahead.Days);
                if (due > today)
                {
                    wanted.Add((kind, child.Id, null, due, birthday));
                }
            }
        }
        var claimable = children.Where(c => answers.Custody.GetValueOrDefault(c.Id) is null or "Me" or "Shared").Select(c => (c.FirstName, c.AgeOn(today) ?? 0)).ToList();
        var household = new BenefitHousehold(answers, claimable);
        var applied = (await db.LearningBondBenefitApplications.AsNoTracking().Where(a => a.HouseholdId == householdId).ToListAsync(cancellationToken))
            .Where(a => a.Sent).Select(a => a.BenefitKey).ToHashSet();
        foreach (var entry in BenefitCatalogue.All.Where(e => e.Renews is not null && (applied.Contains(e.Key) || e.Rule.AlreadyGets?.Invoke(household) == true)))
        {
            var (month, day) = entry.Renews!.Value;
            var renews = new DateOnly(today.Year, month, day);
            renews = renews > today ? renews : renews.AddYears(1);
            wanted.Add((LearningBondDateReminderKind.Renewal, null, entry.Key, renews, renews));
        }
        var existing = await db.LearningBondDateReminders.Where(r => r.HouseholdId == householdId).ToListAsync(cancellationToken);
        foreach (var (kind, child, benefit, due, on) in wanted)
        {
            if (!existing.Any(r => r.Kind == kind && r.ChildId == child && r.BenefitKey == benefit && r.EventOn == on))
            {
                db.LearningBondDateReminders.Add(new LearningBondDateReminder(Guid.NewGuid(), organizationId, householdId, kind, child, benefit, due, on));
            }
        }
    }
}
