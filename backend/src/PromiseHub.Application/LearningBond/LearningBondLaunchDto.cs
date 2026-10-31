namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The launch page (L2-140): the covered households and how each can be reached, whether no covered household has a mobile number, the
/// launch as chosen, and the range of days it may be scheduled for in the organization's time zone. Counts and dates only.
/// </summary>
public sealed record LearningBondLaunchDto(
    int Covered,
    int Mobile,
    int EmailOnly,
    int Neither,
    IReadOnlyList<string> Programs,
    bool NoPhoneNumbers,
    string? Mode,
    DateOnly? Date,
    DateTimeOffset? LaunchedAt,
    DateOnly Earliest,
    DateOnly Latest,
    string? LaunchBlocked);
