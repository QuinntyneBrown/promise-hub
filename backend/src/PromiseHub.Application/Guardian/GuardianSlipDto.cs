namespace PromiseHub.Application.Guardian;

/// <summary>The slip page for one child: the event, the child's details to check, the questions, the text to agree to and where it stands.</summary>
public sealed record GuardianSlipDto(
    string Language,
    string Organization,
    string? Phone,
    string GuardianName,
    GuardianSlipEventDto Event,
    GuardianSlipChildDto Child,
    GuardianContactDto? EmergencyContact,
    string Title,
    string Body,
    DateOnly SignBy,
    bool AskPhotos,
    bool AskSwimming,
    bool AskLunch,
    string Status,
    DateTimeOffset? AnsweredAt,
    string? AnsweredBy);
