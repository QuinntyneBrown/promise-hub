using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Reports;

/// <summary>A report written to a file (L2-025). The file is kept for seven days; after that the link answers gone.</summary>
public sealed class ReportExport : ITenantOwned
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    public ReportExport(Guid id, Guid organizationId, string fileName, string content, int rows, string createdBy, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        FileName = fileName;
        Content = content;
        Rows = rows;
        CreatedBy = createdBy;
        CreatedAt = createdAt;
        ExpiresAt = createdAt + Lifetime;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string FileName { get; private set; }
    public string Content { get; private set; }
    public int Rows { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
}
