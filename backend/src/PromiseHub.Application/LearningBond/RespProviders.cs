namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The platform's list of no-fee RESP providers (L2-148 criteria 1 and 5): the same for every organization, which cannot change, reorder or
/// add to it, and no provider pays to be on it. The recommendation is the first that serves the household's province.
/// </summary>
public static class RespProviders
{
    public const string Reason = "No fees, no deposit needed, and it handles the Learning Bond";

    /// <summary>The provinces and territories, by their two-letter codes.</summary>
    public static readonly string[] Provinces = ["NL", "PE", "NS", "NB", "QC", "ON", "MB", "SK", "AB", "BC", "YT", "NT", "NU"];

    public static readonly IReadOnlyList<RespProvider> All =
    [
        new("Northfield Credit Union", ["ON", "MB", "SK", "AB", "BC"], "northfield", 71, 115),
        new("Maple Trust RESP", ["NL", "PE", "NS", "NB", "QC", "ON", "MB", "SK", "AB", "BC", "YT", "NT"], "maple-trust", 60, 120),
        new("Prairie Co-op Education Savings", ["MB", "SK", "AB"], "prairie-coop", 45, 90),
    ];

    public static IReadOnlyList<RespProvider> Serving(string province) => [.. All.Where(p => p.Provinces.Contains(province))];

    public static RespProvider? Named(string? name) => All.FirstOrDefault(p => p.Name == name);

    /// <summary>The province an organization is in, from its time zone; the guardian can change it on the review.</summary>
    public static string ProvinceOf(string timeZone) => timeZone switch
    {
        "America/St_Johns" => "NL",
        "America/Halifax" or "America/Glace_Bay" => "NS",
        "America/Moncton" => "NB",
        "America/Montreal" => "QC",
        "America/Winnipeg" => "MB",
        "America/Regina" => "SK",
        "America/Edmonton" => "AB",
        "America/Vancouver" => "BC",
        "America/Whitehorse" => "YT",
        "America/Yellowknife" => "NT",
        "America/Iqaluit" => "NU",
        _ => "ON",
    };
}
