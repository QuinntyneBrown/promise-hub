namespace PromiseHub.Application.Attendance;

public sealed record PickupDto(string Name, string Relationship, bool IsPrimary, Guid? PickupId = null);
