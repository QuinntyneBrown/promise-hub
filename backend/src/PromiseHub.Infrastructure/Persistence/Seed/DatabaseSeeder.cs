using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Infrastructure.Persistence.Seed;

/// <summary>Seeds the Harbourview cast and a second organization. Rows are found by stable id; existing rows are never changed.</summary>
public sealed class DatabaseSeeder(PromiseHubDbContext db, IPasswordHasher hasher)
{
    public static readonly Guid Harbourview = SeedIds.Of("org:harbourview");
    public static readonly Guid Northgate = SeedIds.Of("org:northgate");

    private SeedOptions _options = SeedOptions.None;

    public async Task<int> SeedAsync(SeedOptions? options = null, CancellationToken cancellationToken = default)
    {
        _options = options ?? SeedOptions.None;
        Add(new Organization(Harbourview, "Harbourview Youth Collective", "Hamilton, Ontario", Plan.Standard));
        Add(new Organization(Northgate, "Northgate Community Church Kids", "Burlington, Ontario", Plan.Free));

        // Harbourview runs the whole suite; Northgate, on the Free plan, runs check-in only (L2-004, L2-005).
        Modules(Harbourview, ModuleCatalog.All);
        Modules(Northgate, [ModuleId.Roster, ModuleId.RollCall, ModuleId.QuickCards]);

        Staff(Harbourview, "Jaylen Okafor", "jaylen@harbourview.example", Role.SiteLead);
        Staff(Harbourview, "Marisol Delgado", "marisol@harbourview.example", Role.ProgramDirector);
        Staff(Harbourview, "Tom Nguyen", "tom@harbourview.example", Role.Admin);
        Staff(Harbourview, "Priya Raman", "priya@harbourview.example", Role.VolunteerCoordinator);
        Staff(Harbourview, "Aisha Bello", "aisha@harbourview.example", Role.YouthWorker);
        Staff(Northgate, "Priya Raman", "priya@harbourview.example", Role.VolunteerCoordinator);
        Staff(Northgate, "Grace Mensah", "grace@northgate.example", Role.Admin);

        Family(Harbourview, "Rivera", ("Mateo", "Rivera"), ("Sofía", "Rivera"));
        Family(Harbourview, "Thompson", ("Ava", "Thompson"));
        Family(Harbourview, "Tran", ("Minh", "Tran"));
        // A second Mateo Rivera in another organization proves lookups stay in their tenant (L2-001).
        Family(Northgate, "Rivera", ("Mateo", "Rivera"));

        return await db.SaveChangesAsync(cancellationToken);
    }

    public static Guid MembershipId(Guid organizationId, string email) => SeedIds.Of($"membership:{organizationId}:{email}");

    public static Guid ChildId(Guid organizationId, string fullName) => SeedIds.Of($"child:{organizationId}:{fullName}");

    private void Modules(Guid organizationId, IEnumerable<ModuleId> on) =>
        Add(new ModuleConfiguration(SeedIds.Of($"modules:{organizationId}"), organizationId, ModuleConfiguration.Format(on), SeedClock));

    // A fixed time keeps re-runs identical.
    private static readonly DateTimeOffset SeedClock = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    public static Guid UserId(string email) => SeedIds.Of($"user:{email}");

    private void Staff(Guid organizationId, string name, string email, Role role)
    {
        Add(new Membership(MembershipId(organizationId, email), organizationId, name, email, role));
        // Admins and program directors are enrolled in MFA when a secret is configured (L2-006).
        var mfa = SignInPolicy.RequiresMfa(role) ? _options.MfaSecret : null;
        var password = _options.StaffPassword is { } p ? hasher.Hash(p) : null;
        if (db.ChangeTracker.Entries<StaffUser>().All(e => e.Entity.Email != email))
        {
            Add(new StaffUser(UserId(email), email, password, mfa));
        }
    }

    private void Family(Guid organizationId, string name, params (string First, string Last)[] children)
    {
        var householdId = SeedIds.Of($"household:{organizationId}:{name}");
        Add(new Household(householdId, organizationId, name));
        foreach (var (first, last) in children)
        {
            Add(new Child(ChildId(organizationId, $"{first} {last}"), organizationId, householdId, first, last));
        }
    }

    private void Add<T>(T entity)
        where T : class
    {
        var id = (Guid)db.Entry(entity).Property("Id").CurrentValue!;
        db.Entry(entity).State = EntityState.Detached;
        if (!db.Set<T>().IgnoreQueryFilters().AsNoTracking().Any(e => EF.Property<Guid>(e, "Id") == id))
        {
            db.Set<T>().Add(entity);
        }
    }
}
