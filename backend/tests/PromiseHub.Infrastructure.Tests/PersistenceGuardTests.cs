using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Organizations;
using PromiseHub.Infrastructure.Persistence;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Infrastructure.Tests;

public sealed class PersistenceGuardTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public PersistenceGuardTests()
    {
        _connection.Open();
        using var db = Context(TenantContext.System());
        db.Database.Migrate();
        new DatabaseSeeder(db).SeedAsync().GetAwaiter().GetResult();
    }

    // L2-032 criterion 4: an audit entry cannot be edited or deleted through the application.
    [Fact]
    public void Audit_entries_cannot_be_deleted()
    {
        using var db = Context(Signed("jaylen@harbourview.example"));
        var entry = Entry();
        db.AuditEntries.Add(entry);
        db.SaveChanges();

        db.AuditEntries.Remove(entry);

        Assert.Throws<AuditImmutableException>(() => db.SaveChanges());
    }

    [Fact]
    public void Audit_entries_cannot_be_edited()
    {
        using var db = Context(Signed("jaylen@harbourview.example"));
        var entry = Entry();
        db.AuditEntries.Add(entry);
        db.SaveChanges();

        db.Entry(entry).Property(e => e.Summary).CurrentValue = "rewritten";

        Assert.Throws<AuditImmutableException>(() => db.SaveChanges());
    }

    // L2-001: a write for another organization is refused, whatever the caller supplied.
    [Fact]
    public void Writing_a_row_for_another_organization_is_refused()
    {
        using var db = Context(Signed("jaylen@harbourview.example"));

        db.Households.Add(new Household(Guid.NewGuid(), DatabaseSeeder.Northgate, "Intruder"));

        Assert.Throws<InvalidOperationException>(() => db.SaveChanges());
    }

    [Fact]
    public void Queries_return_only_the_current_organizations_rows()
    {
        using var db = Context(Signed("jaylen@harbourview.example"));

        Assert.All(db.Children.ToList(), c => Assert.Equal(DatabaseSeeder.Harbourview, c.OrganizationId));
        Assert.Single(db.Children, c => c.FirstName == "Mateo");
    }

    [Fact]
    public void Without_a_resolved_tenant_queries_return_nothing()
    {
        using var db = Context(new TenantContext());

        Assert.Empty(db.Children.ToList());
    }

    private static AuditEntry Entry() => new(
        Guid.NewGuid(), DatabaseSeeder.Harbourview, DateTimeOffset.UtcNow, null, "Jaylen Okafor",
        AuditAction.Viewed, "Child", null, "Viewed a Quick Card", null, null, null);

    private TenantContext Signed(string email)
    {
        using var system = Context(TenantContext.System());
        var membership = system.Memberships.IgnoreQueryFilters().Single(m => m.Email == email && m.OrganizationId == DatabaseSeeder.Harbourview);
        var tenant = new TenantContext();
        tenant.Resolve(membership);
        return tenant;
    }

    private PromiseHubDbContext Context(ITenantContext tenant) =>
        new(new DbContextOptionsBuilder<PromiseHubDbContext>().UseSqlite(_connection).Options, tenant);

    public void Dispose() => _connection.Dispose();
}
