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
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Haddad = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Haddad");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");

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

    [Fact]
    public async Task Attendance_counts_her_marks_and_lists_the_most_recent_sessions_while_Roll_Call_is_on()
    {
        var (guardian, token) = await Verified();
        await Mark(LastNight, "absences", Sofia, excused: true);
        await Mark(Tonight, "check-ins", Sofia, late: true);
        await Mark(Tonight, "check-ins", Mateo);

        var attendance = (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("attendance");

        Assert.Equal(0, attendance.GetProperty("present").GetInt32());
        Assert.Equal(1, attendance.GetProperty("late").GetInt32());
        Assert.Equal(1, attendance.GetProperty("excused").GetInt32());
        Assert.Equal(0, attendance.GetProperty("absent").GetInt32());
        var recent = attendance.GetProperty("recent").EnumerateArray().ToList();
        Assert.Equal([Tonight, LastNight], recent.Select(r => r.GetProperty("eventId").GetGuid()));
        Assert.Equal(["Late", "Excused"], recent.Select(r => r.GetProperty("status").GetString()));

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "Messages", "Learning" } });

        Assert.Equal(JsonValueKind.Null, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("attendance").ValueKind);
    }

    [Fact]
    public async Task Learning_shows_the_youths_own_progress_by_module_and_her_badges_and_never_her_work()
    {
        var content = await new LearningContent(_factory).BuildAsync();
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(LearningContent.Nadia).PostAsync($"/learning/lessons/{content.Strengths}/complete", null)).StatusCode);
        await _factory.ClientFor(LearningContent.Nadia).PutAsJsonAsync($"/learning/lessons/{content.Strengths}/reflection", new { mood = "Unsure", text = "I am good at listening, and I want to say it out loud more often in our group.", action = (string?)null, shared = false });
        var (guardian, token) = await Verified(Haddad, contact: "905-555-0128");

        var response = await guardian.GetAsync($"/g/home/{token}/children/{LearningContent.NadiaChild}");
        var raw = await response.Content.ReadAsStringAsync();
        var learning = JsonDocument.Parse(raw).RootElement.GetProperty("learning");
        var journey = await _factory.ClientFor(LearningContent.Nadia).GetFromJsonAsync<JsonElement>("/learning/journey");

        Assert.Equal(1, learning.GetProperty("completedLessons").GetInt32());
        Assert.Equal(journey.GetProperty("totalLessons").GetInt32(), learning.GetProperty("totalLessons").GetInt32());
        var modules = learning.GetProperty("modules").EnumerateArray().ToList();
        Assert.Equal(["Knowing Yourself", "Leading by Serving"], modules.Select(m => m.GetProperty("title").GetString()));
        Assert.Equal(1, modules[0].GetProperty("done").GetInt32());
        Assert.Equal(2, modules[0].GetProperty("total").GetInt32());
        Assert.Empty(learning.GetProperty("badges").EnumerateArray());
        Assert.DoesNotContain("Everyone is good at something", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("I am good at listening", raw, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_child_without_a_youth_account_or_with_Learning_off_has_no_learning()
    {
        var (guardian, token) = await Verified();

        Assert.Equal(JsonValueKind.Null, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Mateo}")).GetProperty("learning").ValueKind);
        Assert.Equal(JsonValueKind.Object, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("learning").ValueKind);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "RollCall", "Messages" } });

        Assert.Equal(JsonValueKind.Null, (await guardian.GetFromJsonAsync<JsonElement>($"/g/home/{token}/children/{Sofia}")).GetProperty("learning").ValueKind);
    }

    private async Task Mark(Guid session, string what, Guid child, bool late = false, bool excused = false)
    {
        var response = await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{session}/{what}", new { childId = child, arrivedAt = (string?)null, clientActionId = Guid.NewGuid(), late, excused });
        Assert.True(response.IsSuccessStatusCode, $"{what} answered {response.StatusCode}");
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
