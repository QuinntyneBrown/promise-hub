namespace PromiseHub.Application.Audit;

/// <summary>One page of the audit log, newest first, with how many entries match.</summary>
public sealed record AuditLogDto(IReadOnlyList<AuditLogEntryDto> Entries, int Total, int Page, int PageSize);
