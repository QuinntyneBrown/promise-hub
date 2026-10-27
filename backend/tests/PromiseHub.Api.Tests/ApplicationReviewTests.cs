using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-072 reviewing and placing applicants; L2-013 review decisions, L2-007 roles, L2-001 tenant isolation, L2-032 audit,
// L2-005 Roster off.
public sealed partial class ApplicationReviewTests : IAsyncLifetime
{
    private static readonly Guid Marisol = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "marisol@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid WinterCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Winter Camp 2026");
    private static readonly Guid Sports = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Saturday Sports");
    private static readonly Guid SummerCamp = DatabaseSeeder.ProgramId(DatabaseSeeder.Harbourview, "Summer Camp 2026");
    private static readonly Guid KidsClub = DatabaseSeeder.ProgramId(DatabaseSeeder.Northgate, "Kids Club");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_pipeline_lists_every_waiting_application_newest_first_with_who_applied_and_the_counts()
    {
        await ApplyAsYouth("905-555-0311");
        await Refer("rachel.ellis@bennetto.example.ca");

        var list = await List("WaitingReview");

        var rows = list.GetProperty("applications").EnumerateArray().ToList();
        Assert.Equal(["Zoe Campbell", "Malik Johnson"], rows.Select(r => r.GetProperty("child").GetString()));
        var zoe = rows[0];
        Assert.Equal("Referrer", zoe.GetProperty("appliedAs").GetString());
        Assert.Equal("Rachel Ellis", zoe.GetProperty("appliedBy").GetString());
        Assert.Equal("Guidance counsellor", zoe.GetProperty("referrerRole").GetString());
        Assert.Equal("Winter Camp 2026", zoe.GetProperty("program").GetString());
        Assert.False(zoe.GetProperty("seasonConsent").GetBoolean());
        Assert.Equal("Youth", rows[1].GetProperty("appliedAs").GetString());
        Assert.Equal(13, zoe.GetProperty("age").GetInt32());
        var counts = list.GetProperty("counts");
        Assert.Equal(2, counts.GetProperty("waitingReview").GetInt32());
        Assert.Equal(0, counts.GetProperty("accepted").GetInt32());
    }

    [Fact]
    public async Task The_status_filter_answers_waitlisted_and_decided_applications_with_who_decided()
    {
        await ApplyAsYouth("905-555-0311");
        await Refer("rachel.ellis@bennetto.example.ca");
        var waiting = (await List("WaitingReview")).GetProperty("applications").EnumerateArray().ToList();
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[0])}/review", new { decision = "Decline", note = "Camp is full this year." });
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[1])}/review", new { decision = "Waitlist" });

        var declined = (await List("Declined")).GetProperty("applications").EnumerateArray().Single();
        var waitlisted = (await List("Waitlisted")).GetProperty("applications").EnumerateArray().Single();

        Assert.Equal("Zoe Campbell", declined.GetProperty("child").GetString());
        Assert.Equal("Tom Nguyen", declined.GetProperty("reviewedBy").GetString());
        Assert.Equal("Camp is full this year.", declined.GetProperty("note").GetString());
        Assert.Equal(1, waitlisted.GetProperty("position").GetInt32());
        Assert.Empty((await List("WaitingReview")).GetProperty("applications").EnumerateArray());
        Assert.Equal(1, (await List("Accepted")).GetProperty("counts").GetProperty("declined").GetInt32());
    }

    [Fact]
    public async Task Only_admins_and_program_directors_open_the_pipeline()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Marisol).GetAsync("/applications")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync("/applications")).StatusCode);
    }

    [Fact]
    public async Task Another_organization_never_sees_the_applications()
    {
        await Refer("rachel.ellis@bennetto.example.ca");

        var list = await _factory.ClientFor(Grace).GetFromJsonAsync<JsonElement>("/applications");

        Assert.Empty(list.GetProperty("applications").EnumerateArray());
        Assert.Equal(0, list.GetProperty("counts").GetProperty("waitingReview").GetInt32());
    }

    [Fact]
    public async Task With_Roster_off_the_pipeline_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/applications")).StatusCode);
    }

    [Fact]
    public async Task An_application_shows_the_young_person_the_referral_and_the_family()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());

        var app = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications/{id}");

        Assert.Equal("Zoe Campbell", app.GetProperty("child").GetString());
        Assert.Equal("2013-01-20", app.GetProperty("dateOfBirth").GetString());
        Assert.Equal("Winter Camp 2026", app.GetProperty("program").GetString());
        Assert.Equal("WaitingReview", app.GetProperty("status").GetString());
        Assert.Equal("Zoe is curious and kind.", app.GetProperty("reason").GetString());
        var referrer = app.GetProperty("referrer");
        Assert.Equal("Rachel Ellis", referrer.GetProperty("name").GetString());
        Assert.Equal("Bennetto Elementary", referrer.GetProperty("organization").GetString());
        Assert.Equal("rachel.ellis@bennetto.example.ca", referrer.GetProperty("contact").GetString());
        var guardian = app.GetProperty("guardian");
        Assert.Equal("Tanya Campbell", guardian.GetProperty("name").GetString());
        Assert.Equal("905-555-0320", guardian.GetProperty("mobile").GetString());
        Assert.Equal("Campbell", app.GetProperty("household").GetString());
        Assert.False(app.GetProperty("returning").GetBoolean());
        Assert.Empty(app.GetProperty("notes").EnumerateArray());
    }

    [Fact]
    public async Task Staff_add_notes_newest_first_and_each_is_audited_without_its_text()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());

        var first = await _factory.ClientFor(Marisol).PostAsJsonAsync($"/applications/{id}/notes", new { text = "Rachel says Zoe would do well with a mentor." });
        _factory.Clock.Advance(TimeSpan.FromMinutes(5));
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/notes", new { text = "  Called Tanya: happy for Zoe to start.  " });

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var notes = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications/{id}")).GetProperty("notes").EnumerateArray().ToList();
        Assert.Equal(["Called Tanya: happy for Zoe to start.", "Rachel says Zoe would do well with a mentor."], notes.Select(n => n.GetProperty("text").GetString()));
        Assert.Equal("Tom Nguyen", notes[0].GetProperty("author").GetString());
        var audit = Query("SELECT Summary FROM AuditEntries WHERE RecordType = 'EnrollmentNote' AND Action = 'Created'");
        Assert.Equal(2, audit.Count);
        Assert.DoesNotContain(audit, a => a.Contains("Tanya", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task An_empty_or_too_long_note_is_refused(string? text)
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());

        var empty = await _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/notes", new { text });
        var tooLong = await _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/notes", new { text = new string('a', 2001) });

        Assert.Equal("Write a note of up to 2,000 characters.", (await Errors(empty)).GetProperty("text").GetString());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, tooLong.StatusCode);
        Assert.Empty(Query("SELECT Id FROM EnrollmentNotes"));
    }

    [Fact]
    public async Task Another_organization_cannot_read_or_note_an_application_and_site_leads_cannot_open_one()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).GetAsync($"/applications/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/applications/{id}/notes", new { text = "Hello" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).GetAsync($"/applications/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/applications/{Guid.NewGuid()}")).StatusCode);
    }

    [Fact]
    public async Task Placing_moves_the_application_to_the_chosen_cohort_enrolls_the_young_person_texts_the_family_and_is_audited()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());
        var before = (await Program(Sports)).GetProperty("enrolled").GetInt32();

        var placed = await Place(id, Sports, "Welcome! Saturdays at 10 am.");
        await RunJob();

        Assert.Equal(HttpStatusCode.NoContent, placed.StatusCode);
        Assert.Equal(before + 1, (await Program(Sports)).GetProperty("enrolled").GetInt32());
        var app = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications/{id}");
        Assert.Equal("Accepted", app.GetProperty("status").GetString());
        Assert.Equal("Saturday Sports", app.GetProperty("program").GetString());
        Assert.Equal("Tom Nguyen", app.GetProperty("reviewedBy").GetString());
        Assert.Contains(Sms.Sent, m => m.To == "905-555-0320" && m.Text.Contains("Zoe is enrolled in Saturday Sports. Welcome! Saturdays at 10 am.", StringComparison.Ordinal));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'EnrollmentRequest' AND Summary = 'Zoe Campbell · Saturday Sports · placed'"));
        Assert.Equal(HttpStatusCode.Conflict, (await Place(id, Sports, null)).StatusCode);
    }

    [Fact]
    public async Task Placing_a_waitlisted_application_elsewhere_moves_the_rest_of_its_waitlist_up()
    {
        await ApplyAsYouth("905-555-0311");
        await Refer("rachel.ellis@bennetto.example.ca");
        var waiting = (await List("WaitingReview")).GetProperty("applications").EnumerateArray().ToList();
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[1])}/review", new { decision = "Waitlist" });
        await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{Id(waiting[0])}/review", new { decision = "Waitlist" });

        Assert.Equal(HttpStatusCode.NoContent, (await Place(Id(waiting[1]), Sports, null)).StatusCode);

        var left = (await List("Waitlisted")).GetProperty("applications").EnumerateArray().Single();
        Assert.Equal("Zoe Campbell", left.GetProperty("child").GetString());
        Assert.Equal(1, left.GetProperty("position").GetInt32());
    }

    [Fact]
    public async Task A_full_cohort_or_one_that_is_archived_missing_or_another_organizations_is_refused()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());
        var enrolled = (await Program(Sports)).GetProperty("enrolled").GetInt32();
        await _factory.ClientFor(Tom).PutAsJsonAsync($"/programs/{Sports}", new { name = "Saturday Sports", startsOn = "2026-09-12", endsOn = "2027-05-29", schedule = "Sat, 10 am–12 pm", capacity = enrolled, ages = "7–14", enrollmentOpen = true, seasonConsent = true });

        var full = await Place(id, Sports, null);
        var archived = await Place(id, SummerCamp, null);
        var foreign = await Place(id, KidsClub, null);
        var none = await _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/place", new { note = "Hi" });

        Assert.Equal($"Saturday Sports is full ({enrolled} of {enrolled}). Waitlist instead.", (await Errors(full)).GetProperty("decision").GetString());
        Assert.Equal("Choose a cohort.", (await Errors(archived)).GetProperty("programId").GetString());
        Assert.Equal("Choose a cohort.", (await Errors(foreign)).GetProperty("programId").GetString());
        Assert.Equal("Choose a cohort.", (await Errors(none)).GetProperty("programId").GetString());
        Assert.Equal("WaitingReview", (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications/{id}")).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Another_organization_cannot_place_an_application_and_site_leads_cannot_place_one()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/applications/{id}/place", new { programId = KidsClub })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _factory.ClientFor(Jaylen).PostAsJsonAsync($"/applications/{id}/place", new { programId = Sports })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Place(Guid.NewGuid(), Sports, null)).StatusCode);
    }

    [Fact]
    public async Task A_declined_application_says_who_decided_and_what_the_family_read_takes_no_decision_but_still_takes_notes()
    {
        await Refer("rachel.ellis@bennetto.example.ca");
        var id = Id((await List("WaitingReview")).GetProperty("applications").EnumerateArray().Single());
        await _factory.ClientFor(Marisol).PostAsJsonAsync($"/enrollments/{id}/review", new { decision = "Decline", note = "Tutoring is full this term." });

        var app = await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications/{id}");

        Assert.Equal("Declined", app.GetProperty("status").GetString());
        Assert.Equal("Marisol Delgado", app.GetProperty("reviewedBy").GetString());
        Assert.Equal("Tutoring is full this term.", app.GetProperty("note").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await Place(id, Sports, null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/enrollments/{id}/review", new { decision = "Waitlist" })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/notes", new { text = "Tanya called back; try again in January." })).StatusCode);
    }

    private Task<HttpResponseMessage> Place(Guid id, Guid programId, string? note) =>
        _factory.ClientFor(Tom).PostAsJsonAsync($"/applications/{id}/place", new { programId, note });

    private async Task<JsonElement> Program(Guid id) => await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/programs/{id}");

    private async Task<JsonElement> List(string status) =>
        await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>($"/applications?status={status}");

    private static Guid Id(JsonElement row) => row.GetProperty("id").GetGuid();

    private async Task<string> Open()
    {
        var response = await _factory.ClientFor(Marisol).PostAsync($"/programs/{WinterCamp}/enrollment/open", null);
        var url = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        return url[(url.LastIndexOf('/') + 1)..];
    }

    /// <summary>Malik Johnson, 14, applies for himself; his mother Denise is the household.</summary>
    private Task ApplyAsYouth(string contact) => Submit(contact, new
    {
        applyingAs = "Youth",
        reason = "I want to learn to code and help with the younger kids.",
        household = new { guardianName = "Denise Johnson", mobile = "905-555-0310", email = "", language = "English" },
        children = new[] { new { id = (Guid?)null, firstName = "Malik", lastName = "Johnson", dateOfBirth = "2012-04-18", school = "", allergies = "", medication = "", enroll = true } },
    });

    /// <summary>Rachel Ellis refers Zoe Campbell, 13; Tanya Campbell is the household.</summary>
    private Task Refer(string contact) => Submit(contact, new
    {
        applyingAs = "Referrer",
        referrer = new { name = "Rachel Ellis", role = "Guidance counsellor", organization = "Bennetto Elementary" },
        reason = "Zoe is curious and kind.",
        household = new { guardianName = "Tanya Campbell", mobile = "905-555-0320", email = "", language = "English" },
        children = new[] { new { id = (Guid?)null, firstName = "Zoe", lastName = "Campbell", dateOfBirth = "2013-01-20", school = "", allergies = "", medication = "", enroll = true } },
    });

    private async Task Submit(string contact, object draft)
    {
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var slug = await Open();
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync($"/g/enroll/{slug}/code", new { contact });
        await client.PostAsJsonAsync($"/g/enroll/{slug}/verify", new { contact, code = LastCode() });
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/g/enroll/{slug}/draft", draft)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/g/enroll/{slug}/submit", new { consent = true })).StatusCode);
    }

    private string LastCode() => CodePattern().Match(Sms.Sent.Select(s => s.Text).Concat(_factory.Services.GetRequiredService<FakeEmailSender>().Bodies.Select(b => b.Body))
        .Last(t => t.Contains("code is", StringComparison.Ordinal))).Value;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    private Task RunJob() => _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();

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
