namespace PromiseHub.Application.Attendance;

/// <summary>An adult to add (dialog: add-pickup); with <see cref="Siblings"/> the adult is added for every child of the household.</summary>
public sealed record AddPickupCommand(string? Name, string? Relationship, string? Mobile, bool Siblings);
