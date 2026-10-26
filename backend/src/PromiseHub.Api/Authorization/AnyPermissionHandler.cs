using Microsoft.AspNetCore.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Authorization;

/// <summary>Grants the requirement when the role of the request's membership holds any one of its permissions.</summary>
public sealed class AnyPermissionHandler(ITenantContext tenant) : AuthorizationHandler<AnyPermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AnyPermissionRequirement requirement)
    {
        if (tenant.IsResolved && requirement.Permissions.Any(p => RolePermissions.Has(tenant.Role, p)))
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
