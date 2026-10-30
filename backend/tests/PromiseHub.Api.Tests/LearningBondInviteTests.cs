using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-140 criteria 4, 5 and 8: staff whose role is in the status roles invite a covered household at the door; once within 7 days; the
// household card shows whether it was invited. L2-162: per organization, behind the module gate.
public sealed class LearningBondInviteTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Thompson = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Thompson");
    private static readonly Guid Okonkwo = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Okonkwo");
    private static readonly Guid NorthgateRivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Northgate, "Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-140 criteria 4 and 5: Invite to Learning Bond texts the household at once; again within 7 days sends nothing and says when.
    [Fact]
    public async Task Inviting_at_the_door_texts_the_household_once_and_again_within_7_days_answers_when()
    {
        var tom = _factory.ClientFor(Tom);
        var card = await tom.GetFromJsonAsync<JsonElement>($"/learning-bond/households/{Thompson}");
        Assert.True(card.GetProperty("covered").GetBoolean());
        Assert.Equal(["After-School Tutoring"], card.GetProperty("programs").EnumerateArray().Select(p => p.GetString()!));
        Assert.Equal(JsonValueKind.Null, card.GetProperty("invitedAt").ValueKind);
        Assert.Equal(["Dana Thompson"], card.GetProperty("recipients").EnumerateArray().Select(p => p.GetString()!));
        Assert.Equal("English", card.GetProperty("language").GetString());
        Assert.StartsWith("Harbourview Youth Collective: Jordan may be owed up to $2,000", card.GetProperty("sms").GetString(), StringComparison.Ordinal);

        var invited = await tom.PostAsync($"/learning-bond/households/{Thompson}/invitations", null);

        Assert.Equal(HttpStatusCode.Created, invited.StatusCode);
        Assert.Equal(_factory.Clock.GetUtcNow(), (await invited.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("invitedAt").GetDateTimeOffset());
        await RunJob();
        var (to, text) = Assert.Single(Sms.Sent);
        Assert.Equal("905-555-0117", to);
        Assert.Contains("/g/learning-bond/", text, StringComparison.Ordinal);
        Assert.Equal("Tom Nguyen|Learning Bond invitation sent to the Thompson household at the door",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond invitation sent%'"));

        _factory.Clock.Advance(TimeSpan.FromDays(6));
        var again = await tom.PostAsync($"/learning-bond/households/{Thompson}/invitations", null);
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        Assert.Equal(new DateTimeOffset(2026, 11, 5, 21, 12, 0, TimeSpan.Zero), (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("invitedAt").GetDateTimeOffset());
        await RunJob();
        Assert.Single(Sms.Sent);
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondInvitations"));
    }

    // L2-140 criterion 8: a role outside the status roles gets 403 until it is added.
    [Fact]
    public async Task A_site_lead_outside_the_status_roles_gets_403_until_the_role_is_added()
    {
        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync($"/learning-bond/households/{Thompson}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.PostAsync($"/learning-bond/households/{Thompson}/invitations", null)).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PutAsJsonAsync("/learning-bond/settings",
            new { coverage = "AllPrograms", programIds = Array.Empty<Guid>(), statusRoles = new[] { "Admin", "ProgramDirector", "SiteLead" } })).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await jaylen.GetAsync($"/learning-bond/households/{Thompson}")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await jaylen.PostAsync($"/learning-bond/households/{Thompson}/invitations", null)).StatusCode);
    }

    // L2-140 criterion 8, L2-162: a household not covered cannot be invited; another organization's is unknown; with the module off, 404.
    [Fact]
    public async Task An_uncovered_household_another_organizations_and_the_module_off_are_refused()
    {
        var tom = _factory.ClientFor(Tom);
        Assert.False((await tom.GetFromJsonAsync<JsonElement>($"/learning-bond/households/{Okonkwo}")).GetProperty("covered").GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound, (await tom.PostAsync($"/learning-bond/households/{Okonkwo}/invitations", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await tom.GetAsync($"/learning-bond/households/{NorthgateRivera}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await tom.PostAsync($"/learning-bond/households/{NorthgateRivera}/invitations", null)).StatusCode);

        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync($"/learning-bond/households/{NorthgateRivera}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.PostAsync($"/learning-bond/households/{NorthgateRivera}/invitations", null)).StatusCode);
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondInvitations"));
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

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
