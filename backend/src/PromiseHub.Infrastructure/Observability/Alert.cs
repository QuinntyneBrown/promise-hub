namespace PromiseHub.Infrastructure.Observability;

/// <summary>Something on-call must look at: its kind ("error-rate" or "queue-age"), the tenant when it is one tenant's, and a summary.</summary>
public sealed record Alert(string Kind, Guid? OrganizationId, string Summary, DateTimeOffset RaisedAt);
