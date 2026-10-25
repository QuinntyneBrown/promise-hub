using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Sends a six-digit code to the contact the guardian typed, when it is one on file for the link's household; the answer
/// is the same either way so the page never reveals which contacts are on file (L2-026 criterion 1).
/// </summary>
public sealed class RequestGuardianCodeHandler(IPromiseHubDb db, GuardianAccess access, ISmsSender sms, IEmailSender email, IAuditWriter audit, TimeProvider clock)
{
    public async Task<GuardianResult> HandleAsync(GuardianCodeRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(new GuardianRequest(request.Token, null, null), cancellationToken);
        if (scope is null)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(null));
        }
        var typed = request.Contact?.Trim() ?? string.Empty;
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        var byPhone = ContactMask.Digits(typed) is { Length: 10 } digits
            ? guardians.FirstOrDefault(g => g.Mobile is not null && ContactMask.Digits(g.Mobile) == digits)
            : null;
        var byEmail = typed.Contains('@', StringComparison.Ordinal)
            ? guardians.FirstOrDefault(g => !g.EmailBounced && string.Equals(g.Email, typed, StringComparison.OrdinalIgnoreCase))
            : null;
        if ((byPhone ?? byEmail) is { } guardian)
        {
            var code = GuardianTokens.NewCode();
            var now = clock.GetUtcNow();
            db.GuardianVerifications.Add(new GuardianVerification(Guid.NewGuid(), scope.Link.OrganizationId, scope.Link.Id,
                GuardianTokens.Hash($"{scope.Link.Id}:{code}"), now.AddMinutes(10)));
            var text = $"Your {scope.Organization.Name} code is {code}. It expires in 10 minutes.";
            if (byPhone is not null)
            {
                await sms.SendAsync(guardian.Mobile!, text, cancellationToken);
            }
            else
            {
                await email.SendAsync(guardian.Email!, $"Your {scope.Organization.Name} code", text, cancellationToken);
            }
            audit.Record(new AuditEvent(AuditAction.Sent, "GuardianLink", scope.Link.Id, $"Code sent to {guardian.Name}"));
            await db.SaveChangesAsync(cancellationToken);
        }
        return GuardianResult.Of(GuardianOutcome.Done);
    }
}
