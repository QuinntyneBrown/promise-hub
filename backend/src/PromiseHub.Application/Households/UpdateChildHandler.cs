using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Households;

public sealed class UpdateChildHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid id, UpdateChildCommand command, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (child is null)
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter the child’s name.";
        }
        if (command.DateOfBirth is null)
        {
            errors["dateOfBirth"] = "Enter the date of birth.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var before = new { child.FirstName, child.LastName, child.DateOfBirth, child.School };
        var (first, last) = PersonName.Split(command.Name);
        child.UpdateDetails(first, last, command.DateOfBirth, string.IsNullOrWhiteSpace(command.School) ? null : command.School.Trim());
        audit.Record(new AuditEvent(AuditAction.Updated, "Child", child.Id, child.FullName, before,
            new { child.FirstName, child.LastName, child.DateOfBirth, child.School }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
