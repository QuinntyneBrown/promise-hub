using Microsoft.AspNetCore.Identity;
using PromiseHub.Domain.Identity;
using IPasswordHasher = PromiseHub.Application.Identity.IPasswordHasher;

namespace PromiseHub.Infrastructure.Auth;

/// <summary>PBKDF2 hashing from ASP.NET Core Identity.</summary>
public sealed class PasswordHasher : IPasswordHasher
{
    private static readonly StaffUser Subject = new(Guid.Empty, string.Empty, null, null);
    private readonly PasswordHasher<StaffUser> _inner = new();

    public string Hash(string password) => _inner.HashPassword(Subject, password);

    public bool Verify(string hash, string password) =>
        _inner.VerifyHashedPassword(Subject, hash, password) is not PasswordVerificationResult.Failed;
}
