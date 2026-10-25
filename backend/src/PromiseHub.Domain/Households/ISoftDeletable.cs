namespace PromiseHub.Domain.Households;

/// <summary>A row hidden from every query once deleted, and purged later.</summary>
public interface ISoftDeletable
{
    DateTimeOffset? DeletedAt { get; }
}
