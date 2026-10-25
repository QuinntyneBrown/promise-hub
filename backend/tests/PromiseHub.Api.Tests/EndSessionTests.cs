using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-018 criterion 4 and 9 ending a session with notes, L2-007 roles, L2-001 tenant isolation, L2-032 audit, L2-005 Roll Call off.
public sealed class EndSessionTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Ending_marks_the_not_checked_in_absent_signs_out_the_rest_and_records_the_session()
    {
        await CheckIn(Mateo);

        var ended = await End("MarkAbsent", "SignOutAtEnd");

        Assert.Equal(HttpStatusCode.OK, ended.StatusCode);
        var summary = await ended.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Ended", summary.GetProperty("status").GetString());
        Assert.Equal(1, summary.GetProperty("checkedIn").GetInt32());
        Assert.Equal(0, summary.GetProperty("notYet").GetInt32());
        var roster = await Roster();
        Assert.Equal("SignedOut", Row(roster, "Mateo Rivera").GetProperty("status").GetString());
        Assert.Equal("Absent", Row(roster, "Sofía Rivera").GetProperty("status").GetString());
        Assert.Equal("Jaylen Okafor", roster.GetProperty("session").GetProperty("endedBy").GetString());
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Session' AND Summary LIKE '%ended%'"));
    }

    [Fact]
    public async Task Leaving_them_keeps_the_gaps_and_an_ended_session_is_read_only()
    {
        await CheckIn(Mateo);

        await End("LeaveNotRecorded", "LeaveUnsigned");
        var late = await CheckIn(Sofia);
        var again = await End("MarkAbsent", "SignOutAtEnd");

        var roster = await Roster();
        Assert.Equal("Present", Row(roster, "Mateo Rivera").GetProperty("status").GetString());
        Assert.Equal("NotYet", Row(roster, "Sofía Rivera").GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, late.StatusCode);
        Assert.Equal("This session has ended.", (await late.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("session").GetString());
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [Fact]
    public async Task Session_notes_are_saved_for_the_next_site_lead_also_after_ending()
    {
        await End("MarkAbsent", "SignOutAtEnd");

        var saved = await _factory.ClientFor(Jaylen).PutAsJsonAsync($"/sessions/{Tonight}/notes", new { notes = "Room 2 projector is broken again." });

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        Assert.Equal("Room 2 projector is broken again.", (await Roster()).GetProperty("session").GetProperty("notes").GetString());
    }

    [Fact]
    public async Task Another_organization_or_Roll_Call_off_never_reaches_the_session()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/sessions/{Tonight}/end", new { notCheckedIn = "MarkAbsent", notSignedOut = "SignOutAtEnd" })).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });
        Assert.Equal(HttpStatusCode.NotFound, (await End("MarkAbsent", "SignOutAtEnd")).StatusCode);
    }

    private Task<HttpResponseMessage> End(string notCheckedIn, string notSignedOut) =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/end", new { notCheckedIn, notSignedOut });

    private Task<HttpResponseMessage> CheckIn(Guid child) =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{Tonight}/check-ins", new { childId = child, arrivedAt = (DateTimeOffset?)null, clientActionId = Guid.NewGuid() });

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
