namespace PromiseHub.Api.Endpoints;

public sealed record SetCohortMentorsRequest(Guid? LeadMentorId, IReadOnlyList<Guid>? SupportingMentorIds);
