namespace PromiseHub.Application.Events;

public sealed record CancelEventCommand(string? Message, bool TellGuardians);
