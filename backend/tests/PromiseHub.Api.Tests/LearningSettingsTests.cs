using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-124 criteria 1 to 4, L2-056 criterion 1, L2-005, L2-007, L2-001, L2-032
// Description: while Learning is on, Settings › Organization reads and saves the one consent policy through /settings/learning; with
// Learning off both answer 404.
public sealed class LearningSettingsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private const string Wording = "We agree that our child may join lessons and mentoring at Harbourview.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task With_Learning_on_the_card_reads_the_consent_policy()
    {
        var policy = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/learning");

        Assert.Equal(18, policy.GetProperty("consentAge").GetInt32());
        Assert.StartsWith("I consent to my child taking part in lessons", policy.GetProperty("wording").GetString());
    }

    [Fact]
    public async Task Saving_from_Learning_changes_the_one_policy_Privacy_shows_and_is_audited()
    {
        var saved = await Save(Tom, 16, Wording);

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var privacy = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/consent");
        Assert.Equal(16, privacy.GetProperty("consentAge").GetInt32());
        Assert.Equal(Wording, privacy.GetProperty("wording").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'ConsentPolicy' AND Action = 'Updated'"));
    }

    [Fact]
    public async Task The_same_rules_as_the_consent_policy_apply()
    {
        var invalid = await Save(Tom, 12, "Yes.");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Choose an age from 13 to 19.", errors.GetProperty("consentAge").GetString());
        Assert.Equal("Write the wording guardians sign, 20 to 2,000 characters.", errors.GetProperty("wording").GetString());
    }

    [Fact]
    public async Task With_Learning_off_both_answer_404_and_turning_it_back_on_shows_what_was_saved()
    {
        await Save(Tom, 16, Wording);
        var on = await ModulesOn(Tom);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = on.Where(m => m != "Learning").ToArray() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/settings/learning")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Tom, 17, Wording)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync("/settings/learning")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on });
        Assert.Equal(16, (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/settings/learning")).GetProperty("consentAge").GetInt32());
    }

    [Fact]
    public async Task Only_admins_and_program_directors_and_another_organization_keeps_its_own()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/settings/learning")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Save(Jaylen, 16, Wording)).StatusCode);

        await Save(Tom, 16, Wording);

        Assert.Equal(18, (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/settings/consent")).GetProperty("consentAge").GetInt32());
    }

    private Task<HttpResponseMessage> Save(Guid membership, int age, string wording) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/settings/learning", new { consentAge = age, wording });

    private async Task<string[]> ModulesOn(Guid admin) =>
        (await _factory.ClientFor(admin).GetFromJsonAsync<JsonElement>("/settings/modules")).GetProperty("modules").EnumerateArray()
            .Where(m => m.GetProperty("on").GetBoolean()).Select(m => m.GetProperty("id").GetString()!).ToArray();

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
