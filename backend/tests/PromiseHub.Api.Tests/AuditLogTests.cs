using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-032 audit trail, L2-019 medical views logged, L2-007 roles, L2-001 tenant isolation.
public sealed class AuditLogTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_admin_sees_who_did_what_newest_first()
    {
        await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}");

        var log = await Get(Tom, "/audit");

        var first = log.GetProperty("entries")[0];
        Assert.Equal("Jaylen Okafor", first.GetProperty("who").GetString());
        Assert.Equal("Viewed", first.GetProperty("action").GetString());
        Assert.Contains("Mateo Rivera", first.GetProperty("summary").GetString());
        Assert.True(log.GetProperty("total").GetInt32() >= 1);
    }

    [Fact]
    public async Task Searching_by_person_or_record_and_filtering_by_action_narrows_the_log()
    {
        await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}");
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/privacy", new { consentRetentionYears = 3 });

        var byPerson = await Get(Tom, "/audit?q=jaylen");
        var byAction = await Get(Tom, "/audit?action=Updated");

        Assert.All(byPerson.GetProperty("entries").EnumerateArray(), e => Assert.Equal("Jaylen Okafor", e.GetProperty("who").GetString()));
        Assert.All(byAction.GetProperty("entries").EnumerateArray(), e => Assert.Equal("Updated", e.GetProperty("action").GetString()));
        Assert.NotEmpty(byAction.GetProperty("entries").EnumerateArray());
    }

    [Fact]
    public async Task The_period_leaves_out_older_entries()
    {
        await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}");
        _factory.Clock.Advance(TimeSpan.FromDays(10));

        var week = await Get(Tom, "/audit?days=7&q=jaylen");
        var month = await Get(Tom, "/audit?days=30&q=jaylen");

        Assert.Empty(week.GetProperty("entries").EnumerateArray());
        Assert.NotEmpty(month.GetProperty("entries").EnumerateArray());
    }

    [Fact]
    public async Task Exporting_writes_the_filtered_entries_as_csv_and_is_itself_logged()
    {
        await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}");

        var file = await _factory.ClientFor(Tom).GetAsync("/audit/export?q=jaylen");
        var csv = await file.Content.ReadAsStringAsync();

        Assert.Equal("text/csv", file.Content.Headers.ContentType?.MediaType);
        Assert.StartsWith("When,Who,Action,Record,Summary,Device", csv);
        Assert.Contains("Jaylen Okafor", csv);
        Assert.NotEmpty(Query("SELECT Id FROM AuditEntries WHERE Action = 'Exported' AND RecordType = 'AuditLog'"));
    }

    [Fact]
    public async Task Only_admins_read_the_log_and_each_organization_sees_its_own()
    {
        await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}");

        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/audit")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Marisol).GetAsync("/audit/export")).StatusCode);
        Assert.Empty((await Get(Grace, "/audit?q=jaylen")).GetProperty("entries").EnumerateArray());
    }

    private async Task<JsonElement> Get(Guid membership, string path) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

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
