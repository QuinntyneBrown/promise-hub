using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Records an announcement (L2-105 criteria 1 to 4, ADR 0068): checks each field, answers 404 for a program outside the organization,
/// queues the guardians' copy as a Messages-module message due at the send time (so the send job and the SMS cap apply unchanged) and
/// audits it. When it is sent now, its in-app recipients' open streams are told (L2-107).
/// </summary>
public sealed class ComposeAnnouncementHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, IAuditWriter audit,
    AudienceResolver resolver, MessageWriter writer, AnnouncementRecipients recipients, IRealtimeEvents events)
{
    public async Task<Result> HandleAsync(ComposeAnnouncementRequest request, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var title = request.Title?.Trim() ?? string.Empty;
        var body = request.Body?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (title.Length == 0)
        {
            errors["title"] = "Give it a title.";
        }
        else if (title.Length > Announcement.MaximumTitle)
        {
            errors["title"] = "Keep it to 120 characters.";
        }
        if (body.Length == 0)
        {
            errors["body"] = "Write the announcement.";
        }
        else if (body.Length > Announcement.MaximumBody)
        {
            errors["body"] = "Keep it to 2,000 characters.";
        }
        if (request.Audience is null || !Enum.IsDefined(request.Audience.Value))
        {
            errors["audience"] = "Choose who hears it.";
        }
        if (request.SendAt is { } at && at < now)
        {
            errors["sendAt"] = "Pick a time from now on.";
        }
        string? programName = null;
        if (request.ProgramId is { } programId)
        {
            programName = await db.Programs.AsNoTracking().Where(p => p.Id == programId).Select(p => p.Name).FirstOrDefaultAsync(cancellationToken);
            if (programName is null)
            {
                return Result.NotFound;
            }
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var announcement = new Announcement(Guid.NewGuid(), tenant.OrganizationId, title, body, request.ProgramId, request.Audience!.Value,
            request.SendAt ?? now, now, tenant.MembershipId, tenant.ActorName, tenant.Role);
        db.Announcements.Add(announcement);
        if (announcement.ReachesGuardians)
        {
            var audienceRequest = new AudienceRequest(request.ProgramId, null, null, body, ChannelChoice.TextWithEmailFallback);
            var households = await resolver.ResolveAsync(audienceRequest, cancellationToken);
            if (households.Recipients.Count > 0)
            {
                var message = writer.Queue(MessageSource.Messages, title, body, ChannelChoice.TextWithEmailFallback, households, audienceRequest,
                    dueAt: announcement.SendAt);
                announcement.CopiedToGuardians(message.Id);
            }
        }
        audit.Record(new AuditEvent(AuditAction.Created, "Announcement", announcement.Id,
            $"{title} · {programName ?? "All programs"} · {announcement.Audience}"));
        await db.SaveChangesAsync(cancellationToken);
        if (announcement.SendAt <= now)
        {
            events.Publish(tenant.OrganizationId, await recipients.MembersAsync(announcement, cancellationToken), new RealtimeEvent("announcement"));
        }
        return Result.Created(announcement.Id);
    }
}
