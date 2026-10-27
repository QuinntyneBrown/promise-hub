namespace PromiseHub.Domain.Organizations;

/// <summary>
/// The organization's guardian consent policy (L2-056, ADR 0046): youth whose linked child is under <see cref="ConsentAge"/> need a
/// guardian's consent, and guardians sign <see cref="Wording"/>. An organization without a row uses the defaults.
/// </summary>
public sealed class ConsentPolicy : ITenantOwned
{
    public const int DefaultConsentAge = 18;
    public const int MinimumAge = 13;
    public const int MaximumAge = 19;
    public const int MinimumWording = 20;
    public const int MaximumWording = 2000;

    public static string DefaultWording(string organization) =>
        $"I consent to my child taking part in lessons, mentoring and program activities at {organization}, and to staff contacting them about their program.";

    public ConsentPolicy(Guid id, Guid organizationId, int consentAge, string wording)
    {
        Id = id;
        OrganizationId = organizationId;
        ConsentAge = consentAge;
        Wording = wording;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int ConsentAge { get; private set; }
    public string Wording { get; private set; }

    public void Change(int consentAge, string wording)
    {
        ConsentAge = consentAge;
        Wording = wording;
    }
}
