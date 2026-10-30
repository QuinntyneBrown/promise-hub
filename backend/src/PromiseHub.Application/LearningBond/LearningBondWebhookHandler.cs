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
/// A provider's progress report (L2-150 criteria 2 to 5): signed by the provider whose channel the route names, or 401; for an application
/// that provider holds, found by its reference, or 404; in that application's organization with the module on, or 404. Each event id is
/// applied once: it moves the application, and the guardian is texted the fixed line in the household's language.
/// </summary>
public sealed class LearningBondWebhookHandler(IPromiseHubDb db, IProviderWebhookVerifier verifier, TenantContext tenant, IModuleGate modules,
    LearningBondGuardianTexter texter, GuardianLinkIssuer links, IAuditWriter audit, TimeProvider clock)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<ProviderWebhookOutcome> HandleAsync(string channel, string body, string? signature, CancellationToken cancellationToken = default)
    {
        if (!verifier.Verify(channel, body, signature))
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
        if (report is not { EventId.Length: > 0, Reference.Length: > 0, Kind: "Received" or "Deposited" or "DocumentNeeded" }
            || (report.Kind == "Deposited" && report.Amount is not > 0) || (report.Kind == "DocumentNeeded" && string.IsNullOrWhiteSpace(report.DocumentName)))
        {
            return ProviderWebhookOutcome.Invalid;
        }
        if (RespProviders.All.FirstOrDefault(p => p.Channel == channel) is not { } provider)
        {
            return ProviderWebhookOutcome.NotFound;
        }
        var found = await db.LearningBondApplications.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(a => a.ProviderReference == report.Reference && a.Provider == provider.Name, cancellationToken);
        if (found is null)
        {
            return ProviderWebhookOutcome.NotFound;
        }
        tenant.ResolveForJob(found.OrganizationId);
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return ProviderWebhookOutcome.NotFound;
        }
        if (await db.LearningBondProviderEvents.AnyAsync(e => e.Provider == provider.Name && e.EventId == report.EventId, cancellationToken))
        {
            return ProviderWebhookOutcome.Applied;
        }
        var application = await db.LearningBondApplications.SingleAsync(a => a.Id == found.Id, cancellationToken);
        var claim = await db.LearningBondClaims.SingleAsync(c => c.Id == application.ClaimId, cancellationToken);
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == application.ChildId, cancellationToken);
        var household = await db.Households.AsNoTracking().SingleAsync(h => h.Id == application.HouseholdId, cancellationToken);
        var code = GuardianLanguage.Code(household.Language);
        var now = clock.GetUtcNow();
        string text;
        switch (report.Kind)
        {
            case "Received":
                application.MarkReceived(now);
                text = LearningBondTexts.Received(code, provider.Name, child.FirstName);
                break;
            case "Deposited":
                application.MarkDeposited(report.Amount!.Value, now);
                claim.MarkDeposited(now);
                text = LearningBondTexts.Deposited(code, report.Amount.Value, child.FirstName);
                break;
            default:
                var name = report.DocumentName!.Trim();
                db.LearningBondDocuments.Add(new LearningBondDocument(Guid.NewGuid(), application.OrganizationId, application.Id,
                    name.Length > 200 ? name[..200] : name, now));
                var link = $"{links.IssueLearningBond(household.Id)}/children/{child.Id}/submitted";
                text = LearningBondTexts.DocumentNeeded(code, provider.Name, name, child.FirstName, link);
                break;
        }
        db.LearningBondProviderEvents.Add(new LearningBondProviderEvent(Guid.NewGuid(), application.OrganizationId, provider.Name, report.EventId, application.Id,
            report.Kind, now));
        var consent = await db.LearningBondConsents.AsNoTracking().SingleAsync(c => c.Id == claim.ConsentId, cancellationToken);
        if (consent.InForce)
        {
            await texter.QueueAsync(household.Id, $"Learning Bond: {child.FirstName}", text, cancellationToken);
        }
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondApplication), application.Id,
            $"Learning Bond application for {child.FirstName}: {provider.Name} reported {report.Kind}"));
        await db.SaveChangesAsync(cancellationToken);
        return ProviderWebhookOutcome.Applied;
    }
}
