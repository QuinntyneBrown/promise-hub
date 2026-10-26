namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's tracks for authors (L2-007 criterion 12). There are none until prompt 56 adds authoring.</summary>
public sealed class CurriculumHandler
{
    public Task<CurriculumDto> HandleAsync(CancellationToken cancellationToken = default) => Task.FromResult(new CurriculumDto([]));
}
