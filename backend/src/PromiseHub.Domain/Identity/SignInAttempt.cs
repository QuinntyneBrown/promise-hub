namespace PromiseHub.Domain.Identity;

/// <summary>One password check for an email, kept whether or not the email belongs to anyone, so lockout reveals nothing.</summary>
public sealed class SignInAttempt
{
    public SignInAttempt(Guid id, string email, DateTimeOffset at, bool succeeded)
    {
        Id = id;
        Email = email;
        At = at;
        Succeeded = succeeded;
    }

    public Guid Id { get; private set; }
    public string Email { get; private set; }
    public DateTimeOffset At { get; private set; }
    public bool Succeeded { get; private set; }
}
