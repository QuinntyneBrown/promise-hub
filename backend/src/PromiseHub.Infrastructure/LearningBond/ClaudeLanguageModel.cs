using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using Microsoft.Extensions.Configuration;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>
/// The agent's model when <c>LearningBond:Agent:ApiKey</c> is configured (ADR 0085): Claude through the Anthropic SDK, with the step's
/// system prompt, the read-only tools and a short tool loop. A refusal, a cut-off answer or a loop that does not settle answers null, so the
/// fixed line stands. The key is read from configuration only.
/// </summary>
public sealed class ClaudeLanguageModel(IConfiguration configuration) : ILanguageModel
{
    private const int MaximumRounds = 4;

    private readonly AnthropicClient _client = new() { ApiKey = configuration["LearningBond:Agent:ApiKey"] };

    private string Model => configuration["LearningBond:Agent:Model"] ?? "claude-opus-5-5";

    public async Task<string?> ReplyAsync(LanguageModelRequest request, Func<LanguageModelToolCall, CancellationToken, Task<string>> runTool, CancellationToken cancellationToken)
    {
        List<MessageParam> messages = [.. request.History.Select(Turn), new UserMessageParam { Content = request.Message }];
        List<ToolUnion> tools = [.. request.Tools.Select(Tool)];
        for (var round = 0; round < MaximumRounds; round++)
        {
            var response = await _client.Messages.Create(new MessageCreateParams
            {
                Model = Model,
                MaxTokens = 1024,
                System = request.System,
                OutputConfig = new() { Effort = Effort.Low },
                Tools = tools,
                Messages = messages,
            }, cancellationToken);
            if (response.StopReason == StopReason.ToolUse)
            {
                List<ContentBlockParam> echo = [];
                List<ContentBlockParam> results = [];
                foreach (var block in response.Content)
                {
                    if (block.TryPickText(out var text))
                    {
                        echo.Add(new TextBlockParam { Text = text.Text });
                    }
                    else if (block.TryPickThinking(out var thinking))
                    {
                        echo.Add(new ThinkingBlockParam { Thinking = thinking.Thinking, Signature = thinking.Signature });
                    }
                    else if (block.TryPickRedactedThinking(out var redacted))
                    {
                        echo.Add(new RedactedThinkingBlockParam { Data = redacted.Data });
                    }
                    else if (block.TryPickToolUse(out var use))
                    {
                        echo.Add(new ToolUseBlockParam { ID = use.ID, Name = use.Name, Input = use.Input });
                        var arguments = use.Input.ToDictionary(p => p.Key, p => p.Value.ValueKind == JsonValueKind.String ? p.Value.GetString() ?? string.Empty : p.Value.ToString());
                        results.Add(new ToolResultBlockParam { ToolUseID = use.ID, Content = await runTool(new LanguageModelToolCall(use.Name, arguments), cancellationToken) });
                    }
                }
                messages = [.. messages, new AssistantMessageParam { Content = echo }, new UserMessageParam { Content = results }];
                continue;
            }
            if (response.StopReason != StopReason.EndTurn)
            {
                return null;
            }
            var reply = string.Join(' ', response.Content.Select(b => b.TryPickText(out var t) ? t.Text : null).OfType<string>()).Trim();
            return reply.Length == 0 ? null : reply;
        }
        return null;
    }

    private static MessageParam Turn(LanguageModelTurn turn) =>
        turn.Role == "assistant" ? new AssistantMessageParam { Content = turn.Text } : new UserMessageParam { Content = turn.Text };

    private static Tool Tool(LanguageModelTool tool) => new()
    {
        Name = tool.Name,
        Description = tool.Description,
        InputSchema = new()
        {
            Properties = tool.Parameters.ToDictionary(p => p.Key, p => JsonSerializer.SerializeToElement(new { type = "string", description = p.Value })),
            Required = [.. tool.Parameters.Keys],
        },
    };
}
