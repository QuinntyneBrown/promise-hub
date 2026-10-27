using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>A youth's saved code and ticked steps for one coding lesson or project (L2-070, ADR 0051).</summary>
public sealed class CodingWorkspace : ITenantOwned
{
    public CodingWorkspace(Guid id, Guid organizationId, Guid membershipId, Guid lessonId)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        LessonId = lessonId;
        Code = string.Empty;
        CheckedStepIds = string.Empty;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid LessonId { get; private set; }
    public string Code { get; private set; }

    /// <summary>The ticked step ids, comma separated.</summary>
    public string CheckedStepIds { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public IReadOnlyList<Guid> Checked => CheckedStepIds.Length == 0 ? [] : CheckedStepIds.Split(',').Select(Guid.Parse).ToList();

    public void Save(string code, IEnumerable<Guid> checkedStepIds, DateTimeOffset now)
    {
        Code = code;
        CheckedStepIds = string.Join(',', checkedStepIds);
        UpdatedAt = now;
    }
}
