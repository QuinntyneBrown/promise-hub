using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Website;

/// <summary>A message a visitor sent from an organization's public contact page (L2-134 criterion 1, ADR 0075). Plain text, never rendered unescaped.</summary>
public sealed class ContactMessage : ITenantOwned
{
    public const int MaximumName = 100;
    public const int MaximumEmail = 320;
    public const int MaximumMessage = 2000;

    public ContactMessage(Guid id, Guid organizationId, string name, string email, string topic, string message, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Name = name;
        Email = email;
        Topic = topic;
        Message = message;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string Topic { get; private set; }
    public string Message { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
