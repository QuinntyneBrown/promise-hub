using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Messaging;

/// <summary>The organization's announcements for staff (L2-105 criterion 7), newest send time first, with reach and reads.</summary>
public sealed class ListAnnouncementsHandler(IPromiseHubDb db, AnnouncementRecipients recipients, TimeProvider clock)
{
    public async Task<AnnouncementListDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var announcements = (await db.Announcements.AsNoTracking().ToListAsync(cancellationToken)).OrderByDescending(a => a.SendAt).ToList();
        var programIds = announcements.Where(a => a.ProgramId != null).Select(a => a.ProgramId!.Value).Distinct().ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var messageIds = announcements.Where(a => a.GuardianMessageId != null).Select(a => a.GuardianMessageId!.Value).ToList();
        var households = await db.Messages.AsNoTracking().Where(m => messageIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, m => m.RecipientCount, cancellationToken);
        var reads = await db.AnnouncementReads.AsNoTracking().Select(r => new { r.AnnouncementId, r.MembershipId }).ToListAsync(cancellationToken);
        var rows = new List<AnnouncementRowDto>(announcements.Count);
        foreach (var a in announcements)
        {
            var members = await recipients.MembersAsync(a, cancellationToken);
            var read = reads.Count(r => r.AnnouncementId == a.Id && members.Contains(r.MembershipId));
            rows.Add(new AnnouncementRowDto(a.Id, a.Title, a.Body, a.ProgramId is { } p ? programs.GetValueOrDefault(p) : null, a.Audience,
                a.SendAt > now ? "Scheduled" : "Sent", a.SendAt, a.CreatedBy, members.Count, read,
                a.GuardianMessageId is { } m ? households.GetValueOrDefault(m) : 0));
        }
        return new AnnouncementListDto(rows);
    }
}
