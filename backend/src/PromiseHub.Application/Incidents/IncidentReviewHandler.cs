using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Incidents;

namespace PromiseHub.Application.Incidents;

/// <summary>
/// A supervisor's review (dialog: review-incident) with a required note, which closes the report or keeps it open and tells
/// the reporter; follow-ups (dialog: add-follow-up) from anyone who can read it, even after closing; and reopening
/// (dialog: reopen-incident). Each is audited (L2-023 criterion 2, L2-032).
/// </summary>
public sealed class IncidentReviewHandler(IPromiseHubDb db, ITenantContext tenant, IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> ReviewAsync(Guid id, ReviewIncidentCommand command, CancellationToken cancellationToken = default)
    {
        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (incident is null)
        {
            return Result.NotFound;
        }
        if (incident.Status == IncidentStatus.Closed)
        {
            return Result.Conflict;
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Note))
        {
            errors["note"] = "Write a review note.";
        }
        if (command.Outcome is null)
        {
            errors["outcome"] = "Choose an outcome.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        incident.Review(command.Note!.Trim(), command.Outcome!.Value, tenant.ActorName, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "Incident", incident.Id, incident.Status == IncidentStatus.Closed ? "reviewed and closed the report" : "reviewed the report and kept it open"));
        await db.SaveChangesAsync(cancellationToken);
        var reporter = await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Id == incident.ReporterId, cancellationToken);
        if (reporter is not null)
        {
            await email.SendAsync(reporter.Email, $"Your incident report was reviewed: {incident.Category}",
                $"{tenant.ActorName} reviewed your report: {incident.ReviewNote}", cancellationToken);
        }
        return Result.Done;
    }

    public async Task<Result> AddFollowUpAsync(Guid id, AddFollowUpCommand command, CancellationToken cancellationToken = default)
    {
        var incident = await IncidentAccess.Readable(db.Incidents, tenant.Role, tenant.MembershipId).FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (incident is null)
        {
            return Result.NotFound;
        }
        if (string.IsNullOrWhiteSpace(command.Text))
        {
            return Result.Invalid(new Dictionary<string, string> { ["text"] = "Write the follow-up." });
        }
        db.IncidentFollowUps.Add(new IncidentFollowUp(Guid.NewGuid(), tenant.OrganizationId, incident.Id, command.Text.Trim(), tenant.ActorName, clock.GetUtcNow()));
        audit.Record(new AuditEvent(AuditAction.Created, "IncidentFollowUp", incident.Id, $"added a follow-up to the report"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReopenAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (incident is null)
        {
            return Result.NotFound;
        }
        if (incident.Status != IncidentStatus.Closed)
        {
            return Result.Conflict;
        }
        incident.Reopen();
        audit.Record(new AuditEvent(AuditAction.Updated, "Incident", incident.Id, "reopened the report"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
