namespace PromiseHub.Api.Authorization;

public static class PlacementEndpointExtensions
{
    /// <summary>Closes program content to a youth until program staff place them in a program (ADR 0047).</summary>
    public static TBuilder RequirePlacement<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new PlacementFilter());
}
