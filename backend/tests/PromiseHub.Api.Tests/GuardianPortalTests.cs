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

// L2-102 the guardian's child page and the family page's children, L2-104 consents on it, L2-026 links, L2-001 tenant from the link, L2-005 module gates.
public sealed partial class GuardianPortalTests : IAsyncLifetime
{
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");
    private static readonly Guid FieldTrip = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Fall field trip: Royal Botanical Gardens");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_family_page_lists_each_child_with_their_active_programs()
    {
        var (guardian, token) = await Verified();

        var home = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}");

        var children = home.GetProperty("children").EnumerateArray().ToList();
        Assert.Equal([Mateo, Sofia], children.Select(c => c.GetProperty("id").GetGuid()));
        Assert.All(children, c => Assert.Equal(["After-School Tutoring"], c.GetProperty("programs").EnumerateArray().Select(p => p.GetString())));
    }

    [Fact]
    public async Task A_childs_page_shows_her_programs_and_the_sessions_of_the_next_four_weeks()
    {
        var (guardian, token) = await Verified();
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/events/{FieldTrip}/cancel", new { message = "The gardens are closed.", tellGuardians = false });

        var child = await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}");

        Assert.Equal("Sofía Rivera", child.GetProperty("name").GetString());
        Assert.Equal("Sofía", child.GetProperty("firstName").GetString());
        Assert.Equal("es", child.GetProperty("language").GetString());
        Assert.Equal(["After-School Tutoring"], child.GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        var schedule = child.GetProperty("schedule").EnumerateArray().ToList();
        Assert.Equal(["Tutoring night", "Fall field trip: Royal Botanical Gardens"], schedule.Select(e => e.GetProperty("name").GetString()));
        Assert.True(schedule[0].GetProperty("today").GetBoolean());
        Assert.Equal("Scheduled", schedule[0].GetProperty("status").GetString());
        Assert.Equal("Cancelled", schedule[1].GetProperty("status").GetString());
        Assert.Equal("After-School Tutoring", schedule[1].GetProperty("program").GetString());
    }

    [Fact]
    public async Task Consents_show_her_participation_consent_and_each_sent_slip_with_its_answer()
    {
        var (guardian, token) = await Verified();
        await GiveConsent(guardian);
        var slips = await SendSlip();
        await guardian.PostAsJsonAsync($"/g/slips/{slips["Mateo"]}/sign", new { name = "Carmen Rivera", photos = true, lunch = "pack" });

        var sofia = (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("consents");
        var mateo = (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Mateo}")).GetProperty("consents");

        var participation = sofia.GetProperty("participation");
        Assert.Equal("Given", participation.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", participation.GetProperty("signedBy").GetString());
        Assert.Equal("Parent", participation.GetProperty("relationship").GetString());
        Assert.StartsWith("GC-", participation.GetProperty("reference").GetString(), StringComparison.Ordinal);
        var sofiaSlip = Assert.Single(sofia.GetProperty("slips").EnumerateArray());
        Assert.Equal("Fall field trip: Royal Botanical Gardens", sofiaSlip.GetProperty("event").GetString());
        Assert.Equal("NotSigned", sofiaSlip.GetProperty("status").GetString());
        Assert.Equal("2026-11-12", sofiaSlip.GetProperty("signBy").GetString());
        Assert.Equal(JsonValueKind.Null, mateo.GetProperty("participation").ValueKind);
        var mateoSlip = Assert.Single(mateo.GetProperty("slips").EnumerateArray());
        Assert.Equal("Signed", mateoSlip.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", mateoSlip.GetProperty("signedBy").GetString());
    }

    [Fact]
    public async Task With_Slips_off_no_slip_is_answered()
    {
        var (guardian, token) = await Verified();
        await SendSlip();
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Learning" } });

        var consents = (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("consents");

        Assert.Equal(JsonValueKind.Null, consents.GetProperty("slips").ValueKind);
    }

    [Fact]
    public async Task Another_households_or_organizations_child_an_unverified_device_and_Roster_off_are_refused()
    {
        var (guardian, token) = await Verified();

        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"/g/home/{token}/children/{Jordan}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"/g/home/{token}/children/{NorthgateMateo}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"/g/home/{token}/children/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _factory.CreateClient().GetAsync($"/g/home/{token}/children/{Sofia}")).StatusCode);
        Assert.Equal(HttpStatusCode.Gone, (await guardian.GetAsync($"/g/home/not-a-token/children/{Sofia}")).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"/g/home/{token}/children/{Sofia}")).StatusCode);
    }

    private async Task GiveConsent(HttpClient guardian)
    {
        Assert.Equal(HttpStatusCode.Accepted, (await _factory.ClientFor(Tom).PostAsync($"/children/{Sofia}/consent-request", null)).StatusCode);
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        var consent = ConsentLink().Match(Sms.Sent.Last(s => s.Text.Contains("/g/consent/", StringComparison.Ordinal)).Text).Groups["token"].Value;
        Assert.Equal(HttpStatusCode.NoContent, (await guardian.PostAsJsonAsync($"/g/consent/{consent}/sign", new { name = "Carmen Rivera", relationship = "Parent", agree = true })).StatusCode);
    }

    private async Task<Dictionary<string, string>> SendSlip()
    {
        var staff = _factory.ClientFor(Marisol);
        await staff.PutAsJsonAsync($"/events/{FieldTrip}/slip", new
        {
            title = "Fall field trip: Royal Botanical Gardens",
            body = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens.",
            signBy = "2026-11-12",
            askPhotos = true,
            askSwimming = false,
            askLunch = true,
            reminders = "TwiceWeekly",
            channel = "TextAndEmail",
        });
        var slipId = (await staff.GetFromJsonAsync<JsonElement>($"/events/{FieldTrip}/slip")).GetProperty("id").GetGuid();
        await staff.PostAsJsonAsync($"/slips/{slipId}/send", new { });
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        return Sms.Sent.SelectMany(s => SlipLink().Matches(s.Text)).ToDictionary(m => m.Groups["child"].Value, m => m.Groups["token"].Value);
    }

    [GeneratedRegex(@"/g/consent/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex ConsentLink();

    [GeneratedRegex(@"(?<child>[\p{L}]+): \S+/g/slip/(?<token>[A-Za-z0-9_-]+)")]
    private static partial Regex SlipLink();

    private async Task<(HttpClient Client, string Token)> Verified(Guid? household = null, Guid? organization = null, string contact = "905-555-0142")
    {
        var token = await Link(household ?? Rivera, organization ?? DatabaseSeeder.Harbourview);
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/g/auth/code", new { token, contact });
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/g/auth/verify", new { token, code = CodePattern().Match(Sms.Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value })).StatusCode);
        return (client, token);
    }

    private async Task<string> Link(Guid household, Guid organization)
    {
        using var scope = _factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organization);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueHome(household);
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
