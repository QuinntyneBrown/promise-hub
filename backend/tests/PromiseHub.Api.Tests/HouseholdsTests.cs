using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-011 household and child records, L2-001 tenant isolation, L2-007 roles, L2-032 audit, L2-005 module off.
public sealed class HouseholdsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Aisha = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "aisha@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Rivera = DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, "Rivera");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Luis = DatabaseSeeder.GuardianId(DatabaseSeeder.Harbourview, "Luis Rivera");
    private static readonly Guid NorthgateGuardian = DatabaseSeeder.GuardianId(DatabaseSeeder.Northgate, "Ana Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task Families_lists_the_organizations_households_with_guardian_and_children()
    {
        var list = await Get(Tom, "/households");

        var rivera = Households(list).Single(h => h.GetProperty("name").GetString() == "Rivera");
        Assert.Equal("Carmen Rivera", rivera.GetProperty("primaryGuardian").GetString());
        Assert.Equal(["Mateo (9)", "Sofía (12)"], rivera.GetProperty("children").EnumerateArray().Select(c => c.GetString()));
        Assert.Equal("Spanish", rivera.GetProperty("language").GetString());
        Assert.Equal(2, rivera.GetProperty("medicalFlags").GetInt32());
        Assert.DoesNotContain(Households(list), h => h.GetProperty("primaryGuardian").GetString() == "Ana Rivera");
    }

    [Theory]
    [InlineData("mateo", "Rivera")]
    [InlineData("0142", "Rivera")]
    [InlineData("dana", "Thompson")]
    public async Task Search_matches_children_guardians_and_phone_numbers(string q, string household)
    {
        var list = await Get(Tom, $"/households?q={q}");

        Assert.Equal([household], Households(list).Select(h => h.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task The_missing_info_filter_lists_households_no_one_can_reach()
    {
        var list = await Get(Tom, "/households?filter=missing-info");

        Assert.Equal(["Okonkwo"], Households(list).Select(h => h.GetProperty("name").GetString()));
        Assert.Equal(1, list.GetProperty("counts").GetProperty("missingInfo").GetInt32());
        Assert.True(list.GetProperty("counts").GetProperty("all").GetInt32() >= 5);
    }

    [Fact]
    public async Task Adding_a_family_creates_the_household_with_its_first_guardian_and_audits_it()
    {
        var response = await Send(Tom, HttpMethod.Post, "/households", new { guardianName = "Farah Siddiqui", mobile = "905-555-0170", email = "", language = "English" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var household = await Get(Tom, $"/households/{id}");
        Assert.Equal("Siddiqui", household.GetProperty("name").GetString());
        Assert.Equal("Farah Siddiqui", household.GetProperty("guardians")[0].GetProperty("name").GetString());
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE Action = 'Created' AND RecordType = 'Household' AND RecordId = '{id.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task A_family_needs_a_guardian_name_and_a_way_to_reach_them()
    {
        var response = await Send(Tom, HttpMethod.Post, "/households", new { guardianName = "", mobile = "", email = "", language = "English" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter the guardian’s name.", errors.GetProperty("guardianName").GetString());
        Assert.Equal("Enter a mobile number or an email.", errors.GetProperty("mobile").GetString());
    }

    [Fact]
    public async Task A_child_added_to_a_household_appears_with_age_and_school()
    {
        var response = await Send(Tom, HttpMethod.Post, $"/households/{Rivera}/children", new { name = "Lucía Rivera", dateOfBirth = "2020-01-18", school = "Bennetto Elementary, Kindergarten", allergies = "" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var child = await Get(Tom, $"/children/{id}");
        Assert.Equal("Lucía Rivera", child.GetProperty("name").GetString());
        Assert.Equal(6, child.GetProperty("age").GetInt32());
        Assert.Equal("Bennetto Elementary, Kindergarten", child.GetProperty("school").GetString());
        Assert.Equal("Rivera", child.GetProperty("householdName").GetString());
    }

    [Fact]
    public async Task Editing_medical_details_is_audited_with_the_editor_and_shown_on_the_next_read()
    {
        var response = await Send(Tom, HttpMethod.Put, $"/children/{Mateo}/medical", new
        {
            allergies = "Peanuts (anaphylaxis); tree nuts (hives); sesame",
            medication = "EpiPen 0.3 mg, carried in backpack",
            conditions = "None",
            doctor = "Dr. Amrita Sethi · 905-555-0100",
            redAlert = true,
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var medical = (await Get(Jaylen, $"/children/{Mateo}")).GetProperty("medical");
        Assert.Equal("Peanuts (anaphylaxis); tree nuts (hives); sesame", medical.GetProperty("allergies").GetString());
        Assert.Equal("Tom Nguyen", medical.GetProperty("updatedBy").GetString());
        var audit = Query("SELECT ActorName, BeforeJson, AfterJson FROM AuditEntries WHERE Action = 'Updated' AND RecordType = 'ChildMedical'").Single();
        Assert.StartsWith("Tom Nguyen|", audit);
        Assert.DoesNotContain("sesame", audit.Split('|')[1]);
        Assert.Contains("sesame", audit.Split('|')[2]);
    }

    [Fact]
    public async Task Reading_a_childs_medical_details_is_audited()
    {
        await Get(Jaylen, $"/children/{Mateo}");

        Assert.Contains("Jaylen Okafor", Query($"SELECT ActorName FROM AuditEntries WHERE Action = 'Viewed' AND RecordId = '{Mateo.ToString().ToUpperInvariant()}'"));
    }

    [Theory]
    [InlineData("priya")]
    [InlineData("aisha")]
    public async Task Roles_without_medical_access_get_the_child_without_medical_fields(string who)
    {
        var child = await Get(who == "priya" ? PriyaAtHarbourview : Aisha, $"/children/{Mateo}");

        Assert.Equal(JsonValueKind.Null, child.GetProperty("medical").ValueKind);
        Assert.True(child.GetProperty("medicalRestricted").GetBoolean());
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE Action = 'Viewed' AND RecordId = '{Mateo.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task Editing_a_guardian_changes_their_contact_and_pickup_permission()
    {
        var response = await Send(Tom, HttpMethod.Put, $"/guardians/{Luis}", new { name = "Luis Rivera", relationship = "Uncle or aunt", mobile = "905-555-0111", canPickUp = false, canSign = true });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var luis = Guardians(await Get(Tom, $"/households/{Rivera}")).Single(g => g.GetProperty("name").GetString() == "Luis Rivera");
        Assert.Equal("905-555-0111", luis.GetProperty("mobile").GetString());
        Assert.False(luis.GetProperty("canPickUp").GetBoolean());
        Assert.True(luis.GetProperty("canSign").GetBoolean());
    }

    [Fact]
    public async Task Another_organizations_guardian_and_household_answer_404()
    {
        var edit = await Send(Tom, HttpMethod.Put, $"/guardians/{NorthgateGuardian}", new { name = "X", relationship = "Other", mobile = "1", canPickUp = true, canSign = true });
        var read = await _factory.ClientFor(Grace).GetAsync($"/households/{Rivera}");

        Assert.Equal(HttpStatusCode.NotFound, edit.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, read.StatusCode);
    }

    [Fact]
    public async Task A_site_lead_reads_households_but_cannot_add_or_delete_them()
    {
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Jaylen).GetAsync("/households")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Jaylen, HttpMethod.Post, "/households", new { guardianName = "A B", mobile = "1", email = "", language = "English" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(Jaylen, HttpMethod.Delete, $"/households/{Rivera}", new { reason = "Duplicate", confirmName = "Rivera" })).StatusCode);
    }

    [Fact]
    public async Task Deleting_a_household_needs_its_name_typed()
    {
        var response = await Send(Tom, HttpMethod.Delete, $"/households/{Rivera}", new { reason = "Duplicate", confirmName = "Rivra" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(Tom).GetAsync($"/households/{Rivera}")).StatusCode);
    }

    [Fact]
    public async Task A_deleted_household_and_its_children_leave_every_list_and_the_deletion_is_audited()
    {
        var response = await Send(Tom, HttpMethod.Delete, $"/households/{Rivera}", new { reason = "Guardian asked", confirmName = "Rivera" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.DoesNotContain(Households(await Get(Tom, "/households")), h => h.GetProperty("name").GetString() == "Rivera");
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/children/{Mateo}")).StatusCode);
        Assert.Single(Query($"SELECT Id FROM AuditEntries WHERE Action = 'Deleted' AND RecordId = '{Rivera.ToString().ToUpperInvariant()}'"));
        // Soft-deleted: the rows stay until the purge.
        Assert.Single(Query($"SELECT Id FROM Households WHERE Id = '{Rivera.ToString().ToUpperInvariant()}' AND DeletedAt IS NOT NULL AND PurgeAfter IS NOT NULL"));
    }

    [Fact]
    public async Task With_Roster_off_household_endpoints_answer_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync("/households")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _factory.ClientFor(Tom).GetAsync($"/households/{Rivera}")).StatusCode);
    }

    private async Task<JsonElement> Get(Guid membership, string path) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

    private Task<HttpResponseMessage> Send(Guid membership, HttpMethod method, string path, object body) =>
        _factory.ClientFor(membership).SendAsync(new HttpRequestMessage(method, path) { Content = JsonContent.Create(body) });

    private static IEnumerable<JsonElement> Households(JsonElement list) => list.GetProperty("households").EnumerateArray();

    private static IEnumerable<JsonElement> Guardians(JsonElement household) => household.GetProperty("guardians").EnumerateArray();

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
