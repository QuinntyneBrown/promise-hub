using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance test. Traces to: L2-105 criteria 1, 2, 3, 4, 7 and 8 (composing an announcement to a program or everyone, now or later,
// the guardians' copy through Messages under the SMS cap, the staff list with reach and reads, roles, tenancy and Messages off), L2-021,
// L2-022, L2-032. Today at Harbourview is Thu 5 Nov 2026 (the clock reads 21:12 UTC).
public sealed class AnnouncementsTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Daniel = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "daniel@harbourview.example");
    private static readonly Guid Sofia = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "sofia@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Tutoring = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "After-School Tutoring");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");
    private static readonly Guid SofiaChild = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");
    private const string Room = "Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.";

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Marisol_sends_an_announcement_to_Tutoring_youth_now_it_is_recorded_audited_and_listed_with_its_reach()
    {
        var response = await Compose(Marisol, new { title = "Tutoring night moves to Room 2", body = Room, programId = Tutoring, audience = "Youth", sendAt = (string?)null });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var audit = Assert.Single(Query("SELECT Summary FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Announcement'"));
        Assert.Contains("Tutoring night moves to Room 2", audit, StringComparison.Ordinal);
        Assert.Contains("After-School Tutoring", audit, StringComparison.Ordinal);

        var list = await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements");
        var row = Assert.Single(list.GetProperty("announcements").EnumerateArray());
        Assert.Equal(id, row.GetProperty("id").GetGuid());
        Assert.Equal("Tutoring night moves to Room 2", row.GetProperty("title").GetString());
        Assert.Equal(Room, row.GetProperty("body").GetString());
        Assert.Equal("After-School Tutoring", row.GetProperty("program").GetString());
        Assert.Equal("Youth", row.GetProperty("audience").GetString());
        Assert.Equal("Sent", row.GetProperty("status").GetString());
        Assert.Equal("Marisol Delgado", row.GetProperty("sentBy").GetString());
        // Sofía is the one youth account whose child is enrolled in Tutoring; no guardian copy for Youth.
        Assert.Equal(1, row.GetProperty("recipients").GetInt32());
        Assert.Equal(0, row.GetProperty("reads").GetInt32());
        Assert.Equal(0, row.GetProperty("households").GetInt32());
        Assert.Empty(Query("SELECT Id FROM Messages"));
    }

    [Fact]
    public async Task Youth_and_guardians_queues_a_Messages_copy_to_the_households_of_the_enrolled_children_sent_by_the_dispatcher()
    {
        var response = await Compose(Marisol, new { title = "Gardens trip: sign-ups close Friday", body = "Sign up for the trip by Friday.", programId = Tutoring, audience = "YouthAndGuardians", sendAt = (string?)null });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var message = Assert.Single(Query("SELECT Title, Source, RecipientCount FROM Messages")).Split('|');
        Assert.Equal("Gardens trip: sign-ups close Friday", message[0]);
        Assert.Equal("Messages", message[1]);
        // Mateo and Sofía (Rivera), Jordan (Thompson) and Yusuf (Haddad) are enrolled in Tutoring: three households.
        Assert.Equal("3", message[2]);
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.Contains(_factory.Services.GetRequiredService<FakeSmsSender>().Sent, s => s.Text.Contains("Sign up for the trip by Friday.", StringComparison.Ordinal));

        var row = Assert.Single((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").EnumerateArray());
        Assert.Equal(3, row.GetProperty("households").GetInt32());
    }

    [Fact]
    public async Task A_scheduled_announcement_is_listed_as_scheduled_and_its_guardian_copy_waits_until_its_time()
    {
        var sendAt = _factory.Clock.GetUtcNow().AddHours(12);
        var response = await Compose(Marisol, new { title = "Field day", body = "Wear running shoes.", programId = (Guid?)null, audience = "Everyone", sendAt });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var row = Assert.Single((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").EnumerateArray());
        Assert.Equal("Scheduled", row.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, row.GetProperty("program").ValueKind);
        Assert.Equal(sendAt, row.GetProperty("sendAt").GetDateTimeOffset());

        var sms = _factory.Services.GetRequiredService<FakeSmsSender>();
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.DoesNotContain(sms.Sent, s => s.Text.Contains("Wear running shoes.", StringComparison.Ordinal));
        _factory.Clock.Advance(TimeSpan.FromHours(13));
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.Contains(sms.Sent, s => s.Text.Contains("Wear running shoes.", StringComparison.Ordinal));
        Assert.Equal("Sent", Assert.Single((await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").EnumerateArray()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Everyone_for_all_programs_reaches_every_youth_account_with_an_enrolled_child_and_every_mentor()
    {
        await _factory.ClientFor(Marisol).PutAsJsonAsync($"/programs/{Tutoring}/youth/{SofiaChild}/mentor", new { mentorId = Daniel });
        Assert.Equal(HttpStatusCode.Created, (await Compose(Marisol, new { title = "Huddle", body = "Mentor huddle Thursday at 7.", programId = (Guid?)null, audience = "Mentors", sendAt = (string?)null })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Compose(Marisol, new { title = "Room 2", body = Room, programId = Tutoring, audience = "Mentors", sendAt = (string?)null })).StatusCode);

        var rows = (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements").EnumerateArray().ToList();
        // All programs: Daniel, Hana (Harbourview's mentors). Tutoring: Daniel only, as Sofía's mentor.
        Assert.Equal(2, rows.Single(r => r.GetProperty("title").GetString() == "Huddle").GetProperty("recipients").GetInt32());
        Assert.Equal(1, rows.Single(r => r.GetProperty("title").GetString() == "Room 2").GetProperty("recipients").GetInt32());
    }

    [Fact]
    public async Task Missing_or_too_long_fields_and_a_past_time_answer_422_per_field_and_nothing_is_recorded()
    {
        var empty = await Compose(Marisol, new { title = " ", body = "", programId = (Guid?)null, audience = (string?)null, sendAt = (string?)null });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, empty.StatusCode);
        var errors = (await empty.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Give it a title.", errors.GetProperty("title").GetString());
        Assert.Equal("Write the announcement.", errors.GetProperty("body").GetString());
        Assert.Equal("Choose who hears it.", errors.GetProperty("audience").GetString());

        var tooLong = await Compose(Marisol, new { title = new string('a', 121), body = new string('b', 2001), programId = (Guid?)null, audience = "Youth", sendAt = _factory.Clock.GetUtcNow().AddMinutes(-5) });
        var longErrors = (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Keep it to 120 characters.", longErrors.GetProperty("title").GetString());
        Assert.Equal("Keep it to 2,000 characters.", longErrors.GetProperty("body").GetString());
        Assert.Equal("Pick a time from now on.", longErrors.GetProperty("sendAt").GetString());
        Assert.Empty(Query("SELECT Id FROM Announcements"));
    }

    [Fact]
    public async Task Staff_without_Send_messages_and_participants_are_refused_and_another_organizations_program_is_not_found()
    {
        var body = new { title = "Room 2", body = Room, programId = Tutoring, audience = "Youth", sendAt = (string?)null };
        Assert.Equal(HttpStatusCode.Created, (await Compose(Jaylen, body)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Compose(Tom, body)).StatusCode);
        foreach (var who in new[] { Aisha, Daniel, Sofia })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Compose(who, body)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(who).GetAsync("/announcements")).StatusCode);
        }
        Assert.Equal(HttpStatusCode.NotFound, (await Compose(Marisol, body with { programId = KidsClub })).StatusCode);
    }

    [Fact]
    public async Task Another_organizations_announcements_are_never_listed_and_with_Messages_off_every_endpoint_answers_404()
    {
        await Compose(Marisol, new { title = "Room 2", body = Room, programId = Tutoring, audience = "Youth", sendAt = (string?)null });
        await _factory.ClientFor(Grace).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards", "Messages" } });
        Assert.Equal(HttpStatusCode.Created, (await Compose(Grace, new { title = "Kids Club at 6", body = "Kids Club starts at 6 sharp.", programId = KidsClub, audience = "Everyone", sendAt = (string?)null })).StatusCode);

        var harbourview = (await _factory.ClientFor(Marisol).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements");
        var northgate = (await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/announcements")).GetProperty("announcements");
        Assert.Equal("Room 2", Assert.Single(harbourview.EnumerateArray()).GetProperty("title").GetString());
        Assert.Equal("Kids Club at 6", Assert.Single(northgate.EnumerateArray()).GetProperty("title").GetString());

        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Marisol).GetAsync("/announcements")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Compose(Marisol, new { title = "Room 2", body = Room, programId = Tutoring, audience = "Youth", sendAt = (string?)null })).StatusCode);
        Assert.Single(Query("SELECT Id FROM Announcements WHERE OrganizationId = (SELECT OrganizationId FROM Memberships WHERE upper(Id) = upper('" + Marisol + "'))"));
    }

    private Task<HttpResponseMessage> Compose(Guid who, object body) => _factory.ClientFor(who).PostAsJsonAsync("/announcements", body);

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

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
