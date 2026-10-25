using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Imports;

/// <summary>
/// One roster import: the file's rows as read, the column mapping and target program, and the summary once run. The rows
/// live here for the life of the import; the file itself is not kept.
/// </summary>
public sealed class ImportSession : ITenantOwned
{
    public const int MaxRows = 5000;

    public ImportSession(Guid id, Guid organizationId, string fileName, string headers, string rows, int rowCount, string createdBy, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        FileName = fileName;
        Headers = headers;
        Rows = rows;
        RowCount = rowCount;
        CreatedBy = createdBy;
        CreatedAt = createdAt;
        Status = ImportStatus.Uploaded;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string FileName { get; private set; }

    /// <summary>The header row as JSON.</summary>
    public string Headers { get; private set; }

    /// <summary>The data rows as JSON, one array of cells per row.</summary>
    public string Rows { get; private set; }

    public int RowCount { get; private set; }

    /// <summary>Column name to field, as JSON.</summary>
    public string? Mapping { get; private set; }

    public Guid? ProgramId { get; private set; }
    public ImportStatus Status { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public string? Summary { get; private set; }

    public void Map(string mapping, Guid? programId)
    {
        Mapping = mapping;
        ProgramId = programId;
        Status = ImportStatus.Mapped;
    }

    public void Complete(string summary)
    {
        Summary = summary;
        Status = ImportStatus.Completed;
    }
}
