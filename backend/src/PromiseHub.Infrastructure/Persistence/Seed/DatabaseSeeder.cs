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

        var rivera = Family(Harbourview, "Rivera", "Spanish");
        Guardian(Harbourview, rivera, "Carmen Rivera", "Mother", "905-555-0142", "carmen.rivera@example.com", "Spanish", primary: true);
        Guardian(Harbourview, rivera, "Luis Rivera", "Uncle or aunt", "905-555-0199", null, "Spanish");
        Kid(Harbourview, rivera, "Mateo", "Rivera", new DateOnly(2017, 3, 14), "Bennetto Elementary, Grade 4",
            new MedicalDetails("Peanuts (anaphylaxis); tree nuts (hives)", "EpiPen 0.3 mg, carried", null, "Dr. Amrita Sethi · 905-555-0100", RedAlert: true));
        Kid(Harbourview, rivera, "Sofía", "Rivera", new DateOnly(2014, 6, 2), "Bennetto Elementary, Grade 7",
            new MedicalDetails(null, "Inhaler as needed", "Asthma", null, RedAlert: false));

        var thompson = Family(Harbourview, "Thompson", "English");
        Guardian(Harbourview, thompson, "Dana Thompson", "Mother", "905-555-0117", "dana.thompson@example.com", "English", primary: true);
        Kid(Harbourview, thompson, "Jordan", "Thompson", new DateOnly(2015, 2, 20), "Hess Street School, Grade 6");

        var tran = Family(Harbourview, "Tran", "English");
        Guardian(Harbourview, tran, "Linh Tran", "Mother", "905-555-0163", null, "English", primary: true);
        Kid(Harbourview, tran, "Kevin", "Tran", new DateOnly(2018, 5, 9), "Queen Victoria School, Grade 3");
        Kid(Harbourview, tran, "Emily", "Tran", new DateOnly(2016, 8, 30), "Queen Victoria School, Grade 5");

        var haddad = Family(Harbourview, "Haddad", "French");
        Guardian(Harbourview, haddad, "Nour Haddad", "Mother", "905-555-0128", "nour.haddad@example.com", "French", primary: true);
        Kid(Harbourview, haddad, "Yusuf", "Haddad", new DateOnly(2013, 9, 4), "École Pavillon de la jeunesse, Grade 8",
            new MedicalDetails(null, "Methylphenidate at lunch", null, null, RedAlert: false));

        // No mobile and a bounced email: the "Missing info" case (L2-011 criterion 3).
        var okonkwo = Family(Harbourview, "Okonkwo", "English");
        Guardian(Harbourview, okonkwo, "Chidi Okonkwo", "Father", null, "chidi.okonkwo@example.com", "English", primary: true, bounced: true);
        Kid(Harbourview, okonkwo, "Amara", "Okonkwo", new DateOnly(2019, 4, 11), "Bennetto Elementary, Grade 2");

        // A second Mateo Rivera in another organization proves lookups stay in their tenant (L2-001).
        var northgateRivera = Family(Northgate, "Rivera", "Spanish");
        Guardian(Northgate, northgateRivera, "Ana Rivera", "Mother", "289-555-0101", null, "Spanish", primary: true);
        Kid(Northgate, northgateRivera, "Mateo", "Rivera", new DateOnly(2016, 10, 1), null);

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

    public static Guid HouseholdId(Guid organizationId, string name) => SeedIds.Of($"household:{organizationId}:{name}");

    public static Guid GuardianId(Guid organizationId, string name) => SeedIds.Of($"guardian:{organizationId}:{name}");

    private Guid Family(Guid organizationId, string name, string language)
    {
        var id = HouseholdId(organizationId, name);
        Add(new Household(id, organizationId, name, language));
        return id;
    }

    private void Guardian(Guid organizationId, Guid householdId, string name, string relationship, string? mobile, string? email, string language, bool primary = false, bool bounced = false)
    {
        var guardian = new Guardian(GuardianId(organizationId, name), organizationId, householdId, name, relationship, mobile, email, language,
            primary, canPickUp: true, canSign: primary);
        if (bounced)
        {
            guardian.MarkEmailBounced();
        }
        Add(guardian);
    }

    private void Kid(Guid organizationId, Guid householdId, string first, string last, DateOnly born, string? school, MedicalDetails? medical = null)
    {
        var child = new Child(ChildId(organizationId, $"{first} {last}"), organizationId, householdId, first, last, born, school);
        if (medical is not null)
        {
            child.UpdateMedical(medical, "Carmen Rivera", SeedClock);
        }
        Add(child);
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
