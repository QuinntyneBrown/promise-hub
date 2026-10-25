namespace PromiseHub.Application.Attendance;

/// <summary>What the sign-out dialog needs: the approved adults, primary first, and whom to call for anyone else.</summary>
public sealed record PickupOptionsDto(
    Guid ChildId,
    string ChildName,
    string? PrimaryName,
    string? PrimaryPhone,
    IReadOnlyList<ApprovedAdultDto> Approved);
