using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Programs;

public sealed class GetProgramHandler(IPromiseHubDb db, TimeProvider clock)
{
    public async Task<ProgramDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null)
        {
            return null;
        }
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var roster = await (
            from e in db.Enrollments.AsNoTracking()
            where e.ProgramId == id && e.EndedAt == null
            join c in db.Children.AsNoTracking() on e.ChildId equals c.Id
            join h in db.Households.AsNoTracking() on c.HouseholdId equals h.Id
            select new { Child = c, Household = h.Name }).ToListAsync(cancellationToken);
        var events = await db.Events.AsNoTracking().Where(e => e.ProgramId == id).ToListAsync(cancellationToken);
        return new ProgramDto(
            program.Id, program.Name, program.StartsOn, program.EndsOn, program.Schedule, program.Capacity, program.Ages,
            program.EnrollmentOpen, program.SeasonConsent, program.Status.ToString(), roster.Count,
            [.. roster.OrderBy(r => r.Child.LastName).ThenBy(r => r.Child.FirstName)
                .Select(r => new RosterChildDto(r.Child.Id, r.Child.HouseholdId, r.Child.FullName, r.Child.AgeOn(today), r.Household))],
            [.. events.OrderBy(e => e.StartsAt).Select(e => new ProgramEventDto(e.Id, e.Name, e.StartsAt, e.EndsAt, e.Status.ToString()))],
            program.ArchivedAt, program.ArchivedBy);
    }
}
