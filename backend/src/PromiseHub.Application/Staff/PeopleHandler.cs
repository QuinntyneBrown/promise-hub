using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Staff;

/// <summary>
/// The people directory (page: people, L2-112, ADR 0070): the active organization's memberships that are not removed, searched and
/// filtered on the server, 25 to a page. Mentoring fields and the Mentor filter exist only while Mentoring is on.
/// </summary>
public sealed class PeopleHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules)
{
    public const int PageSize = 25;

    public async Task<PeopleListResult> ListAsync(PeopleQuery query, CancellationToken cancellationToken = default)
    {
        var mentoring = await modules.IsOnAsync(ModuleId.Mentoring, cancellationToken);
        var roles = Enum.GetValues<Role>().Where(r => mentoring || r != Role.Mentor).ToList();
        var errors = new Dictionary<string, string>();
        Role? role = null;
        if (!string.IsNullOrEmpty(query.Role))
        {
            if (Enum.TryParse<Role>(query.Role, out var parsed) && roles.Contains(parsed))
            {
                role = parsed;
            }
            else
            {
                errors["role"] = "Choose a role.";
            }
        }
        if (!string.IsNullOrEmpty(query.Status) && query.Status is not ("Active" or "Deactivated"))
        {
            errors["status"] = "Choose Active or Deactivated.";
        }
        if (errors.Count > 0)
        {
            return new PeopleListResult(null, errors);
        }

        var members = db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null);
        if (role is { } r)
        {
            members = members.Where(m => m.Role == r);
        }
        if (query.Status == "Deactivated")
        {
            members = members.Where(m => false);
        }
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim().ToLower();
            members = members.Where(m => m.PersonName.ToLower().Contains(term) || m.Email.ToLower().Contains(term));
        }
        if (query.ProgramId is { } programId)
        {
            var children = db.Enrollments.Where(e => e.ProgramId == programId && e.EndedAt == null).Select(e => e.ChildId);
            var mentors = db.CohortMentors.Where(c => mentoring && c.ProgramId == programId).Select(c => c.MentorMembershipId);
            members = members.Where(m => (m.ChildId != null && children.Contains(m.ChildId.Value)) || mentors.Contains(m.Id));
        }

        var all = await members.ToListAsync(cancellationToken);
        // SQLite cannot order by culture; names sort here, which also keeps accents (Sofía) in place.
        var ordered = all.OrderBy(m => m.PersonName, StringComparer.CurrentCultureIgnoreCase).ToList();
        var page = Math.Max(1, query.Page);
        var slice = ordered.Skip((page - 1) * PageSize).Take(PageSize).ToList();
        var details = await PersonDetails.LoadAsync(db, slice, mentoring, cancellationToken);
        var items = slice.Select(m => new PersonRowDto(m.Id, m.PersonName, m.Email, m.Role.ToString(), "Active", details.Programs(m),
            details.LastSignedIn(m), m.Id == tenant.MembershipId, mentoring ? details.Mentoring(m) : null)).ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => p.Status == ProgramStatus.Active).OrderBy(p => p.Name)
            .Select(p => new ProgramOptionDto(p.Id, p.Name)).ToListAsync(cancellationToken);
        return new PeopleListResult(new PeoplePageDto(items, ordered.Count, page, PageSize, [.. roles.Select(x => x.ToString())], programs), null);
    }
}
