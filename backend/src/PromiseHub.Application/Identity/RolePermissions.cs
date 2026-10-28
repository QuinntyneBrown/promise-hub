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
        // Volunteers run only the sessions they are assigned to, like youth workers (ADR 0043).
        Permission.RunSessions => role is Role.Admin or Role.ProgramDirector or Role.SiteLead or Role.YouthWorker or Role.Volunteer,
        // Youth workers run only the sessions they are assigned to (L2-007 criterion 6).
        Permission.RunAnySession => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.SendMessages => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ManageSlips => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ReviewEnrollments => role is Role.Admin or Role.ProgramDirector,
        Permission.ReviewIncidents => role is Role.Admin or Role.ProgramDirector,
        Permission.ManagePickups => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ManageStaff => role is Role.Admin,
        Permission.InviteStaff => role is Role.Admin or Role.VolunteerCoordinator,
        Permission.AssignStaff => role is Role.Admin or Role.ProgramDirector or Role.SiteLead or Role.VolunteerCoordinator,
        // Youth workers and coordinators see a child's age, not the date of birth (L2-007 criterion 7).
        Permission.ReadDateOfBirth => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        Permission.ViewReports => role is Role.Admin or Role.ProgramDirector or Role.SiteLead,
        // Exact counts under five are shown only to directors and admins; exports always mask them (L2-024 criterion 3).
        Permission.ReadSmallCounts => role is Role.Admin or Role.ProgramDirector,
        Permission.ManageBilling => role is Role.Admin,
        Permission.ViewAudit => role is Role.Admin,
        Permission.UseStaffApp => role is Role.Admin or Role.ProgramDirector or Role.SiteLead or Role.YouthWorker or Role.VolunteerCoordinator,
        Permission.Learn => role is Role.Youth,
        Permission.MentorYouth => role is Role.Mentor,
        Permission.AuthorCurriculum => role is Role.Admin or Role.ProgramDirector,
        Permission.ReviewAtRiskFlags => role is Role.Admin or Role.ProgramDirector,
        _ => false,
    };
}
