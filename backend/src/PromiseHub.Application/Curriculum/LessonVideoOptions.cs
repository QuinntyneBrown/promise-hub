namespace PromiseHub.Application.Curriculum;

/// <summary>The largest lesson video accepted, from Lessons:MaxVideoBytes (ADR 0050).</summary>
public sealed record LessonVideoOptions(long MaxBytes)
{
    public const long DefaultMaxBytes = 1L << 30;
}
