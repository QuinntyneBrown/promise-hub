using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Enrollment;

namespace PromiseHub.Application.Enrollment;

/// <summary>
/// The organization's application pipeline (screen: applications; L2-072): every enrollment request with one status, who applied
/// and the program, with the count of each status. The tenant filter keeps it to the signed-in organization.
/// </summary>
public sealed class ApplicationsHandler(IPromiseHubDb db, TimeProvider clock)
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

    /// <summary>The referrer for a referral, the young person for their own application, otherwise the guardian who submitted.</summary>
    private static string AppliedBy(EnrollmentRequest r) => r.AppliedAs == EnrollmentApplicant.Referrer ? r.ReferrerName ?? r.SubmittedBy : r.SubmittedBy;
}
