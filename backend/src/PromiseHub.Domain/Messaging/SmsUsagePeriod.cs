using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Messaging;

/// <summary>An organization's SMS segments for one calendar month ("yyyy-MM" in its time zone). A new month starts a new row.</summary>
public sealed class SmsUsagePeriod : ITenantOwned
{
    public SmsUsagePeriod(Guid id, Guid organizationId, string period, int cap)
    {
        Id = id;
        OrganizationId = organizationId;
        Period = period;
        Cap = cap;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Period { get; private set; }
    public int Cap { get; private set; }
    public int Used { get; private set; }

    public int Remaining => Math.Max(0, Cap - Used);

    public bool TryReserve(int segments)
    {
        if (Used + segments > Cap)
        {
            return false;
        }
        Used += segments;
        return true;
    }

    public void Release(int segments) => Used = Math.Max(0, Used - segments);

    public void ChangeCap(int cap) => Cap = cap;

    /// <summary>The monthly cap by plan until admins can raise it.</summary>
    public static int CapFor(Plan plan) => plan switch
    {
        Plan.Free => 200,
        Plan.Standard => 2000,
        _ => 5000,
    };
}
