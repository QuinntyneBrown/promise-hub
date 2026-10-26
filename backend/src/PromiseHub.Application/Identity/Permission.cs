namespace PromiseHub.Application.Identity;

public enum Permission
{
    ManageSettings,
    WriteHouseholds,
    DeleteHouseholds,
    ReadMedical,
    WriteMedical,
    ManagePrograms,
    ManageEvents,
    CancelEvents,
    RunSessions,
    RunAnySession,
    SendMessages,
    ManageSlips,
    ReviewEnrollments,
    ReviewIncidents,
    ManagePickups,
    ManageStaff,
    InviteStaff,
    AssignStaff,
    ReadDateOfBirth,
    ViewReports,
    ReadSmallCounts,
    ManageBilling,
    ViewAudit,

    /// <summary>Held by the five staff roles; the fallback policy requires it, so a participant role reaches only what it was granted (ADR 0043).</summary>
    UseStaffApp,
    Learn,
    MentorYouth,
    AuthorCurriculum,
}
