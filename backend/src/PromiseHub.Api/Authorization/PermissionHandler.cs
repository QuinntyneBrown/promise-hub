using Microsoft.AspNetCore.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Authorization;

/// <summary>Grants a permission from the role of the membership resolved for this request, so a role change applies on the next request.</summary>
public sealed class PermissionHandler(ITenantContext tenant) : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (tenant.IsResolved && RolePermissions.Has(tenant.Role, requirement.Permission))
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
