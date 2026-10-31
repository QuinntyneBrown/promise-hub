using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Infrastructure.Messaging;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-150 criteria 2 to 5: the provider reports progress through a signed webhook; each event is applied once, moves the application and
// texts the guardian in the household's language; an unsigned event, an unknown application or another provider's changes nothing.
public sealed class LearningBondWebhookTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    private FakeSmsSender Sms => _factory.Services.GetRequiredService<FakeSmsSender>();

    // L2-150 criteria 2 and 4.
    [Fact]
    public async Task Received_moves_the_application_and_texts_Carmen_once_in_Spanish()
    {
        var anonymous = _factory.CreateClient();

        var first = await Post(anonymous, "northfield", new { eventId = "evt-1", reference = "NCU-0001", kind = "Received" });
        var again = await Post(anonymous, "northfield", new { eventId = "evt-1", reference = "NCU-0001", kind = "Received" });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        // Once to each guardian with a mobile number, as the invitation was.
        var received = Sms.Sent.Where(s => s.Text.Contains("recibió", StringComparison.Ordinal)).ToList();
        Assert.Equal(["905-555-0142", "905-555-0199"], received.Select(s => s.To).Order(StringComparer.Ordinal));
        Assert.All(received, s => Assert.Equal("Northfield Credit Union recibió la solicitud de Mateo.", s.Text));
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.Equal("Received", progress.GetProperty("status").GetString());
        Assert.Equal(1, progress.GetProperty("stepsDone").GetInt32());
    }

    // L2-150 criteria 2 and 5.
    [Fact]
    public async Task Deposited_records_the_amount_texts_it_and_staff_see_Deposited()
    {
        var response = await Post(_factory.CreateClient(), "northfield", new { eventId = "evt-2", reference = "NCU-0001", kind = "Deposited", amount = 1400 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.Contains(Sms.Sent, s => s.Text == "Se depositaron $1,400 en el RESP de Mateo.");
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.Equal(1400, progress.GetProperty("depositAmount").GetInt32());
        Assert.Equal(3, progress.GetProperty("stepsDone").GetInt32());
        var rivera = (await _factory.ClientFor(Tom).GetFromJsonAsync<JsonElement>("/learning-bond/households")).GetProperty("households").EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Rivera");
        Assert.Equal("Deposited", rivera.GetProperty("status").GetString());
    }

    // L2-150 criteria 2 and 6: a document request names the document and links to where it is sent from.
    [Fact]
    public async Task A_document_request_texts_its_name_with_the_link_and_shows_on_the_progress()
    {
        await Post(_factory.CreateClient(), "northfield", new { eventId = "evt-3", reference = "NCU-0001", kind = "DocumentNeeded", documentName = "un comprobante de domicilio" });

        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();
        Assert.Contains(Sms.Sent, s => s.Text.StartsWith("Northfield Credit Union necesita un comprobante de domicilio para Mateo. Toque para enviarlo: ", StringComparison.Ordinal)
            && s.Text.Contains("/submitted", StringComparison.Ordinal));
        var progress = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/progress"));
        Assert.Equal("un comprobante de domicilio", progress.GetProperty("document").GetProperty("name").GetString());
    }

    // L2-150 criterion 3, L2-162.
    [Fact]
    public async Task An_unsigned_event_an_unknown_application_another_providers_or_the_module_off_changes_nothing()
    {
        var anonymous = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { eventId = "evt-4", reference = "NCU-0001", kind = "Received" });
        using var unsigned = new StringContent(body, Encoding.UTF8, "application/json");
        unsigned.Headers.Add("X-PromiseHub-Signature", "sha256=00");

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync("/learning-bond/webhooks/providers/northfield", unsigned)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(anonymous, "northfield", new { eventId = "evt-5", reference = "NCU-9999", kind = "Received" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Post(anonymous, "maple-trust", new { eventId = "evt-6", reference = "NCU-0001", kind = "Received" }, "maple-test-secret")).StatusCode);
        await _factory.ClientFor(Tom).PutAsJsonAsync("/settings/modules", new { on = new[] { "Roster", "Messages" } });
        Assert.Equal(HttpStatusCode.NotFound, (await Post(anonymous, "northfield", new { eventId = "evt-7", reference = "NCU-0001", kind = "Received" })).StatusCode);
        Assert.Equal("Submitted", Scalar("SELECT Status FROM LearningBondApplications"));
    }

    private static async Task<HttpResponseMessage> Post(HttpClient client, string provider, object payload, string secret = ApiFactoryBase.NorthfieldWebhookSecret)
    {
        var body = JsonSerializer.Serialize(payload);
        var signature = Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body)));
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        content.Headers.Add("X-PromiseHub-Signature", $"sha256={signature}");
        return await client.PostAsync($"/learning-bond/webhooks/providers/{provider}", content);
    }

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public async Task InitializeAsync()
    {
        _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
