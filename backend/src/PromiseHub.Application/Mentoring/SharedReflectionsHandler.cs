using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The reflections a youth shared, for her mentor (L2-089 criteria 5 and 6, ADR 0060): 404 for a child outside the organization, 403 (audited)
/// for one outside the mentor's scope, otherwise only the shared reflections of the child's youth memberships, newest first, audited as Viewed.
/// Private reflections never leave the server.
/// </summary>
public sealed class SharedReflectionsHandler(IPromiseHubDb db, MentorScope scope, IAuditWriter audit)
{
    public async Task<(Result Result, SharedReflectionsDto? Shared)> HandleAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return (Result.NotFound, null);
        }
        if (!await scope.CanSeeYouthAsync(childId, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", childId, "Shared reflections outside the mentor’s youth"));
            await db.SaveChangesAsync(cancellationToken);
            return (Result.Forbidden, null);
        }
        var rows = await (
            from r in db.Reflections.AsNoTracking()
            where r.Shared
            join m in db.Memberships.AsNoTracking() on r.MembershipId equals m.Id
            where m.ChildId == childId && m.Role == Role.Youth
            join l in db.Lessons.AsNoTracking() on r.LessonId equals l.Id
            join mo in db.CurriculumModules.AsNoTracking() on l.ModuleId equals mo.Id
            select new { r.LessonId, LessonTitle = l.Title, ModuleTitle = mo.Title, r.Mood, r.Text, r.Action, r.SavedAt }).ToListAsync(cancellationToken);
        var items = rows.OrderByDescending(r => r.SavedAt)
            .Select(r => new SharedReflectionDto(r.LessonId, r.LessonTitle, r.ModuleTitle, r.Mood.ToString(), r.Text, r.Action, r.SavedAt)).ToList();
        audit.Record(new AuditEvent(AuditAction.Viewed, "Child", childId, $"{child.FullName} · shared reflections"));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, new SharedReflectionsDto(childId, child.FullName, items));
    }
}
