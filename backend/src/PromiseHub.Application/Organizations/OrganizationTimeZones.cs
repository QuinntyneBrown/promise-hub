namespace PromiseHub.Application.Organizations;

/// <summary>The time zones an organization may choose (L2-122, ADR 0073): Canada's, west to east by name.</summary>
public static class OrganizationTimeZones
{
    public static readonly IReadOnlyList<string> All =
    [
        "America/St_Johns", "America/Halifax", "America/Toronto", "America/Winnipeg", "America/Regina", "America/Edmonton", "America/Vancouver",
        "America/Whitehorse",
    ];
}
