namespace PromiseHub.Application.Website;

/// <summary>What the contact page sends (L2-134 criterion 1).</summary>
public sealed record ContactRequest(string? Name, string? Email, string? Topic, string? Message);
