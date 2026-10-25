using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Households;

/// <summary>Adds a family: a household named after its first guardian, who becomes the primary guardian.</summary>
public sealed class CreateHouseholdHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(CreateHouseholdCommand command, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.GuardianName))
        {
            errors["guardianName"] = "Enter the guardian’s name.";
        }
        if (string.IsNullOrWhiteSpace(command.Mobile) && string.IsNullOrWhiteSpace(command.Email))
        {
            errors["mobile"] = "Enter a mobile number or an email.";
        }
        var language = HouseholdRules.Languages.Contains(command.Language) ? command.Language : "English";
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var name = command.GuardianName.Trim();
        var (_, last) = PersonName.Split(name);
        var household = new Household(Guid.NewGuid(), tenant.OrganizationId, string.IsNullOrEmpty(last) ? name : last, language);
        var guardian = new Domain.Households.Guardian(Guid.NewGuid(), tenant.OrganizationId, household.Id, name, "Guardian",
            Clean(command.Mobile), Clean(command.Email), language, isPrimary: true, canPickUp: true, canSign: true);
        db.Households.Add(household);
        db.Guardians.Add(guardian);
        audit.Record(new AuditEvent(AuditAction.Created, "Household", household.Id, $"{household.Name} household",
            After: new { household.Name, Guardian = guardian.Name, guardian.Mobile, guardian.Email, household.Language }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(household.Id);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
