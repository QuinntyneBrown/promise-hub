using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;
using PromiseHub.Domain.Slips;
using Event = PromiseHub.Domain.Events.Event;
using SessionStaff = PromiseHub.Domain.Events.SessionStaff;

namespace PromiseHub.Infrastructure.Persistence;

public sealed class PromiseHubDbContext(DbContextOptions<PromiseHubDbContext> options, ITenantContext tenant)
    : DbContext(options), IPromiseHubDb
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<ModuleConfiguration> ModuleConfigurations => Set<ModuleConfiguration>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<Domain.Programs.Program> Programs => Set<Domain.Programs.Program>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<PermissionSlip> PermissionSlips => Set<PermissionSlip>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceEvent> AttendanceEvents => Set<AttendanceEvent>();
    public DbSet<WalkIn> WalkIns => Set<WalkIn>();
    public DbSet<SessionStaff> SessionStaff => Set<SessionStaff>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<SmsUsagePeriod> SmsUsagePeriods => Set<SmsUsagePeriod>();
    public DbSet<SlipSignature> SlipSignatures => Set<SlipSignature>();
    public DbSet<GuardianLink> GuardianLinks => Set<GuardianLink>();
    public DbSet<SlipReminder> SlipReminders => Set<SlipReminder>();
    public DbSet<Domain.Imports.ImportSession> ImportSessions => Set<Domain.Imports.ImportSession>();
    public DbSet<Domain.Enrollment.EnrollmentSession> EnrollmentSessions => Set<Domain.Enrollment.EnrollmentSession>();
    public DbSet<Domain.Enrollment.EnrollmentRequest> EnrollmentRequests => Set<Domain.Enrollment.EnrollmentRequest>();
    public DbSet<Domain.Incidents.Incident> Incidents => Set<Domain.Incidents.Incident>();
    public DbSet<Domain.Incidents.IncidentFollowUp> IncidentFollowUps => Set<Domain.Incidents.IncidentFollowUp>();
    public DbSet<GuardianVerification> GuardianVerifications => Set<GuardianVerification>();
    public DbSet<TrustedGuardianDevice> TrustedGuardianDevices => Set<TrustedGuardianDevice>();
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
            e.Property(o => o.TimeZone).HasMaxLength(60);
        });
        modelBuilder.Entity<Membership>(e =>
        {
            e.Property(m => m.PersonName).HasMaxLength(200);
            e.Property(m => m.Email).HasMaxLength(320);
            e.Property(m => m.Role).HasConversion<string>().HasMaxLength(40);
        });
        modelBuilder.Entity<ModuleConfiguration>(e =>
        {
            e.Property(c => c.ModulesOn).HasMaxLength(200);
            e.Property(c => c.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Ignore(c => c.On);
            e.HasIndex(c => c.OrganizationId).IsUnique();
        });
        modelBuilder.Entity<Household>(e =>
        {
            e.Property(h => h.Name).HasMaxLength(200);
            e.Property(h => h.Language).HasMaxLength(40);
            e.Property(h => h.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(h => h.PurgeAfter).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
        });
        modelBuilder.Entity<Guardian>(e =>
        {
            e.Property(g => g.Name).HasMaxLength(200);
            e.Property(g => g.Relationship).HasMaxLength(60);
            e.Property(g => g.Mobile).HasMaxLength(40);
            e.Property(g => g.Email).HasMaxLength(320);
            e.Property(g => g.Language).HasMaxLength(40);
            e.Ignore(g => g.Reachable);
            e.Property(g => g.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Household>().WithMany().HasForeignKey(g => g.HouseholdId);
        });
        modelBuilder.Entity<Child>(e =>
        {
            e.Property(c => c.FirstName).HasMaxLength(100);
            e.Property(c => c.LastName).HasMaxLength(100);
            e.Property(c => c.School).HasMaxLength(200);
            e.Property(c => c.Allergies).HasMaxLength(1000);
            e.Property(c => c.Medication).HasMaxLength(1000);
            e.Property(c => c.Conditions).HasMaxLength(1000);
            e.Property(c => c.Doctor).HasMaxLength(300);
            e.Property(c => c.AlertInstruction).HasMaxLength(500);
            e.Property(c => c.HealthCard).HasMaxLength(60);
            e.Property(c => c.Notes).HasMaxLength(1000);
            e.Property(c => c.MedicalUpdatedBy).HasMaxLength(200);
            e.Ignore(c => c.FullName);
            e.Ignore(c => c.HasMedicalFlag);
            e.Ignore(c => c.Medical);
            e.Property(c => c.MedicalUpdatedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(c => c.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
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

        modelBuilder.Entity<Domain.Programs.Program>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(120);
            e.Property(p => p.Schedule).HasMaxLength(200);
            e.Property(p => p.Ages).HasMaxLength(40);
            e.Property(p => p.ArchivedBy).HasMaxLength(200);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.ArchivedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
        });
        modelBuilder.Entity<Enrollment>(e =>
        {
            e.Property(x => x.EnrolledAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.EndedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(x => x.EndReason).HasMaxLength(200);
            e.Ignore(x => x.Active);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(x => x.ProgramId);
            e.HasOne<Child>().WithMany().HasForeignKey(x => x.ChildId);
        });
        modelBuilder.Entity<Event>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Place).HasMaxLength(300);
            e.Property(x => x.StaffNotes).HasMaxLength(2000);
            e.Property(x => x.CancelledBy).HasMaxLength(200);
            e.Property(x => x.CancellationMessage).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.StartsAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.EndsAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.CancelledAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(x => x.ProgramId);
        });
        modelBuilder.Entity<PermissionSlip>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Body).HasMaxLength(PermissionSlip.MaxBodyLength);
            e.Property(x => x.Reminders).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Channel).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ScheduledFor).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Event>().WithMany().HasForeignKey(x => x.EventId);
            e.HasIndex(x => x.EventId).IsUnique();
        });
        modelBuilder.Entity<AttendanceRecord>(e =>
        {
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.UpdatedBy).HasMaxLength(200);
            e.Property(r => r.CheckedInAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(r => r.MarkedAbsentAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Event>().WithMany().HasForeignKey(r => r.EventId);
            e.HasIndex(r => new { r.EventId, r.ChildId });
        });
        modelBuilder.Entity<AttendanceEvent>(e =>
        {
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<AttendanceRecord>().WithMany().HasForeignKey(x => x.RecordId);
            e.HasIndex(x => new { x.OrganizationId, x.ClientActionId }).IsUnique();
        });
        modelBuilder.Entity<WalkIn>(e =>
        {
            e.Property(w => w.ChildName).HasMaxLength(200);
            e.Property(w => w.Guardian).HasMaxLength(300);
            e.Property(w => w.MedicalNotes).HasMaxLength(1000);
            e.HasOne<Event>().WithMany().HasForeignKey(w => w.EventId);
        });
        modelBuilder.Entity<SessionStaff>(e =>
        {
            e.HasOne<Event>().WithMany().HasForeignKey(s => s.EventId);
            e.HasOne<Membership>().WithMany().HasForeignKey(s => s.MembershipId);
            e.HasIndex(s => new { s.EventId, s.MembershipId }).IsUnique();
        });
        modelBuilder.Entity<Message>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(200);
            e.Property(m => m.Body).HasMaxLength(Application.Messaging.SendMessageHandler.MaxLength);
            e.Property(m => m.Audience).HasMaxLength(300);
            e.Property(m => m.Language).HasMaxLength(50);
            e.Property(m => m.CreatedBy).HasMaxLength(200);
            e.Property(m => m.Channel).HasConversion<string>().HasMaxLength(30);
            e.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.Source).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Delivery>(e =>
        {
            e.Property(d => d.Household).HasMaxLength(200);
            e.Property(d => d.Guardian).HasMaxLength(200);
            e.Property(d => d.Language).HasMaxLength(50);
            e.Property(d => d.To).HasMaxLength(320);
            e.Property(d => d.FallbackEmail).HasMaxLength(320);
            e.Property(d => d.Reason).HasMaxLength(200);
            e.Property(d => d.Text).HasMaxLength(1000);
            e.Property(d => d.Channel).HasConversion<string>().HasMaxLength(10);
            e.Property(d => d.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(d => d.DueAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Message>().WithMany().HasForeignKey(d => d.MessageId);
            e.HasIndex(d => new { d.OrganizationId, d.Status });
        });
        modelBuilder.Entity<SlipSignature>(e =>
        {
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.SignedBy).HasMaxLength(200);
            e.Property(s => s.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<PermissionSlip>().WithMany().HasForeignKey(s => s.SlipId);
            e.HasIndex(s => new { s.SlipId, s.ChildId });
            e.Property(s => s.Device).HasMaxLength(300);
            e.Property(s => s.Language).HasMaxLength(50);
            e.Property(s => s.TextHash).HasMaxLength(64);
            e.Property(s => s.Answers).HasMaxLength(500);
            e.Property(s => s.Reason).HasMaxLength(500);
        });
        modelBuilder.Entity<Domain.Enrollment.EnrollmentSession>(e =>
        {
            e.Property(s => s.Contact).HasMaxLength(320);
            e.Property(s => s.CodeHash).HasMaxLength(64);
            e.Property(s => s.TokenHash).HasMaxLength(64);
            e.HasIndex(s => s.TokenHash).IsUnique();
            e.Property(s => s.CodeExpiresAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(s => s.LockedUntil).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(s => s.ProgramId);
        });
        modelBuilder.Entity<Domain.Enrollment.EnrollmentRequest>(e =>
        {
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.SubmittedBy).HasMaxLength(200);
            e.Property(r => r.ReviewedBy).HasMaxLength(200);
            e.Property(r => r.Note).HasMaxLength(500);
            e.Ignore(r => r.Open);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(r => r.ProgramId);
            e.HasOne<Child>().WithMany().HasForeignKey(r => r.ChildId);
            e.HasIndex(r => new { r.ProgramId, r.Status });
        });
        modelBuilder.Entity<Domain.Incidents.Incident>(e =>
        {
            e.Property(i => i.Category).HasConversion<string>().HasMaxLength(30);
            e.Property(i => i.GuardianContact).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Severity).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Place).HasMaxLength(100);
            e.Property(i => i.WhatHappened).HasMaxLength(4000);
            e.Property(i => i.ActionTaken).HasMaxLength(4000);
            e.Property(i => i.ReportedBy).HasMaxLength(200);
            e.Property(i => i.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.ReportedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Child>().WithMany().HasForeignKey(i => i.ChildId);
            e.HasIndex(i => i.ReporterId);
            e.Property(i => i.Outcome).HasConversion<string>().HasMaxLength(30);
            e.Property(i => i.ReviewNote).HasMaxLength(4000);
            e.Property(i => i.ReviewedBy).HasMaxLength(200);
            e.Property(i => i.ReviewedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Incidents.IncidentFollowUp>(e =>
        {
            e.Property(f => f.Text).HasMaxLength(4000);
            e.Property(f => f.WrittenBy).HasMaxLength(200);
            e.Property(f => f.WrittenAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Incidents.Incident>().WithMany().HasForeignKey(f => f.IncidentId);
        });
        modelBuilder.Entity<Domain.Imports.ImportSession>(e =>
        {
            e.Property(s => s.FileName).HasMaxLength(260);
            e.Property(s => s.CreatedBy).HasMaxLength(200);
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<SlipReminder>(e =>
        {
            e.Property(r => r.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Slot).HasMaxLength(60);
            e.Property(r => r.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<PermissionSlip>().WithMany().HasForeignKey(r => r.SlipId);
            e.HasIndex(r => new { r.SlipId, r.HouseholdId, r.Slot }).IsUnique();
        });
        modelBuilder.Entity<GuardianLink>(e =>
        {
            e.Property(l => l.TokenHash).HasMaxLength(64);
            e.HasIndex(l => l.TokenHash).IsUnique();
            e.Property(l => l.LockedUntil).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Household>().WithMany().HasForeignKey(l => l.HouseholdId);
        });
        modelBuilder.Entity<GuardianVerification>(e =>
        {
            e.Property(v => v.CodeHash).HasMaxLength(64);
            e.Property(v => v.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<GuardianLink>().WithMany().HasForeignKey(v => v.LinkId);
        });
        modelBuilder.Entity<TrustedGuardianDevice>(e =>
        {
            e.Property(d => d.TokenHash).HasMaxLength(64);
            e.HasIndex(d => d.TokenHash).IsUnique();
            e.Property(d => d.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Household>().WithMany().HasForeignKey(d => d.HouseholdId);
        });
        modelBuilder.Entity<SmsUsagePeriod>(e =>
        {
            e.Property(p => p.Period).HasMaxLength(7);
            e.Ignore(p => p.Remaining);
            e.HasIndex(p => new { p.OrganizationId, p.Period }).IsUnique();
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

    /// <summary>OrganizationId equals the tenant; for soft-deletable rows, also DeletedAt is null.</summary>
    private LambdaExpression TenantFilter(Type clrType)
    {
        var entity = Expression.Parameter(clrType, "e");
        var organizationId = Expression.Property(entity, nameof(ITenantOwned.OrganizationId));
        var current = Expression.Property(Expression.Constant(this), nameof(CurrentOrganizationId));
        Expression body = Expression.Equal(organizationId, current);
        if (typeof(ISoftDeletable).IsAssignableFrom(clrType))
        {
            var deletedAt = Expression.Property(entity, nameof(ISoftDeletable.DeletedAt));
            body = Expression.AndAlso(body, Expression.Equal(deletedAt, Expression.Constant(null, typeof(DateTimeOffset?))));
        }
        return Expression.Lambda(body, entity);
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
