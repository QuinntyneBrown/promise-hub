namespace PromiseHub.Application.Identity;

/// <summary>Gone (unknown, used or expired link), invalid with one message per field, or the sign-in that follows.</summary>
public sealed record ResetPasswordResult(bool Gone, IReadOnlyDictionary<string, string>? Errors, SignInResult? SignIn);
