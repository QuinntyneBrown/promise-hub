using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The covered households with their status (L2-142 criteria 1 and 5): for staff whose role is in the status roles. A status is computed
/// from the household's records: its latest invitation and its call requests; the claim's steps add theirs as they arrive.
/// </summary>
public sealed class LearningBondFamiliesHandler(IPromiseHubDb db, LearningBondCoverage coverage, LearningBondStatusRoles roles)
{
    public async Task<(bool Allowed, LearningBondFamiliesDto? List)> ListAsync(string? status, Guid? programId, CancellationToken cancellationToken = default)
    {
        if (!await roles.SeesStatusAsync(cancellationToken))
        {
            return (false, null);
        }
        var covered = await coverage.CoveredAsync(cancellationToken);
        var ids = covered.Select(c => c.HouseholdId).ToList();
        var households = await db.Households.AsNoTracking().Where(h => ids.Contains(h.Id)).ToDictionaryAsync(h => h.Id, h => h.Name, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        var invitations = await db.LearningBondInvitations.AsNoTracking().Where(i => ids.Contains(i.HouseholdId)).Select(i => new { i.HouseholdId, i.SentAt, i.DeclinedAt })
            .ToListAsync(cancellationToken);
        var calls = await db.LearningBondCallRequests.AsNoTracking().Where(r => ids.Contains(r.HouseholdId)).ToListAsync(cancellationToken);
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => ids.Contains(c.HouseholdId)).Select(c => new { c.HouseholdId, c.UpdatedAt, c.PausedReason, c.Status })
            .ToListAsync(cancellationToken);
        var rows = covered.Select(c =>
        {
            var invited = invitations.Where(i => i.HouseholdId == c.HouseholdId).Select(i => (DateTimeOffset?)i.SentAt).Max();
            var state = invited is null ? LearningBondFamilyStatus.NotInvited : LearningBondFamilyStatus.Invited;
            var changed = invited;
            var own = calls.Where(r => r.HouseholdId == c.HouseholdId).ToList();
            var open = own.Where(r => r.IsOpen).OrderByDescending(r => r.RequestedAt).FirstOrDefault();
            var done = own.Where(r => !r.IsOpen).OrderByDescending(r => r.DoneAt).FirstOrDefault();
            if (open is not null)
            {
                (state, changed) = (LearningBondFamilyStatus.CallRequested, open.RequestedAt);
            }
            else if (claims.Where(x => x.HouseholdId == c.HouseholdId).OrderByDescending(x => x.UpdatedAt).FirstOrDefault() is { } claim)
            {
                state = claim.Status == LearningBondClaimStatus.Deposited ? LearningBondFamilyStatus.Deposited
                    : claim.Status == LearningBondClaimStatus.Submitted ? LearningBondFamilyStatus.Submitted : claim.PausedReason switch
                    {
                        LearningBondPausedReason.NeedsTaxReturn => LearningBondFamilyStatus.PausedNeedsTaxReturn,
                        LearningBondPausedReason.NeedsSin => LearningBondFamilyStatus.PausedNeedsSin,
                        _ => LearningBondFamilyStatus.Started,
                    };
                changed = claim.UpdatedAt;
            }
            else if (done is { Outcome: LearningBondCallOutcome.NotInterested })
            {
                (state, changed) = (LearningBondFamilyStatus.NotInterested, done.DoneAt);
            }
            else if (invitations.Where(i => i.HouseholdId == c.HouseholdId).Select(i => i.DeclinedAt).Max() is { } declined)
            {
                (state, changed) = (LearningBondFamilyStatus.NotInterested, declined);
            }
            var guardian = guardians.Where(g => g.HouseholdId == c.HouseholdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture)
                .FirstOrDefault()?.Name;
            return (Covered: c, Row: new LearningBondFamilyDto(c.HouseholdId, households[c.HouseholdId], guardian, string.Join(", ", c.Programs), state.ToString(), changed,
                open?.Phone, open?.When.ToString()));
        }).ToList();
        var programs = covered.SelectMany(c => c.ProgramIds.Zip(c.Programs)).Distinct().OrderBy(p => p.Second, StringComparer.CurrentCulture)
            .Select(p => new LearningBondProgramDto(p.First, p.Second, covered.Count(c => c.ProgramIds.Contains(p.First)))).ToList();
        return (true, new LearningBondFamiliesDto(covered.Count, programs, [.. rows
            .Where(r => string.IsNullOrEmpty(status) || string.Equals(r.Row.Status, status, StringComparison.OrdinalIgnoreCase))
            .Where(r => programId is null || r.Covered.ProgramIds.Contains(programId.Value))
            .Select(r => r.Row)]));
    }
}
