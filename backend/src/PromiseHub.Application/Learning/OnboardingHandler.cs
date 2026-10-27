using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// A youth's first-run setup (L2-059, ADR 0047): read with defaults from the record, saved step by step, finished once (audited).
/// Only the caller's own membership is ever read or written.
/// </summary>
public sealed class OnboardingHandler(IPromiseHubDb db, ITenantContext tenant, Placement placement, IAuditWriter audit, TimeProvider clock)
{
    public async Task<YouthOnboardingDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var row = await Own().AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var program = await placement.ForMembershipAsync(tenant.MembershipId, cancellationToken);
        if (row is null)
        {
            return new YouthOnboardingDto("not-started", 1, await DefaultNameAsync(cancellationToken), null, true, true, false, program);
        }
        return new YouthOnboardingDto(row.Completed ? "completed" : "in-progress", row.Step, row.PreferredName, row.Pronouns,
            row.LessonReminders, row.MentorMessages, row.Announcements, program);
    }

    public async Task<Result> SaveAsync(SaveOnboardingRequest request, CancellationToken cancellationToken = default)
    {
        var errors = OnboardingRules.Validate(request);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var row = await Own().FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            row = new YouthOnboarding(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, clock.GetUtcNow());
            db.YouthOnboardings.Add(row);
        }
        row.Save(request.Step, request.PreferredName!.Trim(), request.Pronouns, request.LessonReminders, request.MentorMessages, request.Announcements);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> CompleteAsync(CancellationToken cancellationToken = default)
    {
        var row = await Own().FirstOrDefaultAsync(cancellationToken);
        if (row is null || row.PreferredName.Length == 0)
        {
            return Result.Conflict;
        }
        if (!row.Completed)
        {
            row.Complete(clock.GetUtcNow());
            audit.Record(new AuditEvent(AuditAction.Completed, "YouthOnboarding", row.Id, $"First-run setup completed as {row.PreferredName}"));
            await db.SaveChangesAsync(cancellationToken);
        }
        return Result.Done;
    }

    private IQueryable<YouthOnboarding> Own() =>
        db.YouthOnboardings.Where(o => o.MembershipId == tenant.MembershipId && o.OrganizationId == tenant.OrganizationId);

    /// <summary>The linked child's first name, otherwise the first word of the account's name.</summary>
    private async Task<string> DefaultNameAsync(CancellationToken cancellationToken)
    {
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        var first = childId is { } id
            ? await db.Children.AsNoTracking().Where(c => c.Id == id).Select(c => c.FirstName).FirstOrDefaultAsync(cancellationToken)
            : null;
        return first ?? tenant.ActorName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
    }
}
