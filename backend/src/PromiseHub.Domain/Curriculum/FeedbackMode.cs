namespace PromiseHub.Domain.Curriculum;

/// <summary>When youth see the correct answers of a quiz (L2-073 criterion 5, ADR 0054).</summary>
public enum FeedbackMode
{
    /// <summary>The correct answers after each attempt.</summary>
    ShowAnswers,

    /// <summary>Only the score.</summary>
    ScoreOnly,

    /// <summary>The correct answers once the last allowed attempt is used.</summary>
    AfterLastAttempt,
}
