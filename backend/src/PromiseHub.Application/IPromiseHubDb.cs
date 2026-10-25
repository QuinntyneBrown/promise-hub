using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application;

/// <summary>The unit of work handlers read and write through. Tenant-owned sets are filtered to the current organization.</summary>
public interface IPromiseHubDb
{
    DbSet<Organization> Organizations { get; }
    DbSet<Membership> Memberships { get; }
    DbSet<ModuleConfiguration> ModuleConfigurations { get; }
    DbSet<Household> Households { get; }
    DbSet<Guardian> Guardians { get; }
    DbSet<Child> Children { get; }
    DbSet<AuditEntry> AuditEntries { get; }
    DbSet<StaffUser> StaffUsers { get; }
    DbSet<SignInAttempt> SignInAttempts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
