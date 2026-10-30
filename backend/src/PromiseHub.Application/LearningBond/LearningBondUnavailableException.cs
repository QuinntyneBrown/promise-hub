namespace PromiseHub.Application.LearningBond;

/// <summary>The Learning Bond key is missing or unusable; the handlers turn it into 503 "Learning Bond is unavailable right now. Nothing was lost."</summary>
public sealed class LearningBondUnavailableException() : Exception("Learning Bond is unavailable right now. Nothing was lost.");
