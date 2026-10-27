using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>
/// One youth membership's go at a quiz (L2-075, L2-076, ADR 0055), numbered from 1. While in progress its answers (JSON keyed by question
/// id) and position change with every save; submitting scores it and locks it for good.
/// </summary>
public sealed class QuizAttempt : ITenantOwned
{
    public const int MaximumTextAnswer = 200;

    public QuizAttempt(Guid id, Guid organizationId, Guid membershipId, Guid quizId, int number, string questionOrder, DateTimeOffset startedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        QuizId = quizId;
        Number = number;
        QuestionOrder = questionOrder;
        Answers = "{}";
        StartedAt = startedAt;
        Status = AttemptStatus.InProgress;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid QuizId { get; private set; }
    public int Number { get; private set; }

    /// <summary>The question ids in the order this attempt shows them, comma-separated, fixed when it starts.</summary>
    public string QuestionOrder { get; private set; }

    /// <summary>Her answers as JSON: {"questionId": {"choices": [1]}} or {"questionId": {"text": "others"}}.</summary>
    public string Answers { get; private set; }

    /// <summary>The zero-based question she was on.</summary>
    public int Position { get; private set; }
    public AttemptStatus Status { get; private set; }
    public int? Correct { get; private set; }
    public int? Total { get; private set; }

    /// <summary>The rounded percentage of questions right.</summary>
    public int? Score { get; private set; }
    public bool? Passed { get; private set; }
    /// <summary>The auto-score kept beside an approved score (L2-081 criterion 2, ADR 0057); null until a mentor approves it.</summary>
    public int? AutoScore { get; private set; }
    public string? ApprovedByName { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public DateTimeOffset StartedAt { get; private set; }
    public DateTimeOffset? SubmittedAt { get; private set; }

    public bool Submitted => Status != AttemptStatus.InProgress;

    public void Save(string answers, int position)
    {
        if (Submitted)
        {
            throw new InvalidOperationException("A submitted attempt never changes.");
        }
        Answers = answers;
        Position = position;
    }

    public void Submit(int correct, int total, int passMark, bool needsApproval, DateTimeOffset at)
    {
        if (Submitted)
        {
            throw new InvalidOperationException("A submitted attempt never changes.");
        }
        Correct = correct;
        Total = total;
        Score = total == 0 ? 0 : (int)Math.Round(100.0 * correct / total, MidpointRounding.AwayFromZero);
        Passed = Score >= passMark;
        Status = needsApproval ? AttemptStatus.AwaitingApproval : AttemptStatus.Scored;
        SubmittedAt = at;
    }

    /// <summary>
    /// A mentor approves the score, or overrides it with 0 to 100 (L2-081, ADR 0057): the auto-score is kept, the approved score becomes the
    /// attempt's score and pass, and it counts from now on.
    /// </summary>
    public void Approve(int? overrideScore, int passMark, string approvedBy, DateTimeOffset at)
    {
        if (Status != AttemptStatus.AwaitingApproval)
        {
            throw new InvalidOperationException("Only an attempt awaiting approval can be approved.");
        }
        AutoScore = Score;
        Score = overrideScore ?? Score;
        Passed = Score >= passMark;
        ApprovedByName = approvedBy;
        ApprovedAt = at;
        Status = AttemptStatus.Scored;
    }
}
