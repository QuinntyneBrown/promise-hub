using Microsoft.AspNetCore.Authorization;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authorization;

public static class AuthorizationSetup
{
    public static IServiceCollection AddPermissionAuthorization(this IServiceCollection services)
    {
        var builder = services.AddAuthorizationBuilder()
            // Endpoints require authentication unless they opt out with AllowAnonymous.
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
        foreach (var permission in Enum.GetValues<Permission>())
        {
            builder.AddPolicy(permission.ToString(), p => p.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)));
        }
        services.AddScoped<IAuthorizationHandler, PermissionHandler>();
        return services;
    }

    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, Permission permission)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(permission.ToString());
}
