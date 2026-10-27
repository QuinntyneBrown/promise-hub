using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Mentoring;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>Replaces a cohort's mentor team with one lead and any supporting mentors (L2-062 criteria 4 and 9).</summary>
public sealed class SetCohortMentorsHandler(IPromiseHubDb db, ITenantContext tenant, ActiveMentors activeMentors, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid programId, Guid? leadMentorId, IReadOnlyList<Guid>? supportingMentorIds, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        if (program.Status == ProgramStatus.Archived)
        {
            return Invalid("leadMentorId", $"{program.Name} is archived.");
        }
        if (leadMentorId is not { } lead)
        {
            return Invalid("leadMentorId", "Choose a lead mentor.");
        }
        var supporting = (supportingMentorIds ?? []).Distinct().ToList();
        if (supporting.Contains(lead))
        {
            return Invalid("supportingMentorIds", "The lead mentor can’t also be a supporting mentor.");
        }
        if (!await activeMentors.AreActiveAsync([lead, .. supporting], cancellationToken))
        {
            return Invalid("leadMentorId", "Choose active mentors.");
        }
        var existing = await db.CohortMentors.Where(t => t.ProgramId == programId).ToListAsync(cancellationToken);
        var before = new { Lead = existing.FirstOrDefault(t => t.IsLead)?.MentorMembershipId, Supporting = existing.Where(t => !t.IsLead).Select(t => t.MentorMembershipId).ToList() };
        db.CohortMentors.RemoveRange(existing);
        db.CohortMentors.Add(new CohortMentor(Guid.NewGuid(), tenant.OrganizationId, programId, lead, isLead: true));
        foreach (var mentor in supporting)
        {
            db.CohortMentors.Add(new CohortMentor(Guid.NewGuid(), tenant.OrganizationId, programId, mentor, isLead: false));
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "CohortMentors", programId, program.Name, before, new { Lead = lead, Supporting = supporting }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static Result Invalid(string field, string message) => Result.Invalid(new Dictionary<string, string> { [field] = message });
}
