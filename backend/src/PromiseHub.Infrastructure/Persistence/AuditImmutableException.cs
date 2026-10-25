namespace PromiseHub.Infrastructure.Persistence;

public sealed class AuditImmutableException() : InvalidOperationException("Audit entries cannot be edited or deleted.");
