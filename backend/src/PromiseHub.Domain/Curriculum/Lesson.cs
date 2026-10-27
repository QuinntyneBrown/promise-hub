using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Curriculum;

/// <summary>
/// One lesson of a module (L2-067, ADR 0050): what youth read, plus leader guide notes only authors and mentors see. Deleting
/// sets DeletedAt and keeps the row, so youth progress for it stays archived.
/// </summary>
public sealed class Lesson : ITenantOwned
{
    public const int MaximumTitle = 120;
    public const int MaximumReading = 200;
    public const int MaximumBody = 20000;
    public const int MaximumLines = 10;
    public const int MaximumLine = 300;
    public const int MaximumNotes = 4000;

    public Lesson(Guid id, Guid organizationId, Guid moduleId, string title, int position)
    {
        Id = id;
        OrganizationId = organizationId;
        ModuleId = moduleId;
        Title = title;
        Position = position;
        Status = ContentStatus.Draft;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ModuleId { get; private set; }
    public string Title { get; private set; }

    /// <summary>The story or passage the lesson is built on.</summary>
    public string? Reading { get; private set; }
    public int? Minutes { get; private set; }

    /// <summary>One objective per line.</summary>
    public string? Objectives { get; private set; }

    /// <summary>The teaching content youth read; required before publishing.</summary>
    public string? Body { get; private set; }

    /// <summary>One reflection prompt per line.</summary>
    public string? Prompts { get; private set; }

    /// <summary>For authors and mentors; never part of a youth response.</summary>
    public string? LeaderNotes { get; private set; }
    public int Position { get; private set; }
    public ContentStatus Status { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    /// <summary>The lesson video's file name as uploaded; shown only, never used as a path.</summary>
    public string? VideoFileName { get; private set; }

    /// <summary>Where file storage keeps the video: lessons/{organization}/{lesson}/{guid}{extension}.</summary>
    public string? VideoKey { get; private set; }
    public string? VideoContentType { get; private set; }
    public long? VideoBytes { get; private set; }
    public DateTimeOffset? VideoUploadedAt { get; private set; }
    public string? VideoUploadedBy { get; private set; }

    public void Update(string title, string? reading, int? minutes, string? objectives, string? body, string? prompts, string? leaderNotes)
    {
        Title = title;
        Reading = reading;
        Minutes = minutes;
        Objectives = objectives;
        Body = body;
        Prompts = prompts;
        LeaderNotes = leaderNotes;
    }

    public void MoveTo(int position) => Position = position;

    public void SetStatus(ContentStatus status) => Status = status;

    public void Delete(DateTimeOffset now) => DeletedAt = now;

    public void AttachVideo(string fileName, string key, string contentType, long bytes, DateTimeOffset at, string by)
    {
        VideoFileName = fileName;
        VideoKey = key;
        VideoContentType = contentType;
        VideoBytes = bytes;
        VideoUploadedAt = at;
        VideoUploadedBy = by;
    }

    public void RemoveVideo()
    {
        VideoFileName = null;
        VideoKey = null;
        VideoContentType = null;
        VideoBytes = null;
        VideoUploadedAt = null;
        VideoUploadedBy = null;
    }
}
