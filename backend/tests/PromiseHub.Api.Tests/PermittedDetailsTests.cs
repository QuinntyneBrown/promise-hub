using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-007 criterion 7 field-level filtering and restricted records, L2-001 tenant isolation, L2-032 audit, L2-005 Roster off.
public sealed class PermittedDetailsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Tran = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Tran");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Kevin = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Kevin Tran");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_youth_worker_gets_the_childs_age_without_date_of_birth_and_keeps_guardian_contact()
    {
        var child = await Get(Aisha, $"/children/{Mateo}");
        var household = await Get(Aisha, $"/households/{Rivera}");

        Assert.Equal(JsonValueKind.Null, child.GetProperty("dateOfBirth").ValueKind);
        Assert.Equal(9, child.GetProperty("age").GetInt32());
        Assert.Contains(household.GetProperty("guardians").EnumerateArray(), g => g.GetProperty("mobile").GetString() == "905-555-0142");
    }

    [Fact]
    public async Task A_site_lead_gets_the_date_of_birth()
    {
        var child = await Get(Jaylen, $"/children/{Mateo}");

        Assert.Equal("2017-03-14", child.GetProperty("dateOfBirth").GetString());
    }

    [Fact]
    public async Task A_child_outside_the_youth_workers_sessions_answers_403_and_is_audited()
    {
        var child = await _factory.ClientFor(Aisha).GetAsync($"/children/{Kevin}");
        var household = await _factory.ClientFor(Aisha).GetAsync($"/households/{Tran}");

        Assert.Equal(HttpStatusCode.Forbidden, child.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, household.StatusCode);
        Assert.Contains("Aisha Bello", Query($"SELECT ActorName FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordId = '{Kevin.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task A_youth_worker_never_receives_restricted_children_in_lists_or_search()
    {
        var families = await Get(Aisha, "/households");
        var search = await Get(Aisha, "/children?q=Tran");

        Assert.DoesNotContain(families.GetProperty("households").EnumerateArray(), h => h.GetProperty("name").GetString() == "Tran");
        Assert.Empty(search.GetProperty("children").EnumerateArray());
    }

    [Fact]
    public async Task Site_leads_read_every_child_of_the_organization()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/children/{Kevin}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/households/{Tran}")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_child_is_not_found_rather_than_forbidden()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).GetAsync($"/children/{NorthgateMateo}")).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_the_child_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).GetAsync($"/children/{Mateo}")).StatusCode);
    }

    private async Task<JsonElement> Get(Guid membership, string path) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

    private List<string> Query(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
