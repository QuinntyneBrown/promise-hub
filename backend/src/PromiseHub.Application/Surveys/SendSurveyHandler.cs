using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Surveys;

namespace PromiseHub.Application.Surveys;

/// <summary>Sends an event's survey: one text or email per household with a link per child, through the send job (L2-043).</summary>
public sealed class SendSurveyHandler(IPromiseHubDb db, ITenantContext tenant, AudienceResolver resolver, MessageWriter writer, GuardianLinkIssuer links, IAuditWriter audit, TimeProvider clock)
{
    public async Task<SurveySentDto?> HandleAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return null;
        }
        var survey = new Survey(Guid.NewGuid(), tenant.OrganizationId, e.Id, tenant.ActorName, clock.GetUtcNow());
        db.Surveys.Add(survey);
        var request = new AudienceRequest(null, e.Id, null, null, ChannelChoice.TextWithEmailFallback);
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        var body = $"Two quick questions about {e.Name}. It takes a minute.";
        var children = await (
            from en in db.Enrollments.AsNoTracking()
            where en.ProgramId == e.ProgramId && en.EndedAt == null
            join c in db.Children.AsNoTracking() on en.ChildId equals c.Id
            orderby c.FirstName
            select new { c.Id, c.FirstName, c.HouseholdId }).ToListAsync(cancellationToken);
        string LinksFor(Recipient r) =>
            $"{body} " + string.Join(" · ", children.Where(c => c.HouseholdId == r.HouseholdId).Select(c => $"{c.FirstName}: {links.IssueSurvey(r.HouseholdId, survey.Id, c.Id)}"));
        writer.Queue(MessageSource.Survey, $"Survey: {e.Name}", body, request.Channel, audience, request, LinksFor);
        audit.Record(new AuditEvent(AuditAction.Sent, "Survey", survey.Id, $"{e.Name} · {audience.Recipients.Count} households"));
        await db.SaveChangesAsync(cancellationToken);
        return new SurveySentDto(survey.Id, audience.Recipients.Count, survey.ClosesAt);
    }
}
