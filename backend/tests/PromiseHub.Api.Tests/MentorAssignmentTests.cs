using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-062 mentors for youth and for whole cohorts: reading a cohort's mentoring, assigning and removing a youth's mentor, a mentor's
// youth, validation, roles, tenancy, archived programs and the Mentoring and Roster gates.
public sealed class MentorAssignmentTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Samuel = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "samuel@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];

    private readonly PromiseHubApiFactory _factory = new();

    // ---- criterion 1: reading a cohort's mentoring

    [Fact]
    public async Task A_cohorts_mentoring_lists_its_team_each_youths_mentor_and_the_active_mentors()
    {
        var mentoring = await Get(Marisol, $"/programs/{Tutoring}/mentoring");

        Assert.Equal(JsonValueKind.Null, mentoring.GetProperty("lead").ValueKind);
        Assert.Empty(mentoring.GetProperty("supporting").EnumerateArray());
        Assert.Equal(["Daniel Osei", "Hana Kim"], Names(mentoring.GetProperty("mentors")));
        var youth = mentoring.GetProperty("youth").EnumerateArray().ToList();
        Assert.Equal(4, youth.Count);
        Assert.All(youth, y => Assert.Equal(JsonValueKind.Null, y.GetProperty("mentor").ValueKind));
    }

    // ---- criterion 2: assigning, replacing and removing a youth's mentor

    [Fact]
    public async Task Assigning_a_mentor_names_them_on_the_youth_is_audited_and_reaches_the_mentors_list()
    {
        var response = await AssignYouth(Marisol, Tutoring, Mateo, Daniel);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Daniel Osei", MentorOf(await Get(Marisol, $"/programs/{Tutoring}/mentoring"), Mateo));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'YouthMentor'"));
        Assert.Equal(["Mateo Rivera"], Names((await Get(Daniel, "/mentoring/youth")).GetProperty("youth")));
        Assert.Empty((await Get(Hana, "/mentoring/youth")).GetProperty("youth").EnumerateArray());
    }

    [Fact]
    public async Task A_youth_has_one_mentor_so_assigning_again_replaces_and_removing_clears()
    {
        await AssignYouth(Marisol, Tutoring, Mateo, Daniel);
        await AssignYouth(Marisol, Tutoring, Mateo, Hana);

        Assert.Equal("Hana Kim", MentorOf(await Get(Marisol, $"/programs/{Tutoring}/mentoring"), Mateo));
        Assert.Empty((await Get(Daniel, "/mentoring/youth")).GetProperty("youth").EnumerateArray());

        var removed = await _factory.ClientFor(Marisol).DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor");

        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Null(MentorOf(await Get(Marisol, $"/programs/{Tutoring}/mentoring"), Mateo));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Deleted' AND RecordType = 'YouthMentor'"));
    }

    // ---- criterion 3: validation

    [Fact]
    public async Task A_mentor_must_be_chosen_and_must_be_an_active_mentor_of_the_organization()
    {
        var none = await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor", new { mentorId = (Guid?)null });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, none.StatusCode);
        Assert.Equal("Choose a mentor.", await Error(none, "mentorId"));

        foreach (var notAMentor in new[] { Jaylen, Samuel, Nadia })
        {
            var refused = await AssignYouth(Marisol, Tutoring, Mateo, notAMentor);
            Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
            Assert.Equal("Choose an active mentor.", await Error(refused, "mentorId"));
        }
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'YouthMentor'"));
    }

    [Fact]
    public async Task A_removed_mentor_cannot_be_assigned_and_drops_from_the_list()
    {
        await AssignYouth(Marisol, Tutoring, Mateo, Hana);
        var removed = await _factory.ClientFor(Tom).DeleteAsync($"/staff/{Hana}");
        Assert.True(removed.IsSuccessStatusCode, $"Removing answered {removed.StatusCode}");

        var mentoring = await Get(Marisol, $"/programs/{Tutoring}/mentoring");
        Assert.Equal(["Daniel Osei"], Names(mentoring.GetProperty("mentors")));
        Assert.Null(MentorOf(mentoring, Mateo));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await AssignYouth(Marisol, Tutoring, Mateo, Hana)).StatusCode);
    }

    [Fact]
    public async Task A_child_not_on_the_cohorts_active_roster_is_not_found()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await AssignYouth(Marisol, Tutoring, Amara, Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AssignYouth(Marisol, Sports, Mateo, Daniel)).StatusCode);
    }

    // ---- criterion 4: a cohort's team

    [Fact]
    public async Task Setting_a_cohorts_team_names_its_lead_and_supporting_mentors_and_is_audited()
    {
        var response = await SetTeam(Marisol, Tutoring, Daniel, Hana);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var mentoring = await Get(Marisol, $"/programs/{Tutoring}/mentoring");
        Assert.Equal("Daniel Osei", mentoring.GetProperty("lead").GetProperty("name").GetString());
        Assert.Equal(["Hana Kim"], Names(mentoring.GetProperty("supporting")));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'CohortMentors'"));
        var roster = new[] { "Jordan Thompson", "Mateo Rivera", "Sofía Rivera", "Yusuf Haddad" };
        Assert.Equal(roster, Names((await Get(Daniel, "/mentoring/youth")).GetProperty("youth")));
        Assert.Equal(roster, Names((await Get(Hana, "/mentoring/youth")).GetProperty("youth")));
    }

    [Fact]
    public async Task Saving_the_team_again_replaces_it_and_a_mentor_may_lead_one_cohort_and_support_another()
    {
        await SetTeam(Marisol, Tutoring, Daniel, Hana);
        await SetTeam(Marisol, Tutoring, Hana);
        await SetTeam(Marisol, Sports, Daniel);

        var tutoring = await Get(Marisol, $"/programs/{Tutoring}/mentoring");
        Assert.Equal("Hana Kim", tutoring.GetProperty("lead").GetProperty("name").GetString());
        Assert.Empty(tutoring.GetProperty("supporting").EnumerateArray());
        await AssignYouth(Marisol, Tutoring, Mateo, Daniel);
        Assert.Equal(["Emily Tran", "Kevin Tran", "Mateo Rivera"], Names((await Get(Daniel, "/mentoring/youth")).GetProperty("youth")));
    }

    [Fact]
    public async Task A_team_needs_a_lead_who_is_not_also_supporting_and_only_active_mentors()
    {
        var noLead = await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/mentors", new { leadMentorId = (Guid?)null, supportingMentorIds = new[] { Hana } });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, noLead.StatusCode);
        Assert.Equal("Choose a lead mentor.", await Error(noLead, "leadMentorId"));

        var twice = await SetTeam(Marisol, Tutoring, Daniel, Daniel);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, twice.StatusCode);
        Assert.Equal("The lead mentor can’t also be a supporting mentor.", await Error(twice, "supportingMentorIds"));

        var inactive = await SetTeam(Marisol, Tutoring, Daniel, Samuel);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, inactive.StatusCode);
        Assert.Equal("Choose active mentors.", await Error(inactive, "leadMentorId"));
        Assert.Empty(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'CohortMentors'"));
    }

    // ---- criterion 5: who drops off a mentor's list

    [Fact]
    public async Task Youth_of_an_archived_cohort_or_an_ended_enrollment_drop_off_unless_assigned_directly()
    {
        await SetTeam(Marisol, Tutoring, Daniel);
        await AssignYouth(Marisol, Tutoring, Mateo, Daniel);
        var jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");
        await _factory.ClientFor(Marisol).SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"/programs/{Tutoring}/enrollments/{jordan}") { Content = JsonContent.Create(new { reason = "Moved away" }) });

        Assert.DoesNotContain("Jordan Thompson", Names((await Get(Daniel, "/mentoring/youth")).GetProperty("youth")));

        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });
        Assert.Equal(["Mateo Rivera"], Names((await Get(Daniel, "/mentoring/youth")).GetProperty("youth")));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await SetTeam(Marisol, Tutoring, Hana)).StatusCode);
    }

    // ---- criterion 6: roles

    [Fact]
    public async Task Only_admins_and_program_directors_assign_other_staff_read_and_participants_are_refused()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await AssignYouth(Tom, Tutoring, Mateo, Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await AssignYouth(Jaylen, Tutoring, Mateo, Hana)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await SetTeam(Jaylen, Tutoring, Hana)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Aisha).DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync($"/programs/{Tutoring}/mentoring")).StatusCode);

        foreach (var participant in new[] { Daniel, Nadia, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(participant).GetAsync($"/programs/{Tutoring}/mentoring")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await AssignYouth(participant, Tutoring, Mateo, Daniel)).StatusCode);
        }
    }

    // ---- criterion 8: tenancy

    [Fact]
    public async Task Another_organizations_cohort_is_not_found_and_its_mentors_never_mix()
    {
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Mentoring" } });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/programs/{KidsClub}/mentoring")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AssignYouth(Grace, Tutoring, Mateo, Samuel)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SetTeam(Grace, Tutoring, Samuel)).StatusCode);

        await AssignYouth(Marisol, Tutoring, Mateo, Daniel);
        Assert.Equal(["Samuel Boateng"], Names((await Get(Grace, $"/programs/{KidsClub}/mentoring")).GetProperty("mentors")));
        Assert.Empty((await Get(Samuel, "/mentoring/youth")).GetProperty("youth").EnumerateArray());
    }

    // ---- criterion 9: archived

    [Fact]
    public async Task An_archived_cohort_refuses_assignments()
    {
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/programs/{Tutoring}/archive", new { confirmName = "After-School Tutoring" });

        var response = await AssignYouth(Marisol, Tutoring, Mateo, Daniel);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("After-School Tutoring is archived.", await Error(response, "mentorId"));
    }

    // ---- criterion 7: module gates

    [Fact]
    public async Task With_Mentoring_off_every_assignment_endpoint_answers_404_and_turning_it_on_again_restores_them()
    {
        await SetTeam(Marisol, Tutoring, Daniel, Hana);
        await AssignYouth(Marisol, Tutoring, Mateo, Hana);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });

        var client = _factory.ClientFor(Marisol);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/programs/{Tutoring}/mentoring")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SetTeam(Marisol, Tutoring, Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AssignYouth(Marisol, Tutoring, Mateo, Daniel)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/programs/{Tutoring}/youth/{Mateo}/mentor")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/programs/{Tutoring}")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = (string[])[.. Suite, "Mentoring"] });

        var mentoring = await Get(Marisol, $"/programs/{Tutoring}/mentoring");
        Assert.Equal("Daniel Osei", mentoring.GetProperty("lead").GetProperty("name").GetString());
        Assert.Equal("Hana Kim", MentorOf(mentoring, Mateo));
    }

    [Fact]
    public async Task With_Roster_off_the_assignment_endpoints_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync($"/programs/{Tutoring}/mentoring")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await AssignYouth(Marisol, Tutoring, Mateo, Daniel)).StatusCode);
    }

    private Task<HttpResponseMessage> SetTeam(Guid caller, Guid program, Guid lead, params Guid[] supporting) =>
        _factory.ClientFor(caller).PutAsJsonAsync($"/programs/{program}/mentors", new { leadMentorId = lead, supportingMentorIds = supporting });

    private Task<HttpResponseMessage> AssignYouth(Guid caller, Guid program, Guid child, Guid mentor) =>
        _factory.ClientFor(caller).PutAsJsonAsync($"/programs/{program}/youth/{child}/mentor", new { mentorId = mentor });

    private static string[] Names(JsonElement list) => [.. list.EnumerateArray().Select(x => x.GetProperty("name").GetString() ?? "")];

    private static string? MentorOf(JsonElement mentoring, Guid child)
    {
        var row = mentoring.GetProperty("youth").EnumerateArray().Single(y => y.GetProperty("childId").GetGuid() == child);
        var mentor = row.GetProperty("mentor");
        return mentor.ValueKind == JsonValueKind.Null ? null : mentor.GetProperty("name").GetString();
    }

    private static async Task<string?> Error(HttpResponseMessage response, string field) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty(field).GetString();

    private async Task<JsonElement> Get(Guid membership, string path)
    {
        var response = await _factory.ClientFor(membership).GetAsync(path);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
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
            rows.Add(reader.GetValue(0).ToString() ?? "");
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
