using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// Quiz results awaiting the mentor's approval (L2-081, ADR 0057), for the mentor's youth only: listed oldest first, approved one at a time
/// at the auto-score or an override from 0 to 100, or all at once at their auto-scores. Each approval notifies the youth and is audited with
/// the auto-score and any override.
/// </summary>
public sealed class QuizApprovalHandler(IPromiseHubDb db, ITenantContext tenant, MentorYouthMemberships youth, IAuditWriter audit, TimeProvider clock, BadgeAwarder badges)
{
    public async Task<QuizApprovalsDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var ids = names.Keys.ToList();
        var rows = await (
            from t in db.QuizAttempts.AsNoTracking()
            where ids.Contains(t.MembershipId) && t.Status == AttemptStatus.AwaitingApproval
            join q in db.Quizzes.AsNoTracking() on t.QuizId equals q.Id
            join m in db.CurriculumModules.AsNoTracking() on q.ModuleId equals m.Id
            select new { t.Id, t.MembershipId, q.Title, Module = m.Title, t.Number, t.Score, t.Correct, t.Total, q.PassMark, t.SubmittedAt }).ToListAsync(cancellationToken);
        return new QuizApprovalsDto([.. rows.OrderBy(r => r.SubmittedAt)
            .Select(r => new QuizApprovalItemDto(r.Id, names[r.MembershipId], r.Title, r.Module, r.Number, r.Score ?? 0, r.Correct ?? 0, r.Total ?? 0, r.PassMark, r.SubmittedAt!.Value))]);
    }

    public async Task<Gated<ApproveAllDto>> ApproveAsync(Guid attemptId, ApproveQuizRequest request, CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var attempt = await db.QuizAttempts.FirstOrDefaultAsync(t => t.Id == attemptId, cancellationToken);
        if (attempt is null || !names.ContainsKey(attempt.MembershipId))
        {
            return Gated<ApproveAllDto>.NotFound();
        }
        if (attempt.Status != AttemptStatus.AwaitingApproval)
        {
            return Gated<ApproveAllDto>.Conflict("not-awaiting");
        }
        if (request.Override is < 0 or > 100)
        {
            return Gated<ApproveAllDto>.Invalid(new Dictionary<string, string> { ["override"] = "Enter a whole number from 0 to 100, or leave it blank." });
        }
        var quiz = await db.Quizzes.AsNoTracking().FirstAsync(q => q.Id == attempt.QuizId, cancellationToken);
        Approve(attempt, quiz, request.Override);
        await db.SaveChangesAsync(cancellationToken);
        await badges.AwardAsync(attempt.MembershipId, cancellationToken);
        return Gated<ApproveAllDto>.Found(new ApproveAllDto(1));
    }

    public async Task<ApproveAllDto> ApproveAllAsync(CancellationToken cancellationToken = default)
    {
        var ids = (await youth.ReadAsync(cancellationToken)).Keys.ToList();
        var attempts = await db.QuizAttempts.Where(t => ids.Contains(t.MembershipId) && t.Status == AttemptStatus.AwaitingApproval).ToListAsync(cancellationToken);
        var quizIds = attempts.Select(a => a.QuizId).Distinct().ToList();
        var quizzes = await db.Quizzes.AsNoTracking().Where(q => quizIds.Contains(q.Id)).ToDictionaryAsync(q => q.Id, cancellationToken);
        foreach (var attempt in attempts)
        {
            Approve(attempt, quizzes[attempt.QuizId], null);
        }
        await db.SaveChangesAsync(cancellationToken);
        foreach (var membership in attempts.Select(a => a.MembershipId).Distinct())
        {
            await badges.AwardAsync(membership, cancellationToken);
        }
        return new ApproveAllDto(attempts.Count);
    }

    private void Approve(QuizAttempt attempt, Quiz quiz, int? overrideScore)
    {
        var now = clock.GetUtcNow();
        attempt.Approve(overrideScore, quiz.PassMark, tenant.ActorName, now);
        var auto = attempt.AutoScore ?? 0;
        audit.Record(new AuditEvent(AuditAction.Updated, "QuizAttempt", attempt.Id,
            $"{quiz.Title} attempt {attempt.Number} approved at {attempt.Score}% by {tenant.ActorName}{(overrideScore is null ? "" : $" (auto-score {auto}%)")}",
            Before: new { AutoScore = auto }, After: new { attempt.Score, Override = overrideScore, attempt.Passed }));
        db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, attempt.MembershipId, "learning",
            $"{tenant.ActorName} approved your {quiz.Title} score: {attempt.Score}%.", $"/learning/attempts/{attempt.Id}", now));
    }
}
