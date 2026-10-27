using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>One ordered step of a coding lesson (L2-070, ADR 0051): what to do, a code sample, and the checklist item it ticks.</summary>
public sealed class CodingStep : ITenantOwned
{
    public const int MaximumTitle = 120;
    public const int MaximumInstructions = 4000;
    public const int MaximumSample = 4000;
    public const int MaximumCheckLabel = 200;

    public CodingStep(Guid id, Guid organizationId, Guid lessonId, int position, string title, string instructions, string? sample, string checkLabel)
    {
        Id = id;
        OrganizationId = organizationId;
        LessonId = lessonId;
        Position = position;
        Title = title;
        Instructions = instructions;
        Sample = sample;
        CheckLabel = checkLabel;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid LessonId { get; private set; }
    public int Position { get; private set; }
    public string Title { get; private set; }
    public string Instructions { get; private set; }
    public string? Sample { get; private set; }
    public string CheckLabel { get; private set; }
}
