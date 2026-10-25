namespace PromiseHub.Application.Attendance;

/// <summary>Who collected the child: an approved guardian, or someone else named with the guardian's okay by phone.</summary>
public sealed record SignOutCommand(
    Guid ChildId,
    Guid? GuardianId,
    bool SomeoneElse,
    string? OtherName,
    bool GuardianConfirmed,
    bool IdChecked,
    DateTimeOffset? LeftAt,
    Guid ClientActionId);
