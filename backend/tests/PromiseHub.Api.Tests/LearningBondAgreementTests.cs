using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-136 the data-handling agreement is read and accepted per organization and version, with authority confirmed and audited;
// L2-135 criterion 4 an acceptance lets the module turn on; L2-162 the agreement door is per organization.
public sealed class LearningBondAgreementTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-136 criterion 1.
    [Fact]
    public async Task The_current_agreement_answers_its_version_date_and_three_sections_with_Harbourviews_acceptance()
    {
        var agreement = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/agreement");

        Assert.Equal(2, agreement.GetProperty("version").GetInt32());
        Assert.Equal("2026-10-01", agreement.GetProperty("effectiveOn").GetString());
        Assert.Equal(["What we collect", "Where it goes", "What your organization sees"],
            agreement.GetProperty("sections").EnumerateArray().Select(s => s.GetProperty("title").GetString()));
        Assert.All(agreement.GetProperty("sections").EnumerateArray(), s => Assert.False(string.IsNullOrWhiteSpace(s.GetProperty("text").GetString())));
        var acceptance = agreement.GetProperty("acceptance");
        Assert.Equal("Tom Nguyen", acceptance.GetProperty("acceptedBy").GetString());
        Assert.Equal(2, acceptance.GetProperty("version").GetInt32());
        Assert.True(agreement.GetProperty("moduleOn").GetBoolean());
    }

    // L2-136 criteria 6 and 8: the agreement is served while Learning Bond is off, but only while Roster and Messages are on.
    [Fact]
    public async Task Northgate_gets_404_while_Messages_is_off_and_the_agreement_with_no_acceptance_once_it_is_on()
    {
        var grace = _factory.ClientFor(Grace);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.GetAsync("/learning-bond/agreement")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);

        await TurnOnMessages();

        var agreement = await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement");
        Assert.Equal(JsonValueKind.Null, agreement.GetProperty("acceptance").ValueKind);
        Assert.False(agreement.GetProperty("moduleOn").GetBoolean());
    }

    // L2-136 criterion 3.
    [Fact]
    public async Task Accepting_without_the_authority_box_is_refused_and_nothing_is_stored()
    {
        await TurnOnMessages();

        var response = await _factory.ClientFor(Grace).PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = false });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Confirm you have authority to accept this agreement, or ask someone else to sign.", errors.GetProperty("authority").GetString());
        Assert.Equal("0", Scalar($"SELECT COUNT(*) FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
    }

    // L2-136 criterion 2, L2-135 criterion 4, L2-161.
    [Fact]
    public async Task Accepting_with_authority_stores_who_which_version_and_when_audits_it_and_lets_Learning_Bond_turn_on()
    {
        await TurnOnMessages();
        var grace = _factory.ClientFor(Grace);

        var response = await grace.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var acceptance = (await grace.GetFromJsonAsync<JsonElement>("/learning-bond/agreement")).GetProperty("acceptance");
        Assert.Equal("Grace Mensah", acceptance.GetProperty("acceptedBy").GetString());
        Assert.Equal(2, acceptance.GetProperty("version").GetInt32());
        Assert.Equal(_factory.Clock.GetUtcNow(), acceptance.GetProperty("acceptedAt").GetDateTimeOffset());
        Assert.Equal($"{Upper(Grace)}|2", Scalar($"SELECT AcceptedByMembershipId || '|' || AgreementVersion FROM LearningBondAgreementAcceptances WHERE OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
        Assert.Equal("Grace Mensah|Learning Bond data-handling agreement version 2 accepted",
            Scalar($"SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'LearningBondAgreementAcceptance' AND OrganizationId = '{Upper(DatabaseSeeder.Northgate)}'"));
        Assert.Equal(HttpStatusCode.OK, (await grace.PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages", "LearningBond" } })).StatusCode);
    }

    // L2-136 criterion 7, L2-162 criterion 7.
    [Fact]
    public async Task A_site_lead_gets_403_and_an_anonymous_caller_401()
    {
        var jaylen = _factory.ClientFor(Jaylen);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.GetAsync("/learning-bond/agreement")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await jaylen.PostAsJsonAsync("/learning-bond/agreement/acceptances", new { authority = true })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync("/learning-bond/agreement")).StatusCode);
    }

    private async Task TurnOnMessages() =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } })).StatusCode);

    private static string Upper(Guid id) => id.ToString().ToUpperInvariant();

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
