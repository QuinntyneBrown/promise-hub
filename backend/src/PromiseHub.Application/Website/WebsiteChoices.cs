namespace PromiseHub.Application.Website;

/// <summary>The fixed lists the public forms choose from (L2-134, ADR 0075).</summary>
public static class WebsiteChoices
{
    public static readonly IReadOnlyList<string> Topics = ["Programs and enrollment", "Volunteering", "Giving", "Something else"];

    public static readonly IReadOnlyList<string> Areas = ["Homework help", "Coaching a sports team", "Camp helper", "Driving and setup", "Wherever I’m needed"];

    /// <summary>Monthly donation amounts in dollars (Waypoint decision 13).</summary>
    public static readonly IReadOnlyList<int> MonthlyAmounts = [20, 50, 100];
}
