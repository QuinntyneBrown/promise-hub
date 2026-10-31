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

// L2-142 criteria 3, 4, 6 and 7: a guardian asks for a call, the household's status is Call requested, staff in the status roles are told
// with the number and the time; the caller records the outcome, audited. L2-162: per organization, module gate.
public sealed class LearningBondCallbackTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tran = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Tran");
    private static readonly Guid Thompson = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Thompson");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-142 criterion 3.
    [Fact]
    public async Task Asking_for_a_call_marks_the_household_call_requested_and_tells_the_status_roles_with_the_number_and_time()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Tran");

        var response = await _factory.CreateClient().PostAsJsonAsync($"/g/learning-bond/{token}/callback", new { phone = "289-555-0119", when = "Afternoons" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Harbourview Youth Collective will call you. They will see where you are in the steps, never your SIN.",
            (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString());
        var tran = await Row(_factory.ClientFor(Tom), "Tran");
        Assert.Equal("CallRequested", tran.GetProperty("status").GetString());
        Assert.Equal("289-555-0119", tran.GetProperty("callPhone").GetString());
        Assert.Equal("Afternoons", tran.GetProperty("callWhen").GetString());
        foreach (var who in new[] { Tom, Marisol })
        {
            var notice = Assert.Single((await _factory.ClientFor(who).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray(),
                n => n.GetProperty("kind").GetString() == "learning-bond");
            Assert.Equal("Linh Tran asked for a call about Learning Bond · 289-555-0119 · afternoons.", notice.GetProperty("text").GetString());
        }
        Assert.DoesNotContain((await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>("/notifications")).GetProperty("items").EnumerateArray(),
            n => n.GetProperty("kind").GetString() == "learning-bond");
        Assert.Equal("Guardian|Learning Bond call requested by the Tran household",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond call requested%'"));
    }

    // L2-142 criterion 3: a number and a time are needed.
    [Fact]
    public async Task A_missing_number_or_time_is_refused_by_field_and_nothing_is_stored()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Tran");

        var response = await _factory.CreateClient().PostAsJsonAsync($"/g/learning-bond/{token}/callback", new { phone = "555", when = "Midnight" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter a phone number like 905-555-0142.", errors.GetProperty("phone").GetString());
        Assert.Equal("Choose a time of day.", errors.GetProperty("when").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondCallRequests"));
    }

    // L2-142 criteria 4 and 7: the outcome sets the status and is audited; no open request answers 409; another organization's, 404.
    [Fact]
    public async Task Marking_the_call_done_records_the_outcome_and_the_status_follows_it()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Tran");
        await _factory.CreateClient().PostAsJsonAsync($"/g/learning-bond/{token}/callback", new { phone = "289-555-0119", when = "Afternoons" });
        var tom = _factory.ClientFor(Tom);

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PostAsJsonAsync($"/learning-bond/households/{Tran}/call-outcome", new { outcome = "NotInterested" })).StatusCode);

        var tran = await Row(tom, "Tran");
        Assert.Equal("NotInterested", tran.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, tran.GetProperty("callPhone").ValueKind);
        Assert.Equal("Tom Nguyen|Learning Bond call with the Tran household done: Not interested",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond call with%'"));
        Assert.Equal(HttpStatusCode.Conflict, (await tom.PostAsJsonAsync($"/learning-bond/households/{Thompson}/call-outcome", new { outcome = "Resumed" })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await tom.PostAsJsonAsync($"/learning-bond/households/{Tran}/call-outcome", new { outcome = "Maybe" })).StatusCode);

        var northgate = DatabaseSeeder.HouseholdId(DatabaseSeeder.Northgate, "Rivera");
        Assert.Equal(HttpStatusCode.NotFound, (await tom.PostAsJsonAsync($"/learning-bond/households/{northgate}/call-outcome", new { outcome = "Resumed" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/learning-bond/households/{Tran}/call-outcome", new { outcome = "Resumed" })).StatusCode);
    }

    // L2-142 criterion 4: no answer keeps the household at Call requested; Resumed returns it to where it was.
    [Fact]
    public async Task No_answer_keeps_the_request_and_resumed_returns_the_household_to_invited()
    {
        var token = await Link(DatabaseSeeder.Harbourview, "Tran");
        var tom = _factory.ClientFor(Tom);
        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsync($"/learning-bond/households/{Tran}/invitations", null)).StatusCode);
        await _factory.CreateClient().PostAsJsonAsync($"/g/learning-bond/{token}/callback", new { phone = "289-555-0119", when = "Evenings" });

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PostAsJsonAsync($"/learning-bond/households/{Tran}/call-outcome", new { outcome = "NoAnswer" })).StatusCode);
        Assert.Equal("CallRequested", (await Row(tom, "Tran")).GetProperty("status").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PostAsJsonAsync($"/learning-bond/households/{Tran}/call-outcome", new { outcome = "Resumed" })).StatusCode);
        Assert.Equal("Invited", (await Row(tom, "Tran")).GetProperty("status").GetString());
        Assert.Equal(["Learning Bond call with the Tran household done: No answer", "Learning Bond call with the Tran household done: Resumed"],
            Scalar("SELECT group_concat(Summary, '|') FROM (SELECT Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond call with%' ORDER BY OccurredAt)").Split('|'));
    }

    // L2-142 criterion 6: with Learning Bond off, the guardian's request is unknown and nothing is stored or notified.
    [Fact]
    public async Task With_Learning_Bond_off_a_callback_answers_404_and_nothing_is_stored()
    {
        var token = await Link(DatabaseSeeder.Northgate, "Rivera");

        var response = await _factory.CreateClient().PostAsJsonAsync($"/g/learning-bond/{token}/callback", new { phone = "289-555-0101", when = "Mornings" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondCallRequests"));
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/learning-bond/households")).StatusCode);
    }

    private static async Task<JsonElement> Row(HttpClient client, string name) =>
        (await client.GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray().Single(r => r.GetProperty("name").GetString() == name);

    private async Task<string> Link(Guid organizationId, string household)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueLearningBond(DatabaseSeeder.HouseholdId(organizationId, household));
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

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
