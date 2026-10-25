namespace PromiseHub.Application.Attendance;

/// <summary>A guardian who may pick up (<see cref="GuardianId"/>) or another approved adult (<see cref="PickupId"/>).</summary>
public sealed record ApprovedAdultDto(Guid? GuardianId, string Name, string Relationship, bool IsPrimary, Guid? PickupId = null);
