using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-059 first-run onboarding for a youth: server-saved steps, validation, finishing (audited), the consent gate, Learning off,
// roles and tenancy.
public sealed class YouthOnboardingTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Lucia = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "lucia@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];
    private static readonly string[] WithLearning = [.. Suite, "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task A_youth_who_never_opened_setup_gets_defaults_from_her_record_and_no_program_while_unplaced()
    {
        var response = await Get(Nadia);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var setup = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("not-started", setup.GetProperty("status").GetString());
        Assert.Equal(1, setup.GetProperty("step").GetInt32());
        Assert.Equal("Nadia", setup.GetProperty("preferredName").GetString());
        Assert.Equal(JsonValueKind.Null, setup.GetProperty("pronouns").ValueKind);
        Assert.True(setup.GetProperty("lessonReminders").GetBoolean());
        Assert.True(setup.GetProperty("mentorMessages").GetBoolean());
        Assert.False(setup.GetProperty("announcements").GetBoolean());
        Assert.Equal(JsonValueKind.Null, setup.GetProperty("program").ValueKind);
    }

    [Fact]
    public async Task The_program_step_names_the_program_her_active_enrollment_names()
    {
        await Enroll(child: "Nadia Haddad", program: "After-School Tutoring");

        var program = (await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("program");

        Assert.Equal("After-School Tutoring", program.GetProperty("name").GetString());
        Assert.Equal("Mon–Thu, 4–6 pm", program.GetProperty("schedule").GetString());
        Assert.Equal("2026-09-08", program.GetProperty("startsOn").GetString());
        Assert.Equal("2027-06-24", program.GetProperty("endsOn").GetString());
    }

    [Fact]
    public async Task Each_step_is_saved_on_the_server_so_she_resumes_where_she_stopped()
    {
        var saved = await Save(Nadia, step: 2, preferredName: "  Nadi  ", pronouns: "she/her");

        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var setup = await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("in-progress", setup.GetProperty("status").GetString());
        Assert.Equal(2, setup.GetProperty("step").GetInt32());
        Assert.Equal("Nadi", setup.GetProperty("preferredName").GetString());
        Assert.Equal("she/her", setup.GetProperty("pronouns").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await Save(Nadia, step: 3, preferredName: "Nadi", pronouns: "she/her", announcements: true, lessonReminders: false)).StatusCode);
        setup = await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, setup.GetProperty("step").GetInt32());
        Assert.True(setup.GetProperty("announcements").GetBoolean());
        Assert.False(setup.GetProperty("lessonReminders").GetBoolean());
    }

    [Theory]
    [InlineData("", "she/her", 2, "preferredName", "Tell us what to call you.")]
    [InlineData("   ", null, 2, "preferredName", "Tell us what to call you.")]
    [InlineData("Nadia Haddad the youngest of three sisters from Hamilton Ontario", null, 2, "preferredName", "Use 60 characters or fewer.")]
    [InlineData("Nadia", "xe/xem", 2, "pronouns", "Choose pronouns from the list.")]
    [InlineData("Nadia", null, 4, "step", "Choose a step from 1 to 3.")]
    public async Task An_invalid_step_is_refused_field_by_field_and_nothing_is_saved(string name, string? pronouns, int step, string field, string message)
    {
        var response = await Save(Nadia, step, name, pronouns);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(message, errors.GetProperty(field).GetString());
        Assert.Equal("not-started", (await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Finishing_marks_the_setup_completed_and_is_audited()
    {
        await Save(Nadia, step: 3, preferredName: "Nadi", pronouns: null);

        var finished = await _factory.ClientFor(Nadia).PostAsync("/learning/onboarding/complete", null);

        Assert.Equal(HttpStatusCode.NoContent, finished.StatusCode);
        Assert.Equal("completed", (await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var audit = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'YouthOnboarding' AND Action = 'Completed'"));
        Assert.Contains("Nadi", audit, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Finishing_before_a_preferred_name_was_saved_is_a_conflict()
    {
        var finished = await _factory.ClientFor(Nadia).PostAsync("/learning/onboarding/complete", null);

        Assert.Equal(HttpStatusCode.Conflict, finished.StatusCode);
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'YouthOnboarding'"));
    }

    [Fact]
    public async Task A_youth_without_guardian_consent_is_refused_setup_and_nothing_is_stored()
    {
        var get = await Get(Sofia);
        var save = await Save(Sofia, step: 2, preferredName: "Sofi", pronouns: null);
        var complete = await _factory.ClientFor(Sofia).PostAsync("/learning/onboarding/complete", null);

        Assert.Equal(HttpStatusCode.Forbidden, get.StatusCode);
        Assert.Equal("consent-required", (await get.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, save.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, complete.StatusCode);
        Assert.Empty(Query("SELECT Id FROM YouthOnboardings"));
    }

    [Fact]
    public async Task Staff_mentors_and_volunteers_are_refused()
    {
        foreach (var member in new[] { Tom, Daniel, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Get(member)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Save(member, 2, "Someone", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(member).PostAsync("/learning/onboarding/complete", null)).StatusCode);
        }
    }

    [Fact]
    public async Task With_Learning_off_every_onboarding_endpoint_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        Assert.Equal(HttpStatusCode.NotFound, (await Get(Nadia)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Save(Nadia, 2, "Nadi", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Nadia).PostAsync("/learning/onboarding/complete", null)).StatusCode);
    }

    [Fact]
    public async Task A_youth_of_another_organization_reads_only_her_own_setup_and_her_own_programs()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = WithLearning });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/consent", new { consentAge = 13, wording = "We agree that our child may join lessons and mentoring." });
        await Enroll(child: "Nadia Haddad", program: "After-School Tutoring");
        await Save(Nadia, step: 3, preferredName: "Nadi", pronouns: "she/her");

        var lucia = await (await Get(Lucia)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("not-started", lucia.GetProperty("status").GetString());
        Assert.Equal("Lucía", lucia.GetProperty("preferredName").GetString());
        Assert.Equal(JsonValueKind.Null, lucia.GetProperty("program").ValueKind);
        Assert.Equal("in-progress", (await (await Get(Nadia)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    private Task<HttpResponseMessage> Get(Guid membership) => _factory.ClientFor(membership).GetAsync("/learning/onboarding");

    private Task<HttpResponseMessage> Save(Guid membership, int step, string preferredName, string? pronouns, bool lessonReminders = true, bool mentorMessages = true, bool announcements = false) =>
        _factory.ClientFor(membership).PutAsJsonAsync("/learning/onboarding", new { step, preferredName, pronouns, lessonReminders, mentorMessages, announcements });

    private async Task Enroll(string child, string program)
    {
        var programId = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, program);
        var childId = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, child);
        var response = await _factory.ClientFor(Tom).PostAsJsonAsync($"/programs/{programId}/enrollments", new { childId });
        Assert.True(response.IsSuccessStatusCode, $"Enrolling answered {response.StatusCode}");
    }

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

    public async Task InitializeAsync() => await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = WithLearning });

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
