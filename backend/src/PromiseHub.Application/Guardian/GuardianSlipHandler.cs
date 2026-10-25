using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// The guardian's slip page (L2-015): read the slip for one child, sign with a typed name that matches a guardian of the
/// child, or decline. The record keeps the name, time, device, language and a hash of the text as shown.
/// </summary>
public sealed class GuardianSlipHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, slip, e, child, guardians, answer) = page!.Value;
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        var status = answer is not null ? answer.Status.ToString() : clock.GetUtcNow() >= e.StartsAt ? "Closed" : "Open";
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianSlipDto(
            GuardianLanguage.Code(scope.Household.Language),
            scope.Organization.Name,
            scope.Organization.Phone,
            primary?.Name.Split(' ')[0] ?? string.Empty,
            new GuardianSlipEventDto(e.Name, e.StartsAt, e.EndsAt, e.Place),
            new GuardianSlipChildDto(child.FullName, child.FirstName, child.AgeOn(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime)) ?? 0, child.Allergies, child.Medication),
            primary is null ? null : new GuardianContactDto(primary.Name, primary.Mobile),
            string.IsNullOrEmpty(slip.Title) ? e.Name : slip.Title,
            slip.Body,
            slip.SignBy,
            slip.AskPhotos,
            slip.AskSwimming,
            slip.AskLunch,
            status,
            answer?.At,
            answer?.SignedBy));
    }

    public async Task<GuardianResult> SignAsync(GuardianRequest request, SignSlipRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, slip, e, child, guardians, answer) = page!.Value;
        if (answer is not null || clock.GetUtcNow() >= e.StartsAt)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        var typed = body.Name?.Trim() ?? string.Empty;
        if (typed.Length == 0)
        {
            return GuardianResult.Invalid("name", "Type your full name to sign.");
        }
        var signer = guardians.FirstOrDefault(g => g.CanSign && string.Equals(g.Name, string.Join(' ', typed.Split(' ', StringSplitOptions.RemoveEmptyEntries)), StringComparison.OrdinalIgnoreCase));
        if (signer is null)
        {
            return GuardianResult.Invalid("name", $"That name doesn’t match a guardian of {child.FirstName}.");
        }
        var answers = JsonSerializer.Serialize(new { photos = body.Photos, lunch = body.Lunch, swimming = body.Swimming });
        Record(scope, slip, child, SignatureStatus.Signed, signer.Name, request.UserAgent, answers, null);
        audit.Record(new AuditEvent(AuditAction.Signed, "PermissionSlip", slip.Id, $"{child.FullName} · signed by {signer.Name} · version {slip.Version}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> DeclineAsync(GuardianRequest request, DeclineSlipRequest body, CancellationToken cancellationToken = default)
    {
        var (problem, page) = await LoadAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var (scope, slip, e, child, guardians, answer) = page!.Value;
        if (answer?.Status == SignatureStatus.Declined || clock.GetUtcNow() >= e.StartsAt)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict);
        }
        answer?.Supersede();
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).First();
        var by = guardians.FirstOrDefault(g => string.Equals(g.Name, body.Name?.Trim(), StringComparison.OrdinalIgnoreCase))?.Name ?? primary.Name;
        Record(scope, slip, child, SignatureStatus.Declined, by, request.UserAgent, null, string.IsNullOrWhiteSpace(body.Reason) ? null : body.Reason.Trim());
        audit.Record(new AuditEvent(AuditAction.Updated, "PermissionSlip", slip.Id, $"{child.FullName} · declined by {by}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    private void Record(GuardianScope scope, PermissionSlip slip, Child child, SignatureStatus status, string by, string? device, string? answers, string? reason)
    {
        var signature = new SlipSignature(Guid.NewGuid(), scope.Link.OrganizationId, slip.Id, child.Id, slip.Version, status, by, clock.GetUtcNow());
        signature.Given(device is { Length: > 300 } ? device[..300] : device, scope.Household.Language, GuardianTokens.Hash(slip.Body), answers, reason);
        db.SlipSignatures.Add(signature);
    }

    private async Task<(GuardianResult? Problem, (GuardianScope Scope, PermissionSlip Slip, Event Event, Child Child, List<Domain.Households.Guardian> Guardians, SlipSignature? Answer)? Page)> LoadAsync(
        GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(null)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Slips, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        var slip = await db.PermissionSlips.FirstOrDefaultAsync(s => s.Id == scope.Link.SlipId, cancellationToken);
        var e = slip is null ? null : await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == slip.EventId, cancellationToken);
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == scope.Link.ChildId, cancellationToken);
        if (slip is null || e is null || child is null || GuardianAccess.Expired(slip, clock.GetUtcNow()))
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
        var answer = await db.SlipSignatures.Where(s => s.SlipId == slip.Id && s.ChildId == child.Id && s.Version == slip.Version && s.Status != SignatureStatus.Superseded)
            .OrderByDescending(s => s.At).FirstOrDefaultAsync(cancellationToken);
        return (null, (scope, slip, e, child, guardians, answer));
    }
}
