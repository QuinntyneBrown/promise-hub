using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Guardian;

public sealed record AnswerNoShowRequest(Guid EventId, NoShowReply Reply);
