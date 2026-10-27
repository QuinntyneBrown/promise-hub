using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Enrollment;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// Accepts, waitlists or declines children who asked to enroll, one or several at once (dialogs: review-enrollment,
/// bulk-review; L2-013 criterion 4). An accepted child joins the roster; the guardian is texted the decision with a link to the
/// household's home page (criterion 12); each decision is audited.
/// </summary>
public sealed class ReviewEnrollmentHandler(IPromiseHubDb db, ITenantContext tenant, AudienceResolver resolver, MessageWriter writer, GuardianLinkIssuer links, IAuditWriter audit, TimeProvider clock, Billing.PlanLimit limit)
{
    public Task<Result> ReviewAsync(Guid id, ReviewEnrollmentCommand command, CancellationToken cancellationToken = default) =>
        DecideAsync([id], command.Decision, command.Note, cancellationToken);

    public Task<Result> BulkAsync(BulkReviewCommand command, CancellationToken cancellationToken = default) =>
        DecideAsync(command.Ids ?? [], command.Decision, command.Note, cancellationToken);

    /// <summary>
    /// Places an open application into the cohort chosen now (dialog: place-applicant; L2-072 criterion 4): the request moves to that
    /// program, leaving its old waitlist, and is accepted as any review would. An archived, missing or another organization's program
    /// answers 422.
    /// </summary>
    public async Task<Result> PlaceAsync(Guid id, PlaceApplicantCommand command, CancellationToken cancellationToken = default)
    {
        var request = await db.EnrollmentRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (request is null)
        {
            return Result.NotFound;
        }
        if (!request.Open)
        {
            return Result.Conflict;
        }
        var program = command.ProgramId is { } programId
            ? await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId && p.Status != Domain.Programs.ProgramStatus.Archived, cancellationToken)
            : null;
        if (program is null)
        {
            return Result.Invalid(new Dictionary<string, string> { ["programId"] = "Choose a cohort." });
        }
        if (request.ProgramId != program.Id)
        {
            if (request.Status == EnrollmentRequestStatus.Waitlisted && request.Position is { } place)
            {
                foreach (var behind in await db.EnrollmentRequests.Where(r => r.ProgramId == request.ProgramId && r.Status == EnrollmentRequestStatus.Waitlisted && r.Position > place).ToListAsync(cancellationToken))
                {
                    behind.MoveUp();
                }
            }
            request.MoveTo(program.Id);
        }
        return await DecideAsync([id], ReviewDecision.Accept, command.Note, cancellationToken, placed: true);
    }

    private async Task<Result> DecideAsync(Guid[] ids, ReviewDecision decision, string? note, CancellationToken cancellationToken, bool placed = false)
    {
        var requests = await db.EnrollmentRequests.Where(r => ids.Contains(r.Id)).ToListAsync(cancellationToken);
        if (requests.Count == 0 || requests.Count != ids.Distinct().Count())
        {
            return Result.NotFound;
        }
        if (requests.Any(r => !r.Open) || (decision == ReviewDecision.Waitlist && requests.Any(r => r.Status == EnrollmentRequestStatus.Waitlisted)))
        {
            return Result.Conflict;
        }
        var text = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (decision == ReviewDecision.Decline && text is null)
        {
            return Result.Invalid(new Dictionary<string, string> { ["note"] = "Write a reason the guardian will read." });
        }
        if (decision == ReviewDecision.Accept && await limit.RefusalForAsync(requests.Select(r => r.ChildId), cancellationToken) is { } refusal)
        {
            return Result.Invalid(new Dictionary<string, string> { ["decision"] = refusal });
        }
        var now = clock.GetUtcNow();
        foreach (var group in requests.GroupBy(r => r.ProgramId))
        {
            var program = await db.Programs.SingleAsync(p => p.Id == group.Key, cancellationToken);
            var enrolled = await db.Enrollments.Where(e => e.ProgramId == program.Id && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken);
            if (decision == ReviewDecision.Accept && enrolled.Count + group.Count() > program.Capacity)
            {
                return Result.Invalid(new Dictionary<string, string> { ["decision"] = $"{program.Name} is full ({enrolled.Count} of {program.Capacity}). Waitlist instead." });
            }
            var position = await db.EnrollmentRequests.Where(r => r.ProgramId == program.Id && r.Status == EnrollmentRequestStatus.Waitlisted).MaxAsync(r => (int?)r.Position, cancellationToken) ?? 0;
            foreach (var request in group.OrderBy(r => r.SubmittedAt))
            {
                var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == request.ChildId, cancellationToken);
                var leftPlace = request.Status == EnrollmentRequestStatus.Waitlisted ? request.Position : null;
                string message;
                switch (decision)
                {
                    case ReviewDecision.Accept:
                        request.Accept(tenant.ActorName, now, text);
                        if (!enrolled.Contains(child.Id))
                        {
                            db.Enrollments.Add(new Domain.Programs.Enrollment(Guid.NewGuid(), tenant.OrganizationId, program.Id, child.Id, now));
                        }
                        message = $"{child.FirstName} is enrolled in {program.Name}.";
                        break;
                    case ReviewDecision.Waitlist:
                        request.Waitlist(++position, tenant.ActorName, now, text);
                        message = $"{child.FirstName} is on the waitlist for {program.Name}, number {position}.";
                        break;
                    default:
                        request.Decline(tenant.ActorName, now, text!);
                        message = $"{child.FirstName} wasn’t enrolled in {program.Name}: {text}";
                        text = null;
                        break;
                }
                if (leftPlace is { } place)
                {
                    // Children behind on the waitlist move up one place (L2-013 criterion 13).
                    foreach (var behind in await db.EnrollmentRequests.Where(r => r.ProgramId == program.Id && r.Status == EnrollmentRequestStatus.Waitlisted && r.Position > place).ToListAsync(cancellationToken))
                    {
                        behind.MoveUp();
                    }
                    position--;
                }
                var body = $"{(text is null ? message : $"{message} {text}")} See where things stand: {links.IssueHome(request.HouseholdId)}";
                var audience = await resolver.ForHouseholdAsync(request.HouseholdId, cancellationToken);
                writer.Queue(MessageSource.Enrollment, $"Enrollment: {program.Name}", body, ChannelChoice.TextWithEmailFallback, audience,
                    new AudienceRequest(program.Id, null, null, body, ChannelChoice.TextWithEmailFallback));
                audit.Record(new AuditEvent(AuditAction.Updated, "EnrollmentRequest", request.Id,
                    $"{child.FullName} · {program.Name} · {request.Status switch { EnrollmentRequestStatus.Accepted => placed ? "placed" : "accepted", EnrollmentRequestStatus.Waitlisted => $"waitlisted #{request.Position}", _ => "declined" }}"));
                text = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            }
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
