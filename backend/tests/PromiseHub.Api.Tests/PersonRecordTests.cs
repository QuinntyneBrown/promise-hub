using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-113, L2-114, L2-001, L2-005, L2-032
// Description: an admin reads one account of the organization: the account, a youth's child record and programs, her mentor while
// Mentoring is on, her Learning progress while Learning is on, a mentor's youth, and the account's audited history.
public sealed class PersonRecordTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly string[] AllOn = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning", "Mentoring"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_youths_record_names_her_account_child_record_programs_mentor_and_learning()
    {
        await new LearningContent(_factory).BuildAsync();
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{SofiaChild}/mentor", new { mentorId = Daniel })).StatusCode);

        var sofia = await Get(Tom, $"/people/{Sofia}");

        Assert.Equal("Sofía Rivera", sofia.GetProperty("name").GetString());
        Assert.Equal("sofia@harbourview.example", sofia.GetProperty("email").GetString());
        Assert.Equal("Youth", sofia.GetProperty("role").GetString());
        Assert.Equal("Active", sofia.GetProperty("status").GetString());
        Assert.False(sofia.GetProperty("isYou").GetBoolean());
        var child = sofia.GetProperty("child");
        Assert.Equal(SofiaChild, child.GetProperty("id").GetGuid());
        Assert.Equal("Sofía Rivera", child.GetProperty("name").GetString());
        Assert.Equal(12, child.GetProperty("age").GetInt32());
        Assert.Equal("Rivera", child.GetProperty("household").GetString());
        Assert.False(child.GetProperty("deleted").GetBoolean());
        Assert.Equal(["After-School Tutoring"], sofia.GetProperty("programs").EnumerateArray().Select(p => p.GetString()!).ToArray());
        Assert.Equal("Daniel Osei", sofia.GetProperty("mentoring").GetProperty("mentor").GetString());
        var learning = sofia.GetProperty("learning");
        Assert.Equal(4, learning.GetProperty("lessonsTotal").GetInt32());
        Assert.Equal(0, learning.GetProperty("lessonsDone").GetInt32());
        Assert.Empty(learning.GetProperty("badges").EnumerateArray());

        var daniel = await Get(Tom, $"/people/{Daniel}");
        Assert.Equal(["Sofía Rivera"], daniel.GetProperty("mentoring").GetProperty("youth").EnumerateArray().Select(p => p.GetString()!).ToArray());
        Assert.Equal(JsonValueKind.Null, daniel.GetProperty("child").ValueKind);
        Assert.False(daniel.TryGetProperty("learning", out _));
    }

    [Fact]
    public async Task Mentoring_and_learning_are_absent_while_their_module_is_off()
    {
        await Modules(AllOn.Except(["Mentoring", "Learning"]));

        var sofia = await Get(Tom, $"/people/{Sofia}");

        Assert.False(sofia.TryGetProperty("mentoring", out _));
        Assert.False(sofia.TryGetProperty("learning", out _));
        Assert.Equal("Rivera", sofia.GetProperty("child").GetProperty("household").GetString());
    }

    [Fact]
    public async Task The_history_is_the_accounts_audit_entries_newest_first_and_your_own_record_says_so()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PutAsJsonAsync($"/staff/{Leo}/role", new { role = "YouthWorker" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PutAsJsonAsync($"/staff/{Leo}/role", new { role = "SiteLead" })).StatusCode);

        var history = (await Get(Tom, $"/people/{Leo}")).GetProperty("history").EnumerateArray().ToList();

        Assert.Equal(2, history.Count);
        Assert.Equal("RoleChanged", history[0].GetProperty("action").GetString());
        Assert.Contains("SiteLead", history[0].GetProperty("summary").GetString(), StringComparison.Ordinal);
        Assert.Contains("YouthWorker", history[1].GetProperty("summary").GetString(), StringComparison.Ordinal);
        Assert.Equal("Tom Nguyen", history[0].GetProperty("by").GetString());
        Assert.True((await Get(Tom, $"/people/{Tom}")).GetProperty("isYou").GetBoolean());
    }

    [Fact]
    public async Task Only_an_admin_reads_a_record_of_their_own_organization_and_never_a_removed_one()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync($"/people/{Sofia}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync($"/people/{Sofia}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync($"/people/{Sofia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/people/{Sofia}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/people/{Guid.NewGuid()}")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Aisha}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/people/{Aisha}")).StatusCode);
    }

    private async Task Modules(IEnumerable<string> on) =>
        Assert.True((await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.ToArray() })).IsSuccessStatusCode);

    private async Task<JsonElement> Get(Guid who, string path) => await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>(path);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
