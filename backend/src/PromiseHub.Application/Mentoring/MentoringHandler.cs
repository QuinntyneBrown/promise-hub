namespace PromiseHub.Application.Mentoring;

/// <summary>The youth assigned to the calling mentor (L2-007 criterion 10). Assignments arrive with prompt 54; until then the list is empty.</summary>
public sealed class MentoringHandler
{
    public Task<AssignedYouthDto> HandleAsync(CancellationToken cancellationToken = default) => Task.FromResult(new AssignedYouthDto([]));
}
