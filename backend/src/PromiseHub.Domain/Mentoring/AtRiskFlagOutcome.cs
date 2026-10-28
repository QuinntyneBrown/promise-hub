namespace PromiseHub.Domain.Mentoring;

/// <summary>How an at-risk flag was resolved (L2-091 criterion 5, Waypoint's resolution reasons).</summary>
public enum AtRiskFlagOutcome
{
    Reconnected,
    HandedToDirector,
    LeftProgram,
    FlaggedInError,
}
