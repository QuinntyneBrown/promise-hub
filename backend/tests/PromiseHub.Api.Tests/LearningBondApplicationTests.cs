using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

// L2-148 a recommended no-fee provider from the platform's list and a pre-filled application, reviewed field by field; edits are for this
// application only and the household record doesn't change.
public sealed class LearningBondApplicationTests : IAsyncLifetime
{
    private static readonly Guid Mateo = DatabaseSeeder.ChildId(DatabaseSeeder.Harbourview, "Mateo Rivera");

    private readonly PromiseHubApiFactory _factory = new();

    // L2-148 criteria 1 and 3.
    [Fact]
    public async Task Preparing_recommends_the_first_no_fee_provider_for_Ontario_and_prefills_every_field()
    {
        var carmen = await Estimated();

        var response = await carmen.Http.PostAsync(carmen.Path($"/children/{Mateo}/applications"), null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var app = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Northfield Credit Union", app.GetProperty("provider").GetString());
        Assert.Equal("No fees, no deposit needed, and it handles the Learning Bond", app.GetProperty("reason").GetString());
        Assert.Equal(["Northfield Credit Union", "Maple Trust RESP"], app.GetProperty("providers").EnumerateArray().Select(p => p.GetString()!));
        Assert.Equal("ON", app.GetProperty("province").GetString());
        Assert.Equal(1, app.GetProperty("reviewVersion").GetInt32());
        var fields = app.GetProperty("fields");
        Assert.Equal("Mateo Rivera", fields.GetProperty("beneficiaryName").GetString());
        Assert.Equal("2017-03-14", fields.GetProperty("dateOfBirth").GetString());
        Assert.Equal("459", fields.GetProperty("childSin").GetString());
        Assert.Equal("Carmen Rivera", fields.GetProperty("caregiverName").GetString());
        Assert.Equal("212", fields.GetProperty("guardianSin").GetString());
        Assert.Equal("905-555-0142", fields.GetProperty("phone").GetString());
        Assert.Equal("carmen.rivera@example.com", fields.GetProperty("email").GetString());
        Assert.Equal("Spanish", fields.GetProperty("language").GetString());
        Assert.Equal(JsonValueKind.Null, fields.GetProperty("address").ValueKind);
        Assert.DoesNotContain("345123459", app.ToString(), StringComparison.Ordinal);

        var again = await carmen.Http.PostAsync(carmen.Path($"/children/{Mateo}/applications"), null);
        Assert.Equal(app.GetProperty("id").GetString(), (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());
    }

    // L2-148 criterion 4.
    [Fact]
    public async Task An_edited_phone_or_address_is_validated_and_used_for_this_application_only()
    {
        var carmen = await Estimated();
        var id = await Prepare(carmen);

        var bad = await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/phone"), new { value = "555-0142" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);
        Assert.Equal("Enter a 10-digit mobile number.", (await bad.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("value").GetString());

        var phone = await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/phone"), new { value = "905 555 0177" });
        Assert.Equal(HttpStatusCode.OK, phone.StatusCode);
        var app = await phone.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("905-555-0177", app.GetProperty("fields").GetProperty("phone").GetString());
        Assert.Equal(2, app.GetProperty("reviewVersion").GetInt32());
        var address = await (await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/address"), new { value = "42 Barton St E, Apt 3, Hamilton ON L8L 2V6" }))
            .Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("42 Barton St E, Apt 3, Hamilton ON L8L 2V6", address.GetProperty("fields").GetProperty("address").GetString());
        Assert.Equal("905-555-0142", Scalar("SELECT Mobile FROM Guardians WHERE Name = 'Carmen Rivera'"));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/childSin"), new { value = "1" })).StatusCode);
    }

    // L2-148 criteria 1 and 2: Choose another lists only providers serving the province; with none, the claim stays started.
    [Fact]
    public async Task Another_provider_must_serve_the_province_and_a_province_with_none_says_so()
    {
        var carmen = await Estimated();
        var id = await Prepare(carmen);

        var maple = await carmen.Http.PutAsJsonAsync(carmen.Path($"/applications/{id}/provider"), new { name = "Maple Trust RESP" });
        Assert.Equal("Maple Trust RESP", (await maple.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("provider").GetString());
        var prairie = await carmen.Http.PutAsJsonAsync(carmen.Path($"/applications/{id}/provider"), new { name = "Prairie Co-op Education Savings" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, prairie.StatusCode);
        Assert.Equal("Choose a provider that serves your province.", (await prairie.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("provider").GetString());

        var nunavut = await (await carmen.Http.PatchAsJsonAsync(carmen.Path($"/applications/{id}/fields/province"), new { value = "NU" })).Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(nunavut.GetProperty("noProvider").GetBoolean());
        Assert.Equal(JsonValueKind.Null, nunavut.GetProperty("provider").ValueKind);
        Assert.Equal("Started", Scalar("SELECT Status FROM LearningBondClaims"));
    }

    // L2-148: no application before the estimate.
    [Fact]
    public async Task Before_the_estimate_an_application_answers_409()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });

        Assert.Equal(HttpStatusCode.Conflict, (await carmen.Http.PostAsync(carmen.Path($"/children/{Mateo}/applications"), null)).StatusCode);
    }

    private async Task<LearningBondGuardianClient> Estimated()
    {
        var carmen = await new LearningBondGuardianClient(_factory).OpenAsync("Rivera", "905-555-0142");
        await carmen.Http.PostAsJsonAsync(carmen.Path("/consents"), new { childIds = new[] { Mateo }, typedName = "Carmen Rivera" });
        await carmen.Http.PutAsJsonAsync(carmen.Path($"/children/{Mateo}/intake"), new { guardianSin = "276 543 212", childSin = "345 123 459", taxFiled = "Yes" });
        Assert.Equal(HttpStatusCode.OK, (await carmen.Http.GetAsync(carmen.Path($"/children/{Mateo}/estimate"))).StatusCode);
        return carmen;
    }

    private static async Task<string> Prepare(LearningBondGuardianClient carmen) =>
        (await (await carmen.Http.PostAsync(carmen.Path($"/children/{Mateo}/applications"), null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

    private string Scalar(string sql)
    {
        using var connection = new SqliteConnection(_factory.ConnectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToString(command.ExecuteScalar(), System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _factory.DisposeAsync();
}
