namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The Learning Bond card on a household (L2-140 criteria 4 and 5): whether it is covered and by which programs, when it was last invited,
/// whom the invitation reaches and in which language, and the text it carries with the sample link. Never a contact, a SIN or an amount.
/// </summary>
public sealed record LearningBondHouseholdDto(
    Guid HouseholdId,
    string Name,
    bool Covered,
    IReadOnlyList<string> Programs,
    IReadOnlyList<string> Children,
    DateTimeOffset? InvitedAt,
    IReadOnlyList<string> Recipients,
    string Language,
    string Sms,
    int SmsCharacters,
    int SmsSegments);
