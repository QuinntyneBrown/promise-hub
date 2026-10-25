using PromiseHub.Domain.Guardian;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>A resolved link: the link, its household and organization, and whether this device is trusted for the household.</summary>
public sealed record GuardianScope(GuardianLink Link, Household Household, Organization Organization, bool Trusted);
