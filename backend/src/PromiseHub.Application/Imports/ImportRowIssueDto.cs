namespace PromiseHub.Application.Imports;

/// <summary>A row by its line in the file (the header is line 1), the child, and why it needs attention.</summary>
public sealed record ImportRowIssueDto(int Row, string Child, string Reason);
