namespace PromiseHub.Domain.Organizations;

public enum Role
{
    Admin,
    ProgramDirector,
    SiteLead,
    YouthWorker,
    VolunteerCoordinator,

    // Participant roles (ADR 0043): they hold no staff permission.
    Youth,
    Mentor,
    Volunteer,
}
