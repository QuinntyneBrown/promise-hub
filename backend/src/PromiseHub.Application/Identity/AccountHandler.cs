using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Identity;

/// <summary>
/// The signed-in person's account (L2-006): profile, new recovery codes (ten, shown once, stored as hashes) and signing
/// out every other session, which raises the session version so older cookies are refused (L2-031).
/// </summary>
public sealed class AccountHandler(IPromiseHubDb db, ITenantContext tenant, IPasswordHasher hasher, IAuditWriter audit)
{
    private const string Alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

    public async Task<AccountDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var membership = await db.Memberships.AsNoTracking().SingleAsync(m => m.Id == tenant.MembershipId, cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var user = await db.StaffUsers.AsNoTracking().FirstOrDefaultAsync(u => u.Email == membership.Email, cancellationToken);
        return new AccountDto(membership.PersonName, membership.Email, membership.Role.ToString(), organization.Name, membership.Mobile,
            user?.MfaSecret is not null, user?.RecoveryCodesLeft ?? 0);
    }

    public async Task<RecoveryCodesDto?> NewRecoveryCodesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }
        var codes = Enumerable.Range(0, 10).Select(_ => $"{Random(4)}-{Random(4)}").ToList();
        user.ReplaceRecoveryCodes(codes.Select(hasher.Hash));
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffUser", user.Id, "Made new recovery codes"));
        await db.SaveChangesAsync(cancellationToken);
        return new RecoveryCodesDto(codes);
    }

    /// <summary>The new session version, for re-issuing this device's cookie; null without a user.</summary>
    public async Task<int?> SignOutOthersAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }
        user.EndOtherSessions();
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffUser", user.Id, "Signed out other devices"));
        await db.SaveChangesAsync(cancellationToken);
        return user.SessionVersion;
    }

    public async Task<int> SessionVersionAsync(Guid userId, CancellationToken cancellationToken = default) =>
        (await db.StaffUsers.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken))?.SessionVersion ?? 0;

    private static string Random(int length) =>
        new([.. Enumerable.Range(0, length).Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)])]);
}
