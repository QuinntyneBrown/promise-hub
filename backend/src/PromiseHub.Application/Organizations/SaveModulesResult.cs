namespace PromiseHub.Application.Organizations;

public sealed record SaveModulesResult(int On, IReadOnlyList<ModuleViolation> Violations);
