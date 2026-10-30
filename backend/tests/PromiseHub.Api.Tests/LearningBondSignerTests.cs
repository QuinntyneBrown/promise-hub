using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-137 an admin names a signer who accepts through a single-use 14-day link: one open request per organization, Resend and Cancel,
// field errors, audited; L2-162 per organization. The signer's own page behind the link is prompt 84.
public sealed class LearningBondSignerTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private static readonly object Angela = new { name = "Rev. Angela Baptiste", title = "Board chair", email = "angela.baptiste@harbourview.example" };

    private readonly PromiseHubApiFactory _factory = new();

    private FakeEmailSender Email => _factory.Services.GetRequiredService<FakeEmailSender>();

    // L2-137 criterion 1.
    [Fact]
    public async Task Naming_a_signer_emails_a_link_from_the_organization_and_the_agreement_shows_who_it_waits_for()
    {
        var tom = _factory.ClientFor(Tom);

        var response = await tom.PostAsJsonAsync("/learning-bond/agreement/signers", Angela);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var signer = (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer");
        Assert.Equal("Rev. Angela Baptiste", signer.GetProperty("name").GetString());
        Assert.Equal("Board chair", signer.GetProperty("title").GetString());
        Assert.Equal("angela.baptiste@harbourview.example", signer.GetProperty("email").GetString());
        Assert.Equal(_factory.Clock.GetUtcNow(), signer.GetProperty("sentAt").GetDateTimeOffset());
        Assert.Equal(_factory.Clock.GetUtcNow().AddDays(14), signer.GetProperty("expiresAt").GetDateTimeOffset());
        Assert.False(signer.TryGetProperty("token", out _));
        var (to, subject) = Assert.Single(Email.Sent);
        Assert.Equal("angela.baptiste@harbourview.example", to);
        Assert.StartsWith("Harbourview Youth Collective via PromiseHub", subject, StringComparison.Ordinal);
        Assert.Contains("/sign/learning-bond/", Assert.Single(Email.Bodies).Body, StringComparison.Ordinal);
        Assert.Equal("Tom Nguyen|Learning Bond agreement signer requested: Rev. Angela Baptiste, Board chair",
            Scalar($"SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'LearningBondSignerRequest'"));
    }

    // L2-137 criterion 4.
    [Fact]
    public async Task A_missing_name_or_title_and_an_email_that_is_not_one_are_refused_by_field_and_nothing_is_sent()
    {
        var response = await _factory.ClientFor(Tom).PostAsJsonAsync("/learning-bond/agreement/signers", new { name = " ", title = "", email = "angela" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the signer’s name.", errors.GetProperty("name").GetString());
        Assert.Equal("Enter the signer’s role or title.", errors.GetProperty("title").GetString());
        Assert.Equal("Enter an email like name@example.org.", errors.GetProperty("email").GetString());
        Assert.Empty(Email.Sent);
        Assert.Equal("0", Scalar("SELECT COUNT(*) FROM LearningBondSignerRequests"));
    }

    // L2-137 criterion 5: a new request replaces the open one.
    [Fact]
    public async Task A_second_request_replaces_the_first_so_only_one_is_open()
    {
        var tom = _factory.ClientFor(Tom);
        await tom.PostAsJsonAsync("/learning-bond/agreement/signers", Angela);

        await tom.PostAsJsonAsync("/learning-bond/agreement/signers", new { name = "Marcus Lee", title = "Treasurer", email = "marcus@harbourview.example" });

        var signer = (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer");
        Assert.Equal("Marcus Lee", signer.GetProperty("name").GetString());
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondSignerRequests WHERE CancelledAt IS NULL"));
    }

    // L2-137 criterion 6.
    [Fact]
    public async Task Resend_sends_a_new_link_and_cancel_closes_the_request_both_audited()
    {
        var tom = _factory.ClientFor(Tom);
        var id = await Request(tom);

        Assert.Equal(HttpStatusCode.NoContent, (await tom.PostAsync($"/learning-bond/agreement/signers/{id}/resend", null)).StatusCode);
        Assert.Equal(2, Email.Sent.Count);
        Assert.NotEqual(Email.Bodies[0].Body, Email.Bodies[1].Body);

        Assert.Equal(HttpStatusCode.NoContent, (await tom.DeleteAsync($"/learning-bond/agreement/signers/{id}")).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound, (await tom.PostAsync($"/learning-bond/agreement/signers/{id}/resend", null)).StatusCode);
        Assert.Equal(
            ["Learning Bond agreement signer link resent to Rev. Angela Baptiste", "Learning Bond agreement signer request for Rev. Angela Baptiste cancelled"],
            Rows("SELECT Summary FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'LearningBondSignerRequest' ORDER BY OccurredAt"));
    }

    // L2-137 criterion 7, L2-162: another organization's request is unknown, and a site lead may not ask.
    [Fact]
    public async Task Northgate_never_sees_or_touches_Harbourviews_request_and_a_site_lead_gets_403()
    {
        var id = await Request(_factory.ClientFor(Tom));
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);

        Assert.Equal(JsonValueKind.Null, (await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.PostAsync($"/learning-bond/agreement/signers/{id}/resend", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.DeleteAsync($"/learning-bond/agreement/signers/{id}")).StatusCode);
        Assert.Equal("1", Scalar("SELECT COUNT(*) FROM LearningBondSignerRequests WHERE CancelledAt IS NULL"));

        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.PostAsJsonAsync("/learning-bond/agreement/signers", Angela)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.DeleteAsync($"/learning-bond/agreement/signers/{id}")).StatusCode);
    }

    // L2-137 criterion 11: the admin sees the email the signer received, in the words that were sent, without the link.
    [Fact]
    public async Task The_waiting_request_carries_the_email_the_signer_received_without_its_link()
    {
        var tom = _factory.ClientFor(Tom);
        await Request(tom);

        var preview = (await tom.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("signer").GetProperty("preview");

        Assert.Equal("Tom Nguyen asked you to accept the Learning Bond data-handling agreement", preview.GetProperty("title").GetString());
        Assert.Equal("Hello Rev. Angela Baptiste. Harbourview Youth Collective wants to offer Learning Bond, which helps families claim the Canada Learning Bond "
            + "and child benefits. Someone with authority has to accept a one-page agreement about what it collects and where it goes. Tom Nguyen named you, "
            + "as Board chair. No PromiseHub account is needed. The link works once, for 14 days.", preview.GetProperty("text").GetString());
        Assert.Equal("Read and accept", preview.GetProperty("action").GetString());
        Assert.Equal("Harbourview Youth Collective via PromiseHub", preview.GetProperty("footer").GetString());
        var body = Assert.Single(Email.Bodies).Body;
        Assert.Contains(preview.GetProperty("title").GetString()!, body, StringComparison.Ordinal);
        Assert.Contains(preview.GetProperty("text").GetString()!, body, StringComparison.Ordinal);
        Assert.Contains("Read and accept: ", body, StringComparison.Ordinal);
        Assert.DoesNotContain("/sign/learning-bond/", preview.ToString(), StringComparison.Ordinal);
    }

    private static async Task<string> Request(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/learning-bond/agreement/signers", Angela);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
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

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
