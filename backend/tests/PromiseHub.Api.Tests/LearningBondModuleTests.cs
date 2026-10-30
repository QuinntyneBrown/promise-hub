using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-135 Learning Bond needs Roster and Messages and the agreement, L2-162 per organization and module-gated end to end,
// L2-161 criteria 3 and 4 audited and searchable, L2-005 modules that are off are unreachable.
public sealed class LearningBondModuleTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    // Harbourview's seeded configuration: the operations suite, Learning, Mentoring and Learning Bond.
    private static readonly string[] Harbourview =
        ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning", "Mentoring", "LearningBond"];

    private readonly PromiseHubApiFactory _factory = new();

    // L2-135 criterion 1.
    [Fact]
    public async Task Learning_Bond_is_listed_last_needing_Roster_and_Messages_on_for_Harbourview_and_off_for_Northgate()
    {
        var harbourview = await Row(Tom);
        var northgate = await Row(Grace);

        Assert.Equal("Learning Bond", harbourview.GetProperty("name").GetString());
        Assert.Equal(["Roster", "Messages"], harbourview.GetProperty("needs").EnumerateArray().Select(n => n.GetString()));
        Assert.True(harbourview.GetProperty("on").GetBoolean());
        Assert.False(northgate.GetProperty("on").GetBoolean());
    }

    // L2-135 criterion 2.
    [Fact]
    public async Task Turning_Learning_Bond_on_while_Messages_is_off_is_rejected_naming_Messages_and_nothing_is_stored()
    {
        var response = await Save(Grace, "Roster", "RollCall", "QuickCards", "LearningBond");

        var error = Assert.Single(await Errors(response));
        Assert.Equal("LearningBond", error.Module);
        Assert.Equal("Learning Bond needs Messages.", error.Message);
        Assert.Equal(["Roster", "RollCall", "QuickCards"], await ModulesOn(Grace));
    }

    // L2-135 criterion 4; L2-162 criterion 1: Harbourview's acceptance never counts for Northgate.
    [Fact]
    public async Task Turning_Learning_Bond_on_before_the_agreement_is_accepted_is_rejected_and_nothing_is_stored()
    {
        var response = await Save(Grace, "Roster", "Messages", "LearningBond");

        var error = Assert.Single(await Errors(response));
        Assert.Equal("LearningBond", error.Module);
        Assert.Equal("Accept the Learning Bond data-handling agreement first.", error.Message);
        Assert.Equal(["Roster", "RollCall", "QuickCards"], await ModulesOn(Grace));
    }

    // L2-135 criterion 3.
    [Fact]
    public async Task Turning_Messages_or_Roster_off_while_Learning_Bond_is_on_is_rejected_and_nothing_changes()
    {
        var withoutMessages = await Errors(await Save(Tom, [.. Harbourview.Where(m => m != "Messages")]));
        var withoutRoster = await Errors(await Save(Tom, [.. Harbourview.Where(m => m != "Roster")]));

        Assert.Contains(withoutMessages, e => e is { Module: "LearningBond", Message: "Learning Bond needs Messages." });
        var roster = Assert.Single(withoutRoster);
        Assert.Equal("Roster", roster.Module);
        Assert.Contains("Learning Bond", roster.Message, StringComparison.Ordinal);
        Assert.Equal(Harbourview, await ModulesOn(Tom));
    }

    // L2-135 criterion 5, L2-162 criterion 3 and 7.
    [Fact]
    public async Task The_staff_endpoint_answers_while_the_module_is_on_404_while_it_is_off_and_again_once_it_is_back_on()
    {
        var client = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/learning-bond")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await Save(Tom, [.. Harbourview.Where(m => m != "LearningBond")])).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/learning-bond")).StatusCode);

        // The accepted agreement is kept, so turning it back on needs no new acceptance.
        Assert.Equal(HttpStatusCode.OK, (await Save(Tom, Harbourview)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/learning-bond")).StatusCode);
        Assert.Equal(["Roster", "RollCall", "QuickCards"], await ModulesOn(Grace));
    }

    // L2-162 criteria 3 and 7: off for Northgate, and signing in is required.
    [Fact]
    public async Task Northgate_staff_get_404_and_an_anonymous_caller_401()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/learning-bond")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync("/learning-bond")).StatusCode);
    }

    // L2-162 criterion 6: the tenant comes from the link.
    [Fact]
    public async Task A_guardian_link_of_an_organization_with_Learning_Bond_on_answers_that_organization()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Rivera");

        var response = await _factory.CreateClient().GetAsync($"/g/learning-bond/{token}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Harbourview Youth Collective", body.GetProperty("organization").GetString());
        Assert.Equal("es", body.GetProperty("language").GetString());
    }

    // L2-162 criterion 6, L2-161 criterion 4.
    [Fact]
    public async Task A_link_while_Learning_Bond_is_off_answers_404_with_no_body_and_is_audited_for_the_links_organization()
    {
        var northgate = await Link(DatabaseSeeder.Northgate, "Rivera");

        var response = await _factory.CreateClient().GetAsync($"/g/learning-bond/{northgate}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(string.Empty, await response.Content.ReadAsStringAsync());
        var row = Assert.Single(Query($"SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'LearningBondLink' AND OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));
        Assert.Equal("Guardian|Learning Bond link opened while Learning Bond is off", row);
    }

    // L2-162 criterion 6: an unknown link and a link after the module was turned off look the same.
    [Fact]
    public async Task An_unknown_link_and_a_link_after_the_module_is_turned_off_both_answer_404()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Rivera");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.CreateClient().GetAsync("/g/learning-bond/not-a-real-token")).StatusCode);

        await Save(Tom, [.. Harbourview.Where(m => m != "LearningBond")]);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.CreateClient().GetAsync($"/g/learning-bond/{token}")).StatusCode);
    }

    // L2-161 criteria 3 and 4.
    [Fact]
    public async Task Turning_Learning_Bond_off_is_audited_by_name_and_found_by_searching_for_Learning_Bond_in_Harbourview_only()
    {
        await Save(Tom, [.. Harbourview.Where(m => m != "LearningBond")]);

        var found = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/audit?q=Learning%20Bond");
        var northgate = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/audit?q=Learning%20Bond");

        var entry = Assert.Single(found.GetProperty("entries").EnumerateArray());
        Assert.Equal("Tom Nguyen", entry.GetProperty("who").GetString());
        Assert.Contains("Learning Bond turned off", entry.GetProperty("summary").GetString(), StringComparison.Ordinal);
        Assert.Empty(northgate.GetProperty("entries").EnumerateArray());
    }

    private async Task<JsonElement> Row(Guid who) =>
        (await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/settings/modules")).GetProperty("modules").EnumerateArray().Last();

    private Task<HttpResponseMessage> Save(Guid who, params string[] on) => _factory.ClientFor(who).PutAsJsonAsync("/settings/modules", new { on });

    private static async Task<List<(string Module, string Message)>> Errors(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return [.. (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray()
            .Select(e => (e.GetProperty("module").GetString()!, e.GetProperty("message").GetString()!))];
    }

    private async Task<string[]> ModulesOn(Guid who) =>
        [.. (await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/me")).GetProperty("modules").EnumerateArray().Select(m => m.GetString()!)];

    private async Task<string> Link(Guid organizationId, string household)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueHome(DatabaseSeeder.HouseholdId(organizationId, household));
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
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
            rows.Add(reader.GetString(0));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
