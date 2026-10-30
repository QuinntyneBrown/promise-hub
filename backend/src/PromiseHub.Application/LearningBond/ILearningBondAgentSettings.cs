namespace PromiseHub.Application.LearningBond;

/// <summary>How long the agent waits for the model before the fixed line stands (L2-160 criterion 4; 10 s unless configured).</summary>
public interface ILearningBondAgentSettings
{
    TimeSpan Timeout { get; }
}
