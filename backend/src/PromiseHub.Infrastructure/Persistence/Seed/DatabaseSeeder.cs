using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;
using PromiseHub.Domain.Slips;
using Event = PromiseHub.Domain.Events.Event;
using SessionStaff = PromiseHub.Domain.Events.SessionStaff;

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
        // Harbourview finished the organization step of setup; Northgate is still part way through.
        var harbourview = new Organization(Harbourview, "Harbourview Youth Collective", "Hamilton, Ontario", Plan.Standard, phone: "905-555-0100");
        harbourview.ChangeProfile(harbourview.Name, harbourview.City, new DateTimeOffset(2024, 9, 1, 12, 0, 0, TimeSpan.Zero));
        // Public website addresses (ADR 0043); the module itself stays off until an admin turns it on.
        harbourview.ChangeWebsiteSlug("harbourview");
        Add(harbourview);
        var northgate = new Organization(Northgate, "Northgate Community Church Kids", "Burlington, Ontario", Plan.Free, phone: "289-555-0190");
        northgate.ChangeWebsiteSlug("northgate");
        Add(northgate);

        // Harbourview runs the whole suite; Northgate, on the Free plan, runs check-in only (L2-004, L2-005).
        Modules(Harbourview, ModuleCatalog.Suite);
        Modules(Northgate, [ModuleId.Roster, ModuleId.RollCall, ModuleId.QuickCards]);

        Staff(Harbourview, "Jaylen Okafor", "jaylen@harbourview.example", Role.SiteLead);
        Staff(Harbourview, "Marisol Delgado", "marisol@harbourview.example", Role.ProgramDirector);
        // Tom also runs the service for every organization (L2-003).
        Staff(Harbourview, "Tom Nguyen", "tom@harbourview.example", Role.Admin, platformAdmin: true);
        Staff(Harbourview, "Priya Raman", "priya@harbourview.example", Role.VolunteerCoordinator);
        Staff(Harbourview, "Aisha Bello", "aisha@harbourview.example", Role.YouthWorker);
        Staff(Northgate, "Priya Raman", "priya@harbourview.example", Role.VolunteerCoordinator);
        Staff(Northgate, "Grace Mensah", "grace@northgate.example", Role.Admin);
        // From Waypoint (ADR 0043): youth, mentors and a volunteer in both organizations.
        Staff(Harbourview, "Sofía Rivera", "sofia@harbourview.example", Role.Youth);
        Staff(Harbourview, "Nadia Haddad", "nadia@harbourview.example", Role.Youth);
        Staff(Harbourview, "Daniel Osei", "daniel@harbourview.example", Role.Mentor);
        Staff(Harbourview, "Hana Kim", "hana@harbourview.example", Role.Mentor);
        Staff(Harbourview, "Leo Martins", "leo@harbourview.example", Role.Volunteer);
        Staff(Northgate, "Samuel Boateng", "samuel@northgate.example", Role.Mentor);
        Staff(Northgate, "Lucía Rivera", "lucia@northgate.example", Role.Youth);

        var rivera = Family(Harbourview, "Rivera", "Spanish");
        Guardian(Harbourview, rivera, "Carmen Rivera", "Mother", "905-555-0142", "carmen.rivera@example.com", "Spanish", primary: true);
        Guardian(Harbourview, rivera, "Luis Rivera", "Uncle or aunt", "905-555-0199", null, "Spanish");
        Kid(Harbourview, rivera, "Mateo", "Rivera", new DateOnly(2017, 3, 14), "Bennetto Elementary, Grade 4",
            new MedicalDetails("Peanuts (anaphylaxis); tree nuts (hives)", "EpiPen 0.3 mg, carried", null, "Dr. Amrita Sethi · 905-555-0100", RedAlert: true,
                AlertInstruction: "EpiPen in backpack front pocket. Use it, call 911, then Carmen."),
            healthCard: ("Ontario", "4471"), notes: "Sits with Jordan.");
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

        // Programs and events of the mocks; "today" is Thursday 5 November 2026 in Hamilton (UTC−5).
        var tutoring = Program(Harbourview, "After-School Tutoring", new(2026, 9, 8), new(2027, 6, 24), "Mon–Thu, 4–6 pm", 50, "6–13", open: true);
        var sports = Program(Harbourview, "Saturday Sports", new(2026, 9, 12), new(2027, 5, 29), "Sat, 10 am–12 pm", 80, "7–14", open: true);
        Program(Harbourview, "Winter Camp 2026", new(2026, 12, 21), new(2026, 12, 23), "21–23 Dec, 8 am–5 pm", 60, "6–12", open: true);
        Program(Harbourview, "Summer Camp 2026", new(2026, 7, 6), new(2026, 8, 14), "Mon–Fri, 9 am–4 pm", 40, "6–12", open: false, archived: true);
        foreach (var child in new[] { "Mateo Rivera", "Sofía Rivera", "Jordan Thompson", "Yusuf Haddad" })
        {
            Enroll(Harbourview, tutoring, child);
        }
        foreach (var child in new[] { "Kevin Tran", "Emily Tran" })
        {
            Enroll(Harbourview, sports, child);
        }
        Session(Harbourview, tutoring, "Tutoring night", At(2026, 11, 5, 16), At(2026, 11, 5, 18), "Harbourview Community Centre, Room 2", slip: false);
        Session(Harbourview, sports, "Saturday Sports", At(2026, 11, 7, 10), At(2026, 11, 7, 12), "Bennetto School gym", slip: false);
        Session(Harbourview, tutoring, "Fall field trip: Royal Botanical Gardens", At(2026, 11, 14, 9), At(2026, 11, 14, 15), "Royal Botanical Gardens · bus leaves 8:45 am", slip: true);
        Session(Harbourview, tutoring, "Tutoring night", At(2026, 11, 4, 16), At(2026, 11, 4, 18), "Harbourview Community Centre, Room 2", slip: false, key: "past");
        // Tonight's staff, as on the event page: Jaylen leads and Aisha works it; she is not on last night's session.
        Assign(Harbourview, "Tutoring night", "jaylen@harbourview.example");
        Assign(Harbourview, "Tutoring night", "aisha@harbourview.example");
        // Leo volunteers at tonight's session only.
        Assign(Harbourview, "Tutoring night", "leo@harbourview.example");
        var kidsClub = Program(Northgate, "Kids Club", new(2026, 9, 9), new(2027, 6, 16), "Wed, 6–7:30 pm", 30, "5–11", open: true);
        Enroll(Northgate, kidsClub, "Mateo Rivera");
        Session(Northgate, kidsClub, "Kids Club night", At(2026, 11, 11, 18), At(2026, 11, 11, 19), "Northgate fellowship hall", slip: false);

        return await db.SaveChangesAsync(cancellationToken);
    }

    public static Guid MembershipId(Guid organizationId, string email) => SeedIds.Of($"membership:{organizationId}:{email}");

    public static Guid ChildId(Guid organizationId, string fullName) => SeedIds.Of($"child:{organizationId}:{fullName}");

    private void Modules(Guid organizationId, IEnumerable<ModuleId> on) =>
        Add(new ModuleConfiguration(SeedIds.Of($"modules:{organizationId}"), organizationId, ModuleConfiguration.Format(on), SeedClock));

    // A fixed time keeps re-runs identical.
    private static readonly DateTimeOffset SeedClock = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    public static Guid ProgramId(Guid organizationId, string name) => SeedIds.Of($"program:{organizationId}:{name}");

    public static Guid EventId(Guid organizationId, string name, string key = "") => SeedIds.Of($"event:{organizationId}:{name}:{key}");

    /// <summary>A wall-clock time in Hamilton (Eastern Standard Time in November).</summary>
    private static DateTimeOffset At(int year, int month, int day, int hour) => new(year, month, day, hour, 0, 0, TimeSpan.FromHours(-5));

    private Guid Program(Guid organizationId, string name, DateOnly starts, DateOnly ends, string schedule, int capacity, string ages, bool open, bool archived = false)
    {
        var program = new Domain.Programs.Program(ProgramId(organizationId, name), organizationId, name, starts, ends, schedule, capacity, ages, open, seasonConsent: true);
        if (archived)
        {
            program.Archive("Marisol Delgado", SeedClock);
        }
        Add(program);
        return program.Id;
    }

    private void Enroll(Guid organizationId, Guid programId, string child) =>
        Add(new Enrollment(SeedIds.Of($"enrollment:{programId}:{child}"), organizationId, programId, ChildId(organizationId, child), SeedClock));

    private void Session(Guid organizationId, Guid programId, string name, DateTimeOffset starts, DateTimeOffset ends, string place, bool slip, string key = "")
    {
        var id = EventId(organizationId, name, key);
        Add(new Event(id, organizationId, programId, name, starts, ends, place, slip, noShowAlert: true, staffNotes: null));
        if (slip)
        {
            Add(new PermissionSlip(SeedIds.Of($"slip:{id}"), organizationId, id, DateOnly.FromDateTime(starts.UtcDateTime)));
        }
    }

    private void Assign(Guid organizationId, string session, string email)
    {
        var eventId = EventId(organizationId, session);
        var membershipId = MembershipId(organizationId, email);
        Add(new SessionStaff(SeedIds.Of($"session-staff:{eventId}:{membershipId}"), organizationId, eventId, membershipId));
    }

    public static Guid UserId(string email) => SeedIds.Of($"user:{email}");

    private void Staff(Guid organizationId, string name, string email, Role role, bool platformAdmin = false)
    {
        Add(new Membership(MembershipId(organizationId, email), organizationId, name, email, role));
        // Admins and program directors are enrolled in MFA when a secret is configured (L2-006).
        var mfa = SignInPolicy.RequiresMfa(role) ? _options.MfaSecret : null;
        var password = _options.StaffPassword is { } p ? hasher.Hash(p) : null;
        if (db.ChangeTracker.Entries<StaffUser>().All(e => e.Entity.Email != email))
        {
            var user = new StaffUser(UserId(email), email, password, mfa);
            if (platformAdmin)
            {
                user.MakePlatformAdmin();
            }
            Add(user);
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

    private void Kid(Guid organizationId, Guid householdId, string first, string last, DateOnly born, string? school, MedicalDetails? medical = null,
        (string Province, string LastFour)? healthCard = null, string? notes = null)
    {
        var child = new Child(ChildId(organizationId, $"{first} {last}"), organizationId, householdId, first, last, born, school);
        if (medical is not null)
        {
            child.UpdateMedical(medical, "Carmen Rivera", SeedClock);
        }
        if (healthCard is { } card)
        {
            child.RecordHealthCard(card.Province, card.LastFour);
        }
        child.UpdateNotes(notes);
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
