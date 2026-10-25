namespace PromiseHub.Application.Attendance;

/// <summary>
/// A child's Quick Card. <see cref="AllergyAlert"/> and <see cref="Medical"/> are null for roles without medical access
/// (<see cref="MedicalRestricted"/> true) and when nothing medical is recorded.
/// </summary>
public sealed record QuickCardDto(
    Guid Id,
    Guid HouseholdId,
    string Name,
    int? Age,
    string? School,
    IReadOnlyList<string> Programs,
    string? PrimaryGuardian,
    string Language,
    AllergyAlertDto? AllergyAlert,
    QuickCardMedicalDto? Medical,
    IReadOnlyList<ContactDto> CallOrder,
    IReadOnlyList<PickupDto> ApprovedPickups,
    string? Notes,
    bool MedicalRestricted);
