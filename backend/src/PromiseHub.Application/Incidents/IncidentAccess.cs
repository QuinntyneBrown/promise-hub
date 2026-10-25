using PromiseHub.Domain.Incidents;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Incidents;

/// <summary>Supervisors (admins and program directors) read the whole log; everyone else reads only what they reported (L2-023 criterion 3).</summary>
public static class IncidentAccess
{
    public static bool ReadsLog(Role role) => role is Role.Admin or Role.ProgramDirector;

    public static IQueryable<Incident> Readable(IQueryable<Incident> incidents, Role role, Guid membershipId) =>
        ReadsLog(role) ? incidents : incidents.Where(i => i.ReporterId == membershipId);
}
