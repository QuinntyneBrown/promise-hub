using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Enrollment;

namespace PromiseHub.Application.Enrollment;

/// <summary>A program's children waiting for review or waitlisted (screen: roster).</summary>
public sealed class ListEnrollmentRequestsHandler(IPromiseHubDb db, TimeProvider clock)
{
    public async Task<object?> HandleAsync(Guid programId, string? status, CancellationToken cancellationToken = default)
    {
        if (!await db.Programs.AnyAsync(p => p.Id == programId, cancellationToken))
        {
            return null;
        }
        var wanted = Enum.TryParse<EnrollmentRequestStatus>(status, out var s) ? s : EnrollmentRequestStatus.WaitingReview;
        var requests = await db.EnrollmentRequests.AsNoTracking().Where(r => r.ProgramId == programId && r.Status == wanted).ToListAsync(cancellationToken);
        var childIds = requests.Select(r => r.ChildId).ToList();
        var householdIds = requests.Select(r => r.HouseholdId).Distinct().ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);
        var households = await db.Households.AsNoTracking().Where(h => householdIds.Contains(h.Id)).ToDictionaryAsync(h => h.Id, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => householdIds.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        var returning = (await db.Enrollments.AsNoTracking().Where(e => childIds.Contains(e.ChildId)).Select(e => e.ChildId).ToListAsync(cancellationToken)).ToHashSet();
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var rows = requests.Select(r =>
        {
            var child = children[r.ChildId];
            var primary = guardians.Where(g => g.HouseholdId == r.HouseholdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
            var medical = string.Join("; ", new[] { child.Allergies, child.Medication }.Where(x => !string.IsNullOrWhiteSpace(x)));
            return new EnrollmentRequestDto(r.Id, child.Id, r.HouseholdId, child.FullName, child.AgeOn(today), primary?.Name ?? r.SubmittedBy, primary?.Mobile,
                households[r.HouseholdId].Language, medical.Length == 0 ? null : medical, returning.Contains(child.Id), r.SubmittedAt, r.Status.ToString(), r.Position);
        });
        var ordered = wanted == EnrollmentRequestStatus.Waitlisted ? rows.OrderBy(r => r.Position) : rows.OrderBy(r => r.Child, StringComparer.CurrentCulture);
        return new { requests = ordered.ToList() };
    }
}
