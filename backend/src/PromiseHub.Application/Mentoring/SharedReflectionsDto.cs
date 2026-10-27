namespace PromiseHub.Application.Mentoring;

/// <summary>The reflections a youth shared, newest first (L2-089 criterion 5).</summary>
public sealed record SharedReflectionsDto(Guid ChildId, string Name, IReadOnlyList<SharedReflectionDto> Reflections);
