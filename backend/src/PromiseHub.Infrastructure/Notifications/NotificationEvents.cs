using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Infrastructure.Notifications;

/// <summary>
/// Tells the event stream about notices (L2-110, ADR 0069): after a save that adds a notice, a <c>notification</c> event with no content goes
/// to its recipient; after a save that reads one, to the reader, so every device follows. Nothing is sent when the save fails.
/// </summary>
public sealed class NotificationEvents(IRealtimeEvents events) : SaveChangesInterceptor
{
    private readonly ConditionalWeakTable<DbContext, List<(Guid OrganizationId, Guid MembershipId)>> _pending = new();

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Collect(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Collect(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Publish(eventData.Context);
        return result;
    }

    public override ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        Publish(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData) => Forget(eventData.Context);

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        Forget(eventData.Context);
        return Task.CompletedTask;
    }

    private void Collect(DbContext? context)
    {
        if (context is null)
        {
            return;
        }
        var changed = context.ChangeTracker.Entries<Notification>()
            .Where(e => e.State == EntityState.Added || (e.State == EntityState.Modified && e.Property(n => n.ReadAt).IsModified))
            .Select(e => (e.Entity.OrganizationId, e.Entity.MembershipId))
            .ToList();
        _pending.AddOrUpdate(context, changed);
    }

    private void Publish(DbContext? context)
    {
        if (context is null || !_pending.TryGetValue(context, out var changed))
        {
            return;
        }
        _pending.Remove(context);
        foreach (var organization in changed.GroupBy(c => c.OrganizationId))
        {
            events.Publish(organization.Key, organization.Select(c => c.MembershipId).Distinct(), new RealtimeEvent("notification"));
        }
    }

    private void Forget(DbContext? context)
    {
        if (context is not null)
        {
            _pending.Remove(context);
        }
    }
}
