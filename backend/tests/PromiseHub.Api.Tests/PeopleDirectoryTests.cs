using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-112, L2-114, L2-001, L2-005
// Description: the people directory lists every account of the admin's organization, searches and filters on the server, pages by 25,
// answers mentoring only while Mentoring is on, and is closed to everyone but the organization's admins.
public sealed class PeopleDirectoryTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly string[] AllOn = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_lists_every_account_of_the_organization_by_name_with_role_status_and_programs()
    {
        var people = await Get(Tom, "/people");

        Assert.Equal(10, people.GetProperty("total").GetInt32());
        Assert.Equal(1, people.GetProperty("page").GetInt32());
        Assert.Equal(25, people.GetProperty("pageSize").GetInt32());
        Assert.Equal(["Aisha Bello", "Daniel Osei", "Hana Kim", "Jaylen Okafor", "Leo Martins", "Marisol Delgado", "Nadia Haddad", "Priya Raman", "Sofía Rivera", "Tom Nguyen"], Names(people));
        var sofia = Row(people, "Sofía Rivera");
        Assert.Equal("sofia@harbourview.example", sofia.GetProperty("email").GetString());
        Assert.Equal("Youth", sofia.GetProperty("role").GetString());
        Assert.Equal("Active", sofia.GetProperty("status").GetString());
        Assert.Equal(["After-School Tutoring"], sofia.GetProperty("programs").EnumerateArray().Select(p => p.GetString()!).ToArray());
        Assert.False(sofia.GetProperty("isYou").GetBoolean());
        Assert.True(Row(people, "Tom Nguyen").GetProperty("isYou").GetBoolean());
        Assert.Equal(JsonValueKind.Null, Row(people, "Leo Martins").GetProperty("lastSignedInAt").ValueKind);
        Assert.Contains("Mentor", people.GetProperty("roles").EnumerateArray().Select(r => r.GetString()));
        Assert.Contains(people.GetProperty("programs").EnumerateArray(), p => p.GetProperty("name").GetString() == "After-School Tutoring");
    }

    [Fact]
    public async Task A_removed_account_is_not_listed()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Aisha}")).StatusCode);

        Assert.DoesNotContain("Aisha Bello", Names(await Get(Tom, "/people")));
    }

    [Fact]
    public async Task Search_role_and_program_narrow_the_list_on_the_server()
    {
        Assert.Equal(["Sofía Rivera"], Names(await Get(Tom, "/people?q=SOFIA@")));
        Assert.Equal(["Daniel Osei", "Hana Kim"], Names(await Get(Tom, "/people?role=Mentor")));
        Assert.Equal(["Daniel Osei"], Names(await Get(Tom, "/people?role=Mentor&q=osei")));
        Assert.Empty(Names(await Get(Tom, "/people?status=Deactivated")));
        Assert.Equal(10, (await Get(Tom, "/people?status=Active")).GetProperty("total").GetInt32());

        await Cohort(Daniel);
        Assert.Equal(["Daniel Osei", "Sofía Rivera"], Names(await Get(Tom, $"/people?programId={Tutoring}")));
    }

    [Fact]
    public async Task An_unknown_role_or_status_is_refused()
    {
        var role = await _factory.ClientFor(Tom).GetAsync("/people?role=Mayor");
        var status = await _factory.ClientFor(Tom).GetAsync("/people?status=Sleeping");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, role.StatusCode);
        Assert.True((await role.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").TryGetProperty("role", out _));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, status.StatusCode);
        Assert.True((await status.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").TryGetProperty("status", out _));
    }

    [Fact]
    public async Task Pages_hold_twenty_five_and_a_page_past_the_end_is_empty()
    {
        for (var i = 0; i < 20; i++)
        {
            Execute($"INSERT INTO Memberships (Id, OrganizationId, PersonName, Email, Role) VALUES ('{Guid.NewGuid().ToString().ToUpperInvariant()}', '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}', 'Worker {i:00}', 'worker{i:00}@harbourview.example', 'YouthWorker')");
        }

        var first = await Get(Tom, "/people");
        var second = await Get(Tom, "/people?page=2");
        var past = await Get(Tom, "/people?page=3");

        Assert.Equal(30, first.GetProperty("total").GetInt32());
        Assert.Equal(25, Names(first).Length);
        Assert.Equal(5, Names(second).Length);
        Assert.Empty(Names(past));
        Assert.Empty(Names(first).Intersect(Names(second)));
    }

    [Fact]
    public async Task A_youths_mentor_is_answered_only_while_mentoring_is_on()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{SofiaChild}/mentor", new { mentorId = Daniel })).StatusCode);

        var on = await Get(Tom, "/people");
        Assert.Equal("Daniel Osei", Row(on, "Sofía Rivera").GetProperty("mentoring").GetProperty("mentor").GetString());
        Assert.Equal(JsonValueKind.Null, Row(on, "Nadia Haddad").GetProperty("mentoring").GetProperty("mentor").ValueKind);

        await Modules(AllOn.Except(["Mentoring"]));
        var off = await Get(Tom, "/people");

        Assert.All(off.GetProperty("items").EnumerateArray(), r => Assert.False(r.TryGetProperty("mentoring", out _)));
        Assert.DoesNotContain("Mentor", off.GetProperty("roles").EnumerateArray().Select(r => r.GetString()));
        Assert.Contains("Daniel Osei", Names(off));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _factory.ClientFor(Tom).GetAsync("/people?role=Mentor")).StatusCode);
    }

    [Fact]
    public async Task Only_admins_read_the_directory_and_only_their_own_organizations()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/people")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync("/people")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/people")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync("/people")).StatusCode);

        var northgate = await Get(Grace, "/people");
        Assert.Equal(["Grace Mensah", "Lucía Rivera", "Priya Raman", "Samuel Boateng"], Names(northgate));
        Assert.Equal("VolunteerCoordinator", Row(northgate, "Priya Raman").GetProperty("role").GetString());
    }

    private async Task Cohort(Guid lead) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = lead, supportingMentorIds = Array.Empty<Guid>() })).StatusCode);

    private async Task Modules(IEnumerable<string> on) =>
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.ToArray() })).IsSuccessStatusCode);

    private async Task<JsonElement> Get(Guid who, string path) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>(path);

    private static string[] Names(JsonElement page) => [.. page.GetProperty("items").EnumerateArray().Select(r => r.GetProperty("name").GetString()!)];

    private static JsonElement Row(JsonElement page, string name) => page.GetProperty("items").EnumerateArray().Single(r => r.GetProperty("name").GetString() == name);

    private void Execute(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
