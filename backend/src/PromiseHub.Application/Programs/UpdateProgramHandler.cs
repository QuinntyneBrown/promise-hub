using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Programs;

public sealed class UpdateProgramHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid id, SaveProgramCommand command, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null)
        {
            return Result.NotFound;
        }
        var errors = ProgramRules.Check(command);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var before = new { program.Name, program.StartsOn, program.EndsOn, program.Schedule, program.Capacity, program.Ages, program.EnrollmentOpen, program.SeasonConsent, program.Term };
        program.Update(command.Name.Trim(), command.StartsOn!.Value, command.EndsOn!.Value, ProgramRules.Clean(command.Schedule), command.Capacity,
            ProgramRules.Clean(command.Ages), command.EnrollmentOpen, command.SeasonConsent, ProgramRules.Clean(command.Term));
        audit.Record(new AuditEvent(AuditAction.Updated, "Program", program.Id, program.Name, before, command));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
