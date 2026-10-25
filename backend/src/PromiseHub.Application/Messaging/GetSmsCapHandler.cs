namespace PromiseHub.Application.Messaging;

public sealed class GetSmsCapHandler(SmsCap cap)
{
    public async Task<SmsCapDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var period = await cap.CurrentAsync(cancellationToken);
        return new SmsCapDto(period.Cap, period.Used, period.Remaining, period.Remaining == 0 ? "Reached" : "Ok", period.Period);
    }
}
