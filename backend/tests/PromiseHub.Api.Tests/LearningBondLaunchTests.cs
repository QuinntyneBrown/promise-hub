using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-140 launching invitations: the covered households and how each can be reached, the missing contacts, the no-phone block;
// admins only, behind the module gate, per organization (L2-162).
public sealed class LearningBondLaunchTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-140 criterion 1: Rivera and Haddad have a mobile, Tran only an email, Thompson neither.
    [Fact]
    public async Task Launch_counts_the_covered_households_by_how_each_can_be_reached_and_lists_those_with_neither()
    {
        Execute("UPDATE Guardians SET Mobile = NULL, Email = 'linh.tran@example.com' WHERE Name = 'Linh Tran'");
        Execute("UPDATE Guardians SET Mobile = NULL, Email = NULL WHERE Name = 'Dana Thompson'");
        var tom = _factory.ClientFor(Tom);

        var launch = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch");

        Assert.Equal(4, launch.GetProperty("covered").GetInt32());
        Assert.Equal(2, launch.GetProperty("mobile").GetInt32());
        Assert.Equal(1, launch.GetProperty("emailOnly").GetInt32());
        Assert.Equal(1, launch.GetProperty("neither").GetInt32());
        Assert.False(launch.GetProperty("noPhoneNumbers").GetBoolean());
        Assert.Equal(JsonValueKind.Null, launch.GetProperty("mode").ValueKind);
        Assert.Equal(JsonValueKind.Null, launch.GetProperty("date").ValueKind);
        Assert.Equal(new DateOnly(2026, 11, 6), DateOnly.Parse(launch.GetProperty("earliest").GetString()!, System.Globalization.CultureInfo.InvariantCulture));
        Assert.Equal(new DateOnly(2027, 2, 3), DateOnly.Parse(launch.GetProperty("latest").GetString()!, System.Globalization.CultureInfo.InvariantCulture));

        var missing = (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch/missing-contacts")).GetProperty("households");
        var thompson = Assert.Single(missing.EnumerateArray());
        Assert.Equal("Thompson", thompson.GetProperty("name").GetString());
        Assert.Equal("Dana Thompson", thompson.GetProperty("guardian").GetString());
        Assert.Equal("After-School Tutoring", thompson.GetProperty("programs").GetString());
        Assert.False(thompson.TryGetProperty("mobile", out _));
    }

    // L2-140 criterion 2: no covered household has a guardian with a mobile number.
    [Fact]
    public async Task With_no_mobile_number_on_any_covered_household_the_launch_says_so()
    {
        Execute("UPDATE Guardians SET Mobile = NULL");

        var launch = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/launch");

        Assert.True(launch.GetProperty("noPhoneNumbers").GetBoolean());
        Assert.Equal(0, launch.GetProperty("mobile").GetInt32());
    }

    // L2-140 criteria 8 and 9, L2-162: a site lead may not launch; while Learning Bond is off the launch is unknown; each organization
    // counts only its own households.
    [Fact]
    public async Task A_site_lead_gets_403_the_module_off_answers_404_and_Northgate_counts_only_its_own()
    {
        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/launch")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/launch/missing-contacts")).StatusCode);

        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/launch")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);

        var launch = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/launch");
        Assert.Equal(1, launch.GetProperty("covered").GetInt32());
        Assert.Equal(1, launch.GetProperty("mobile").GetInt32());
        Assert.Empty((await grace.GetFromJsonAsync<JsonElement>("/learning-bond/launch/missing-contacts")).GetProperty("households").EnumerateArray());
    }

    // L2-140 criteria 2 and 3, L2-136 criterion 4: the day must be from tomorrow to 90 days ahead, there must be a mobile number, and
    // the current agreement must be accepted.
    [Fact]
    public async Task Scheduling_refuses_a_day_out_of_range_no_mobile_number_and_a_pending_agreement_version()
    {
        var tom = _factory.ClientFor(Tom);

        await AssertInvalid(await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-05" }), "date", DateMessage);
        await AssertInvalid(await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2027-02-04" }), "date", DateMessage);
        await AssertInvalid(await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled" }), "date", DateMessage);

        await PublishVersion(3);
        await AssertInvalid(await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-09" }), "launch",
            "A new version of the agreement needs accepting.");
        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);

        Execute("UPDATE Guardians SET Mobile = NULL");
        var blocked = await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-09" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, blocked.StatusCode);
        Assert.Equal("no-phone-numbers", (await blocked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM AuditEntries WHERE Summary LIKE 'Learning Bond launch%'"));
    }

    // L2-140 criteria 3, 5 and 10, ADR 0079: the launch sends at 10:00 local on its day, one message per household, in its language, naming
    // each eligible child, with its own link; never twice.
    [Fact]
    public async Task A_scheduled_launch_sends_one_invitation_per_covered_household_at_ten_on_its_day_and_never_twice()
    {
        Execute("UPDATE Guardians SET Mobile = NULL WHERE Name = 'Linh Tran'");
        Execute("UPDATE Guardians SET Email = 'linh.tran@example.com' WHERE Name = 'Linh Tran'");
        var tom = _factory.ClientFor(Tom);

        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-09" })).StatusCode);
        var launch = await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch");
        Assert.Equal("Scheduled", launch.GetProperty("mode").GetString());
        Assert.Equal("2026-11-09", launch.GetProperty("date").GetString());
        Assert.Equal("Tom Nguyen|Learning Bond launch scheduled for Mon 9 Nov 2026",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond launch%'"));

        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 9, 14, 59, 0, TimeSpan.Zero));
        await RunJob();
        Assert.Empty(Sms.Sent);

        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 9, 15, 0, 0, TimeSpan.Zero));
        await RunJob();
        await RunJob();

        Assert.Equal(["905-555-0117", "905-555-0128", "905-555-0142", "905-555-0199"], Sms.Sent.Select(s => s.To).Order(StringComparer.Ordinal));
        var carmen = Sms.Sent.Single(s => s.To == "905-555-0142").Text;
        Assert.StartsWith("Harbourview Youth Collective: Mateo y Sofía podrían tener derecho a hasta $2,000", carmen, StringComparison.Ordinal);
        Assert.Contains("/g/learning-bond/", carmen, StringComparison.Ordinal);
        Assert.NotEqual(Link(carmen), Link(Sms.Sent.Single(s => s.To == "905-555-0117").Text));
        Assert.Equal(Link(carmen), Link(Sms.Sent.Single(s => s.To == "905-555-0199").Text));
        Assert.StartsWith("Harbourview Youth Collective : Yusuf pourrait recevoir", Sms.Sent.Single(s => s.To == "905-555-0128").Text, StringComparison.Ordinal);
        var (to, subject) = Assert.Single(Email.Sent);
        Assert.Equal("linh.tran@example.com", to);
        Assert.Equal("Emily and Kevin may be owed up to $2,000 for school after high school", subject);
        Assert.Contains("/g/learning-bond/", Assert.Single(Email.Bodies).Body, StringComparison.Ordinal);

        Assert.Equal("4", Scalar("SELECT COUNT(*) FROM LearningBondInvitations"));
        Assert.Equal("PromiseHub|Learning Bond invitations sent to 4 households",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond invitations sent%'"));
        Assert.NotEqual(JsonValueKind.Null, (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch")).GetProperty("launchedAt").ValueKind);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-12" })).StatusCode);
    }

    // L2-140 criteria 6 and 7: the date can change and the launch can be cancelled until it starts; a cancelled launch, a suspended
    // organization and Learning Bond turned off send nothing.
    [Fact]
    public async Task A_changed_date_moves_the_send_and_cancelled_suspended_or_off_sends_nothing()
    {
        var tom = _factory.ClientFor(Tom);
        await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-09" });

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PutAsJsonAsync("/learning-bond/launch", new { date = "2026-11-10" })).StatusCode);
        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 9, 15, 30, 0, TimeSpan.Zero));
        await RunJob();
        Assert.Empty(Sms.Sent);

        Assert.Equal(HttpStatusCode.NoContent, (await tom.DeleteAsync("/learning-bond/launch")).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch")).GetProperty("mode").ValueKind);
        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 10, 15, 30, 0, TimeSpan.Zero));
        await RunJob();
        Assert.Empty(Sms.Sent);
        Assert.Equal(["Learning Bond launch moved to Tue 10 Nov 2026", "Learning Bond launch cancelled; nothing was sent"],
            Rows("SELECT Summary FROM AuditEntries WHERE Summary LIKE 'Learning Bond launch %' AND Summary NOT LIKE '%scheduled%' ORDER BY OccurredAt"));

        await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "Scheduled", date = "2026-11-11" });
        Execute($"UPDATE Organizations SET SuspendedAt = 1 WHERE Id = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'");
        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 11, 15, 30, 0, TimeSpan.Zero));
        await RunJob();
        Assert.Empty(Sms.Sent);

        Execute("UPDATE Organizations SET SuspendedAt = NULL");
        Execute($"UPDATE ModuleConfigurations SET ModulesOn = REPLACE(ModulesOn, ',LearningBond', '') WHERE OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'");
        await RunJob();
        Assert.Empty(Sms.Sent);
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondInvitations"));
    }

    // L2-140 criterion 4: at the door, nothing is sent in bulk.
    [Fact]
    public async Task Choosing_at_the_door_sends_nothing_in_bulk()
    {
        var tom = _factory.ClientFor(Tom);

        Assert.Equal(HttpStatusCode.Created, (await tom.PostAsJsonAsync("/learning-bond/launch", new { mode = "AtTheDoor" })).StatusCode);

        Assert.Equal("AtTheDoor", (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/launch")).GetProperty("mode").GetString());
        _factory.Clock.SetUtcNow(new DateTimeOffset(2026, 11, 9, 15, 30, 0, TimeSpan.Zero));
        await RunJob();
        Assert.Empty(Sms.Sent);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsJsonAsync("/learning-bond/launch", new { mode = "AtTheDoor" })).StatusCode);
    }

    private const string DateMessage = "Choose a date from tomorrow to 90 days ahead.";

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private static string Link(string text) => text[text.IndexOf("/g/learning-bond/", StringComparison.Ordinal)..].Split(' ')[0];

    private static async Task AssertInvalid(HttpResponseMessage response, string field, string message)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal(message, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString());
    }

    private async Task PublishVersion(int version)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IPromiseHubDb>();
        db.LearningBondAgreements.Add(new LearningBondAgreement(Guid.NewGuid(), version, new DateOnly(2026, 11, 1), "What we collect, version 3.", "Where it goes, version 3.",
            "What your organization sees, version 3."));
        await db.SaveChangesAsync();
    }

    private string Scalar(string sql) => Rows(sql).Single();

    private List<string> Rows(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        using var reader = command.ExecuteReader();
        var rows = new List<string>();
        while (reader.Read())
        {
            rows.Add(Convert.ToString(reader.GetValue(0), System.Globalization.CultureInfo.InvariantCulture)!);
        }
        return rows;
    }

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
