namespace PromiseHub.Domain.Curriculum;

/// <summary>How a quiz question is answered (L2-073 criterion 2, ADR 0054).</summary>
public enum QuestionType
{
    MultipleChoice,
    TrueFalse,
    MultipleAnswer,
    ShortAnswer,
}
