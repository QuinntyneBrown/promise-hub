using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Households;

public sealed class UpdateGuardianHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid id, UpdateGuardianCommand command, CancellationToken cancellationToken = default)
    {
        var guardian = await db.Guardians.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
        if (guardian is null)
        {
            return Result.NotFound;
        }
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            return Result.Invalid(new Dictionary<string, string> { ["name"] = "Enter the guardian’s name." });
        }
        var before = new { guardian.Name, guardian.Relationship, guardian.Mobile, guardian.CanPickUp, guardian.CanSign };
        guardian.Update(command.Name.Trim(), command.Relationship, string.IsNullOrWhiteSpace(command.Mobile) ? null : command.Mobile.Trim(), command.CanPickUp, command.CanSign);
        audit.Record(new AuditEvent(AuditAction.Updated, "Guardian", guardian.Id, guardian.Name, before,
            new { guardian.Name, guardian.Relationship, guardian.Mobile, guardian.CanPickUp, guardian.CanSign }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
