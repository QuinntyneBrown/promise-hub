using System.Security.Cryptography;
using System.Text;

namespace PromiseHub.Infrastructure.Persistence.Seed;

/// <summary>Stable identifiers derived from names, so every seed run addresses the same rows.</summary>
public static class SeedIds
{
    public static Guid Of(string name) => new(MD5.HashData(Encoding.UTF8.GetBytes(name)));
}
