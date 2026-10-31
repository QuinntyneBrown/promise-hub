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

// L2-152, L2-159: withdrawing Learning Bond consent for a child cancels what wasn't sent, destroys the child's SIN and answers (and the
// guardian's when no other child still has consent), stops every reminder and follow-up, keeps what was sent without a SIN, and is audited;
// consenting again starts the intake from the beginning.
public sealed class LearningBondWithdrawTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");
    private static readonly Guid Sofia = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Sofía Rivera");

    private readonly PromiseHubApiFactory _factory = new();
    private LearningBondGuardianClient _carmen = null!;

    // L2-152 criteria 1, 2 and 4.
    [Fact]
    public async Task Withdrawing_before_Submit_destroys_everything_about_Mateo_and_consenting_again_starts_over()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "Yes" });
        await _carmen.Http.GetAsync(_carmen.Path($"/children/{Mateo}/estimate"));
        await _carmen.Http.PostAsync(_carmen.Path($"/children/{Mateo}/applications"), null);
        var consent = await ConsentId("Mateo");
        Assert.Equal("Northfield Credit Union", consent.GetProperty("provider").GetString());

        var withdrawn = await _carmen.Http.DeleteAsync(_carmen.Path($"/consents/{consent.GetProperty("id").GetString()}"));

        Assert.Equal(HttpStatusCode.NoContent, withdrawn.StatusCode);
        Assert.Equal("|", Scalar("SELECT COALESCE(ChildSinCiphertext, '') || '|' || COALESCE(PausedReason, '') FROM LearningBondClaims"));
        Assert.Equal("|", Scalar("SELECT COALESCE(GuardianSinCiphertext, '') || '|' || COALESCE(TaxFiled, '') FROM LearningBondIntakes"));
        Assert.Equal("Cancelled", Scalar("SELECT Status FROM LearningBondApplications"));
        Assert.Equal("Guardian|Learning Bond consent withdrawn for Mateo",
            Scalar("SELECT ActorName || '|' || Summary FROM AuditEntries WHERE Action = 'Withdrawn' AND RecordType = 'LearningBondConsent'"));
        Assert.Empty((await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"))).GetProperty("consents").EnumerateArray());
        Assert.Equal(HttpStatusCode.Forbidden, (await _carmen.Http.GetAsync(_carmen.Path($"/children/{Mateo}/intake"))).StatusCode);

        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        var intake = await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Mateo}/intake"));
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("guardianSin").ValueKind);
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("childSin").ValueKind);
        Assert.Equal(JsonValueKind.Null, intake.GetProperty("taxFiled").ValueKind);
    }

    // L2-152 criterion 2: the guardian's SIN stays while another child still has consent.
    [Fact]
    public async Task Withdrawing_for_Mateo_keeps_Carmens_SIN_while_Sofia_still_has_consent()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { childIds = new[] { Mateo, Sofia }, typedName = "Carmen Rivera" });
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "Yes" });

        await _carmen.Http.DeleteAsync(_carmen.Path($"/consents/{(await ConsentId("Mateo")).GetProperty("id").GetString()}"));

        Assert.StartsWith("v1.", Scalar("SELECT GuardianSinCiphertext FROM LearningBondIntakes"), StringComparison.Ordinal);
        Assert.Equal("Yes", Scalar("SELECT TaxFiled FROM LearningBondIntakes"));
        Assert.Equal("212", (await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path($"/children/{Sofia}/intake"))).GetProperty("guardianSin").GetString());
    }

    // L2-152 criteria 2 and 3: what was sent keeps its status, provider and dates without a SIN; the provider's later news is applied but not texted.
    [Fact]
    public async Task A_submitted_application_keeps_its_status_and_dates_and_nothing_more_is_texted()
    {
        await _carmen.SubmitAsync(Mateo, "Carmen Rivera", "276 543 212", "345 123 459");
        await _carmen.Http.PutAsJsonAsync(_carmen.Path($"/children/{Mateo}/reminder"), new { remind = true });

        await _carmen.Http.DeleteAsync(_carmen.Path($"/consents/{(await ConsentId("Mateo")).GetProperty("id").GetString()}"));
        await Webhook(new { eventId = "evt-after", reference = "NCU-0001", kind = "Received" });
        await _factory.Services.GetRequiredService<MessageDispatchRunner>().RunOnceAsync();

        Assert.Equal("Received|Northfield Credit Union|1", Scalar("SELECT Status || '|' || Provider || '|' || (SubmittedAt IS NOT NULL) FROM LearningBondApplications"));
        Assert.Equal("", Scalar("SELECT COALESCE(ChildSinCiphertext, '') FROM LearningBondClaims"));
        Assert.DoesNotContain(_factory.Services.GetRequiredService<FakeSmsSender>().Sent, s => s.Text.Contains("recibió", StringComparison.Ordinal));
    }

    // L2-152, L2-162: another household's consent is unknown; an unknown id is 404 and changes nothing.
    [Fact]
    public async Task Another_households_link_cannot_withdraw_the_consent()
    {
        await _carmen.Http.PostAsJsonAsync(_carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        var id = (await ConsentId("Mateo")).GetProperty("id").GetString();
        var linh = await new LearningBondGuardianClient(_factory).OpenAsync("Tran", "905-555-0163");

        Assert.Equal(HttpStatusCode.NotFound, (await linh.Http.DeleteAsync(linh.Path($"/consents/{id}"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _carmen.Http.DeleteAsync(_carmen.Path($"/consents/{Guid.NewGuid()}"))).StatusCode);
        Assert.Single((await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"))).GetProperty("consents").EnumerateArray());
    }

    private async Task<JsonElement> ConsentId(string firstName) =>
        (await _carmen.Http.GetFromJsonAsync<JsonElement>(_carmen.Path("/page"))).GetProperty("consents").EnumerateArray()
            .Single(c => c.GetProperty("firstName").GetString() == firstName);

    private async Task Webhook(object payload)
    {
        var body = JsonSerializer.Serialize(payload);
        var signature = Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(ApiFactoryBase.NorthfieldWebhookSecret), Encoding.UTF8.GetBytes(body)));
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        content.Headers.Add("X-PromiseHub-Signature", $"sha256={signature}");
        Assert.Equal(HttpStatusCode.OK, (await _factory.CreateClient().PostAsync("/learning-bond/webhooks/providers/northfield", content)).StatusCode);
    }

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public async Task InitializeAsync() => _carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
