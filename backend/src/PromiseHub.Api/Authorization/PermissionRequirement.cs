using Microsoft.AspNetCore.Authorization;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authorization;

public sealed record PermissionRequirement(Permission Permission) : IAuthorizationRequirement;
