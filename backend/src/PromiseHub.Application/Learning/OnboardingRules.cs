using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>Validation of a setup step (L2-059 criterion 2): one message per field.</summary>
public static class OnboardingRules
{
    public static Dictionary<string, string> Validate(SaveOnboardingRequest request)
    {
        var errors = new Dictionary<string, string>();
        var name = request.PreferredName?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            errors["preferredName"] = "Tell us what to call you.";
        }
        else if (name.Length > YouthOnboarding.MaximumPreferredName)
        {
            errors["preferredName"] = "Use 60 characters or fewer.";
        }
        if (request.Pronouns is { } pronouns && !YouthOnboarding.PronounChoices.Contains(pronouns))
        {
            errors["pronouns"] = "Choose pronouns from the list.";
        }
        if (request.Step is < 1 or > YouthOnboarding.Steps)
        {
            errors["step"] = "Choose a step from 1 to 3.";
        }
        return errors;
    }
}
