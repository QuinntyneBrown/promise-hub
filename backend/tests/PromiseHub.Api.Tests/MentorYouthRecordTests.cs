using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance tests. Traces to: L2-064 (youth record for a mentor), L2-065 criterion 4, L2-007 criteria 1 and 8, L2-019 criterion 3.
public sealed class MentorYouthRecordTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Hana = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "hana@harbourview.example");
    private static readonly Guid Leo = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "leo@harbourview.example");
    private static readonly Guid Nadia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "nadia@harbourview.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid NadiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Nadia Haddad");
    private static readonly Guid Amara = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Amara Okonkwo");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");
    private static readonly Guid Tonight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid LastNight = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night", "past");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports", "Learning"];
    private static readonly string[] Restricted = ["dateOfBirth", "allergies", "medication", "conditions", "doctor", "redAlert", "alertInstruction", "healthCard", "notes", "pickups", "medical"];

    private readonly PromiseHubApiFactory _factory = new();

    // ---- criterion 1: what a mentor sees, audited

    [Fact]
    public async Task A_mentor_reads_their_youths_record_with_programs_mentor_and_guardians_and_the_open_is_audited()
    {
        await Assign(Mateo, Daniel);

        var record = await Get(Daniel, $"/mentoring/youth/{Mateo}");

        Assert.Equal("Mateo Rivera", record.GetProperty("name").GetString());
        Assert.Equal(9, record.GetProperty("age").GetInt32());
        Assert.Equal("Bennetto Elementary, Grade 4", record.GetProperty("school").GetString());
        Assert.Equal(["After-School Tutoring"], record.GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        Assert.Equal("Daniel Osei", record.GetProperty("mentor").GetString());
        Assert.Equal(JsonValueKind.Null, record.GetProperty("preferredName").ValueKind);
        Assert.Equal(JsonValueKind.Null, record.GetProperty("pronouns").ValueKind);
        var guardians = record.GetProperty("guardians").EnumerateArray().ToList();
        Assert.Equal(["Carmen Rivera", "Luis Rivera"], guardians.Select(g => g.GetProperty("name").GetString()));
        Assert.Equal("Mother", guardians[0].GetProperty("relationship").GetString());
        Assert.Equal("905-555-0142", guardians[0].GetProperty("mobile").GetString());
        Assert.Equal("carmen.rivera@example.com", guardians[0].GetProperty("email").GetString());
        Assert.True(guardians[0].GetProperty("isPrimary").GetBoolean());
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE Action = 'Viewed' AND RecordType = 'Child' AND RecordId = '{Mateo.ToString().ToUpperInvariant()}'"));
    }

    // ---- criterion 2: the name a youth goes by, from first-run setup

    [Fact]
    public async Task A_youth_who_finished_setup_shows_the_name_they_go_by_and_pronouns()
    {
        await Post(Marisol, $"/programs/{Tutoring}/enrollments", new { childId = NadiaChild });
        await Assign(NadiaChild, Daniel);
        await _factory.ClientFor(Nadia).PutAsJsonAsync("/learning/onboarding", new { step = 3, preferredName = "Nadi", pronouns = "she/her", lessonReminders = true, mentorMessages = true, announcements = false });

        Assert.Equal(JsonValueKind.Null, (await Get(Daniel, $"/mentoring/youth/{NadiaChild}")).GetProperty("preferredName").ValueKind);

        await _factory.ClientFor(Nadia).PostAsync("/learning/onboarding/complete", null);
        var record = await Get(Daniel, $"/mentoring/youth/{NadiaChild}");

        Assert.Equal("Nadi", record.GetProperty("preferredName").GetString());
        Assert.Equal("she/her", record.GetProperty("pronouns").GetString());
    }

    // ---- criterion 3: restricted fields never reach a mentor

    [Fact]
    public async Task The_record_never_carries_the_date_of_birth_medical_fields_health_card_notes_or_pickups()
    {
        await Assign(Mateo, Daniel);

        var response = await _factory.ClientFor(Daniel).GetAsync($"/mentoring/youth/{Mateo}");
        var body = await response.Content.ReadAsStringAsync();
        var record = JsonDocument.Parse(body).RootElement;

        foreach (var field in Restricted)
        {
            Assert.False(record.TryGetProperty(field, out _), $"the record carries {field}");
        }
        Assert.DoesNotContain("2017-03-14", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Peanuts", body, StringComparison.Ordinal);
        Assert.DoesNotContain("EpiPen", body, StringComparison.Ordinal);
        Assert.DoesNotContain("4471", body, StringComparison.Ordinal);
        Assert.DoesNotContain("Sits with Jordan", body, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Daniel).GetAsync($"/children/{Mateo}/quick-card")).StatusCode);
    }

    // ---- criterion 4: recent attendance while Roll Call is on

    [Fact]
    public async Task Recent_attendance_lists_sessions_that_started_newest_first_and_is_null_with_Roll_Call_off()
    {
        await Assign(Mateo, Daniel);
        await Post(Jaylen, $"/sessions/{LastNight}/absences", new { childId = Mateo, clientActionId = Guid.NewGuid() });
        await Post(Jaylen, $"/sessions/{Tonight}/check-ins", new { childId = Mateo, arrivedAt = "2026-11-05T21:02:00Z", clientActionId = Guid.NewGuid() });

        var attendance = (await Get(Daniel, $"/mentoring/youth/{Mateo}")).GetProperty("recentAttendance").EnumerateArray().ToList();

        Assert.Equal(["CheckedIn", "Absent"], attendance.Select(a => a.GetProperty("status").GetString()));
        Assert.All(attendance, a => Assert.Equal("Tutoring night", a.GetProperty("session").GetString()));

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Slips", "QuickCards", "Messages", "Incidents", "Reports", "Learning", "Mentoring" } });
        Assert.Equal(JsonValueKind.Null, (await Get(Daniel, $"/mentoring/youth/{Mateo}")).GetProperty("recentAttendance").ValueKind);
    }

    // ---- criterion 5: a youth not assigned to the mentor

    [Fact]
    public async Task A_youth_outside_the_mentors_scope_answers_403_and_the_attempt_is_audited()
    {
        await Assign(Mateo, Daniel);

        var response = await _factory.ClientFor(Daniel).GetAsync($"/mentoring/youth/{Amara}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.DoesNotContain("Amara", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE Action = 'AccessDenied' AND RecordType = 'Child' AND RecordId = '{Amara.ToString().ToUpperInvariant()}'"));
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Hana).GetAsync($"/mentoring/youth/{Mateo}")).StatusCode);
    }

    // ---- criterion 6: tenancy, unknown ids and the module

    [Fact]
    public async Task Another_organizations_child_or_an_unknown_id_answers_404_and_so_does_Mentoring_off()
    {
        await Assign(Mateo, Daniel);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/youth/{NorthgateMateo}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/youth/{Guid.NewGuid()}")).StatusCode);

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Suite });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Daniel).GetAsync($"/mentoring/youth/{Mateo}")).StatusCode);
    }

    // ---- criterion 7: roles

    [Fact]
    public async Task Staff_youth_and_volunteers_are_refused()
    {
        await Assign(Mateo, Daniel);

        foreach (var caller in new[] { Marisol, Jaylen, Nadia, Leo })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(caller).GetAsync($"/mentoring/youth/{Mateo}")).StatusCode);
        }
    }

    private async Task Assign(Guid child, Guid mentor) =>
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{child}/mentor", new { mentorId = mentor })).StatusCode);

    private async Task Post(Guid membership, string path, object body)
    {
        var response = await _factory.ClientFor(membership).PostAsJsonAsync(path, body);
        Assert.True(response.IsSuccessStatusCode, $"{path} answered {response.StatusCode}");
    }

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
