using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The signed-in youth's badges (L2-087 criteria 4 to 6, ADR 0059): every award of hers, deleted badge or not; and the badges she can still earn,
/// not deleted and either by hand or automatic with a target in a track she follows, with progress read from the same tracks the journey shows.
/// </summary>
public sealed class LearnerBadges(IPromiseHubDb db, ITenantContext tenant)
{
    public const string ByHand = "Your program team awards it by hand.";

    public async Task<LearnerBadgesDto> ReadAsync(IReadOnlyList<TrackStatus> tracks, CancellationToken cancellationToken = default)
    {
        var modules = tracks.SelectMany(t => t.Modules).ToList();
        var awards = await db.BadgeAwards.AsNoTracking().Where(a => a.MembershipId == tenant.MembershipId).ToListAsync(cancellationToken);
        var held = awards.Select(a => a.BadgeId).ToHashSet();
        var badges = await db.Badges.AsNoTracking().ToListAsync(cancellationToken);
        var byId = badges.ToDictionary(b => b.Id);

        var earned = awards.Where(a => byId.ContainsKey(a.BadgeId)).OrderBy(a => a.AwardedAt)
            .Select(a =>
            {
                var b = byId[a.BadgeId];
                var fallback = b.Kind == BadgeKind.Manual ? "Awarded by hand." : "Earned as you learned.";
                return new EarnedBadgeDto(b.Id, b.Name, b.Icon, b.Description ?? Describe(b, modules) ?? fallback, a.AwardedAt, a.AwardedBy);
            })
            .ToList();
        var locked = badges.Where(b => b.DeletedAt is null && !held.Contains(b.Id) && (b.Kind == BadgeKind.Manual || Describe(b, modules) is not null))
            .OrderBy(b => b.CreatedAt)
            .Select(b =>
            {
                var (done, total) = b.Kind == BadgeKind.Manual ? ((int?)null, (int?)null) : Progress(b, modules);
                return new LockedBadgeDto(b.Id, b.Name, b.Icon, b.Kind == BadgeKind.Manual ? b.Description ?? ByHand : b.Description ?? Describe(b, modules)!,
                    b.Kind.ToString(), b.Rule?.ToString(), done, total);
            })
            .ToList();
        return new LearnerBadgesDto(earned, locked, await MilestonesAsync(earned, locked, cancellationToken));
    }

    private async Task<IReadOnlyList<MilestoneDto>> MilestonesAsync(IReadOnlyList<EarnedBadgeDto> earned, IReadOnlyList<LockedBadgeDto> locked, CancellationToken cancellationToken)
    {
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        var joined = childId is { } child
            ? (await (from e in db.Enrollments.AsNoTracking()
                      join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                      where e.ChildId == child && e.EndedAt == null
                      select new { p.Name, e.EnrolledAt }).ToListAsync(cancellationToken)).OrderBy(x => x.EnrolledAt).ToList()
            : [];
        var result = joined.Select(j => new MilestoneDto("joined", $"Joined {j.Name}", "Welcome to PromiseHub", j.EnrolledAt)).ToList();
        result.AddRange(earned.Select(b => new MilestoneDto("badge", $"{b.Name} badge", b.Description, b.AwardedAt)));
        var next = locked.Where(b => b.Total is > 0).OrderByDescending(b => (double)b.Completed!.Value / b.Total!.Value).ThenBy(b => b.Name, StringComparer.Ordinal).FirstOrDefault();
        if (next is not null)
        {
            var progress = next.Rule == nameof(BadgeRule.ModuleCompleted) ? $"{next.Completed} of {next.Total} lessons" : $"{next.Completed} of {next.Total}";
            result.Add(new MilestoneDto("next", $"Next up: {next.Name}", $"{progress} · {next.Description}", null));
        }
        return result;
    }

    /// <summary>What earns an automatic badge, naming its target; null when the target is not in a track she follows.</summary>
    private static string? Describe(Badge badge, IReadOnlyList<ModuleStatus> modules)
    {
        var target = badge.TargetId;
        return badge.Rule switch
        {
            BadgeRule.LessonCompleted => modules.SelectMany(m => m.Lessons).FirstOrDefault(l => l.Lesson.Id == target) is { } l ? $"Finish {l.Lesson.Title}." : null,
            BadgeRule.ModuleCompleted => modules.FirstOrDefault(m => m.Module.Id == target) is { } m ? $"Finish {m.Module.Title}." : null,
            BadgeRule.QuizPassed => modules.SelectMany(m => m.Quizzes).FirstOrDefault(q => q.Quiz.Id == target) is { } q ? $"Pass {q.Quiz.Title}." : null,
            BadgeRule.AssignmentAccepted => modules.SelectMany(m => m.Assignments).FirstOrDefault(a => a.Assignment.Id == target) is { } a ? $"Have {a.Assignment.Title} accepted." : null,
            _ => null,
        };
    }

    private static (int?, int?) Progress(Badge badge, IReadOnlyList<ModuleStatus> modules)
    {
        var target = badge.TargetId;
        return badge.Rule switch
        {
            BadgeRule.ModuleCompleted => (modules.First(m => m.Module.Id == target).Done, modules.First(m => m.Module.Id == target).Lessons.Count),
            BadgeRule.LessonCompleted => (modules.SelectMany(m => m.Lessons).First(l => l.Lesson.Id == target).Done ? 1 : 0, 1),
            BadgeRule.QuizPassed => (modules.SelectMany(m => m.Quizzes).First(q => q.Quiz.Id == target).Passed ? 1 : 0, 1),
            _ => (modules.SelectMany(m => m.Assignments).First(a => a.Assignment.Id == target).SubmissionStatus == "Accepted" ? 1 : 0, 1),
        };
    }
}
