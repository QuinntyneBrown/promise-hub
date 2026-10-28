using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// Mentor check-ins (L2-090, ADR 0061): a mentor logs one for a youth in his scope (404 outside the organization, 403 audited outside his
/// scope, 422 by field) and it is audited as Created without its words. His history holds only the check-ins he wrote of youth still in his
/// scope, newest first.
/// </summary>
public sealed class MentorCheckInsHandler(IPromiseHubDb db, ITenantContext tenant, MentorScope scope, OrganizationToday today, IAuditWriter audit,
    TimeProvider clock)
{
    private const string TooLong = "Keep it to 2,000 characters.";

    public async Task<(Result Result, MentorCheckInDto? CheckIn)> LogAsync(LogMentorCheckInRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (request.ChildId is not { } childId)
        {
            errors["childId"] = "Choose a youth.";
            childId = Guid.Empty;
        }
        else if (await RefuseAsync(childId, cancellationToken) is { } refused)
        {
            return (refused, null);
        }
        var date = ParseDate(request.Date);
        var now = await today.GetAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.Date) || date is null)
        {
            errors["date"] = "Choose the date.";
        }
        else if (date > now)
        {
            errors["date"] = "The date can’t be in the future.";
        }
        if (!TryParse<MentorCheckInKind>(request.Kind, out var kind))
        {
            errors["kind"] = "Choose how you met.";
        }
        if (!TryParse<MentorCheckInEngagement>(request.Engagement, out var engagement))
        {
            errors["engagement"] = "Choose how it went.";
        }
        var topics = Text(request.Topics, "topics", errors);
        var actionItems = Text(request.ActionItems, "actionItems", errors);
        var privateNotes = Text(request.PrivateNotes, "privateNotes", errors);
        var followUpOn = ParseDate(request.FollowUpOn);
        if (!string.IsNullOrWhiteSpace(request.FollowUpOn) && followUpOn is null)
        {
            errors["followUpOn"] = "Choose a valid date.";
        }
        else if (followUpOn is not null && date is not null && followUpOn < date)
        {
            errors["followUpOn"] = "The follow-up can’t be before the check-in.";
        }
        if (errors.Count > 0)
        {
            return (Result.Invalid(errors), null);
        }
        var child = await db.Children.AsNoTracking().FirstAsync(c => c.Id == childId, cancellationToken);
        var checkIn = new MentorCheckIn(Guid.NewGuid(), tenant.OrganizationId, childId, tenant.MembershipId, date!.Value, kind, engagement, topics,
            actionItems, privateNotes, followUpOn, request.Shared, request.GuardianInformed, clock.GetUtcNow());
        db.MentorCheckIns.Add(checkIn);
        audit.Record(new AuditEvent(AuditAction.Created, "MentorCheckIn", checkIn.Id, $"Mentor check-in with {child.FullName} by {tenant.ActorName}",
            After: new { Kind = kind.ToString(), checkIn.Shared, checkIn.GuardianInformed, HasFollowUp = followUpOn is not null }));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Created(checkIn.Id), ToDto(checkIn, child.FullName));
    }

    public async Task<(Result Result, MentorCheckInHistoryDto? History)> HistoryAsync(Guid? childId, string? kind, CancellationToken cancellationToken = default)
    {
        if (childId is { } id && await RefuseAsync(id, cancellationToken) is { } refused)
        {
            return (refused, null);
        }
        var youthIds = await scope.YouthIdsAsync(cancellationToken);
        var names = await db.Children.AsNoTracking().Where(c => youthIds.Contains(c.Id))
            .Select(c => new { c.Id, c.FirstName, c.LastName }).ToListAsync(cancellationToken);
        var nameOf = names.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}");
        var me = tenant.MembershipId;
        var query = db.MentorCheckIns.AsNoTracking().Where(c => c.MentorMembershipId == me && youthIds.Contains(c.ChildId));
        if (childId is { } only)
        {
            query = query.Where(c => c.ChildId == only);
        }
        if (TryParse<MentorCheckInKind>(kind, out var k))
        {
            query = query.Where(c => c.Kind == k);
        }
        var rows = await query.ToListAsync(cancellationToken);
        var items = rows.OrderByDescending(c => c.Date).ThenByDescending(c => c.CreatedAt).Select(c => ToDto(c, nameOf[c.ChildId])).ToList();
        var youth = nameOf.Select(n => new YouthOptionDto(n.Key, n.Value)).OrderBy(y => y.Name, StringComparer.Ordinal).ToList();
        return (Result.Done, new MentorCheckInHistoryDto(items, youth));
    }

    internal static MentorCheckInDto ToDto(MentorCheckIn c, string youthName) =>
        new(c.Id, c.ChildId, youthName, Format(c.Date), c.Kind.ToString(), c.Engagement.ToString(), c.Topics, c.ActionItems, c.PrivateNotes,
            c.FollowUpOn is { } f ? Format(f) : null, c.Shared, c.GuardianInformed, c.CreatedAt);

    private async Task<Result?> RefuseAsync(Guid childId, CancellationToken cancellationToken)
    {
        if (!await db.Children.AsNoTracking().AnyAsync(c => c.Id == childId, cancellationToken))
        {
            return Result.NotFound;
        }
        if (!await scope.CanSeeYouthAsync(childId, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", childId, "Mentor check-in outside the mentor’s youth"));
            await db.SaveChangesAsync(cancellationToken);
            return Result.Forbidden;
        }
        return null;
    }

    private static string? Text(string? value, string field, Dictionary<string, string> errors)
    {
        var text = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (text?.Length > MentorCheckIn.MaximumText)
        {
            errors[field] = TooLong;
        }
        return text;
    }

    private static bool TryParse<T>(string? value, out T parsed) where T : struct, Enum =>
        Enum.TryParse(value, out parsed) && Enum.IsDefined(parsed) && !int.TryParse(value, out _);

    private static DateOnly? ParseDate(string? value) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;

    private static string Format(DateOnly d) => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
