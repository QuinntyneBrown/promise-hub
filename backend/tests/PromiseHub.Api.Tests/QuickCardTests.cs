using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-019 Quick Card content and access, L2-007 roles, L2-032 audit, L2-001 tenant isolation, L2-005 module off.
public sealed class QuickCardTests : IAsyncLifetime
{
    private static readonly Guid Jaylen = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "jaylen@harbourview.example");
    private static readonly Guid PriyaAtHarbourview = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "priya@harbourview.example");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Jordan = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Jordan Thompson");

    private readonly PromiseHubApiFactory _factory = new();

    [Fact]
    public async Task The_severe_allergy_alert_comes_first_with_medical_facts_and_who_to_call()
    {
        var card = await Get(Jaylen, $"/children/{Mateo}/quick-card");

        Assert.Equal("Mateo Rivera", card.GetProperty("name").GetString());
        Assert.Equal(["After-School Tutoring"], card.GetProperty("programs").EnumerateArray().Select(p => p.GetString()));
        var alert = card.GetProperty("allergyAlert");
        Assert.Equal("Severe allergy: Peanuts (anaphylaxis); tree nuts (hives)", alert.GetProperty("title").GetString());
        Assert.Equal("EpiPen in backpack front pocket. Use it, call 911, then Carmen.", alert.GetProperty("instruction").GetString());
        var medical = card.GetProperty("medical");
        Assert.Equal("EpiPen 0.3 mg, carried", medical.GetProperty("medication").GetString());
        Assert.Equal("Ontario ···· 4471", medical.GetProperty("healthCard").GetString());
        var calls = card.GetProperty("callOrder").EnumerateArray().ToList();
        Assert.Equal("Carmen Rivera", calls[0].GetProperty("name").GetString());
        Assert.Equal("905-555-0142", calls[0].GetProperty("phone").GetString());
        Assert.Equal("Luis Rivera", calls[1].GetProperty("name").GetString());
        Assert.Contains("Luis Rivera", card.GetProperty("approvedPickups").EnumerateArray().Select(p => p.GetProperty("name").GetString()));
        Assert.Equal("Sits with Jordan.", card.GetProperty("notes").GetString());
        Assert.False(card.GetProperty("medicalRestricted").GetBoolean());
    }

    [Fact]
    public async Task Every_open_is_audited_with_who_opened_which_card()
    {
        await Get(Jaylen, $"/children/{Mateo}/quick-card");
        await Get(PriyaAtHarbourview, $"/children/{Mateo}/quick-card");

        var rows = Query($"SELECT ActorName FROM AuditEntries WHERE Action = 'Viewed' AND RecordType = 'QuickCard' AND RecordId = '{Mateo.ToString().ToUpperInvariant()}' ORDER BY ActorName");
        Assert.Equal(["Jaylen Okafor", "Priya Raman"], rows);
    }

    [Fact]
    public async Task A_volunteer_coordinator_gets_no_medical_fields_but_still_who_to_call()
    {
        var card = await Get(PriyaAtHarbourview, $"/children/{Mateo}/quick-card");

        Assert.True(card.GetProperty("medicalRestricted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, card.GetProperty("medical").ValueKind);
        Assert.Equal(JsonValueKind.Null, card.GetProperty("allergyAlert").ValueKind);
        Assert.Equal("905-555-0142", card.GetProperty("callOrder")[0].GetProperty("phone").GetString());
        var raw = await _factory.ClientFor(PriyaAtHarbourview).GetStringAsync($"/children/{Mateo}/quick-card");
        Assert.DoesNotContain("Peanut", raw);
        Assert.DoesNotContain("4471", raw);
    }

    [Fact]
    public async Task A_child_with_no_medical_information_has_no_medical_section()
    {
        var card = await Get(Jaylen, $"/children/{Jordan}/quick-card");

        Assert.Equal(JsonValueKind.Null, card.GetProperty("medical").ValueKind);
        Assert.False(card.GetProperty("medicalRestricted").GetBoolean());
        Assert.Equal("Dana Thompson", card.GetProperty("primaryGuardian").GetString());
    }

    [Fact]
    public async Task Another_organizations_child_is_not_found()
    {
        var response = await _factory.ClientFor(Grace).GetAsync($"/children/{Mateo}/quick-card");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task With_Quick_Cards_off_the_card_answers_404()
    {
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "RollCall" } });

        var response = await _factory.ClientFor(Jaylen).GetAsync($"/children/{Mateo}/quick-card");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<JsonElement> Get(Guid membership, string path) =>
        await _factory.ClientFor(membership).GetFromJsonAsync<JsonElement>(path);

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
