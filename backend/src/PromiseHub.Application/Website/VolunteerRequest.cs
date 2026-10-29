namespace PromiseHub.Application.Website;

/// <summary>What Sign up to volunteer sends (L2-134 criterion 2).</summary>
public sealed record VolunteerRequest(string? Name, string? Email, string? Phone, string? Area, string? About, bool ScreeningAcknowledged);
