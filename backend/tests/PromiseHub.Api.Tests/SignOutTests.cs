using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-017 criterion 3 sign-out, L2-020 approved pickups, L2-001 tenant isolation, L2-007 roles, L2-032 audit, L2-005 Pickup off.
public sealed class SignOutTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid TonightId = DatabaseSeeder.EventId(DatabaseSeeder.Harbourview, "Tutoring night");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid NorthgateMateo = DatabaseSeeder.ChildId(DatabaseSeeder.Northgate, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Sign_out_lists_the_childs_approved_adults_primary_first()
    {
        var pickups = await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/children/{Mateo}/pickups");

        Assert.Equal("Mateo Rivera", pickups.GetProperty("childName").GetString());
        Assert.Equal("Carmen Rivera", pickups.GetProperty("primaryName").GetString());
        Assert.Equal("905-555-0142", pickups.GetProperty("primaryPhone").GetString());
        var approved = pickups.GetProperty("approved").EnumerateArray().ToList();
        Assert.Equal(["Carmen Rivera", "Luis Rivera"], approved.Select(a => a.GetProperty("name").GetString()));
        Assert.True(approved[0].GetProperty("isPrimary").GetBoolean());
    }

    [Fact]
    public async Task Signing_out_to_an_approved_adult_records_who_and_when_once_and_audits_it()
    {
        await CheckIn(Mateo);
        var carmen = await GuardianId("Carmen Rivera");
        var action = Guid.NewGuid();
        var body = new { childId = Mateo, guardianId = carmen, otherName = (string?)null, guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = action };

        var first = await Send(Jaylen, body);
        var again = await Send(Jaylen, body);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        var mateo = Row(await Roster(), "Mateo Rivera");
        Assert.Equal("SignedOut", mateo.GetProperty("status").GetString());
        Assert.Equal("Carmen Rivera", mateo.GetProperty("collectedBy").GetString());
        Assert.Equal("2026-11-05T21:12:00+00:00", mateo.GetProperty("signedOutAt").GetString());
        Assert.Single(Query("SELECT Id FROM AttendanceEvents WHERE Kind = 'SignedOut'"));
        Assert.Single(Query("SELECT Id FROM AuditEntries WHERE RecordType = 'Attendance' AND Summary LIKE '%SignedOut%'"));
    }

    [Fact]
    public async Task Someone_else_is_recorded_only_with_their_name_and_the_guardians_okay_by_phone()
    {
        await CheckIn(Mateo);

        var missing = await Send(Jaylen, new { childId = Mateo, guardianId = (Guid?)null, otherName = "", guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid(), someoneElse = true });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);
        var errors = await Errors(missing);
        Assert.Equal("Enter their name.", errors.GetProperty("otherName").GetString());
        Assert.Equal("Carmen Rivera needs to okay this by phone first.", errors.GetProperty("guardianConfirmed").GetString());

        var ok = await Send(Jaylen, new { childId = Mateo, guardianId = (Guid?)null, otherName = "Daniel Rivera", guardianConfirmed = true, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid(), someoneElse = true });

        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        Assert.Equal("Daniel Rivera", Row(await Roster(), "Mateo Rivera").GetProperty("collectedBy").GetString());
        Assert.Single(Query("SELECT Id FROM AttendanceRecords WHERE ConfirmedByPhone = 1"));
    }

    [Fact]
    public async Task Sign_out_needs_a_choice_photo_id_and_a_checked_in_child()
    {
        var notIn = await Send(Jaylen, new { childId = Mateo, guardianId = await GuardianId("Carmen Rivera"), otherName = (string?)null, guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid() });
        Assert.Equal("Mateo Rivera is not checked in.", (await Errors(notIn)).GetProperty("childId").GetString());

        await CheckIn(Mateo);
        var none = await Send(Jaylen, new { childId = Mateo, guardianId = (Guid?)null, otherName = (string?)null, guardianConfirmed = false, idChecked = false, leftAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, none.StatusCode);
        var errors = await Errors(none);
        Assert.Equal("Choose who is taking Mateo home.", errors.GetProperty("who").GetString());
        Assert.Equal("Check photo ID, or confirm you know this person.", errors.GetProperty("idChecked").GetString());
    }

    [Fact]
    public async Task An_adult_not_on_the_childs_approved_list_is_refused_with_guidance()
    {
        await CheckIn(Mateo);
        var dana = await GuardianId("Dana Thompson");

        var refused = await Send(Jaylen, new { childId = Mateo, guardianId = dana, otherName = (string?)null, guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal("Not on Mateo’s approved list. Call Carmen Rivera at 905-555-0142 before Mateo leaves.", (await Errors(refused)).GetProperty("who").GetString());
        Assert.Equal("Present", Row(await Roster(), "Mateo Rivera").GetProperty("status").GetString());
    }

    [Fact]
    public async Task Volunteer_coordinators_cannot_sign_children_out()
    {
        await CheckIn(Mateo);

        var response = await Send(PriyaAtHarbourview, new { childId = Mateo, guardianId = await GuardianId("Carmen Rivera"), otherName = (string?)null, guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Another_organizations_child_guardian_and_session_are_never_used()
    {
        await CheckIn(Mateo);
        var ana = await GuardianId("Ana Rivera");

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/children/{NorthgateMateo}/pickups")).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await Send(Jaylen, new { childId = Mateo, guardianId = ana, otherName = (string?)null, guardianConfirmed = false, idChecked = true, leftAt = (string?)null, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Grace).PostAsJsonAsync($"/sessions/{TonightId}/sign-outs", new { childId = Mateo, guardianId = await GuardianId("Carmen Rivera"), idChecked = true, clientActionId = Guid.NewGuid() })).StatusCode);
    }

    [Fact]
    public async Task With_Pickup_off_sign_out_answers_404_while_check_in_still_works()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall", "QuickCards" } });
        await CheckIn(Mateo);

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}/pickups")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Send(Jaylen, new { childId = Mateo, guardianId = await GuardianId("Carmen Rivera"), idChecked = true, clientActionId = Guid.NewGuid() })).StatusCode);
        Assert.Equal("Present", Row(await Roster(), "Mateo Rivera").GetProperty("status").GetString());
    }

    private Task CheckIn(Guid child) =>
        _factory.ClientFor(Jaylen).PostAsJsonAsync($"/sessions/{TonightId}/check-ins", new { childId = child, arrivedAt = (string?)null, clientActionId = Guid.NewGuid() });

    private Task<HttpResponseMessage> Send(Guid membership, object body) =>
        _factory.ClientFor(membership).PostAsJsonAsync($"/sessions/{TonightId}/sign-outs", body);

    private async Task<JsonElement> Roster() =>
        await _factory.ClientFor(Jaylen).GetFromJsonAsync<JsonElement>($"/sessions/{TonightId}/roster");

    private static JsonElement Row(JsonElement roster, string name) =>
        roster.GetProperty("children").EnumerateArray().Single(c => c.GetProperty("name").GetString() == name);

    private Task<Guid> GuardianId(string name) =>
        Task.FromResult(Guid.Parse(Query($"SELECT Id FROM Guardians WHERE Name = '{name}'").Single()));

    private static async Task<JsonElement> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");

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
