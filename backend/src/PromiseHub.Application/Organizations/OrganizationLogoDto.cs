namespace PromiseHub.Application.Organizations;

/// <summary>The uploaded logo: its file name, when and by whom (L2-123).</summary>
public sealed record OrganizationLogoDto(string FileName, DateTimeOffset UploadedAt, string UploadedBy);
