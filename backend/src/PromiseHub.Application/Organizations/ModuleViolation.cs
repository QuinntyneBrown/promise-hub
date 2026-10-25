namespace PromiseHub.Application.Organizations;

/// <summary>One broken dependency, reported against the module the admin should change.</summary>
public sealed record ModuleViolation(string Module, string Message);
