using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Identity;

/// <summary>
/// The signed-in person's own profile (L2-117, ADR 0072): the name and mobile of the active membership only. A youth's name comes from
/// the child record and is not theirs to change; the email is the sign-in identity of every membership and is not edited here.
/// </summary>
public sealed class ProfileHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public const int NameMaximum = 100;

    public async Task<Result> SaveAsync(SaveProfileRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await db.Memberships.SingleAsync(m => m.Id == tenant.MembershipId, cancellationToken);
        var name = request.Name?.Trim() ?? string.Empty;
        var mobile = request.Mobile?.Trim() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (name.Length == 0)
        {
            errors["name"] = "Enter your name.";
        }
        else if (name.Length > NameMaximum)
        {
            errors["name"] = $"Use at most {NameMaximum} characters.";
        }
        else if (membership.Role == Role.Youth && name != membership.PersonName)
        {
            errors["name"] = "Your name comes from your record. Ask staff to change it.";
        }
        if (mobile.Length > 0 && ContactMask.Digits(mobile).Length != 10)
        {
            errors["mobile"] = "Include the area code, like 905-555-0101.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        membership.Rename(name);
        membership.SetMobile(mobile.Length == 0 ? null : mobile);
        audit.Record(new AuditEvent(AuditAction.Updated, "Membership", membership.Id, $"{name} updated their profile"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
