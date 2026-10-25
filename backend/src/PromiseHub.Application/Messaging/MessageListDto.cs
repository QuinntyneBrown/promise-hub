namespace PromiseHub.Application.Messaging;

public sealed record MessageListDto(IReadOnlyList<MessageRowDto> Messages, int SegmentsUsed, int SegmentCap);
