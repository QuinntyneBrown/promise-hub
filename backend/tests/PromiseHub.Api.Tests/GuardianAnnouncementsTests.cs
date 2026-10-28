using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-103 guardian announcements: the Messages-module messages sent to the household, read flags, Mark all read, the family page's count,
// Messages off, other households and organizations, links (L2-026).
public sealed partial class GuardianAnnouncementsTests : IAsyncLifetime
{
    private const string RoomChange = "Tutoring night moves to Room 2 this Thursday. The gym floor is being redone; same time, 4:00 pm.";
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Announcements_list_the_messages_sent_to_the_household_unread_and_the_family_page_counts_them()
    {
        await Send(Marisol, Tutoring, RoomChange);
        var (guardian, token) = await Verified();

        var page = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/announcements");
        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");

        Assert.Equal(1, page.GetProperty("unread").GetInt32());
        Assert.Equal("es", page.GetProperty("language").GetString());
        var item = Assert.Single(page.GetProperty("announcements").EnumerateArray());
        Assert.Equal("Tutoring night moves to Room 2 this Thursday.", item.GetProperty("title").GetString());
        Assert.Contains("Room 2", item.GetProperty("body").GetString(), StringComparison.Ordinal);
        Assert.Equal("Marisol Delgado", item.GetProperty("from").GetString());
        Assert.False(item.GetProperty("read").GetBoolean());
        Assert.Equal(1, home.GetProperty("announcements").GetInt32());
    }

    [Fact]
    public async Task Mark_all_read_clears_the_new_flags_and_the_count_and_can_be_repeated()
    {
        await Send(Marisol, Tutoring, RoomChange);
        await Send(Marisol, Tutoring, "Royal Botanical Gardens trip: slips due Friday.");
        var (guardian, token) = await Verified();

        Assert.Equal(HttpStatusCode.NoContent, (await guardian.PostAsync($"/g/home/{token}/announcements/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await guardian.PostAsync($"/g/home/{token}/announcements/read", null)).StatusCode);

        var page = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/announcements");
        Assert.Equal(0, page.GetProperty("unread").GetInt32());
        Assert.All(page.GetProperty("announcements").EnumerateArray(), a => Assert.True(a.GetProperty("read").GetBoolean()));
        Assert.Equal(2, page.GetProperty("announcements").GetArrayLength());
        Assert.Equal(0, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}")).GetProperty("announcements").GetInt32());
    }

    [Fact]
    public async Task Messages_to_other_households_and_other_organizations_are_never_listed()
    {
        await Send(Marisol, Sports, "Saturday Sports is in the gym this week.");
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } });
        await Send(Grace, KidsClub, "Kids Club starts at 6 sharp.");
        var (guardian, token) = await Verified();

        var page = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/announcements");

        Assert.Empty(page.GetProperty("announcements").EnumerateArray());
        Assert.Equal(0, page.GetProperty("unread").GetInt32());
    }

    [Fact]
    public async Task With_Messages_off_both_endpoints_answer_404_and_the_family_page_has_no_count_and_an_unverified_device_is_asked_for_a_code()
    {
        var (guardian, token) = await Verified();
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync($"/g/home/{token}/announcements")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().PostAsync($"/g/home/{token}/announcements/read", null)).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "RollCall" } });

        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"/g/home/{token}/announcements")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.PostAsync($"/g/home/{token}/announcements/read", null)).StatusCode);
        Assert.Equal(JsonValueKind.Null, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}")).GetProperty("announcements").ValueKind);
    }

    private async Task Send(Guid who, Guid programId, string body)
    {
        var response = await _factory.ClientFor(who).PostAsJsonAsync("/messages", new { programId, body, channel = "TextWithEmailFallback" });
        Assert.True(response.IsSuccessStatusCode, $"send answered {response.StatusCode}");
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
    }

    private async Task<(HttpClient Client, string Token)> Verified()
    {
        string token;
        using (var scope = _factory.Services.CreateScope())
        {
            scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(DatabaseSeeder.Harbourview);
            var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueHome(Rivera);
            await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
            token = url[(url.LastIndexOf('/') + 1)..];
        }
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact = "905-555-0142" });
        var code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/g/auth/verify", new { token, code })).StatusCode);
        return (client, token);
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
