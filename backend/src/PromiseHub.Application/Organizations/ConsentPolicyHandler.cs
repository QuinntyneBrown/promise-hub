using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>The consent age and the wording guardians sign (L2-056 criterion 1, ADR 0046). Saving is audited.</summary>
public sealed class ConsentPolicyHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<ConsentPolicyDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var row = await db.ConsentPolicies.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (row is not null)
        {
            return new ConsentPolicyDto(row.ConsentAge, row.Wording);
        }
        var organization = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.Name).SingleAsync(cancellationToken);
        return new ConsentPolicyDto(ConsentPolicy.DefaultConsentAge, ConsentPolicy.DefaultWording(organization));
    }

    public async Task<Result> SaveAsync(SaveConsentPolicyCommand command, CancellationToken cancellationToken = default)
    {
        var wording = command.Wording?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (command.ConsentAge is < ConsentPolicy.MinimumAge or > ConsentPolicy.MaximumAge)
        {
            errors["consentAge"] = "Choose an age from 13 to 19.";
        }
        if (wording.Length is < ConsentPolicy.MinimumWording or > ConsentPolicy.MaximumWording)
        {
            errors["wording"] = "Write the wording guardians sign, 20 to 2,000 characters.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var row = await db.ConsentPolicies.FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            row = new ConsentPolicy(Guid.NewGuid(), tenant.OrganizationId, command.ConsentAge, wording);
            db.ConsentPolicies.Add(row);
        }
        else
        {
            row.Change(command.ConsentAge, wording);
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "ConsentPolicy", row.Id, $"Guardian consent needed under {command.ConsentAge}; wording updated"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
