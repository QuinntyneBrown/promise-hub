using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The email a named signer receives (L2-137 criteria 1 and 11): the same words are sent and shown to the admin with the email-preview
/// component, where "Read and accept" stands in for the link, since only the link's hash is kept.
/// </summary>
public sealed record LearningBondSignerEmailDto(string Title, string Text, string Action, string Footer)
{
    public static LearningBondSignerEmailDto For(LearningBondSignerRequest request, string organization) => new(
        $"{request.RequestedByName} asked you to accept the Learning Bond data-handling agreement",
        $"Hello {request.Name}. {organization} wants to offer Learning Bond, which helps families claim the Canada Learning Bond and child benefits. "
        + "Someone with authority has to accept a one-page agreement about what it collects and where it goes. "
        + $"{request.RequestedByName} named you, as {request.Title}. No PromiseHub account is needed. The link works once, for 14 days.",
        "Read and accept",
        $"{organization} via PromiseHub");

    /// <summary>The plain-text body as sent, with the link after the action.</summary>
    public string Body(string link) => $"{Title}\n\n{Text}\n\n{Action}: {link}\n\n{Footer}";
}
