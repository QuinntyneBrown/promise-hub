using Microsoft.Extensions.Configuration;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>Reads <c>LearningBond:Agent:TimeoutSeconds</c>, 10 when absent.</summary>
public sealed class ConfiguredLearningBondAgentSettings(IConfiguration configuration) : ILearningBondAgentSettings
{
    public TimeSpan Timeout => TimeSpan.FromSeconds(configuration.GetValue("LearningBond:Agent:TimeoutSeconds", 10));
}
