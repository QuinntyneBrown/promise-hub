using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Curriculum;

/// <summary>
/// Awards a youth the automatic badges whose rules she now meets (L2-085 criteria 1 to 3, ADR 0058). Every learning handler calls it after
/// its own save; it checks each automatic, not deleted badge of the organization she does not hold, and adds the award, a notification and
/// an audit entry for each. A unique index keeps an award single when two events race.
/// </summary>
public sealed class BadgeAwarder(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<int> AwardAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var held = await db.BadgeAwards.AsNoTracking().Where(a => a.MembershipId == membershipId).Select(a => a.BadgeId).ToListAsync(cancellationToken);
        var badges = (await db.Badges.AsNoTracking().Where(b => b.Kind == BadgeKind.Automatic && b.DeletedAt == null).ToListAsync(cancellationToken))
            .Where(b => !held.Contains(b.Id)).ToList();
        if (badges.Count == 0)
        {
            return 0;
        }
        var name = await db.Memberships.AsNoTracking().Where(m => m.Id == membershipId).Select(m => m.PersonName).FirstAsync(cancellationToken);
        var now = clock.GetUtcNow();
        var awarded = 0;
        foreach (var badge in badges)
        {
            if (!await MeetsAsync(badge, membershipId, cancellationToken))
            {
                continue;
            }
            var award = new BadgeAward(Guid.NewGuid(), tenant.OrganizationId, badge.Id, membershipId, now, null);
            db.BadgeAwards.Add(award);
            db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, membershipId, "learning", $"You earned the {badge.Name} badge.", "/learning", now));
            audit.Record(new AuditEvent(AuditAction.Created, "BadgeAward", award.Id, $"{badge.Name} earned by {name} automatically"));
            awarded++;
        }
        if (awarded > 0)
        {
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Another event awarded the same badge first; the unique index keeps one award.
                return 0;
            }
        }
        return awarded;
    }

    private Task<bool> MeetsAsync(Badge badge, Guid membershipId, CancellationToken cancellationToken)
    {
        var target = badge.TargetId ?? Guid.Empty;
        return badge.Rule switch
        {
            BadgeRule.LessonCompleted => db.LessonProgress.AnyAsync(p => p.MembershipId == membershipId && p.LessonId == target, cancellationToken),
            BadgeRule.QuizPassed => db.QuizAttempts.AnyAsync(a => a.MembershipId == membershipId && a.QuizId == target && a.Status == AttemptStatus.Scored && a.Passed == true, cancellationToken),
            BadgeRule.AssignmentAccepted => db.AssignmentSubmissions.AnyAsync(s => s.MembershipId == membershipId && s.AssignmentId == target && s.Status == SubmissionStatus.Accepted, cancellationToken),
            BadgeRule.ModuleCompleted => ModuleDoneAsync(target, membershipId, cancellationToken),
            _ => Task.FromResult(false),
        };
    }

    /// <summary>Done as the youth's module page counts it (ADR 0051, ADR 0055): every published lesson done and every required published quiz passed.</summary>
    private async Task<bool> ModuleDoneAsync(Guid moduleId, Guid membershipId, CancellationToken cancellationToken)
    {
        if (!await db.CurriculumModules.AnyAsync(m => m.Id == moduleId && m.Status == ContentStatus.Published, cancellationToken))
        {
            return false;
        }
        var lessons = await db.Lessons.AsNoTracking().Where(l => l.ModuleId == moduleId && l.Status == ContentStatus.Published && l.DeletedAt == null)
            .Select(l => l.Id).ToListAsync(cancellationToken);
        if (lessons.Count == 0)
        {
            return false;
        }
        var done = await db.LessonProgress.AsNoTracking().Where(p => p.MembershipId == membershipId && lessons.Contains(p.LessonId))
            .Select(p => p.LessonId).Distinct().CountAsync(cancellationToken);
        if (done < lessons.Count)
        {
            return false;
        }
        var required = (await db.Quizzes.AsNoTracking().Where(q => q.ModuleId == moduleId && q.Status == ContentStatus.Published && q.RequiredToComplete)
            .ToListAsync(cancellationToken)).Where(q => q.LessonId is null || lessons.Contains(q.LessonId.Value)).ToList();
        foreach (var quiz in required)
        {
            if (!await db.QuizAttempts.AnyAsync(a => a.MembershipId == membershipId && a.QuizId == quiz.Id && a.Status == AttemptStatus.Scored && a.Score >= quiz.PassMark, cancellationToken))
            {
                return false;
            }
        }
        return true;
    }
}
