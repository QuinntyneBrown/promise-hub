using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// An assignment's due state on a day (L2-077 criteria 1 and 5, ADR 0056): open until the due date plus the grace days; after that late
/// when late work is accepted, otherwise closed. No due date is always open.
/// </summary>
public static class DueRules
{
    public const string Open = "open";
    public const string Late = "late";
    public const string Closed = "closed";

    public static string State(Assignment assignment, DateOnly today) =>
        assignment.DueDate is not { } due || today <= due.AddDays(assignment.GraceDays) ? Open : assignment.AllowLate ? Late : Closed;

    /// <summary>Days until the due date, negative once past it, or null without one.</summary>
    public static int? DaysLeft(Assignment assignment, DateOnly today) =>
        assignment.DueDate is { } due ? due.DayNumber - today.DayNumber : null;

    public static IReadOnlyList<string> Types(SubmissionTypes types) =>
        new[] { SubmissionTypes.Text, SubmissionTypes.Photo, SubmissionTypes.Link, SubmissionTypes.File }.Where(t => types.HasFlag(t)).Select(t => t.ToString()).ToList();
}
