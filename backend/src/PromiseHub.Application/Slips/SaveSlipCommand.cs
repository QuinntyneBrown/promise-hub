using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

public sealed record SaveSlipCommand(
    string? Title,
    string? Body,
    DateOnly SignBy,
    bool AskPhotos,
    bool AskSwimming,
    bool AskLunch,
    SlipReminders Reminders,
    SlipChannel Channel);
