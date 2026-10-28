namespace PromiseHub.Domain.Identity;

/// <summary>The display choices a person may keep (L2-119, L2-120, ADR 0072); the first of each is the default.</summary>
public static class DisplayOptions
{
    public static readonly IReadOnlyList<string> Themes = ["system", "light", "dark"];

    public static readonly IReadOnlyList<string> TextSizes = ["default", "large", "larger"];
}
