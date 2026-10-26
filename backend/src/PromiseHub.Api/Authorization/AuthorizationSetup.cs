using Microsoft.AspNetCore.Authorization;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authorization;

public static class AuthorizationSetup
{
    private static readonly AuthorizationPolicy AnyMember = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();

    public static IServiceCollection AddPermissionAuthorization(this IServiceCollection services)
    {
        var builder = services.AddAuthorizationBuilder()
            // Endpoints require a signed-in staff role unless they opt out with AllowAnonymous, opt in every member
            // with AllowAnyMember, or name the permission they need (ADR 0043).
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(Permission.UseStaffApp)).Build());
        foreach (var permission in Enum.GetValues<Permission>())
        {
            builder.AddPolicy(permission.ToString(), p => p.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)));
        }
        services.AddScoped<IAuthorizationHandler, PermissionHandler>();
        services.AddScoped<IAuthorizationHandler, AnyPermissionHandler>();
        return services;
    }

    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, Permission permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(permission.ToString());

    /// <summary>Passes when the caller's role holds any one of the permissions.</summary>
    public static TBuilder RequireAnyPermission<TBuilder>(this TBuilder builder, params Permission[] permissions)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().AddRequirements(new AnyPermissionRequirement(permissions)).Build());

    /// <summary>Opens the endpoint to every signed-in member, participant roles included.</summary>
    public static TBuilder AllowAnyMember<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(AnyMember);
}
