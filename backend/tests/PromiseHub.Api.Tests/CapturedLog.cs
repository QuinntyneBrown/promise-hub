using Microsoft.Extensions.Logging;

namespace PromiseHub.Api.Tests;

public sealed record CapturedLog(string Category, LogLevel Level, string Message, IReadOnlyDictionary<string, object?> Values);
