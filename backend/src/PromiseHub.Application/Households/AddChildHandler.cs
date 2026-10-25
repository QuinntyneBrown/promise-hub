using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Households;

public sealed class AddChildHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid householdId, AddChildCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.Households.AnyAsync(h => h.Id == householdId, cancellationToken))
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter the child’s name.";
        }
        if (command.DateOfBirth is not { } born || born > DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime))
        {
            errors["dateOfBirth"] = "Enter the date of birth.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var (first, last) = PersonName.Split(command.Name);
        var child = new Child(Guid.NewGuid(), tenant.OrganizationId, householdId, first, last, command.DateOfBirth,
            string.IsNullOrWhiteSpace(command.School) ? null : command.School.Trim());
        if (!string.IsNullOrWhiteSpace(command.Allergies) && !command.Allergies.Trim().Equals("none", StringComparison.OrdinalIgnoreCase))
        {
            child.UpdateMedical(new MedicalDetails(command.Allergies.Trim(), null, null, null, false), tenant.ActorName, clock.GetUtcNow());
        }
        db.Children.Add(child);
        audit.Record(new AuditEvent(AuditAction.Created, "Child", child.Id, child.FullName,
            After: new { child.FirstName, child.LastName, child.DateOfBirth, child.School }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(child.Id);
    }
}
