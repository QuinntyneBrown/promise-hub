using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Households;

public sealed class AddGuardianHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid householdId, AddGuardianCommand command, CancellationToken cancellationToken = default)
    {
        var household = await db.Households.FirstOrDefaultAsync(h => h.Id == householdId, cancellationToken);
        if (household is null)
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter the guardian’s name.";
        }
        if (string.IsNullOrWhiteSpace(command.Mobile) && string.IsNullOrWhiteSpace(command.Email))
        {
            errors["mobile"] = "Enter a mobile number or an email.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var guardian = new Domain.Households.Guardian(Guid.NewGuid(), tenant.OrganizationId, householdId, command.Name.Trim(), command.Relationship,
            string.IsNullOrWhiteSpace(command.Mobile) ? null : command.Mobile.Trim(),
            string.IsNullOrWhiteSpace(command.Email) ? null : command.Email.Trim(),
            HouseholdRules.Languages.Contains(command.Language) ? command.Language : household.Language,
            isPrimary: false, command.CanPickUp, command.CanSign);
        db.Guardians.Add(guardian);
        audit.Record(new AuditEvent(AuditAction.Created, "Guardian", guardian.Id, $"{guardian.Name} · {household.Name} household",
            After: new { guardian.Name, guardian.Relationship, guardian.Mobile, guardian.Email, guardian.CanPickUp, guardian.CanSign }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(guardian.Id);
    }
}
