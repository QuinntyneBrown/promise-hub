using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Households;

public sealed class Child : ITenantOwned, ISoftDeletable
{
    public Child(Guid id, Guid organizationId, Guid householdId, string firstName, string lastName, DateOnly? dateOfBirth = null, string? school = null)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        FirstName = firstName;
        LastName = lastName;
        DateOfBirth = dateOfBirth;
        School = school;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public DateOnly? DateOfBirth { get; private set; }

    /// <summary>School and grade as the guardian wrote it, such as "Bennetto Elementary, Grade 4".</summary>
    public string? School { get; private set; }

    public string? Allergies { get; private set; }
    public string? Medication { get; private set; }
    public string? Conditions { get; private set; }
    public string? Doctor { get; private set; }

    /// <summary>Show the allergy as a red alert at the top of the Quick Card.</summary>
    public bool RedAlert { get; private set; }

    public DateTimeOffset? MedicalUpdatedAt { get; private set; }
    public string? MedicalUpdatedBy { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    public string FullName => $"{FirstName} {LastName}";

    public bool HasMedicalFlag => !string.IsNullOrWhiteSpace(Allergies) || !string.IsNullOrWhiteSpace(Medication) || !string.IsNullOrWhiteSpace(Conditions);

    public int? AgeOn(DateOnly today)
    {
        if (DateOfBirth is not { } born)
        {
            return null;
        }
        var age = today.Year - born.Year;
        return born.AddYears(age) > today ? age - 1 : age;
    }

    public void UpdateDetails(string firstName, string lastName, DateOnly? dateOfBirth, string? school)
    {
        FirstName = firstName;
        LastName = lastName;
        DateOfBirth = dateOfBirth;
        School = school;
    }

    public void UpdateMedical(MedicalDetails details, string updatedBy, DateTimeOffset now)
    {
        Allergies = details.Allergies;
        Medication = details.Medication;
        Conditions = details.Conditions;
        Doctor = details.Doctor;
        RedAlert = details.RedAlert;
        MedicalUpdatedBy = updatedBy;
        MedicalUpdatedAt = now;
    }

    public MedicalDetails Medical => new(Allergies, Medication, Conditions, Doctor, RedAlert);

    public void SoftDelete(DateTimeOffset now) => DeletedAt = now;
}
