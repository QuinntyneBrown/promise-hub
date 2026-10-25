namespace PromiseHub.Application.Audit;

/// <summary>Appends an audit entry to the current unit of work; it is committed with the caller's save.</summary>
public interface IAuditWriter
{
    void Record(AuditEvent auditEvent);
}
