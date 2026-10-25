namespace PromiseHub.Application.Households;

public static class HouseholdRules
{
    /// <summary>How long a deleted household is kept before the purge (L2-011 criterion 5).</summary>
    public static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    public static readonly string[] Languages = ["English", "Spanish", "French"];
}
