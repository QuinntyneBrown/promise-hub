using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-040 in-app notifications, L2-005 modules off, L2-001 tenant isolation.
public sealed class NotificationTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_reported_incident_notifies_its_reviewers_newest_first_with_an_unread_count()
    {
        await Report("Mateo slipped on the stairs.");
        await Report("Mateo bumped his head in the gym.");

        var mine = await Get(Marisol);

        Assert.Equal(2, mine.GetProperty("unread").GetInt32());
        var first = mine.GetProperty("items")[0];
        Assert.Equal("incidents", first.GetProperty("kind").GetString());
        Assert.Contains("Mateo Rivera", first.GetProperty("text").GetString());
        Assert.StartsWith("/incidents/", first.GetProperty("link").GetString());
        Assert.Equal(JsonValueKind.Null, first.GetProperty("readAt").ValueKind);
        Assert.Equal(2, (await Get(Tom)).GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task Opening_a_notification_marks_it_read_and_the_count_drops()
    {
        await Report("Mateo slipped on the stairs.");
        var id = (await Get(Marisol)).GetProperty("items")[0].GetProperty("id").GetGuid();

        var read = await _factory.ClientFor(Marisol).PostAsync($"/notifications/{id}/read", null);

        Assert.Equal(HttpStatusCode.NoContent, read.StatusCode);
        Assert.Equal(0, (await Get(Marisol)).GetProperty("unread").GetInt32());
        Assert.Equal(1, (await Get(Tom)).GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task Mark_all_read_clears_the_count()
    {
        await Report("Mateo slipped on the stairs.");
        await Report("Mateo bumped his head in the gym.");

        await _factory.ClientFor(Marisol).PostAsync("/notifications/read-all", null);

        Assert.Equal(0, (await Get(Marisol)).GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task A_youth_worker_gets_no_review_notifications_and_cannot_read_someone_elses()
    {
        await Report("Mateo slipped on the stairs.");
        var id = (await Get(Marisol)).GetProperty("items")[0].GetProperty("id").GetGuid();

        Assert.Empty((await Get(Aisha)).GetProperty("items").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Aisha).PostAsync($"/notifications/{id}/read", null)).StatusCode);
    }

    [Fact]
    public async Task Another_organization_sees_none_of_them()
    {
        await Report("Mateo slipped on the stairs.");
        var id = (await Get(Marisol)).GetProperty("items")[0].GetProperty("id").GetGuid();

        Assert.Empty((await Get(Grace)).GetProperty("items").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsync($"/notifications/{id}/read", null)).StatusCode);
    }

    [Fact]
    public async Task With_Incidents_off_incident_notifications_are_hidden_not_deleted()
    {
        await Report("Mateo slipped on the stairs.");
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        var off = await Get(Marisol);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Incidents" } });

        Assert.Equal(0, off.GetProperty("unread").GetInt32());
        Assert.Empty(off.GetProperty("items").EnumerateArray());
        Assert.Equal(1, (await Get(Marisol)).GetProperty("unread").GetInt32());
    }

    private async Task Report(string whatHappened)
    {
        var reported = await _factory.ClientFor(Aisha).PostAsJsonAsync("/incidents", new
        {
            category = "Injury",
            childId = Mateo,
            occurredAt = "2026-11-05T18:40:00Z",
            place = "Stairwell",
            whatHappened,
            actionTaken = "Ice pack for ten minutes.",
            guardianContact = "CalledAndReached",
            severity = "Minor",
        });
        reported.EnsureSuccessStatusCode();
    }

    private async Task<JsonElement> Get(Guid membership) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/notifications");

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
