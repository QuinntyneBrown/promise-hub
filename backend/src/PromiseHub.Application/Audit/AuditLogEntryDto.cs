namespace PromiseHub.Application.Audit;

public sealed record AuditLogEntryDto(DateTimeOffset When, string Who, string Action, string Record, string Summary, string? Device);
