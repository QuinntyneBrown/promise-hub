namespace PromiseHub.Application.Messaging;

/// <summary>
/// The composer's live count: households matched, how many by text and by email, how many cannot be reached, the SMS
/// segments the message needs and how many households would get email instead because of the cap.
/// </summary>
public sealed record MessagePreviewDto(
    int RecipientCount,
    int TextCount,
    int EmailCount,
    int UnreachableCount,
    int Characters,
    int Segments,
    int TotalSegments,
    int RemainingSegments,
    int FallingBackToEmail);
