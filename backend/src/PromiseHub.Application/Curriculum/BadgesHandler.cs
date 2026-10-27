using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Curriculum;

/// <summary>Reads the organization's badges (L2-084 criteria 1 and 2, L2-085 criterion 4): the list, one badge with its awards, and the builder's options.</summary>
public sealed class BadgesHandler(IPromiseHubDb db)
{
    public async Task<BadgeListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var badges = (await db.Badges.AsNoTracking().Where(b => b.DeletedAt == null).ToListAsync(cancellationToken))
            .OrderBy(b => b.CreatedAt).ThenBy(b => b.Name).ToList();
        var ids = badges.Select(b => b.Id).ToList();
        var awards = await db.BadgeAwards.AsNoTracking().Where(a => ids.Contains(a.BadgeId)).Select(a => new { a.BadgeId, a.MembershipId }).ToListAsync(cancellationToken);
        var titles = await TitlesAsync(badges, cancellationToken);
        var competencies = await CompetencyNamesAsync(cancellationToken);
        var rows = badges.Select(b => new BadgeSummaryDto(b.Id, b.Name, b.Icon, b.Description, b.Kind.ToString(), b.Rule?.ToString(), b.TargetId,
            b.TargetId is { } t ? titles.GetValueOrDefault(t) : null, b.CompetencyId, b.CompetencyId is { } c ? competencies.GetValueOrDefault(c) : null,
            awards.Count(a => a.BadgeId == b.Id))).ToList();
        return new BadgeListDto(rows, awards.Count, awards.Select(a => a.MembershipId).Distinct().Count());
    }

    public async Task<BadgeDetailDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var badge = await db.Badges.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, cancellationToken);
        if (badge is null)
        {
            return null;
        }
        var youth = await db.Memberships.AsNoTracking().Where(m => m.Role == Role.Youth && m.RemovedAt == null)
            .Select(m => new { m.Id, m.PersonName }).ToListAsync(cancellationToken);
        var names = await db.Memberships.AsNoTracking().ToDictionaryAsync(m => m.Id, m => m.PersonName, cancellationToken);
        var awards = (await db.BadgeAwards.AsNoTracking().Where(a => a.BadgeId == id).ToListAsync(cancellationToken))
            .OrderByDescending(a => a.AwardedAt)
            .Select(a => new BadgeAwardDto(a.Id, a.MembershipId, names.GetValueOrDefault(a.MembershipId) ?? "", a.AwardedAt, a.AwardedBy)).ToList();
        var held = awards.Select(a => a.MembershipId).ToHashSet();
        var titles = await TitlesAsync([badge], cancellationToken);
        var competencies = await CompetencyNamesAsync(cancellationToken);
        return new BadgeDetailDto(badge.Id, badge.Name, badge.Icon, badge.Description, badge.Kind.ToString(), badge.Rule?.ToString(), badge.TargetId,
            badge.TargetId is { } t ? titles.GetValueOrDefault(t) : null, badge.CompetencyId, badge.CompetencyId is { } c ? competencies.GetValueOrDefault(c) : null,
            awards, youth.Where(y => !held.Contains(y.Id)).OrderBy(y => y.PersonName).Select(y => new BadgeYouthDto(y.Id, y.PersonName)).ToList());
    }

    public async Task<BadgeOptionsDto> OptionsAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await db.Tracks.AsNoTracking().ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);
        var modules = (await db.CurriculumModules.AsNoTracking().ToListAsync(cancellationToken))
            .OrderBy(m => tracks.GetValueOrDefault(m.TrackId)).ThenBy(m => m.Position).ToList();
        var moduleTitles = modules.ToDictionary(m => m.Id, m => m.Title);
        var order = modules.Select((m, i) => (m.Id, i)).ToDictionary(x => x.Id, x => x.i);
        var lessons = (await db.Lessons.AsNoTracking().Where(l => l.DeletedAt == null).ToListAsync(cancellationToken))
            .OrderBy(l => order.GetValueOrDefault(l.ModuleId)).ThenBy(l => l.Position)
            .Select(l => new BadgeTargetDto(l.Id, $"{moduleTitles.GetValueOrDefault(l.ModuleId)} · {l.Title}")).ToList();
        var quizzes = (await db.Quizzes.AsNoTracking().ToListAsync(cancellationToken))
            .OrderBy(q => order.GetValueOrDefault(q.ModuleId)).ThenBy(q => q.Title)
            .Select(q => new BadgeTargetDto(q.Id, $"{moduleTitles.GetValueOrDefault(q.ModuleId)} · {q.Title}")).ToList();
        var assignments = (await db.Assignments.AsNoTracking().ToListAsync(cancellationToken))
            .OrderBy(a => order.GetValueOrDefault(a.ModuleId)).ThenBy(a => a.Title)
            .Select(a => new BadgeTargetDto(a.Id, $"{moduleTitles.GetValueOrDefault(a.ModuleId)} · {a.Title}")).ToList();
        var competencies = await db.Competencies.AsNoTracking().Where(c => c.RemovedAt == null).OrderBy(c => c.Position)
            .Select(c => new BadgeCompetencyDto(c.Id, c.Name)).ToListAsync(cancellationToken);
        return new BadgeOptionsDto(lessons, modules.Select(m => new BadgeTargetDto(m.Id, $"{tracks.GetValueOrDefault(m.TrackId)} · {m.Title}")).ToList(),
            quizzes, assignments, competencies);
    }

    /// <summary>The title of each badge's target: the lesson, module, quiz or assignment title.</summary>
    private async Task<Dictionary<Guid, string>> TitlesAsync(IReadOnlyList<Badge> badges, CancellationToken cancellationToken)
    {
        var ids = badges.Where(b => b.TargetId is not null).Select(b => b.TargetId!.Value).Distinct().ToList();
        var titles = new Dictionary<Guid, string>();
        if (ids.Count == 0)
        {
            return titles;
        }
        foreach (var x in await db.Lessons.AsNoTracking().Where(l => ids.Contains(l.Id)).Select(l => new { l.Id, l.Title }).ToListAsync(cancellationToken))
        {
            titles[x.Id] = x.Title;
        }
        foreach (var x in await db.CurriculumModules.AsNoTracking().Where(m => ids.Contains(m.Id)).Select(m => new { m.Id, m.Title }).ToListAsync(cancellationToken))
        {
            titles[x.Id] = x.Title;
        }
        foreach (var x in await db.Quizzes.AsNoTracking().Where(q => ids.Contains(q.Id)).Select(q => new { q.Id, q.Title }).ToListAsync(cancellationToken))
        {
            titles[x.Id] = x.Title;
        }
        foreach (var x in await db.Assignments.AsNoTracking().Where(a => ids.Contains(a.Id)).Select(a => new { a.Id, a.Title }).ToListAsync(cancellationToken))
        {
            titles[x.Id] = x.Title;
        }
        return titles;
    }

    private Task<Dictionary<Guid, string>> CompetencyNamesAsync(CancellationToken cancellationToken) =>
        db.Competencies.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);
}
