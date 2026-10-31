using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-142 criteria 1, 2 and 5: staff in the status roles see each covered household's status and last change, filtered by status and
// program, and nothing else about the claim; the session says whether a member sees status. L2-162: per organization, module gate.
public sealed partial class LearningBondFamiliesTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Thompson = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Thompson");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-142 criterion 1.
    [Fact]
    public async Task Each_covered_household_shows_its_status_and_last_change_filtered_by_status_and_program()
    {
        var tom = _factory.ClientFor(Tom);
        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsync($"/learning-bond/households/{Thompson}/invitations", null)).StatusCode);

        var list = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/households");

        var rows = list.GetProperty("households").EnumerateArray().ToList();
        Assert.Equal(["Haddad", "Rivera", "Thompson", "Tran"], rows.Select(r => r.GetProperty("name").GetString()!));
        var thompson = rows.Single(r => r.GetProperty("name").GetString() == "Thompson");
        Assert.Equal("Invited", thompson.GetProperty("status").GetString());
        Assert.Equal(_factory.Clock.GetUtcNow(), thompson.GetProperty("changedAt").GetDateTimeOffset());
        Assert.Equal("Dana Thompson", thompson.GetProperty("guardian").GetString());
        Assert.Equal("After-School Tutoring", thompson.GetProperty("programs").GetString());
        Assert.Equal("NotInvited", rows.Single(r => r.GetProperty("name").GetString() == "Tran").GetProperty("status").GetString());
        Assert.Equal(4, list.GetProperty("covered").GetInt32());
        Assert.Equal(["After-School Tutoring", "Saturday Sports"], list.GetProperty("programs").EnumerateArray().Select(p => p.GetProperty("name").GetString()!));

        var invited = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/households?status=Invited");
        Assert.Equal(["Thompson"], invited.GetProperty("households").EnumerateArray().Select(r => r.GetProperty("name").GetString()!));
        var sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
        var bySports = await tom.GetFromJsonAsync<JsonElement>($"/learning-bond/households?program={sports}");
        Assert.Equal(["Tran"], bySports.GetProperty("households").EnumerateArray().Select(r => r.GetProperty("name").GetString()!));
    }

    // L2-142 criterion 5, L2-162: a role outside the status roles gets 403 and the session says so; with the module off, 404.
    [Fact]
    public async Task A_role_outside_the_status_roles_gets_403_and_its_session_says_so_and_the_module_off_answers_404()
    {
        Assert.True((await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/me")).GetProperty("learningBondStatus").GetBoolean());
        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/households")).StatusCode);
        Assert.False((await jaylen.GetFromJsonAsync<JsonElement>("/me")).GetProperty("learningBondStatus").GetBoolean());

        await _factory.ClientFor(Tom).PutAsJsonAsync("/learning-bond/settings",
            new { coverage = "AllPrograms", programIds = Array.Empty<Guid>(), statusRoles = new[] { "Admin", "ProgramDirector", "SiteLead" } });
        Assert.Equal(HttpStatusCode.OK, (await jaylen.GetAsync("/learning-bond/households")).StatusCode);
        Assert.True((await jaylen.GetFromJsonAsync<JsonElement>("/me")).GetProperty("learningBondStatus").GetBoolean());

        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/households")).StatusCode);
        Assert.False((await grace.GetFromJsonAsync<JsonElement>("/me")).GetProperty("learningBondStatus").GetBoolean());
    }

    // L2-142 criterion 2: no staff response names a SIN, income, marital status, household size, benefit, estimate or amount of a family.
    [Fact]
    public async Task No_staff_Learning_Bond_response_carries_a_SIN_or_a_financial_detail()
    {
        var tom = _factory.ClientFor(Tom);
        await tom.PostAsync($"/learning-bond/households/{Thompson}/invitations", null);
        string[] paths = ["/learning-bond/households", $"/learning-bond/households/{Thompson}", "/learning-bond/launch", "/learning-bond/launch/missing-contacts",
            "/learning-bond/overview", "/learning-bond/settings", "/learning-bond/invitation", "/learning-bond/agreement", "/learning-bond"];

        foreach (var path in paths)
        {
            var body = await tom.GetStringAsync(path);
            Assert.DoesNotMatch(Forbidden(), body);
            Assert.DoesNotMatch(SinLike(), body);
        }
    }

    [GeneratedRegex("\"(sin|socialInsuranceNumber|sinLast3|income|maritalStatus|householdSize|benefits?|estimate|deposit|amount)\"", RegexOptions.IgnoreCase)]
    private static partial Regex Forbidden();

    [GeneratedRegex(@"\b\d{3}[ -]?\d{3}[ -]?\d{3}\b")]
    private static partial Regex SinLike();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
