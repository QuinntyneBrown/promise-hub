using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Identity;

/// <summary>Which role holds which permission (L2-007). Checked on the server for every request.</summary>
public static class RolePermissions
{
    public static bool Has(Role role, Permission permission) => permission switch
    {
        Permission.ManageSettings => role is Role.Admin or Role.ProgramDirector,
        Permission.WriteHouseholds => role is Role.Admin or Role.ProgramDirector,
        Permission.DeleteHouseholds => role is Role.Admin,
        // Volunteer coordinators and youth workers never see medical fields (L2-007 criterion 1).
        Permission.ReadMedical => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.WriteMedical => role is Role.Admin or Role.ProgramDirector,
        Permission.ManagePrograms => role is Role.Admin or Role.ProgramDirector,
        Permission.ManageEvents => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.CancelEvents => role is Role.Admin or Role.ProgramDirector,
        Permission.RunSessions => role is Role.Admin or Role.ProgramDirector or Role.SiteLead or Role.YouthWorker,
        // Youth workers run only the sessions they are assigned to (L2-007 criterion 6).
        Permission.RunAnySession => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.SendMessages => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ManageSlips => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ReviewEnrollments => role is Role.Admin or Role.ProgramDirector,
        Permission.ReviewIncidents => role is Role.Admin or Role.ProgramDirector,
        Permission.ManagePickups => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        _ => false,
    };
}
