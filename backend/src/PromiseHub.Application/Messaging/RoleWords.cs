using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>A role as a youth or mentor reads it under an announcement.</summary>
public static class RoleWords
{
    public static string Of(Role role) => role switch
    {
        Role.ProgramDirector => "Program director",
        Role.SiteLead => "Site lead",
        Role.YouthWorker => "Youth worker",
        Role.VolunteerCoordinator => "Volunteer coordinator",
        _ => role.ToString(),
    };
}
