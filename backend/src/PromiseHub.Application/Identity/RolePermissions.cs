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
        _ => false,
    };
}
