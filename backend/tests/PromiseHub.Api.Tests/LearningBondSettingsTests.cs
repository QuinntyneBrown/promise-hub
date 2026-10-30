using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-138 which programs Learning Bond covers and which staff roles see status, with Admin and Program director fixed; L2-162 per organization
// and module-gated. Harbourview's seed: After-School Tutoring reaches the Rivera, Thompson and Haddad households, Saturday Sports the Tran
// household, Winter Camp none, and Summer Camp 2026 is archived.
public sealed class LearningBondSettingsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid SummerCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Summer Camp 2026");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-138 criterion 1.
    [Fact]
    public async Task Until_changed_it_covers_every_program_for_Admin_and_Program_director_and_lists_running_programs_with_their_households()
    {
        var settings = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/settings");

        Assert.Equal("AllPrograms", settings.GetProperty("coverage").GetString());
        Assert.Empty(settings.GetProperty("programIds").EnumerateArray());
        Assert.Equal(["Admin", "ProgramDirector"], Strings(settings.GetProperty("statusRoles")));
        Assert.Equal(["After-School Tutoring:3", "Saturday Sports:1", "Winter Camp 2026:0"],
            settings.GetProperty("programs").EnumerateArray().Select(p => $"{p.GetProperty("name").GetString()}:{p.GetProperty("households").GetInt32()}"));
        Assert.Equal(4, settings.GetProperty("allHouseholds").GetInt32());
    }

    // L2-138 criterion 2.
    [Fact]
    public async Task Saving_chosen_programs_and_roles_answers_204_keeps_them_and_audits_the_fields_changed()
    {
        var tom = _factory.ClientFor(Tom);

        var response = await tom.PutAsJsonAsync("/learning-bond/settings", Body("ChosenPrograms", [Tutoring, Sports], "SiteLead", "YouthWorker"));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var settings = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/settings");
        Assert.Equal("ChosenPrograms", settings.GetProperty("coverage").GetString());
        Assert.Equal([Tutoring.ToString(), Sports.ToString()], Strings(settings.GetProperty("programIds")));
        Assert.Equal(["Admin", "ProgramDirector", "SiteLead", "YouthWorker"], Strings(settings.GetProperty("statusRoles")));
        Assert.Equal("Tom Nguyen|Learning Bond settings changed: Coverage, Programs, StatusRoles",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'LearningBondSettings'"));
    }

    // L2-138 criterion 3.
    [Fact]
    public async Task No_program_an_archived_program_or_another_organizations_program_is_refused_and_nothing_changes()
    {
        var tom = _factory.ClientFor(Tom);

        Assert.Equal("Choose at least one program.", await ProgramError(tom, Body("ChosenPrograms", [])));
        Assert.Equal("Choose programs that are running.", await ProgramError(tom, Body("ChosenPrograms", [Tutoring, SummerCamp])));
        Assert.Equal("Choose programs that are running.", await ProgramError(tom, Body("ChosenPrograms", [KidsClub])));
        Assert.Equal("AllPrograms", (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/settings")).GetProperty("coverage").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM AuditEntries WHERE RecordType = 'LearningBondSettings'"));
    }

    // L2-138 criterion 4.
    [Fact]
    public async Task Admin_and_Program_director_stay_when_left_out_and_Mentor_Volunteer_and_Youth_are_refused()
    {
        var tom = _factory.ClientFor(Tom);

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PutAsJsonAsync("/learning-bond/settings", Body("AllPrograms", [], "SiteLead"))).StatusCode);
        Assert.Equal(["Admin", "ProgramDirector", "SiteLead"], Strings((await tom.GetFromJsonAsync<JsonElement>("/learning-bond/settings")).GetProperty("statusRoles")));

        foreach (var role in new[] { "Mentor", "Volunteer", "Youth" })
        {
            var response = await tom.PutAsJsonAsync("/learning-bond/settings", Body("AllPrograms", [], role));
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
            Assert.Equal("Choose staff roles that may see status.", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("statusRoles").GetString());
        }
    }

    // L2-138 criteria 6 and 7, L2-162: off answers 404, a site lead 403, and each organization reads only its own programs.
    [Fact]
    public async Task Northgate_gets_404_while_off_and_only_its_own_programs_once_on_and_a_site_lead_gets_403()
    {
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/settings")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.PutAsJsonAsync("/learning-bond/settings", Body("AllPrograms", []))).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);

        var settings = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/settings");
        Assert.Equal(["Kids Club:1"], settings.GetProperty("programs").EnumerateArray().Select(p => $"{p.GetProperty("name").GetString()}:{p.GetProperty("households").GetInt32()}"));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await grace.PutAsJsonAsync("/learning-bond/settings", Body("ChosenPrograms", [Tutoring]))).StatusCode);

        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/settings")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.PutAsJsonAsync("/learning-bond/settings", Body("AllPrograms", []))).StatusCode);
    }

    private static object Body(string coverage, Guid[] programIds, params string[] statusRoles) => new { coverage, programIds, statusRoles };

    private static async Task<string?> ProgramError(HttpClient client, object body)
    {
        var response = await client.PutAsJsonAsync("/learning-bond/settings", body);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("programIds").GetString();
    }

    private static string[] Strings(JsonElement array) => [.. array.EnumerateArray().Select(e => e.GetString()!)];

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
