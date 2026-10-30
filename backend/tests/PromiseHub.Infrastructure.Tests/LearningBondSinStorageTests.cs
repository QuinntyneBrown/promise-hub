using System.Security.Cryptography;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using PromiseHub.Application.LearningBond;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Infrastructure.Audit;
using PromiseHub.Infrastructure.Auth;
using PromiseHub.Infrastructure.LearningBond;
using PromiseHub.Infrastructure.Persistence;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Infrastructure.Tests;

// Traces to: L2-159 criteria 1 and 4 (the database holds only ciphertext and the last three digits; destruction keeps the last three),
// L2-161 criterion 4 (destruction is audited by System without the value), L2-162 criterion 1 (another organization's intake is not found).
public sealed class LearningBondSinStorageTests : IDisposable
{
    private const string Sin = "046 454 286";

    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");

    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly FakeTimeProvider _clock = new(new DateTimeOffset(2026, 11, 5, 21, 12, 0, TimeSpan.Zero));
    private readonly LearningBondCipher _cipher = new(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));

    public LearningBondSinStorageTests()
    {
        _connection.Open();
        using var db = Context(TenantContext.System());
        db.Database.Migrate();
        new DatabaseSeeder(db, new PasswordHasher()).SeedAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public void The_database_holds_only_the_ciphertext_and_the_last_three_digits()
    {
        Save();

        var row = Query("SELECT GuardianSinCiphertext || '|' || GuardianSinLast3 FROM LearningBondIntakes");

        Assert.EndsWith("|286", row, StringComparison.Ordinal);
        Assert.DoesNotContain("046454286", row, StringComparison.Ordinal);
        Assert.DoesNotContain("046 454", row, StringComparison.Ordinal);
        using var db = Context(Job(DatabaseSeeder.Harbourview));
        Assert.Equal("046454286", _cipher.Decrypt(db.LearningBondIntakes.Single().GuardianSin!));
    }

    [Fact]
    public async Task Destroying_the_SIN_keeps_only_its_last_three_digits_and_is_audited_by_System_without_the_value()
    {
        var id = Save();

        using (var db = Context(AsSystem(DatabaseSeeder.Harbourview)))
        {
            Assert.True(await Destroyer(db).DestroyGuardianSinAsync(id));
        }

        Assert.Equal("|286", Query("SELECT IFNULL(GuardianSinCiphertext, '') || '|' || GuardianSinLast3 FROM LearningBondIntakes"));
        var audit = Query("SELECT ActorName || '|' || Action || '|' || RecordType || '|' || Summary FROM AuditEntries WHERE RecordType = 'LearningBondIntake'");
        Assert.Equal("System|Deleted|LearningBondIntake|Learning Bond: guardian SIN destroyed; last three digits kept", audit);
        Assert.DoesNotContain("286", audit, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Destroying_twice_does_nothing_the_second_time()
    {
        var id = Save();
        using var db = Context(AsSystem(DatabaseSeeder.Harbourview));
        var destroyer = Destroyer(db);

        Assert.True(await destroyer.DestroyGuardianSinAsync(id));
        Assert.False(await destroyer.DestroyGuardianSinAsync(id));
        Assert.Equal("1", Query("SELECT COUNT(*) FROM AuditEntries WHERE RecordType = 'LearningBondIntake'"));
    }

    [Fact]
    public async Task Another_organizations_intake_is_never_found_or_destroyed()
    {
        var id = Save();
        using var db = Context(AsSystem(DatabaseSeeder.Northgate));

        Assert.False(await Destroyer(db).DestroyGuardianSinAsync(id));
        Assert.NotEqual(string.Empty, Query("SELECT IFNULL(GuardianSinCiphertext, '') FROM LearningBondIntakes"));
    }

    private Guid Save()
    {
        using var db = Context(Job(DatabaseSeeder.Harbourview));
        var intake = new LearningBondIntake(Guid.NewGuid(), DatabaseSeeder.Harbourview, Rivera, _clock.GetUtcNow());
        intake.SetGuardianSin(_cipher.Encrypt(Sin), _clock.GetUtcNow());
        db.LearningBondIntakes.Add(intake);
        db.SaveChanges();
        return intake.Id;
    }

    private LearningBondSinDestroyer Destroyer(PromiseHubDbContext db) => new(db, new AuditWriter(db, _tenants[db], _clock), _clock);

    private readonly Dictionary<PromiseHubDbContext, TenantContext> _tenants = [];

    private static TenantContext Job(Guid organizationId)
    {
        var tenant = new TenantContext();
        tenant.ResolveForJob(organizationId);
        return tenant;
    }

    /// <summary>A background job acting as "System" for one organization, as the destruction job does.</summary>
    private static TenantContext AsSystem(Guid organizationId)
    {
        var tenant = new TenantContext();
        tenant.ResolveForSystem(organizationId);
        return tenant;
    }

    private PromiseHubDbContext Context(TenantContext tenant)
    {
        var db = new PromiseHubDbContext(Options(), tenant);
        _tenants[db] = tenant;
        return db;
    }

    private DbContextOptions<PromiseHubDbContext> Options() => new DbContextOptionsBuilder<PromiseHubDbContext>().UseSqlite(_connection).Options;

    private string Query(string sql)
    {
        using var command = _connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public void Dispose() => _connection.Dispose();
}
