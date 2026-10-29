using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Mentoring;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Website;

/// <summary>
/// The public website's content (L2-133, ADR 0075), computed on read for the organization the address names: active programs that have not
/// ended, published tracks and modules while Learning is on, the mentorship model and lead mentors while Mentoring is on, and structural counts.
/// </summary>
public sealed class PublicContentHandler(IPromiseHubDb db, PublicSiteResolver sites, IModuleGate modules, OrganizationToday today)
{
    public async Task<PublicContentDto?> HandleAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (await sites.ResolveAsync(slug, cancellationToken) is null)
        {
            return null;
        }
        var on = await modules.OnAsync(cancellationToken);
        var learning = on.Contains(ModuleId.Learning);
        var mentoring = on.Contains(ModuleId.Mentoring);
        var date = await today.GetAsync(cancellationToken);

        var programs = await db.Programs.AsNoTracking()
            .Where(p => p.Status == ProgramStatus.Active && p.EndsOn >= date)
            .ToListAsync(cancellationToken);
        programs = [.. programs.OrderBy(p => p.StartsOn).ThenBy(p => p.Name, StringComparer.OrdinalIgnoreCase)];

        var tracks = learning
            ? await db.Tracks.AsNoTracking().Where(t => t.Status == ContentStatus.Published).ToListAsync(cancellationToken)
            : [];
        var trackIds = tracks.Select(t => t.Id).ToList();
        var publishedModules = learning
            ? await db.CurriculumModules.AsNoTracking().Where(m => trackIds.Contains(m.TrackId) && m.Status == ContentStatus.Published).ToListAsync(cancellationToken)
            : [];
        var moduleIds = publishedModules.Select(m => m.Id).ToList();
        var badges = learning
            ? await db.Badges.AsNoTracking()
                .Where(b => b.DeletedAt == null && b.Rule == BadgeRule.ModuleCompleted && b.TargetId != null && moduleIds.Contains(b.TargetId.Value))
                .ToListAsync(cancellationToken)
            : [];

        var programIds = programs.Select(p => p.Id).ToList();
        var leads = mentoring
            ? await (from c in db.CohortMentors.AsNoTracking()
                     join m in db.Memberships.AsNoTracking() on c.MentorMembershipId equals m.Id
                     where c.IsLead && programIds.Contains(c.ProgramId) && m.RemovedAt == null && m.DeactivatedAt == null
                     select new { c.ProgramId, m.PersonName }).ToListAsync(cancellationToken)
            : [];

        var publicTracks = tracks
            .Select(t => new PublicTrackDto(t.Name, t.Description, [.. publishedModules.Where(m => m.TrackId == t.Id).OrderBy(m => m.Position)
                .Select(m => new PublicModuleDto(m.Title, m.Description, badges.Where(b => b.TargetId == m.Id).OrderBy(b => b.Name).Select(b => b.Name).FirstOrDefault()))]))
            .Where(t => t.Modules.Count > 0)
            .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
        var shownTracks = tracks.Where(t => publicTracks.Any(p => p.Name == t.Name)).ToDictionary(t => t.Id, t => t.Name);

        var publicPrograms = programs.Select(p => new PublicProgramDto(
            p.Name,
            p.Schedule,
            p.Ages,
            p.StartsOn,
            p.EndsOn,
            p.StartsOn <= date ? "Running" : "Upcoming",
            p.EnrollmentOpen && p.EnrollmentSlug is not null ? $"/g/enroll/{p.EnrollmentSlug}" : null,
            p.TrackId is { } track && shownTracks.TryGetValue(track, out var name) ? name : null,
            leads.Where(l => l.ProgramId == p.Id).Select(l => FirstName(l.PersonName)).FirstOrDefault())).ToList();

        var impact = new PublicImpactDto(
            publicPrograms.Count,
            publicPrograms.Count(p => p.ApplyPath is not null),
            learning ? publicTracks.Count : null,
            learning ? publicTracks.Sum(t => t.Modules.Count) : null);
        return new PublicContentDto(publicPrograms, publicTracks, mentoring, impact);
    }

    private static string FirstName(string personName) => personName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? personName;
}
