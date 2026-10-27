namespace PromiseHub.Domain.Curriculum;

/// <summary>The ways youth may submit an assignment (L2-074 criterion 2, ADR 0054); at least one.</summary>
[Flags]
public enum SubmissionTypes
{
    None = 0,
    Text = 1,
    Photo = 2,
    Link = 4,
    File = 8,
}
