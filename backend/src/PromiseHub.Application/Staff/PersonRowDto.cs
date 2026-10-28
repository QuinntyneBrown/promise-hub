using System.Text.Json.Serialization;

namespace PromiseHub.Application.Staff;

/// <summary>
/// One account in the directory. <see cref="Mentoring"/> is left out of the JSON while Mentoring is off (L2-112 criterion 4).
/// </summary>
public sealed record PersonRowDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string Status,
    IReadOnlyList<string> Programs,
    DateTimeOffset? LastSignedInAt,
    bool IsYou,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] PersonMentoringDto? Mentoring);
