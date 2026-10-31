using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// An organization's one Learning Bond settings row (ADR 0076): which programs it covers, which staff roles see a family's status and the
/// invitation's sender name. With no row the organization covers every program, Admin and Program director see status, and the sender is
/// the organization's name.
/// </summary>
public sealed class LearningBondSettings : ITenantOwned
{
    /// <summary>Always in the status roles (L2-138 criterion 4).</summary>
    public static readonly Role[] FixedRoles = [Role.Admin, Role.ProgramDirector];

    /// <summary>The staff roles that may be given status, in the order the page lists them; Mentor, Volunteer and Youth never are.</summary>
    public static readonly Role[] OfferedRoles = [Role.Admin, Role.ProgramDirector, Role.SiteLead, Role.YouthWorker, Role.VolunteerCoordinator];

    public LearningBondSettings(Guid id, Guid organizationId, DateTimeOffset updatedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Coverage = LearningBondCoverageMode.AllPrograms;
        ProgramIds = string.Empty;
        StatusRoles = string.Join(',', FixedRoles);
        UpdatedAt = updatedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public LearningBondCoverageMode Coverage { get; private set; }

    /// <summary>The chosen programs' ids, comma-separated; empty while every program is covered.</summary>
    public string ProgramIds { get; private set; }

    /// <summary>The roles that see status, comma-separated, always starting with the fixed pair.</summary>
    public string StatusRoles { get; private set; }

    public string? SenderName { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public IReadOnlyList<Guid> Programs => [.. ProgramIds.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse)];

    public IReadOnlyList<Role> Roles => [.. StatusRoles.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Enum.Parse<Role>)];

    /// <summary>Stores coverage and roles, adding the fixed pair back, and answers the names of the fields that changed.</summary>
    public IReadOnlyList<string> ChangeCoverage(LearningBondCoverageMode coverage, IEnumerable<Guid> programs, IEnumerable<Role> roles, DateTimeOffset now)
    {
        var programIds = coverage == LearningBondCoverageMode.AllPrograms ? string.Empty : string.Join(',', programs.Distinct());
        var statusRoles = string.Join(',', OfferedRoles.Where(r => FixedRoles.Contains(r) || roles.Contains(r)));
        var changed = new List<string>();
        if (coverage != Coverage)
        {
            changed.Add(nameof(Coverage));
        }
        if (programIds != ProgramIds)
        {
            changed.Add("Programs");
        }
        if (statusRoles != StatusRoles)
        {
            changed.Add(nameof(StatusRoles));
        }
        Coverage = coverage;
        ProgramIds = programIds;
        StatusRoles = statusRoles;
        if (changed.Count > 0)
        {
            UpdatedAt = now;
        }
        return changed;
    }

    public void ChangeSenderName(string senderName, DateTimeOffset now)
    {
        SenderName = senderName;
        UpdatedAt = now;
    }
}
