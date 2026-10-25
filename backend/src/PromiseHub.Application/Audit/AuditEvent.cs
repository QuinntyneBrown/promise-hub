using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Audit;

public sealed record AuditEvent(
    AuditAction Action,
    string RecordType,
    Guid? RecordId,
    string Summary,
    object? Before = null,
    object? After = null,
    string? Device = null);
