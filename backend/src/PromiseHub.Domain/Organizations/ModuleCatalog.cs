namespace PromiseHub.Domain.Organizations;

/// <summary>Each module's name and the modules it needs. Every module needs Roster; Pickup also needs Roll Call and Learning Bond Messages.</summary>
public static class ModuleCatalog
{
    public static readonly IReadOnlyList<ModuleId> All = Enum.GetValues<ModuleId>();

    /// <summary>The eight operations modules of the "Whole suite" preset. Learning, Mentoring, Public website and Learning Bond are switched on one at a time (ADR 0043, ADR 0076).</summary>
    public static readonly IReadOnlyList<ModuleId> Suite =
        [ModuleId.Roster, ModuleId.Slips, ModuleId.RollCall, ModuleId.QuickCards, ModuleId.Pickup, ModuleId.Messages, ModuleId.Incidents, ModuleId.Reports];

    public static string Name(ModuleId module) => module switch
    {
        ModuleId.Roster => "Roster",
        ModuleId.Slips => "Permission slips",
        ModuleId.RollCall => "Roll Call",
        ModuleId.QuickCards => "Quick Cards",
        ModuleId.Pickup => "Pickup",
        ModuleId.Messages => "Messages",
        ModuleId.Incidents => "Incident log",
        ModuleId.Reports => "Reports",
        ModuleId.Learning => "Learning",
        ModuleId.Mentoring => "Mentoring",
        ModuleId.PublicWebsite => "Public website",
        ModuleId.LearningBond => "Learning Bond",
        _ => module.ToString(),
    };

    public static IReadOnlyList<ModuleId> Needs(ModuleId module) => module switch
    {
        ModuleId.Roster => [],
        ModuleId.Pickup => [ModuleId.Roster, ModuleId.RollCall],
        ModuleId.LearningBond => [ModuleId.Roster, ModuleId.Messages],
        _ => [ModuleId.Roster],
    };
}
