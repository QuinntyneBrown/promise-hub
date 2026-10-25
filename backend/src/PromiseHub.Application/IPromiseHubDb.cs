using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;
using PromiseHub.Domain.Slips;
using Event = PromiseHub.Domain.Events.Event;

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
    DbSet<Domain.Programs.Program> Programs { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<Event> Events { get; }
    DbSet<PermissionSlip> PermissionSlips { get; }
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<AttendanceEvent> AttendanceEvents { get; }
    DbSet<WalkIn> WalkIns { get; }
    DbSet<StaffUser> StaffUsers { get; }
    DbSet<SignInAttempt> SignInAttempts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
