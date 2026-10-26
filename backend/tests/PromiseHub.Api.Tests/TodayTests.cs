using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-038 Today composed from enabled modules: cards per enabled module, counts that link to the work, L2-005 modules off, L2-007 roles, L2-001 tenant isolation.
public sealed class TodayTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_director_sees_counts_slips_due_coming_up_and_tasks()
    {
        await SendFieldTripSlip();
        await ReportIncident();

        var today = await Get(Marisol);

        Assert.Equal(6, today.GetProperty("activeChildren").GetInt32());
        Assert.Equal(5, today.GetProperty("households").GetInt32());
        var slip = Assert.Single(today.GetProperty("slipsDue").EnumerateArray());
        Assert.Equal("Fall field trip: Royal Botanical Gardens", slip.GetProperty("title").GetString());
        Assert.Equal(4, slip.GetProperty("unsigned").GetInt32());
        Assert.Equal(["Saturday Sports", "Fall field trip: Royal Botanical Gardens"], Names(today.GetProperty("comingUp")));
        var task = Assert.Single(today.GetProperty("tasks").EnumerateArray());
        Assert.Equal("incidents", task.GetProperty("kind").GetString());
        Assert.Equal(1, task.GetProperty("count").GetInt32());
    }

    [Fact]
    public async Task Cards_of_modules_that_are_off_are_null_and_their_tasks_absent()
    {
        await SendFieldTripSlip();
        await ReportIncident();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster" } });

        var today = await Get(Marisol);

        Assert.Equal(JsonValueKind.Null, today.GetProperty("slipsDue").ValueKind);
        Assert.Empty(today.GetProperty("tasks").EnumerateArray());
    }

    [Fact]
    public async Task A_youth_worker_gets_no_review_tasks()
    {
        await ReportIncident();

        var today = await Get(Aisha);

        Assert.Empty(today.GetProperty("tasks").EnumerateArray());
    }

    [Fact]
    public async Task Another_organization_counts_only_its_own_records()
    {
        await SendFieldTripSlip();

        var today = await Get(Grace);

        Assert.Equal(1, today.GetProperty("activeChildren").GetInt32());
        Assert.Equal(1, today.GetProperty("households").GetInt32());
        var slips = today.GetProperty("slipsDue");
        Assert.True(slips.ValueKind == JsonValueKind.Null || slips.GetArrayLength() == 0);
    }

    [Fact]
    public async Task With_Roster_off_today_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/today")).StatusCode);
    }

    private async Task SendFieldTripSlip()
    {
        (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/events/{FieldTrip}/slip", new
        {
            title = "Fall field trip: Royal Botanical Gardens",
            body = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens.",
            signBy = "2026-11-12",
            askPhotos = true,
            askSwimming = false,
            askLunch = true,
            reminders = "TwiceWeekly",
            channel = "TextAndEmail",
        })).EnsureSuccessStatusCode();
        var slip = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip");
        var sent = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/slips/{slip.GetProperty("id").GetGuid()}/send", new { });
        sent.EnsureSuccessStatusCode();
    }

    private async Task ReportIncident()
    {
        var reported = await _factory.ClientFor(Aisha).PostAsJsonAsync("/incidents", new
        {
            category = "Injury",
            childId = Mateo,
            occurredAt = "2026-11-05T18:40:00Z",
            place = "Stairwell",
            whatHappened = "Mateo slipped on the stairs and hit his knee.",
            actionTaken = "Ice pack for ten minutes.",
            guardianContact = "CalledAndReached",
            severity = "Minor",
        });
        reported.EnsureSuccessStatusCode();
    }

    private async Task<JsonElement> Get(Guid membership) => await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>("/today");

    private static string[] Names(JsonElement list) => [.. list.EnumerateArray().Select(e => e.GetProperty("name").GetString()!)];

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
