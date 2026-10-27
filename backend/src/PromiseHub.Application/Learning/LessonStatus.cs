using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>One published lesson as a youth stands with it: done, locked (with what to finish first) or open (ADR 0051).</summary>
public sealed record LessonStatus(Lesson Lesson, bool Done, bool Locked, string? UnlockAfter)
{
    public string State => Done ? "done" : Locked ? "locked" : "next";
}
