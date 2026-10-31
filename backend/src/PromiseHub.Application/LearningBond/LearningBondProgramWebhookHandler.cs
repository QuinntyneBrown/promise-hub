using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A program reports a benefit started (L2-158 criterion 2): signed as a provider's webhook is (L2-150, ADR 0081), for an application of
/// that program found by its reference, in its organization with the module on; each event id once. The confirmed amount joins the total,
/// and the household is texted the benefit and the new total, while the Benefits consent is in force.
/// </summary>
public sealed class LearningBondProgramWebhookHandler(IPromiseHubDb db, IProviderWebhookVerifier verifier, TenantContext tenant, IModuleGate modules,
    LearningBondBenefitsAccess access, LearningBondTotals totals, LearningBondGuardianTexter texter, IAuditWriter audit, TimeProvider clock)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<ProviderWebhookOutcome> HandleAsync(string program, string body, string? signature, CancellationToken cancellationToken = default)
    {
        if (!verifier.Verify(program, body, signature))
        {
            return ProviderWebhookOutcome.Unauthorized;
        }
        ProviderWebhookEvent? report;
        try
        {
            report = JsonSerializer.Deserialize<ProviderWebhookEvent>(body, Json);
        }
        catch (JsonException)
        {
            return ProviderWebhookOutcome.Invalid;
        }
        if (report is not { EventId.Length: > 0, Reference.Length: > 0, Kind: "Started", Amount: > 0 })
        {
            return ProviderWebhookOutcome.Invalid;
        }
        if (BenefitCatalogue.Named(program) is not { } entry)
        {
            return ProviderWebhookOutcome.NotFound;
        }
        var found = await db.LearningBondBenefitApplications.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(a => a.Reference == report.Reference && a.BenefitKey == entry.Key, cancellationToken);
        if (found is null)
        {
            return ProviderWebhookOutcome.NotFound;
        }
        tenant.ResolveForJob(found.OrganizationId);
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return ProviderWebhookOutcome.NotFound;
        }
        if (await db.LearningBondProviderEvents.AnyAsync(e => e.Provider == entry.Key && e.EventId == report.EventId, cancellationToken))
        {
            return ProviderWebhookOutcome.Applied;
        }
        var application = await db.LearningBondBenefitApplications.SingleAsync(a => a.Id == found.Id, cancellationToken);
        var now = clock.GetUtcNow();
        application.MarkStarted(report.Amount!.Value, now);
        db.LearningBondProviderEvents.Add(new LearningBondProviderEvent(Guid.NewGuid(), application.OrganizationId, entry.Key, report.EventId, application.Id, report.Kind, now));
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondBenefitApplication), application.Id, $"{entry.Name} reported Started"));
        await db.SaveChangesAsync(cancellationToken);
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == application.HouseholdId, cancellationToken);
        if (await access.ConsentedAsync(household.Id, cancellationToken))
        {
            var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == application.OrganizationId, cancellationToken);
            var total = (await totals.LinesAsync(household.Id, organization.TimeZone, cancellationToken)).Where(l => l.Confirmed).Sum(l => l.Amount);
            await texter.QueueAsync(household.Id, entry.Name, LearningBondTexts.BenefitStarted(GuardianLanguage.Code(household.Language), entry.Name, total), cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
        return ProviderWebhookOutcome.Applied;
    }
}
