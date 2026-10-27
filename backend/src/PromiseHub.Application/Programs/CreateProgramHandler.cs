using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Programs;

/// <summary>Creates a program with nobody enrolled; enrollment is closed unless the director opens it (L2-012 criterion 1).</summary>
public sealed class CreateProgramHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(SaveProgramCommand command, CancellationToken cancellationToken = default)
    {
        var errors = ProgramRules.Check(command);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var program = new Domain.Programs.Program(Guid.NewGuid(), tenant.OrganizationId, command.Name.Trim(), command.StartsOn!.Value, command.EndsOn!.Value,
            ProgramRules.Clean(command.Schedule), command.Capacity, ProgramRules.Clean(command.Ages), command.EnrollmentOpen, command.SeasonConsent, ProgramRules.Clean(command.Term));
        db.Programs.Add(program);
        audit.Record(new AuditEvent(AuditAction.Created, "Program", program.Id, program.Name, After: command));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(program.Id);
    }
}
