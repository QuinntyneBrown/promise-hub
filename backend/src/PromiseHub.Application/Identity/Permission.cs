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

    /// <summary>Reads and resolves every at-risk flag of the organization and is notified of new ones (L2-091, ADR 0062).</summary>
    ReviewAtRiskFlags,

    /// <summary>Reads her own schedule and RSVPs to its sessions (L2-094, ADR 0064).</summary>
    RespondToSessions,

    /// <summary>Reads a cohort's attendance history and rates (L2-097, ADR 0065).</summary>
    ReviewAttendance,

    /// <summary>Corrects a youth's mark at a session, audited with a reason (L2-097, ADR 0065).</summary>
    CorrectAttendance,

    /// <summary>Marks a check-in late or an absence excused (L2-095); every role that runs sessions but volunteers (L2-100, ADR 0066).</summary>
    QualifyAttendance,

    /// <summary>Reads the announcements aimed at her role and programs and marks them read (L2-105, ADR 0068): youth and mentors.</summary>
    ReadAnnouncements,

    /// <summary>Reads every conversation between a mentor and a youth, read only, each opening audited (L2-108, ADR 0068).</summary>
    SuperviseConversations,
}
