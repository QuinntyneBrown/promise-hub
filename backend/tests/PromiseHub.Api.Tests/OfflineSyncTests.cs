using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-028 criteria 2 and 3: queued check-ins replay once, in order, and an older offline check-in after a newer absence is a flagged conflict.
public sealed class OfflineSyncTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task An_offline_check_in_older_than_an_absence_from_another_device_keeps_both_resolves_present_and_is_flagged()
    {
        await _factory.ClientFor(Aisha).PostAsJsonAsync($"/sessions/{Tonight}/absences", new { childId = Sofia, clientActionId = Guid.NewGuid() });

        var synced = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = Sofia, arrivedAt = _factory.Clock.GetUtcNow().AddMinutes(-5), clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.OK, synced.StatusCode);
        var row = Row(await Roster(), "Sofía Rivera");
        Assert.Equal("Present", row.GetProperty("status").GetString());
        Assert.True(row.GetProperty("conflict").GetBoolean());
        Assert.Equal(2, Query($"SELECT e.Id FROM AttendanceEvents e JOIN AttendanceRecords r ON r.Id = e.RecordId WHERE r.ChildId = '{Sofia.ToString().ToUpperInvariant()}'").Count);
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND Summary LIKE '%conflict%'"));
    }

    [Fact]
    public async Task A_replayed_queued_check_in_is_applied_once_and_a_normal_check_in_is_no_conflict()
    {
        var action = new { childId = Mateo, arrivedAt = _factory.Clock.GetUtcNow().AddMinutes(-2), clientActionId = Guid.NewGuid() };

        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", action);
        await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", action);

        var row = Row(await Roster(), "Mateo Rivera");
        Assert.Equal("Present", row.GetProperty("status").GetString());
        Assert.False(row.GetProperty("conflict").GetBoolean());
        Assert.Single(Query($"SELECT e.Id FROM AttendanceEvents e JOIN AttendanceRecords r ON r.Id = e.RecordId WHERE r.ChildId = '{Mateo.ToString().ToUpperInvariant()}'"));
    }

    private async Task<JsonElement> Roster() => await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/sessions/{Tonight}/roster");

    private static JsonElement Row(JsonElement roster, string name) =>
        roster.GetProperty("children").EnumerateArray().Single(r => r.GetProperty("name").GetString() == name);

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
