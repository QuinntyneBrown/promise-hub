using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-061 cohorts are programs with a term: the term is saved, listed and audited; youth are placed by enrolling them; roles,
// tenancy and Roster off.
public sealed class CohortTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_term_is_saved_returned_listed_and_audited()
    {
        var response = await Save(Marisol, Tutoring, "2026–27");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("2026–27", (await Get(Marisol, $"/programs/{Tutoring}")).GetProperty("term").GetString());
        var row = (await Get(Marisol, "/programs")).GetProperty("programs").EnumerateArray().Single(p => p.GetProperty("id").GetGuid() == Tutoring);
        Assert.Equal("2026–27", row.GetProperty("term").GetString());
        Assert.Contains(Query("SELECT AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'Program'"), after => after.Contains("2026"));
    }

    [Fact]
    public async Task A_new_program_takes_its_term_and_a_blank_term_is_none()
    {
        var created = await _factory.ClientFor(Marisol).PostAsJsonAsync("/programs", Fields("Fall 2026"));
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        Assert.Equal("Fall 2026", (await Get(Marisol, $"/programs/{id}")).GetProperty("term").GetString());

        await Save(Marisol, id, "   ");
        Assert.Equal(JsonValueKind.Null, (await Get(Marisol, $"/programs/{id}")).GetProperty("term").ValueKind);
    }

    [Fact]
    public async Task A_term_longer_than_40_characters_is_refused()
    {
        var response = await Save(Marisol, Tutoring, new string('x', 41));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Keep the term under 40 characters.", errors.GetProperty("term").GetString());
        Assert.Equal(JsonValueKind.Null, (await Get(Marisol, $"/programs/{Tutoring}")).GetProperty("term").ValueKind);
    }

    [Fact]
    public async Task Placing_a_youth_puts_her_on_the_roster_and_a_second_time_is_refused()
    {
        var placed = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild });
        Assert.Equal(HttpStatusCode.Created, placed.StatusCode);

        var roster = (await Get(Marisol, $"/programs/{Tutoring}")).GetProperty("roster").EnumerateArray();
        Assert.Contains(roster, c => c.GetProperty("id").GetGuid() == NadiaChild);

        var again = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, again.StatusCode);
    }

    [Fact]
    public async Task Only_admins_and_program_directors_set_a_term_and_participants_cannot_read_programs()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Jaylen, Tutoring, "2026–27")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/programs/{Tutoring}")).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_program_is_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Grace, Tutoring, "2026–27")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/programs/{Tutoring}")).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_programs_answer_404()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Grace, kidsClub, "2026–27")).StatusCode);
    }

    private static object Fields(string? term) => new
    {
        name = "After-School Tutoring",
        startsOn = "2026-09-08",
        endsOn = "2027-06-24",
        schedule = "Mon–Thu, 4–6 pm",
        capacity = 50,
        ages = "6–13",
        enrollmentOpen = true,
        seasonConsent = true,
        term,
    };

    private Task<HttpResponseMessage> Save(Guid membership, Guid program, string? term) =>
        _factory.ClientFor(membership).PutAsJsonAsync($"/programs/{program}", Fields(term));

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

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
            rows.Add(reader.IsDBNull(0) ? "" : reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
