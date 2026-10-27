namespace PromiseHub.Application.Mentoring;

/// <summary>My youth (L2-007 criterion 10, L2-062 criterion 5, L2-063 criterion 4): every youth in the caller's mentor scope, once each, by name.</summary>
public sealed class MentoringHandler(MentorScope scope, MentoredYouthReader reader)
{
    public async Task<AssignedYouthDto> HandleAsync(CancellationToken cancellationToken = default) =>
        new(await reader.ReadAsync(await scope.YouthIdsAsync(cancellationToken), cancellationToken));
}
