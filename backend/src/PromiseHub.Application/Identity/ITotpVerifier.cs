namespace PromiseHub.Application.Identity;

/// <summary>Checks a six-digit time-based code against an enrolled secret.</summary>
public interface ITotpVerifier
{
    bool Verify(string base32Secret, string code);
}
