using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-056 criterion 1 the consent policy, L2-030 privacy settings, L2-007 roles, L2-001 tenant isolation, L2-005 Roster off, L2-032 audit.
public sealed class ConsentPolicyTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private const string Wording = "I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, and to staff contacting them about their program.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_organization_without_a_policy_needs_consent_under_18_with_the_default_wording()
    {
        var policy = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/settings/consent");

        Assert.Equal(18, policy.GetProperty("consentAge").GetInt32());
        Assert.Equal(Wording, policy.GetProperty("wording").GetString());
    }

    [Fact]
    public async Task A_program_director_saves_the_age_and_wording_and_the_change_is_audited_in_her_organization_only()
    {
        var saved = await Save(Marisol, 16, "We agree that our child may join lessons and mentoring at Harbourview.");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var policy = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/consent");
        Assert.Equal(16, policy.GetProperty("consentAge").GetInt32());
        Assert.Equal("We agree that our child may join lessons and mentoring at Harbourview.", policy.GetProperty("wording").GetString());
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'ConsentPolicy' AND Action = 'Updated' AND OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'"));
        var northgate = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/consent");
        Assert.Equal(18, northgate.GetProperty("consentAge").GetInt32());
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'ConsentPolicy' AND OrganizationId = '{DatabaseSeeder.Northgate.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task An_age_outside_13_to_19_or_wording_too_short_or_too_long_is_refused()
    {
        var young = await Save(Tom, 12, Wording);
        var old = await Save(Tom, 20, Wording);
        var short_ = await Save(Tom, 18, "Yes.");
        var long_ = await Save(Tom, 18, new string('a', 2001));

        Assert.Equal("Choose an age from 13 to 19.", (await Errors(young)).GetProperty("consentAge").GetString());
        Assert.Equal("Choose an age from 13 to 19.", (await Errors(old)).GetProperty("consentAge").GetString());
        Assert.Equal("Write the wording guardians sign, 20 to 2,000 characters.", (await Errors(short_)).GetProperty("wording").GetString());
        Assert.Equal("Write the wording guardians sign, 20 to 2,000 characters.", (await Errors(long_)).GetProperty("wording").GetString());
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'ConsentPolicy'"));
    }

    [Fact]
    public async Task Only_admins_and_program_directors_read_or_save_the_policy()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/consent")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Jaylen, 16, Wording)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Sofia).GetAsync("/settings/consent")).StatusCode);
    }

    [Fact]
    public async Task With_Roster_off_the_policy_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/settings/consent")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Tom, 16, Wording)).StatusCode);
    }

    private Task<HttpResponseMessage> Save(Guid membership, int age, string wording) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/consent", new { consentAge = age, wording });

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

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
            rows.Add(string.Join("|", Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetValue(i))));
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
