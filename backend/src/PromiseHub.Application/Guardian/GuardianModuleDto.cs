namespace PromiseHub.Application.Guardian;

/// <summary>A published module of a track the youth follows: lessons done of its published lessons (L2-102 criterion 4).</summary>
public sealed record GuardianModuleDto(string Title, string Track, int Done, int Total);
