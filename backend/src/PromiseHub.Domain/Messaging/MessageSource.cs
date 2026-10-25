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
}
