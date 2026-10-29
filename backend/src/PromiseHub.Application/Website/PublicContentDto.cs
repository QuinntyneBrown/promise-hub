namespace PromiseHub.Application.Website;

/// <summary>Everything the public pages show of an organization's published content (L2-133).</summary>
public sealed record PublicContentDto(IReadOnlyList<PublicProgramDto> Programs, IReadOnlyList<PublicTrackDto> Tracks, bool Mentorship, PublicImpactDto Impact);
