using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// The guardian consent page (L2-055, L2-058, ADR 0046): read the organization's wording for one child, consent with a
/// relationship, a ticked box and a typed name that matches a guardian of the household who may sign, or withdraw. The link
/// chooses the tenant; a new device verifies with a code first.
/// </summary>
public sealed class GuardianConsentHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, ConsentGate gate, ConsentPolicyHandler policies,
    IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public static readonly TimeSpan LinkLifetime = TimeSpan.FromDays(30);

    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, child, guardians, status, wording) = page!.Value;
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        var latest = status.Latest;
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianConsentDto(
            GuardianLanguage.Code(scope.Household.Language),
            scope.Organization.Name,
            scope.Organization.Phone,
            primary?.Name.Split(' ')[0] ?? string.Empty,
            new GuardianConsentChildDto(child.FullName, child.FirstName, child.AgeOn(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime)) ?? 0),
            wording,
            status.ConsentAge,
            status.Name,
            latest?.SignedBy,
            latest?.Relationship,
            latest?.SignedAt,
            latest?.Reference,
            latest?.WithdrawnAt,
            latest?.WithdrawnBy));
    }

    public async Task<GuardianResult> SignAsync(GuardianRequest request, GiveConsentRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, child, guardians, status, wording) = page!.Value;
        if (status.InForce)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        var errors = new Dictionary<string, string>();
        var relationship = body.Relationship?.Trim() ?? string.Empty;
        if (relationship.Length == 0)
        {
            errors["relationship"] = $"Choose how you’re related to {child.FirstName}.";
        }
        if (!body.Agree)
        {
            errors["agree"] = "Tick the box to give consent.";
        }
        var typed = string.Join(' ', (body.Name ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        var signer = guardians.FirstOrDefault(g => g.CanSign && string.Equals(g.Name, typed, StringComparison.OrdinalIgnoreCase));
        if (typed.Length == 0)
        {
            errors["name"] = "Type your full name to sign.";
        }
        else if (signer is null)
        {
            errors["name"] = $"That name doesn’t match a guardian of {child.FirstName}.";
        }
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        var reference = $"GC-{Convert.ToHexString(RandomNumberGenerator.GetBytes(3))}";
        var device = request.UserAgent is { Length: > 300 } agent ? agent[..300] : request.UserAgent;
        var consent = new GuardianConsent(Guid.NewGuid(), scope.Link.OrganizationId, child.Id, scope.Household.Id, scope.Link.Id, signer!.Name,
            relationship.Length > 60 ? relationship[..60] : relationship, wording, GuardianTokens.Hash(wording), scope.Household.Language, device, reference, clock.GetUtcNow());
        db.GuardianConsents.Add(consent);
        audit.Record(new AuditEvent(AuditAction.Signed, "GuardianConsent", consent.Id, $"{child.FullName} · consent given by {signer.Name} ({consent.Relationship}) · {reference}"));
        await db.SaveChangesAsync(cancellationToken);
        if (signer.Email is { Length: > 0 } address && !signer.EmailBounced)
        {
            await email.SendAsync(address, ConsentTexts.CopySubject(scope.Household.Language, child.FirstName),
                ConsentTexts.CopyBody(scope.Household.Language, signer.Name, consent.Relationship, child.FullName, reference, wording), cancellationToken);
        }
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private async Task<(GuardianResult? Problem, (GuardianScope Scope, Child Child, List<Domain.Households.Guardian> Guardians, ConsentStatus Status, string Wording)? Page)> LoadAsync(
        GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || !scope.Link.ForConsent || scope.Link.ChildId is not { } childId || clock.GetUtcNow() - scope.Link.CreatedAt > LinkLifetime)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId && c.HouseholdId == scope.Household.Id, cancellationToken);
        if (child is null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope.Organization)), null);
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        if (!scope.Trusted)
        {
            var contacts = guardians.Where(g => g.Mobile is not null).Select(g => ContactMask.Phone(g.Mobile!))
                .Concat(guardians.Where(g => g.Email is not null && !g.EmailBounced).Select(g => ContactMask.Email(g.Email!))).ToList();
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, contacts)), null);
        }
        var status = await gate.StatusAsync(child.Id, cancellationToken);
        var wording = (await policies.GetAsync(cancellationToken)).Wording;
        return (null, (scope, child, guardians, status, wording));
    }
}
