using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The daily claim work for one organization, run by the dispatch runner in that organization's scope (L2-151 criteria 3 and 5, L2-034):
/// each due reminder is texted once with the link to resume, unless the household said it isn't interested or the consent ended; a claim
/// paused with no activity for 180 days closes as Not completed, its SINs destroyed. Nothing runs while the module is off.
/// </summary>
public sealed class LearningBondClaimJob(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, LearningBondGuardianTexter texter, GuardianLinkIssuer links, IAuditWriter audit,
    LearningBondBenefitsAccess benefits, TimeProvider clock)
{
    public static readonly TimeSpan CloseAfter = TimeSpan.FromDays(180);

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return;
        }
        var now = clock.GetUtcNow();
        await SendRemindersAsync(now, cancellationToken);
        await SendDateRemindersAsync(now, cancellationToken);
        await CloseIdleAsync(now, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SendRemindersAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var due = (await db.LearningBondReminders.Where(r => r.SentAt == null && r.CancelledAt == null).ToListAsync(cancellationToken)).Where(r => r.DueAt <= now)
            .OrderBy(r => r.DueAt).ToList();
        if (due.Count == 0)
        {
            return;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var sender = await db.LearningBondSettings.AsNoTracking().Select(s => s.SenderName).FirstOrDefaultAsync(cancellationToken) ?? SenderNameRule.Default(organization.Name);
        foreach (var claimDue in due.GroupBy(r => r.ClaimId))
        {
            var claim = await db.LearningBondClaims.AsNoTracking().SingleAsync(c => c.Id == claimDue.Key, cancellationToken);
            var consent = await db.LearningBondConsents.AsNoTracking().SingleAsync(c => c.Id == claim.ConsentId, cancellationToken);
            var declined = (await db.LearningBondInvitations.AsNoTracking().Where(i => i.HouseholdId == claim.HouseholdId).ToListAsync(cancellationToken))
                .OrderByDescending(i => i.SentAt).FirstOrDefault() is { DeclinedAt: not null };
            if (claim.Status != LearningBondClaimStatus.Paused || !consent.InForce || declined)
            {
                foreach (var reminder in claimDue)
                {
                    reminder.Cancel(now);
                }
                continue;
            }
            // A reminder missed for days is sent once; any older one due alongside it is skipped rather than sent twice.
            foreach (var reminder in claimDue)
            {
                reminder.MarkSent(now);
            }
            var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == claim.HouseholdId, cancellationToken);
            var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == claim.ChildId, cancellationToken);
            var link = $"{links.IssueLearningBond(household.Id)}/children/{child.Id}/paused";
            await texter.QueueAsync(household.Id, $"Learning Bond: {child.FirstName}",
                LearningBondTexts.Reminder(GuardianLanguage.Code(household.Language), sender, child.FirstName, link), cancellationToken);
            audit.Record(new AuditEvent(AuditAction.Sent, nameof(LearningBondReminder), claim.Id, $"Learning Bond reminder sent for {child.FirstName}"));
        }
    }

    /// <summary>
    /// Date reminders (L2-157 criteria 2 to 4): each on its day from 10:00 where the organization is, once, while the Benefits consent is in
    /// force; one whose day passed unsent is missed, never sent late. A tax reminder sent sets next year's.
    /// </summary>
    private async Task SendDateRemindersAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var ahead = (await db.LearningBondDateReminders.Where(r => r.SentAt == null && r.MissedAt == null && r.TurnedOffAt == null).ToListAsync(cancellationToken)).ToList();
        if (ahead.Count == 0)
        {
            return;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var local = TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone));
        var today = DateOnly.FromDateTime(local.DateTime);
        var sender = await db.LearningBondSettings.AsNoTracking().Select(s => s.SenderName).FirstOrDefaultAsync(cancellationToken) ?? SenderNameRule.Default(organization.Name);
        foreach (var reminder in ahead)
        {
            if (reminder.DueOn < today)
            {
                reminder.MarkMissed(now);
                continue;
            }
            if (reminder.DueOn > today || local.Hour < 10)
            {
                continue;
            }
            reminder.MarkSent(now);
            if (!await benefits.ConsentedAsync(reminder.HouseholdId, cancellationToken))
            {
                continue;
            }
            var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == reminder.HouseholdId, cancellationToken);
            var names = await db.Children.AsNoTracking().Where(c => c.HouseholdId == household.Id).ToDictionaryAsync(c => c.Id, c => c.FirstName, cancellationToken);
            var code = GuardianLanguage.Code(household.Language);
            var link = $"{links.IssueLearningBond(household.Id)}/reminders";
            await texter.QueueAsync(household.Id, $"Learning Bond: {reminder.Kind}",
                LearningBondTexts.DateReminder(code, sender, reminder.Kind.ToString(), LearningBondRemindersHandler.Subject(reminder, names), reminder.EventOn, link), cancellationToken);
            audit.Record(new AuditEvent(AuditAction.Sent, nameof(LearningBondDateReminder), reminder.Id, $"Learning Bond reminder sent: {reminder.Kind}"));
            if (reminder.Kind == LearningBondDateReminderKind.Taxes)
            {
                var next = reminder.EventOn.AddYears(1);
                db.LearningBondDateReminders.Add(new LearningBondDateReminder(Guid.NewGuid(), reminder.OrganizationId, reminder.HouseholdId, LearningBondDateReminderKind.Taxes,
                    null, null, next, next));
            }
        }
    }

    private async Task CloseIdleAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var idle = (await db.LearningBondClaims.Where(c => c.Status == LearningBondClaimStatus.Paused).ToListAsync(cancellationToken))
            .Where(c => now - c.UpdatedAt >= CloseAfter).ToList();
        foreach (var claim in idle)
        {
            claim.Close(now);
            (await db.LearningBondConsents.SingleAsync(c => c.Id == claim.ConsentId, cancellationToken)).Close(now);
            foreach (var open in (await db.LearningBondReminders.Where(r => r.ClaimId == claim.Id).ToListAsync(cancellationToken)).Where(r => r.Open))
            {
                open.Cancel(now);
            }
            audit.Record(new AuditEvent(AuditAction.Deleted, nameof(LearningBondClaim), claim.Id, "Learning Bond claim closed as Not completed after 180 days; child SIN destroyed"));
            // The guardian's SIN goes too once no other claim of the household still needs it.
            var others = await db.LearningBondClaims.AsNoTracking().AnyAsync(c => c.HouseholdId == claim.HouseholdId && c.Id != claim.Id
                && c.Status != LearningBondClaimStatus.NotCompleted && c.Status != LearningBondClaimStatus.Deposited, cancellationToken);
            if (!others && await db.LearningBondIntakes.FirstOrDefaultAsync(i => i.HouseholdId == claim.HouseholdId, cancellationToken) is { } intake
                && intake.DestroyGuardianSin(now))
            {
                audit.Record(new AuditEvent(AuditAction.Deleted, nameof(LearningBondIntake), intake.Id, "Learning Bond: guardian SIN destroyed; last three digits kept"));
            }
        }
    }
}
