using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Opens a benefits request (L2-153 criterion 3): the Learning Bond guardian scope, then a Benefits consent in force for the household, or 403.
/// Also reads and writes the household's encrypted benefits answers.
/// </summary>
public sealed class LearningBondBenefitsAccess(IPromiseHubDb db, LearningBondGuardianScope guardianScope, ILearningBondCipher cipher, TimeProvider clock)
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = new(System.Text.Json.JsonSerializerDefaults.Web);

    public async Task<(GuardianResult? Gate, GuardianScope? Scope)> ConsentedAsync(GuardianRequest request, CancellationToken cancellationToken)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return (gate, null);
        }
        return await ConsentedAsync(scope!.Household.Id, cancellationToken) ? (null, scope) : (GuardianResult.Of(GuardianOutcome.Forbidden), null);
    }

    public Task<bool> ConsentedAsync(Guid householdId, CancellationToken cancellationToken) =>
        db.LearningBondConsents.AnyAsync(c => c.HouseholdId == householdId && c.Scope == LearningBondConsentScope.Benefits && c.WithdrawnAt == null && c.ClosedAt == null,
            cancellationToken);

    public async Task<LearningBondBenefitsCheck> CheckAsync(GuardianScope scope, CancellationToken cancellationToken)
    {
        var check = await db.LearningBondBenefitsChecks.FirstOrDefaultAsync(c => c.HouseholdId == scope.Household.Id, cancellationToken);
        if (check is null)
        {
            check = new LearningBondBenefitsCheck(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, clock.GetUtcNow());
            db.LearningBondBenefitsChecks.Add(check);
        }
        return check;
    }

    public async Task<BenefitAnswers?> AnswersAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var check = await db.LearningBondBenefitsChecks.AsNoTracking().FirstOrDefaultAsync(c => c.HouseholdId == householdId, cancellationToken);
        if (check?.AnswersCiphertext is not { } ciphertext)
        {
            return null;
        }
        var plain = cipher.DecryptDocument(Convert.FromBase64String(ciphertext));
        return System.Text.Json.JsonSerializer.Deserialize<BenefitAnswers>(plain, Json);
    }

    public string Encrypt(BenefitAnswers answers) =>
        Convert.ToBase64String(cipher.EncryptDocument(System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(answers, Json)));

    /// <summary>The household's children under 18, by first name, with their age today where the organization is.</summary>
    public async Task<IReadOnlyList<(Guid Id, string FirstName, int? Age, DateOnly? Born)>> ChildrenAsync(GuardianScope scope, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone)).DateTime);
        return [.. (await db.Children.AsNoTracking().Where(c => c.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken))
            .Select(c => (c.Id, c.FirstName, c.AgeOn(today), c.DateOfBirth)).Where(c => c.Item3 is null or < 18).OrderBy(c => c.FirstName, StringComparer.CurrentCulture)];
    }
}
