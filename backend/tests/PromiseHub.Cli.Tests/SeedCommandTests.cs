using Microsoft.Data.Sqlite;
using PromiseHub.Cli;

namespace PromiseHub.Cli.Tests;

// L2-042: migrations run only through the CLI; seed data is idempotent and multi-tenant.
public sealed class SeedCommandTests : IDisposable
{
    private readonly string _path = Path.Combine(Path.GetTempPath(), $"promisehub-{Guid.NewGuid():N}.db");
    private string ConnectionString => $"Data Source={_path}";

    [Fact]
    public async Task Migrate_then_seed_creates_two_organizations_with_distinct_plans()
    {
        Assert.Equal(0, await CliApp.RunAsync(["migrate"], ConnectionString));
        Assert.Equal(0, await CliApp.RunAsync(["seed"], ConnectionString));

        var organizations = Query("SELECT Name || '|' || Plan FROM Organizations ORDER BY Name");
        Assert.Equal(2, organizations.Count);
        Assert.Contains("Harbourview Youth Collective|Standard", organizations);
        Assert.Equal(2, organizations.Select(o => o.Split('|')[1]).Distinct().Count());
    }

    [Fact]
    public async Task Seeding_twice_creates_nothing_new_and_changes_nothing()
    {
        await CliApp.RunAsync(["migrate"], ConnectionString);
        await CliApp.RunAsync(["seed"], ConnectionString);
        var first = Snapshot();

        Assert.Equal(0, await CliApp.RunAsync(["seed"], ConnectionString));

        Assert.Equal(first, Snapshot());
    }

    // L2-042 criterion 4: the Waypoint cast (ADR 0043) in both organizations, linked to their child records.
    [Fact]
    public async Task Seed_creates_the_Waypoint_cast_in_both_organizations_with_youth_linked_to_their_child_records()
    {
        await CliApp.RunAsync(["migrate"], ConnectionString);
        await CliApp.RunAsync(["seed"], ConnectionString);

        var people = Query(
            "SELECT o.Name || '|' || m.PersonName || '|' || m.Role || '|' || COALESCE(c.FirstName || ' ' || c.LastName || ' ' || c.DateOfBirth, '') " +
            "FROM Memberships m JOIN Organizations o ON o.Id = m.OrganizationId LEFT JOIN Children c ON c.Id = m.ChildId " +
            "WHERE m.Role IN ('Youth', 'Mentor', 'Volunteer') ORDER BY o.Name, m.PersonName");
        Assert.Equal(
        [
            "Harbourview Youth Collective|Daniel Osei|Mentor|",
            "Harbourview Youth Collective|Hana Kim|Mentor|",
            "Harbourview Youth Collective|Leo Martins|Volunteer|",
            "Harbourview Youth Collective|Nadia Haddad|Youth|Nadia Haddad 2008-03-15",
            "Harbourview Youth Collective|Sofía Rivera|Youth|Sofía Rivera 2014-06-02",
            "Northgate Community Church Kids|Lucía Rivera|Youth|Lucía Rivera 2012-05-20",
            "Northgate Community Church Kids|Samuel Boateng|Mentor|",
        ], people);
        Assert.Equal(
            ["Harbourview Youth Collective|Roster,Slips,RollCall,QuickCards,Pickup,Messages,Incidents,Reports,Learning,Mentoring|harbourview",
             "Northgate Community Church Kids|Roster,RollCall,QuickCards|northgate"],
            Query("SELECT o.Name || '|' || c.ModulesOn || '|' || o.WebsiteSlug FROM Organizations o JOIN ModuleConfigurations c ON c.OrganizationId = o.Id ORDER BY o.Name"));
    }

    [Fact]
    public async Task Seed_refuses_to_run_when_migrations_are_pending()
    {
        Assert.Equal(1, await CliApp.RunAsync(["seed"], ConnectionString));
    }

    [Fact]
    public async Task Migrate_check_reports_pending_migrations_without_applying_them()
    {
        Assert.Equal(3, await CliApp.RunAsync(["migrate", "--check"], ConnectionString));
        await CliApp.RunAsync(["migrate"], ConnectionString);
        Assert.Equal(0, await CliApp.RunAsync(["migrate", "--check"], ConnectionString));
    }

    [Fact]
    public async Task Unknown_command_is_a_usage_error()
    {
        Assert.Equal(2, await CliApp.RunAsync(["launch"], ConnectionString));
    }

    private string Snapshot()
    {
        var tables = Query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '%Migrations%' AND name NOT LIKE 'sqlite%' ORDER BY name");
        return string.Join("\n", tables.SelectMany(t => Query($"SELECT * FROM \"{t}\" ORDER BY 1").Prepend($"[{t}]")));
    }

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        File.Delete(_path);
    }
}
