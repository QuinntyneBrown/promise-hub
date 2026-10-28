using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// The one targeting rule for announcements (L2-105 criteria 3 and 5, ADR 0068): who an announcement reaches in the app, and which
/// announcements a member may read. Youth accounts count when their linked child is actively enrolled in the program (any program for all
/// programs); mentors when they are on the program's team or mentor a youth enrolled in it (every mentor for all programs). Every read is
/// filtered to the active organization.
/// </summary>
public sealed class AnnouncementRecipients(IPromiseHubDb db)
{
    private static readonly AnnouncementAudience[] YouthAudiences = [AnnouncementAudience.Youth, AnnouncementAudience.YouthAndGuardians, AnnouncementAudience.Everyone];
    private static readonly AnnouncementAudience[] MentorAudiences = [AnnouncementAudience.Mentors, AnnouncementAudience.Everyone];

    /// <summary>The memberships that read the announcement in the app.</summary>
    public async Task<IReadOnlyList<Guid>> MembersAsync(Announcement announcement, CancellationToken cancellationToken = default)
    {
        var ids = new List<Guid>();
        if (announcement.ReachesYouth)
        {
            var children = await EnrolledChildrenAsync(announcement.ProgramId, cancellationToken);
            ids.AddRange(await db.Memberships.AsNoTracking()
                .Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null && children.Contains(m.ChildId.Value))
                .Select(m => m.Id).ToListAsync(cancellationToken));
        }
        if (announcement.ReachesMentors)
        {
            var mentors = db.Memberships.AsNoTracking().Where(m => m.Role == Role.Mentor && m.RemovedAt == null);
            if (announcement.ProgramId is { } programId)
            {
                var children = await EnrolledChildrenAsync(programId, cancellationToken);
                var team = await db.CohortMentors.AsNoTracking().Where(c => c.ProgramId == programId).Select(c => c.MentorMembershipId).ToListAsync(cancellationToken);
                var assigned = await db.YouthMentors.AsNoTracking().Where(y => children.Contains(y.ChildId)).Select(y => y.MentorMembershipId).ToListAsync(cancellationToken);
                var named = team.Concat(assigned).ToList();
                mentors = mentors.Where(m => named.Contains(m.Id));
            }
            ids.AddRange(await mentors.Select(m => m.Id).ToListAsync(cancellationToken));
        }
        return [.. ids.Distinct()];
    }

    /// <summary>The announcements a youth or mentor may read: sent by now, aimed at their role, for all programs or one of theirs.</summary>
    public async Task<List<Announcement>> VisibleToAsync(Guid membershipId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        var member = await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Id == membershipId, cancellationToken);
        List<Guid> programs;
        AnnouncementAudience[] audiences;
        // An announcement for all programs reaches every mentor, but only youth with an enrolled child (as MembersAsync counts them).
        bool allPrograms;
        if (member is { Role: Role.Youth })
        {
            audiences = YouthAudiences;
            programs = member.ChildId is { } childId
                ? await db.Enrollments.AsNoTracking().Where(e => e.ChildId == childId && e.EndedAt == null).Select(e => e.ProgramId).ToListAsync(cancellationToken)
                : [];
            allPrograms = programs.Count > 0;
        }
        else if (member is { Role: Role.Mentor })
        {
            audiences = MentorAudiences;
            var team = await db.CohortMentors.AsNoTracking().Where(c => c.MentorMembershipId == membershipId).Select(c => c.ProgramId).ToListAsync(cancellationToken);
            var children = await db.YouthMentors.AsNoTracking().Where(y => y.MentorMembershipId == membershipId).Select(y => y.ChildId).ToListAsync(cancellationToken);
            var ofYouth = await db.Enrollments.AsNoTracking().Where(e => children.Contains(e.ChildId) && e.EndedAt == null).Select(e => e.ProgramId).ToListAsync(cancellationToken);
            programs = [.. team.Concat(ofYouth).Distinct()];
            allPrograms = true;
        }
        else
        {
            return [];
        }
        return await db.Announcements.AsNoTracking()
            .Where(a => a.SendAt <= now && audiences.Contains(a.Audience) && ((a.ProgramId == null && allPrograms) || (a.ProgramId != null && programs.Contains(a.ProgramId.Value))))
            .ToListAsync(cancellationToken);
    }

    private Task<List<Guid>> EnrolledChildrenAsync(Guid? programId, CancellationToken cancellationToken) =>
        db.Enrollments.AsNoTracking().Where(e => e.EndedAt == null && (programId == null || e.ProgramId == programId))
            .Select(e => e.ChildId).Distinct().ToListAsync(cancellationToken);
}
