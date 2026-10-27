namespace PromiseHub.Application.Curriculum;

public sealed record LessonVideoDto(string FileName, long Bytes, DateTimeOffset UploadedAt, string UploadedBy);
