using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A document the provider asked for (L2-150 criterion 6): requested by name through the webhook, uploaded by the guardian, kept only as
/// ciphertext in the file store, and sent to the provider only on the guardian's Send.
/// </summary>
public sealed class LearningBondDocument : ITenantOwned
{
    public const long MaximumBytes = 10 * 1024 * 1024;

    public LearningBondDocument(Guid id, Guid organizationId, Guid applicationId, string name, DateTimeOffset requestedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ApplicationId = applicationId;
        Name = name;
        RequestedAt = requestedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string Name { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public string? FileName { get; private set; }
    public string? ContentType { get; private set; }
    public string? StorageKey { get; private set; }
    public DateTimeOffset? UploadedAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public void Upload(string fileName, string contentType, string storageKey, DateTimeOffset now)
    {
        FileName = fileName;
        ContentType = contentType;
        StorageKey = storageKey;
        UploadedAt = now;
    }

    public void MarkSent(DateTimeOffset now) => SentAt = now;
}
