using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Infrastructure.Persistence;

public sealed class PromiseHubDbContext(DbContextOptions<PromiseHubDbContext> options, ITenantContext tenant)
    : DbContext(options), IPromiseHubDb
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<SignInAttempt> SignInAttempts => Set<SignInAttempt>();

    // Read by the query filter on every query, so the filter follows the current tenant.
    private Guid CurrentOrganizationId => tenant.OrganizationId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>(e =>
        {
            e.Property(o => o.Name).HasMaxLength(200);
            e.Property(o => o.City).HasMaxLength(200);
            e.Property(o => o.Plan).HasConversion<string>().HasMaxLength(20);
        });
        modelBuilder.Entity<Membership>(e =>
        {
            e.Property(m => m.PersonName).HasMaxLength(200);
            e.Property(m => m.Email).HasMaxLength(320);
            e.Property(m => m.Role).HasConversion<string>().HasMaxLength(40);
        });
        modelBuilder.Entity<Household>(e => e.Property(h => h.Name).HasMaxLength(200));
        modelBuilder.Entity<Child>(e =>
        {
            e.Property(c => c.FirstName).HasMaxLength(100);
            e.Property(c => c.LastName).HasMaxLength(100);
            e.HasOne<Household>().WithMany().HasForeignKey(c => c.HouseholdId);
        });
        modelBuilder.Entity<AuditEntry>(e =>
        {
            e.Property(a => a.Action).HasConversion<string>().HasMaxLength(40);
            e.Property(a => a.ActorName).HasMaxLength(200);
            e.Property(a => a.RecordType).HasMaxLength(100);
            e.Property(a => a.Summary).HasMaxLength(500);
            // SQLite cannot order by DateTimeOffset; store UTC ticks.
            e.Property(a => a.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasIndex(a => new { a.OrganizationId, a.OccurredAt });
        });

        modelBuilder.Entity<StaffUser>(e =>
        {
            e.Property(u => u.Email).HasMaxLength(320);
            e.HasIndex(u => u.Email).IsUnique();
        });
        modelBuilder.Entity<SignInAttempt>(e =>
        {
            e.Property(a => a.Email).HasMaxLength(320);
            e.Property(a => a.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasIndex(a => new { a.Email, a.At });
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes().Where(t => typeof(ITenantOwned).IsAssignableFrom(t.ClrType)))
        {
            entityType.SetQueryFilter(TenantFilter(entityType.ClrType));
            modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(ITenantOwned.OrganizationId));
            modelBuilder.Entity(entityType.ClrType).HasOne(typeof(Organization)).WithMany().HasForeignKey(nameof(ITenantOwned.OrganizationId));
        }
    }

    private LambdaExpression TenantFilter(Type clrType)
    {
        var entity = Expression.Parameter(clrType, "e");
        var organizationId = Expression.Property(entity, nameof(ITenantOwned.OrganizationId));
        var current = Expression.Property(Expression.Constant(this), nameof(CurrentOrganizationId));
        return Expression.Lambda(Expression.Equal(organizationId, current), entity);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        GuardChanges();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        GuardChanges();
        return base.SaveChanges();
    }

    private void GuardChanges()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditEntry && entry.State is EntityState.Modified or EntityState.Deleted)
            {
                throw new AuditImmutableException();
            }

            var changed = entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted;
            if (entry.Entity is ITenantOwned owned && changed && !tenant.IsSystem
                && (!tenant.IsResolved || owned.OrganizationId != tenant.OrganizationId))
            {
                throw new InvalidOperationException($"{entry.Metadata.ClrType.Name} does not belong to the current organization.");
            }
        }
    }
}
