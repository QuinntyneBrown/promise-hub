using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-060 waiting for a program: lessons stay locked on the server until the youth is placed; the consent gate answers first;
// tenancy, Learning off and roles.
public sealed class NoCohortTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] WithLearning = [.. Suite, "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_youth_in_no_program_is_refused_lessons_with_no_cohort()
    {
        var response = await Lessons(Nadia);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("no-cohort", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Nadia).GetAsync("/learning/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Nadia).GetAsync("/learning/onboarding")).StatusCode);
    }

    [Fact]
    public async Task Once_staff_enroll_her_the_next_request_opens_her_lessons()
    {
        await Enroll();

        Assert.Equal(HttpStatusCode.OK, (await Lessons(Nadia)).StatusCode);
    }

    [Fact]
    public async Task An_ended_enrollment_or_an_archived_program_does_not_place_a_youth()
    {
        await Enroll();
        await _factory.ClientFor(Tom).SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"/programs/{Tutoring}/enrollments/{NadiaChild}") { Content = JsonContent.Create(new { reason = "Moved away" }) });

        Assert.Equal("no-cohort", await Code(Nadia));

        await Enroll();
        var archived = await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });
        Assert.True(archived.IsSuccessStatusCode, $"Archiving answered {archived.StatusCode}");

        Assert.Equal("no-cohort", await Code(Nadia));
    }

    [Fact]
    public async Task The_consent_gate_answers_before_placement()
    {
        Assert.Equal("consent-required", await Code(Sofia));
    }

    [Fact]
    public async Task Only_the_youths_own_organization_places_her()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = WithLearning });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await Enroll();

        Assert.Equal("no-cohort", await Code(Lucia));

        var kidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
        var lucia = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Lucía Rivera");
        await _factory.ClientFor(Grace).PostAsJsonAsync($"/programs/{kidsClub}/enrollments", new { childId = lucia });

        Assert.Equal(HttpStatusCode.OK, (await Lessons(Lucia)).StatusCode);
    }

    [Fact]
    public async Task With_Learning_off_lessons_answer_404_and_other_roles_are_refused()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await Lessons(Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Lessons(Leo)).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await Lessons(Nadia)).StatusCode);
    }

    private Task<HttpResponseMessage> Lessons(Guid membership) => _factory.ClientFor(membership).GetAsync("/learning/home");

    private async Task<string?> Code(Guid membership) =>
        (await (await Lessons(membership)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString();

    private async Task Enroll()
    {
        var response = await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{Tutoring}/enrollments", new { childId = NadiaChild });
        Assert.True(response.IsSuccessStatusCode, $"Enrolling answered {response.StatusCode}");
    }

    public async Task InitializeAsync() => await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = WithLearning });

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
