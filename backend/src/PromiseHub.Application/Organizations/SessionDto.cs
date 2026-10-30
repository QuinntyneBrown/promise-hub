using PromiseHub.Application.Identity;

namespace PromiseHub.Application.Organizations;

public sealed record SessionDto(
    string PersonName,
    string Role,
    Guid OrganizationId,
    string OrganizationName,
    string Plan,
    IReadOnlyList<string> Modules,
    Guid MembershipId,
    DisplayPreferencesDto Display,
    bool LearningBondStatus);
