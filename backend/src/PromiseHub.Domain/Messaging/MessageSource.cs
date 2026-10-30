namespace PromiseHub.Domain.Messaging;

/// <summary>Which module a message belongs to; it is sent only while that module is on.</summary>
public enum MessageSource
{
    Messages,
    Slips,

    /// <summary>Enrollment decisions to guardians; part of the Roster module.</summary>
    Enrollment,

    /// <summary>No-show alerts to guardians; part of the Roll Call module.</summary>
    NoShow,

    /// <summary>Changes to a child's approved pickups; part of the Pickup module.</summary>
    Pickup,

    /// <summary>Surveys to guardians; part of the Reports module.</summary>
    Survey,

    /// <summary>Learning Bond invitations; part of the Learning Bond module, and their text already starts with the sender name (ADR 0079).</summary>
    LearningBond,
}
