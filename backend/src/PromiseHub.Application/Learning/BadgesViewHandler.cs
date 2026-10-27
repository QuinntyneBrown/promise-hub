namespace PromiseHub.Application.Learning;

/// <summary>The youth's badges page (L2-087 criteria 4 and 5), from the same followed tracks the journey reads.</summary>
public sealed class BadgesViewHandler(LearnerProgress progress, LearnerBadges badges)
{
    public async Task<LearnerBadgesDto> HandleAsync(CancellationToken cancellationToken = default) =>
        await badges.ReadAsync(await progress.TracksAsync(cancellationToken), cancellationToken);
}
