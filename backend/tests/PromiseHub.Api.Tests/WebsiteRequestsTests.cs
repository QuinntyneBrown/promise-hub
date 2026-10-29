using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// Acceptance Test
// Traces to: L2-134 criteria 1, 2, 4, 5 and 6, L2-032, L2-031, L2-001, L2-005
// Description: a visitor, with no session, writes to an organization or offers to volunteer through its public address; each request is
// validated on the server, stored for that organization only, audited as the website visitor and limited to five per email and hour; an
// unknown address, a suspended organization and the module off answer 404 and store nothing.
public sealed class WebsiteRequestsTests : IAsyncLifetime
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");
    private static readonly Guid Grace = DatabaseSeeder.MembershipId(DatabaseSeeder.Northgate, "grace@northgate.example");
    private static readonly string[] Suite = ["Roster", "Slips", "RollCall", "QuickCards", "Pickup", "Messages", "Incidents", "Reports"];

    private readonly PromiseHubApiFactory _factory = new();

    private static object Message(string name = "Dana Thompson", string email = "Dana.T@Example.com", string topic = "Programs and enrollment",
        string message = "Is there still room in Saturday Sports for an 11-year-old?") => new { name, email, topic, message };

    private static object Offer(bool screeningAcknowledged = true, string area = "Homework help", string? phone = "905-555-0120") =>
        new { name = "Leo Martins", email = "leo.martins@example.com", phone, area, about = "I tutor maths on weekday afternoons.", screeningAcknowledged };

    [Fact]
    public async Task A_contact_message_is_stored_for_the_organization_audited_as_the_visitor_and_acknowledged()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var sent = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/contact", Message(message: "  <b>Is there room?</b>  "));

        Assert.Equal(HttpStatusCode.NoContent, sent.StatusCode);
        var row = Assert.Single(Query("SELECT OrganizationId || '|' || Name || '|' || Email || '|' || Topic || '|' || Message FROM ContactMessages"));
        Assert.Equal($"{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}|Dana Thompson|dana.t@example.com|Programs and enrollment|<b>Is there room?</b>",
            row, ignoreCase: true);
        var audit = Assert.Single(Query("SELECT ActorName || '|' || Action || '|' || Summary FROM AuditEntries WHERE RecordType = 'ContactMessage'"));
        Assert.Equal("Website visitor|Created|Website message: Programs and enrollment", audit);
    }

    [Fact]
    public async Task An_invalid_message_answers_422_by_field_and_stores_nothing()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);

        var invalid = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/contact", Message(name: " ", email: "dana@", topic: "Lunch", message: ""));
        var tooLong = await _factory.CreateClient().PostAsJsonAsync("/website/harbourview/contact", Message(message: new string('a', 2001)));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your name.", errors.GetProperty("name").GetString());
        Assert.Equal("Enter an email like name@example.com.", errors.GetProperty("email").GetString());
        Assert.Equal("Choose a topic.", errors.GetProperty("topic").GetString());
        Assert.Equal("Write your message.", errors.GetProperty("message").GetString());
        Assert.Equal("Use at most 2,000 characters.", (await tooLong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("message").GetString());
        Assert.Empty(Query("SELECT Id FROM ContactMessages"));
    }

    [Fact]
    public async Task A_volunteer_offer_needs_the_screening_acknowledgement_and_is_stored_with_it()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        var visitor = _factory.CreateClient();

        var refused = await visitor.PostAsJsonAsync("/website/harbourview/volunteer", Offer(screeningAcknowledged: false, area: "Juggling"));
        var offered = await visitor.PostAsJsonAsync("/website/harbourview/volunteer", Offer());

        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        var errors = (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Tick the box to say you understand volunteers are screened.", errors.GetProperty("screeningAcknowledged").GetString());
        Assert.Equal("Choose how you’d like to help.", errors.GetProperty("area").GetString());
        Assert.Equal(HttpStatusCode.NoContent, offered.StatusCode);
        Assert.Equal("Leo Martins|leo.martins@example.com|905-555-0120|Homework help|1", Assert.Single(Query(
            "SELECT Name || '|' || Email || '|' || Phone || '|' || Area || '|' || ScreeningAcknowledged FROM VolunteerInterests")));
        Assert.Equal("Website visitor|Created|Volunteer offer: Homework help", Assert.Single(Query(
            "SELECT ActorName || '|' || Action || '|' || Summary FROM AuditEntries WHERE RecordType = 'VolunteerInterest'")));
    }

    [Fact]
    public async Task A_sixth_request_of_a_kind_from_one_email_within_an_hour_answers_429_and_is_not_stored()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        var visitor = _factory.CreateClient();
        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.NoContent, (await visitor.PostAsJsonAsync("/website/harbourview/contact", Message())).StatusCode);
        }

        var sixth = await visitor.PostAsJsonAsync("/website/harbourview/contact", Message(email: "dana.t@example.com"));
        var offer = await visitor.PostAsJsonAsync("/website/harbourview/volunteer", Offer());

        Assert.Equal((HttpStatusCode)429, sixth.StatusCode);
        Assert.Equal("too-many", (await sixth.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(5, Query("SELECT Id FROM ContactMessages").Count);
        Assert.Equal(HttpStatusCode.NoContent, offer.StatusCode);
        _factory.Clock.Advance(TimeSpan.FromMinutes(61));
        Assert.Equal(HttpStatusCode.NoContent, (await visitor.PostAsJsonAsync("/website/harbourview/contact", Message())).StatusCode);
    }

    [Fact]
    public async Task A_request_sent_to_Northgate_is_stored_for_Northgate_only()
    {
        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        await Modules(Grace, ["Roster", "RollCall", "QuickCards", "PublicWebsite"]);

        Assert.Equal(HttpStatusCode.NoContent, (await _factory.CreateClient().PostAsJsonAsync("/website/northgate/contact", Message())).StatusCode);

        Assert.Equal(DatabaseSeeder.Northgate.ToString(), Assert.Single(Query("SELECT OrganizationId FROM ContactMessages")), ignoreCase: true);
        Assert.Empty(Query($"SELECT Id FROM AuditEntries WHERE RecordType = 'ContactMessage' AND OrganizationId = '{DatabaseSeeder.Harbourview.ToString().ToUpperInvariant()}'"));
    }

    [Fact]
    public async Task With_the_module_off_an_unknown_address_or_a_suspended_organization_requests_answer_404_and_store_nothing()
    {
        var visitor = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.PostAsJsonAsync("/website/harbourview/contact", Message())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.PostAsJsonAsync("/website/harbourview/volunteer", Offer())).StatusCode);

        await Modules(Tom, [.. Suite, "PublicWebsite"]);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.PostAsJsonAsync("/website/nowhere/contact", Message())).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _factory.ClientFor(Tom).PostAsJsonAsync($"/platform/organizations/{DatabaseSeeder.Harbourview}/suspend", new { reason = "Unpaid" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.PostAsJsonAsync("/website/harbourview/contact", Message())).StatusCode);

        Assert.Empty(Query("SELECT Id FROM ContactMessages"));
        Assert.Empty(Query("SELECT Id FROM VolunteerInterests"));
    }

    private async Task Modules(Guid admin, string[] on) =>
        Assert.Equal(HttpStatusCode.OK, (await _factory.ClientFor(admin).PutAsJsonAsync("/settings/modules", new { on })).StatusCode);

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
            rows.Add(reader.GetValue(0).ToString()!);
        }
        return rows;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
