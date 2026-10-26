using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace PromiseHub.Api.Tests;

/// <summary>Adds a route that throws, after the app's own pipeline, to prove faults are handled, logged and counted.</summary>
public sealed class FaultRouteFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
    {
        next(app);
        app.Map("/test/fault", b => b.Run(_ => throw new InvalidOperationException("secret-detail")));
    };
}
