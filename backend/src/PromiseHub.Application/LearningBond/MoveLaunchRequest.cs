namespace PromiseHub.Application.LearningBond;

/// <summary>Move a scheduled launch to another day (L2-140 criterion 6).</summary>
public sealed record MoveLaunchRequest(DateOnly? Date);
