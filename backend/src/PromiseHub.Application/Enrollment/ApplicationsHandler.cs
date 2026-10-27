using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Enrollment;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// The organization's application pipeline (screens: applications, application; dialog: add-application-note; L2-072): every
/// enrollment request with one status and the count of each, one application with who applied, the family and staff notes. The
/// tenant filter keeps every read to the signed-in organization, so another organization's application is not found.
/// </summary>
public sealed class ApplicationsHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<ApplicationListDto> ListAsync(string? status, CancellationToken cancellationToken = default)
    {
        var wanted = Enum.TryParse<EnrollmentRequestStatus>(status, out var s) ? s : EnrollmentRequestStatus.WaitingReview;
        var statuses = await db.EnrollmentRequests.AsNoTracking().GroupBy(r => r.Status).Select(g => new { g.Key, Count = g.Count() }).ToListAsync(cancellationToken);
        int Count(EnrollmentRequestStatus x) => statuses.FirstOrDefault(c => c.Key == x)?.Count ?? 0;
        var counts = new ApplicationCountsDto(Count(EnrollmentRequestStatus.WaitingReview), Count(EnrollmentRequestStatus.Waitlisted), Count(EnrollmentRequestStatus.Accepted), Count(EnrollmentRequestStatus.Declined));

        var requests = await db.EnrollmentRequests.AsNoTracking().Where(r => r.Status == wanted).ToListAsync(cancellationToken);
        var childIds = requests.Select(r => r.ChildId).ToList();
        var programIds = requests.Select(r => r.ProgramId).Distinct().ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var returning = (await db.Enrollments.AsNoTracking().Where(e => childIds.Contains(e.ChildId)).Select(e => e.ChildId).ToListAsync(cancellationToken)).ToHashSet();
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var rows = requests.Where(r => children.ContainsKey(r.ChildId)).Select(r =>
        {
            var child = children[r.ChildId];
            return new ApplicationSummaryDto(r.Id, child.Id, child.FullName, child.AgeOn(today), r.AppliedAs.ToString(), AppliedBy(r), r.ReferrerRole,
                r.ProgramId, programs.GetValueOrDefault(r.ProgramId, ""), r.SubmittedAt, r.Status.ToString(), r.Position, r.SeasonConsent,
                returning.Contains(child.Id), r.ReviewedBy, r.ReviewedAt, r.Note);
        });
        var ordered = wanted switch
        {
            EnrollmentRequestStatus.WaitingReview => rows.OrderByDescending(r => r.SubmittedAt),
            EnrollmentRequestStatus.Waitlisted => rows.OrderBy(r => r.Program, StringComparer.CurrentCulture).ThenBy(r => r.Position),
            _ => rows.OrderByDescending(r => r.ReviewedAt),
        };
        return new ApplicationListDto(counts, ordered.ToList());
    }

    public async Task<ApplicationDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var r = await db.EnrollmentRequests.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        var child = r is null ? null : await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == r.ChildId, cancellationToken);
        if (r is null || child is null)
        {
            return null;
        }
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == r.HouseholdId, cancellationToken);
        var guardian = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == r.HouseholdId).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        var program = await db.Programs.AsNoTracking().Where(p => p.Id == r.ProgramId).Select(p => p.Name).SingleAsync(cancellationToken);
        var returning = await db.Enrollments.AsNoTracking().AnyAsync(e => e.ChildId == child.Id, cancellationToken) && r.Status != EnrollmentRequestStatus.Accepted;
        var notes = (await db.EnrollmentNotes.AsNoTracking().Where(n => n.EnrollmentRequestId == r.Id).ToListAsync(cancellationToken))
            .OrderByDescending(n => n.CreatedAt).Select(n => new ApplicationNoteDto(n.Id, n.Author, n.Text, n.CreatedAt)).ToList();
        var referrer = r.AppliedAs == EnrollmentApplicant.Referrer ? new ApplicationReferrerDto(r.ReferrerName ?? r.SubmittedBy, r.ReferrerRole, r.ReferrerOrganization, r.ReferrerContact) : null;
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        return new ApplicationDto(r.Id, child.Id, child.FullName, child.FirstName, child.DateOfBirth, child.AgeOn(today), household.Id, household.Name, returning,
            guardian is null ? null : new ApplicationGuardianDto(guardian.Name, guardian.Mobile, guardian.Email, guardian.Language),
            r.AppliedAs.ToString(), AppliedBy(r), r.Reason, referrer, r.ProgramId, program, r.SubmittedAt, r.Status.ToString(), r.Position, r.SeasonConsent,
            r.ReviewedBy, r.ReviewedAt, r.Note, notes);
    }

    /// <summary>Adds a staff note of 1 to 2,000 characters; audited without its text, which may name the family.</summary>
    public async Task<Result> AddNoteAsync(Guid id, AddApplicationNoteCommand command, CancellationToken cancellationToken = default)
    {
        var r = await db.EnrollmentRequests.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (r is null)
        {
            return Result.NotFound;
        }
        var text = command.Text?.Trim() ?? string.Empty;
        if (text.Length is 0 or > EnrollmentNote.MaxLength)
        {
            return Result.Invalid(new Dictionary<string, string> { ["text"] = "Write a note of up to 2,000 characters." });
        }
        var child = await db.Children.AsNoTracking().Where(c => c.Id == r.ChildId).Select(c => c.FirstName + " " + c.LastName).SingleAsync(cancellationToken);
        var note = new EnrollmentNote(Guid.NewGuid(), tenant.OrganizationId, r.Id, tenant.ActorName, text, clock.GetUtcNow());
        db.EnrollmentNotes.Add(note);
        audit.Record(new AuditEvent(AuditAction.Created, "EnrollmentNote", note.Id, $"{child} · note by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(note.Id);
    }

    /// <summary>The referrer for a referral, the young person for their own application, otherwise the guardian who submitted.</summary>
    private static string AppliedBy(EnrollmentRequest r) => r.AppliedAs == EnrollmentApplicant.Referrer ? r.ReferrerName ?? r.SubmittedBy : r.SubmittedBy;
}
