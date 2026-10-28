using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Direct messages between a mentor and a youth (L2-106, L2-108, ADR 0068): Messages and Mentoring on; mentors, youth and supervisors pass the
/// gate and <see cref="ConversationAccess"/> decides per conversation.
/// </summary>
public static class ConversationEndpoints
{
    public static IEndpointRouteBuilder MapConversationEndpoints(this IEndpointRouteBuilder app)
    {
        var conversations = app.MapGroup("/conversations").RequireModule(ModuleId.Messages).RequireModule(ModuleId.Mentoring)
            .RequireAnyPermission(Permission.MentorYouth, Permission.Learn, Permission.SuperviseConversations);
        conversations.MapGet("/", (ConversationsHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        conversations.MapGet("/{youthId:guid}", async (Guid youthId, ConversationHandler handler, CancellationToken ct) =>
        {
            var (status, conversation) = await handler.HandleAsync(youthId, ct);
            return conversation is not null ? Results.Ok(conversation) : new Result(status).ToHttp();
        });
        conversations.MapPost("/{youthId:guid}/messages", async (Guid youthId, SendDirectMessageRequest request, SendDirectMessageHandler handler, CancellationToken ct) =>
        {
            var outcome = await handler.HandleAsync(youthId, request, ct);
            if (outcome.Blocked is { } blocked)
            {
                return Results.Json(new { code = "blocked", blocked }, statusCode: StatusCodes.Status409Conflict);
            }
            return outcome.Message is { } message
                ? Results.Created($"/conversations/{youthId}/messages/{message.Id}", message)
                : outcome.Result.ToHttp();
        });
        return app;
    }
}
