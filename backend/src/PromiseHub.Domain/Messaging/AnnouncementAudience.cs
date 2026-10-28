namespace PromiseHub.Domain.Messaging;

/// <summary>Who an announcement is for (L2-105): youth and mentors read it in the app; guardians get a Messages copy.</summary>
public enum AnnouncementAudience
{
    Youth,
    YouthAndGuardians,
    Guardians,
    Mentors,
    Everyone,
}
