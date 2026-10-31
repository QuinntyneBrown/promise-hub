namespace PromiseHub.Application.LearningBond;

/// <summary>One line of the running total (L2-158 criterion 1): the child (null for the family), the stream, the amount, and confirmed or applied for.</summary>
public sealed record LearningBondTotalLineDto(string? Child, string Stream, int Amount, bool Confirmed);
