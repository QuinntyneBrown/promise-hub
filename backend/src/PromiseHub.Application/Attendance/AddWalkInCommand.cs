namespace PromiseHub.Application.Attendance;

public sealed record AddWalkInCommand(string ChildName, string Guardian, string? MedicalNotes);
