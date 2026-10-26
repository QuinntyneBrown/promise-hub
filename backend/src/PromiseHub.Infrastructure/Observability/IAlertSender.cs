namespace PromiseHub.Infrastructure.Observability;

/// <summary>Raises an alert to the on-call channel.</summary>
public interface IAlertSender
{
    Task RaiseAsync(Alert alert, CancellationToken cancellationToken = default);
}
