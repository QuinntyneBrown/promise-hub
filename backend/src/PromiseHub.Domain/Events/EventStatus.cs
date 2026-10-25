namespace PromiseHub.Domain.Events;

public enum EventStatus
{
    Scheduled,
    Cancelled,

    /// <summary>A session the site lead ended: attendance is closed and read-only; notes can still be added.</summary>
    Ended,
}
