using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Households;


public sealed class GetChildHandler(IPromiseHubDb db, IAuditWriter audit)
{
    /// <summary>Returns the child of the current organization, or null. A child of another organization is null too, and the attempt is audited.</summary>
    public async Task<ChildDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (child is not null)
        {
            return new ChildDto(child.Id, $"{child.FirstName} {child.LastName}");
        }

        if (await db.Children.IgnoreQueryFilters().AnyAsync(c => c.Id == id, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", id, "Requested a child of another organization"));
            await db.SaveChangesAsync(cancellationToken);
        }
        return null;
    }
}
