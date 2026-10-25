using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-013 criterion 12 enrollment status on the guardian home, L2-026 links and codes, L2-027 language, L2-001 tenant from the link, L2-005 Roster off.
public sealed partial class GuardianHomeTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");

    private readonly PromiseHubApiFactory _factory = new();
    private HttpClient _guardian = null!;

    [Fact]
    public async Task A_decision_text_links_to_the_home_which_asks_for_a_code_in_the_households_language()
    {
        var token = await EnrollAndDecide(sofia: ("Accept", "Welcome! Camp starts at 8 am."), mateo: ("Waitlist", null));

        var response = await _guardian.GetAsync($"/g/home/{token}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("verification-required", body.GetProperty("code").GetString());
        Assert.Equal("es", body.GetProperty("language").GetString());
    }

    [Fact]
    public async Task The_home_shows_each_childs_status_with_the_waitlist_position_and_the_note()
    {
        var token = await EnrollAndDecide(sofia: ("Accept", "Welcome! Camp starts at 8 am."), mateo: ("Waitlist", null));
        await Verify(token);

        var home = await _guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");

        Assert.Equal("Carmen", home.GetProperty("firstName").GetString());
        var children = home.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal(["Mateo Rivera", "Sofía Rivera"], children.Select(c => c.GetProperty("name").GetString()));
        var mateo = Winter(children[0]);
        Assert.Equal("Waitlisted", mateo.GetProperty("status").GetString());
        Assert.Equal(1, mateo.GetProperty("position").GetInt32());
        var sofia = Winter(children[1]);
        Assert.Equal("Enrolled", sofia.GetProperty("status").GetString());
        Assert.Equal("Welcome! Camp starts at 8 am.", sofia.GetProperty("note").GetString());
        Assert.Equal("2026-12-21", sofia.GetProperty("startsOn").GetString());
    }

    [Fact]
    public async Task A_declined_child_shows_the_reason()
    {
        var token = await EnrollAndDecide(sofia: ("Decline", "Camp is for ages 6 to 12."), mateo: ("Accept", null));
        await Verify(token);

        var home = await _guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");

        var sofia = Winter(home.GetProperty("children").EnumerateArray().Single(c => c.GetProperty("name").GetString() == "Sofía Rivera"));
        Assert.Equal("Declined", sofia.GetProperty("status").GetString());
        Assert.Equal("Camp is for ages 6 to 12.", sofia.GetProperty("note").GetString());
    }

    [Fact]
    public async Task A_changed_mobile_revokes_the_home_link()
    {
        var token = await EnrollAndDecide(sofia: ("Accept", null), mateo: ("Accept", null));
        var carmen = Query("SELECT Id FROM Guardians WHERE Name = 'Carmen Rivera'").Single();

        await _factory.ClientFor(Tom).PutAsJsonAsync($"/guardians/{carmen}", new { name = "Carmen Rivera", relationship = "Mother", mobile = "905-555-0177", canPickUp = true, canSign = true });

        Assert.Equal(HttpStatusCode.Gone, (await _guardian.GetAsync($"/g/home/{token}")).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_the_home_answers_404()
    {
        var token = await EnrollAndDecide(sofia: ("Accept", null), mateo: ("Accept", null));
        await Verify(token);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _guardian.GetAsync($"/g/home/{token}")).StatusCode);
    }

    private static JsonElement Winter(JsonElement child) =>
        child.GetProperty("enrollments").EnumerateArray().Single(e => e.GetProperty("program").GetString() == "Winter Camp 2026");

    /// <summary>Carmen re-enrolls Mateo and Sofía in Winter Camp, Tom decides each, and the decision text's home link is returned.</summary>
    private async Task<string> EnrollAndDecide((string Decision, string? Note) sofia, (string Decision, string? Note) mateo)
    {
        var open = await _factory.ClientFor(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null);
        var url = (await open.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        var slug = url[(url.LastIndexOf('/') + 1)..];
        var enroll = _factory.CreateClient();
        await enroll.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact = "905-555-0142" });
        await enroll.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact = "905-555-0142", code = LastCode() });
        var draft = await enroll.GetFromJsonAsync<JsonElement>($"/g/enroll/{slug}/draft");
        await enroll.PutAsJsonAsync($"/g/enroll/{slug}/draft", new { household = draft.GetProperty("household"), children = draft.GetProperty("children") });
        Assert.Equal(HttpStatusCode.OK, (await enroll.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
        var queue = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{WinterCamp}/enrollments?status=WaitingReview")).GetProperty("requests").EnumerateArray().ToList();
        foreach (var (child, decision) in new[] { ("Sofía Rivera", sofia), ("Mateo Rivera", mateo) })
        {
            var id = queue.Single(r => r.GetProperty("child").GetString() == child).GetProperty("id").GetGuid();
            Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{id}/review", new { decision = decision.Decision, note = decision.Note })).StatusCode);
        }
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        return HomeLink().Match(Sms.Sent.Last(s => s.Text.Contains("/g/home/", StringComparison.Ordinal)).Text).Groups["token"].Value;
    }

    private async Task Verify(string token)
    {
        await _guardian.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        Assert.Equal(HttpStatusCode.NoContent, (await _guardian.PostAsJsonAsync("/g/auth/verify", new { token, code = LastCode() })).StatusCode);
    }

    private string LastCode() => CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;

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

    public Task InitializeAsync()
    {
        _guardian = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
