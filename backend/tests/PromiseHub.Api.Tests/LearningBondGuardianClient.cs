using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Persistence.Seed;

namespace PromiseHub.Api.Tests;

/// <summary>
/// A guardian's browser on a Learning Bond link for the claim tests: the household invited at the door, its link issued, and the device
/// verified with the texted code (L2-026), keeping the device cookie.
/// </summary>
internal sealed partial class LearningBondGuardianClient(PromiseHubApiFactory factory)
{
    private static readonly Guid Tom = DatabaseSeeder.MembershipId(DatabaseSeeder.Harbourview, "tom@harbourview.example");

    public HttpClient Http { get; } = factory.CreateClient();

    public string Token { get; private set; } = string.Empty;

    /// <summary>Invites a Harbourview household at the door, issues its link and verifies this device with the guardian's mobile number.</summary>
    public async Task<LearningBondGuardianClient> OpenAsync(string household, string mobile)
    {
        Assert.Equal(HttpStatusCode.Created, (await factory.ClientFor(Tom).PostAsync($"/learning-bond/households/{DatabaseSeeder.HouseholdId(DatabaseSeeder.Harbourview, household)}/invitations", null)).StatusCode);
        Token = await LinkAsync(DatabaseSeeder.Harbourview, household);
        await Http.PostAsJsonAsync("/g/auth/code", new { token = Token, contact = mobile });
        var code = CodePattern().Match(factory.Services.GetRequiredService<FakeSmsSender>().Sent.Last(s => s.Text.Contains("code is", StringComparison.Ordinal)).Text).Value;
        Assert.Equal(HttpStatusCode.NoContent, (await Http.PostAsJsonAsync("/g/auth/verify", new { token = Token, code })).StatusCode);
        return this;
    }

    /// <summary>A link for a household of any organization, as an invitation carries it.</summary>
    public async Task<string> LinkAsync(Guid organizationId, string household)
    {
        using var scope = factory.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TenantContext>().ResolveForJob(organizationId);
        var url = scope.ServiceProvider.GetRequiredService<GuardianLinkIssuer>().IssueLearningBond(DatabaseSeeder.HouseholdId(organizationId, household));
        await scope.ServiceProvider.GetRequiredService<IPromiseHubDb>().SaveChangesAsync();
        return url[(url.LastIndexOf('/') + 1)..];
    }

    public string Path(string rest = "") => $"/g/learning-bond/{Token}{rest}";

    /// <summary>Consent, the intake, the estimate, the review with an address and Submit for one child: the claim as prompt 86 leaves it.</summary>
    public async Task<string> SubmitAsync(Guid childId, string typedName, string guardianSin, string childSin)
    {
        await Http.PostAsJsonAsync(Path("/consents"), new { childIds = new[] { childId }, typedName });
        await Http.PutAsJsonAsync(Path($"/children/{childId}/intake"), new { guardianSin, childSin, taxFiled = "Yes" });
        await Http.GetAsync(Path($"/children/{childId}/estimate"));
        var id = (await (await Http.PostAsync(Path($"/children/{childId}/applications"), null)).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("id").GetString()!;
        var version = (await (await Http.PatchAsJsonAsync(Path($"/applications/{id}/fields/address"), new { value = "42 Barton St E, Hamilton ON L8L 2V6" }))
            .Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("reviewVersion").GetInt32();
        Assert.Equal(HttpStatusCode.Accepted, (await Http.PostAsJsonAsync(Path($"/applications/{id}/submit"), new { reviewVersion = version })).StatusCode);
        return id;
    }

    [GeneratedRegex(@"\b\d{6}\b")]
    private static partial Regex CodePattern();
}
