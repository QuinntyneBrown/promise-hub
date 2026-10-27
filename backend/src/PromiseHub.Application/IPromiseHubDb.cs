using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Guardian;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;
using PromiseHub.Domain.Slips;
using Event = PromiseHub.Domain.Events.Event;
using SessionStaff = PromiseHub.Domain.Events.SessionStaff;

namespace PromiseHub.Application;

/// <summary>The unit of work handlers read and write through. Tenant-owned sets are filtered to the current organization.</summary>
public interface IPromiseHubDb
{
    DbSet<Organization> Organizations { get; }
    DbSet<Membership> Memberships { get; }
    DbSet<ModuleConfiguration> ModuleConfigurations { get; }
    DbSet<Household> Households { get; }
    DbSet<Domain.Households.Guardian> Guardians { get; }
    DbSet<Child> Children { get; }
    DbSet<AuditEntry> AuditEntries { get; }
    DbSet<Domain.Programs.Program> Programs { get; }
    DbSet<Domain.Programs.Enrollment> Enrollments { get; }
    DbSet<Event> Events { get; }
    DbSet<PermissionSlip> PermissionSlips { get; }
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<AttendanceEvent> AttendanceEvents { get; }
    DbSet<WalkIn> WalkIns { get; }
    DbSet<SessionStaff> SessionStaff { get; }
    DbSet<Message> Messages { get; }
    DbSet<Delivery> Deliveries { get; }
    DbSet<SmsUsagePeriod> SmsUsagePeriods { get; }
    DbSet<SlipSignature> SlipSignatures { get; }
    DbSet<GuardianLink> GuardianLinks { get; }
    DbSet<GuardianConsent> GuardianConsents { get; }
    DbSet<SlipReminder> SlipReminders { get; }
    DbSet<Domain.Imports.ImportSession> ImportSessions { get; }
    DbSet<Domain.Enrollment.EnrollmentSession> EnrollmentSessions { get; }
    DbSet<Domain.Enrollment.EnrollmentRequest> EnrollmentRequests { get; }
    DbSet<Domain.Incidents.Incident> Incidents { get; }
    DbSet<Domain.Attendance.NoShowAlert> NoShowAlerts { get; }
    DbSet<Domain.Attendance.ApprovedPickup> ApprovedPickups { get; }
    DbSet<Domain.Attendance.PickupRequest> PickupRequests { get; }
    DbSet<Domain.Staff.StaffInvitation> StaffInvitations { get; }
    DbSet<Domain.Incidents.IncidentFollowUp> IncidentFollowUps { get; }
    DbSet<GuardianVerification> GuardianVerifications { get; }
    DbSet<TrustedGuardianDevice> TrustedGuardianDevices { get; }
    DbSet<StaffUser> StaffUsers { get; }
    DbSet<Domain.Identity.PasswordReset> PasswordResets { get; }
    DbSet<SignInAttempt> SignInAttempts { get; }
    DbSet<EndedSession> EndedSessions { get; }
    DbSet<Domain.Notifications.Notification> Notifications { get; }
    DbSet<Domain.Notifications.NotificationSettings> NotificationSettings { get; }
    DbSet<Domain.Reports.ReportExport> ReportExports { get; }
    DbSet<Domain.Surveys.Survey> Surveys { get; }
    DbSet<Domain.Surveys.SurveyResponse> SurveyResponses { get; }
    DbSet<PrivacySettings> PrivacySettings { get; }
    DbSet<ConsentPolicy> ConsentPolicies { get; }
    DbSet<DataRequest> DataRequests { get; }
    DbSet<Domain.Learning.YouthOnboarding> YouthOnboardings { get; }
    DbSet<Domain.Mentoring.YouthMentor> YouthMentors { get; }
    DbSet<Domain.Mentoring.CohortMentor> CohortMentors { get; }
    DbSet<Domain.Curriculum.Track> Tracks { get; }
    DbSet<Domain.Curriculum.CurriculumModule> CurriculumModules { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
