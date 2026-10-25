namespace PromiseHub.Domain.Audit;

public enum AuditAction
{
    Created,
    Updated,
    Deleted,
    Viewed,
    Signed,
    Exported,
    Imported,
    Sent,
    RoleChanged,
    ModuleChanged,
    AccessDenied,
}
