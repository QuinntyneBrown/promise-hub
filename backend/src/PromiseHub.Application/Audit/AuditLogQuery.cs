namespace PromiseHub.Application.Audit;

/// <summary>Text matched against who, the record and the summary; an action; the last N days; a page from 1.</summary>
public sealed record AuditLogQuery(string? Q, string? Action, int? Days, int? Page);
