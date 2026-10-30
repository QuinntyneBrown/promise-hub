namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// The Canada Learning Bond rule the estimate uses (L2-147): $500 for the first eligible year and $100 for each later one, up to $2,000, for
/// every year from a child's birth to the year they turn 15. Never the language model's (L2-160). A new version is a new rule; an estimate
/// records the version it used.
/// </summary>
public sealed record LearningBondRule(int Version, DateOnly EffectiveFrom, int FirstYearAmount, int LaterYearAmount, int Cap, int EarliestBirthYear,
    int LastEligibleAge, int ClaimUntilAge)
{
    /// <summary>The rule in force since the Learning Bond began paying these amounts.</summary>
    public static LearningBondRule Current { get; } = new(1, new DateOnly(2004, 1, 1), 500, 100, 2000, 2004, 15, 21);

    /// <summary>"Up to" the amount for a child born in <paramref name="birthYear"/>, as of <paramref name="currentYear"/>; null when the rule doesn't apply.</summary>
    public int? Estimate(int birthYear, int currentYear)
    {
        if (birthYear < EarliestBirthYear || birthYear > currentYear)
        {
            return null;
        }
        var years = Math.Min(currentYear, birthYear + LastEligibleAge) - birthYear + 1;
        return Math.Min(Cap, FirstYearAmount + (years - 1) * LaterYearAmount);
    }
}
