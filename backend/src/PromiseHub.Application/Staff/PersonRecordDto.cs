using System.Text.Json.Serialization;

namespace PromiseHub.Application.Staff;

/// <summary>
/// One account's record (page: person, L2-113). <see cref="Mentoring"/> is left out of the JSON while Mentoring is off, and
/// <see cref="Learning"/> while Learning is off or for anyone who is not a youth.
/// </summary>
public sealed record PersonRecordDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string Status,
    DateTimeOffset? DeactivatedAt,
    string? DeactivatedBy,
    DateTimeOffset? LastSignedInAt,
    bool IsYou,
    PersonChildDto? Child,
    IReadOnlyList<string> Programs,
    IReadOnlyList<PersonHistoryDto> History,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] PersonMentoringDto? Mentoring,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] PersonLearningDto? Learning);
