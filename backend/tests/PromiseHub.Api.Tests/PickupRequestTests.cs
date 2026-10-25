using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-020 criteria 3, 4 and 7 confirming an exceptional pickup with the guardian, L2-023 incidents, L2-026 links, L2-001 tenant isolation, L2-005 Pickup off.
public sealed partial class PickupRequestTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Asking_the_guardian_texts_a_link_and_an_approval_lets_the_adult_sign_the_child_out()
    {
        await CheckIn();

        var asked = await Ask("Rosa Alvarez");
        var id = (await asked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        await RunJob();
        var guardian = await VerifiedGuardian();
        var home = await guardian.Client.GetFromJsonAsync<JsonElement>($"/g/home/{guardian.Token}");
        var request = home.GetProperty("pickupRequests").EnumerateArray().Single();
        var approved = await guardian.Client.PostAsJsonAsync($"/g/home/{guardian.Token}/pickup-requests/{id}", new { approve = true });
        var status = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/pickup-requests/{id}");
        var signedOut = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/sign-outs", new { childId = Mateo, guardianId = (Guid?)null, someoneElse = true, otherName = "Rosa Alvarez", guardianConfirmed = false, idChecked = true, leftAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.Created, asked.StatusCode);
        Assert.Contains(Sms.Sent, s => s.To == "905-555-0142" && s.Text.Contains("Rosa Alvarez is at Tutoring night to collect Mateo", StringComparison.Ordinal));
        Assert.Equal("Rosa Alvarez", request.GetProperty("collector").GetString());
        Assert.Equal(HttpStatusCode.NoContent, approved.StatusCode);
        Assert.Equal("Approved", status.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", status.GetProperty("decidedBy").GetString());
        Assert.Equal(HttpStatusCode.OK, signedOut.StatusCode);
    }

    [Fact]
    public async Task A_refusal_keeps_the_child_and_logs_a_pickup_incident()
    {
        await CheckIn();
        var id = (await (await Ask("Unknown man")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        await RunJob();
        var guardian = await VerifiedGuardian();

        await guardian.Client.PostAsJsonAsync($"/g/home/{guardian.Token}/pickup-requests/{id}", new { approve = false });

        var status = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/pickup-requests/{id}");
        Assert.Equal("Refused", status.GetProperty("status").GetString());
        var incident = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/incidents/{status.GetProperty("incidentId").GetGuid()}");
        Assert.Equal("PickupOrSafeguarding", incident.GetProperty("category").GetString());
        Assert.Equal("Mateo Rivera", incident.GetProperty("child").GetString());
        Assert.Contains("Unknown man", incident.GetProperty("whatHappened").GetString(), StringComparison.Ordinal);
        var refusedSignOut = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/sign-outs", new { childId = Mateo, guardianId = (Guid?)null, someoneElse = true, otherName = "Unknown man", guardianConfirmed = false, idChecked = true, leftAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refusedSignOut.StatusCode);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'PickupRequest' AND Summary LIKE '%refused%'"));
    }

    [Fact]
    public async Task A_decided_request_cannot_be_decided_again_and_another_household_cannot_decide_it()
    {
        await CheckIn();
        var id = (await (await Ask("Rosa Alvarez")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        await RunJob();
        var guardian = await VerifiedGuardian();
        await guardian.Client.PostAsJsonAsync($"/g/home/{guardian.Token}/pickup-requests/{id}", new { approve = true });

        Assert.Equal(HttpStatusCode.NotFound, (await guardian.Client.PostAsJsonAsync($"/g/home/{guardian.Token}/pickup-requests/{id}", new { approve = false })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/pickup-requests/{id}")).StatusCode);
    }

    [Fact]
    public async Task Only_a_child_checked_in_can_be_asked_for_and_Pickup_off_answers_404()
    {
        var notIn = await Ask("Rosa Alvarez");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, notIn.StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });
        Assert.Equal(HttpStatusCode.NotFound, (await Ask("Rosa Alvarez")).StatusCode);
    }

    private Task<HttpResponseMessage> Ask(string collector) =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/pickup-requests", new { childId = Mateo, collectorName = collector });

    private Task CheckIn() =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });

    private async Task<(HttpClient Client, string Token)> VerifiedGuardian()
    {
        var token = HomeLink().Match(Sms.Sent.Last(s => s.Text.Contains("/g/home/", StringComparison.Ordinal)).Text).Groups["token"].Value;
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        await client.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value });
        return (client, token);
    }

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"/g/home/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex HomeLink();

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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
