using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application;
using PromiseHub.Application.Organizations;
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

namespace PromiseHub.Infrastructure.Persistence;

public sealed class PromiseHubDbContext(DbContextOptions<PromiseHubDbContext> options, ITenantContext tenant)
    : DbContext(options), IPromiseHubDb
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<ModuleConfiguration> ModuleConfigurations => Set<ModuleConfiguration>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<Domain.Programs.Program> Programs => Set<Domain.Programs.Program>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Domain.Events.EventRsvp> EventRsvps => Set<Domain.Events.EventRsvp>();
    public DbSet<PermissionSlip> PermissionSlips => Set<PermissionSlip>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceEvent> AttendanceEvents => Set<AttendanceEvent>();
    public DbSet<WalkIn> WalkIns => Set<WalkIn>();
    public DbSet<SessionStaff> SessionStaff => Set<SessionStaff>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<AnnouncementRead> AnnouncementReads => Set<AnnouncementRead>();
    public DbSet<DirectMessage> DirectMessages => Set<DirectMessage>();
    public DbSet<SmsUsagePeriod> SmsUsagePeriods => Set<SmsUsagePeriod>();
    public DbSet<SlipSignature> SlipSignatures => Set<SlipSignature>();
    public DbSet<GuardianLink> GuardianLinks => Set<GuardianLink>();
    public DbSet<GuardianConsent> GuardianConsents => Set<GuardianConsent>();
    public DbSet<SlipReminder> SlipReminders => Set<SlipReminder>();
    public DbSet<Domain.Imports.ImportSession> ImportSessions => Set<Domain.Imports.ImportSession>();
    public DbSet<Domain.Enrollment.EnrollmentSession> EnrollmentSessions => Set<Domain.Enrollment.EnrollmentSession>();
    public DbSet<Domain.Enrollment.EnrollmentRequest> EnrollmentRequests => Set<Domain.Enrollment.EnrollmentRequest>();
    public DbSet<Domain.Enrollment.EnrollmentNote> EnrollmentNotes => Set<Domain.Enrollment.EnrollmentNote>();
    public DbSet<Domain.Incidents.Incident> Incidents => Set<Domain.Incidents.Incident>();
    public DbSet<Domain.Attendance.NoShowAlert> NoShowAlerts => Set<Domain.Attendance.NoShowAlert>();
    public DbSet<Domain.Attendance.ApprovedPickup> ApprovedPickups => Set<Domain.Attendance.ApprovedPickup>();
    public DbSet<Domain.Attendance.PickupRequest> PickupRequests => Set<Domain.Attendance.PickupRequest>();
    public DbSet<Domain.Staff.StaffInvitation> StaffInvitations => Set<Domain.Staff.StaffInvitation>();
    public DbSet<Domain.Notifications.Notification> Notifications => Set<Domain.Notifications.Notification>();
    public DbSet<Domain.Notifications.NotificationSettings> NotificationSettings => Set<Domain.Notifications.NotificationSettings>();
    public DbSet<Domain.Notifications.NotificationPreference> NotificationPreferences => Set<Domain.Notifications.NotificationPreference>();
    public DbSet<Domain.Reports.ReportExport> ReportExports => Set<Domain.Reports.ReportExport>();
    public DbSet<Domain.Surveys.Survey> Surveys => Set<Domain.Surveys.Survey>();
    public DbSet<Domain.Surveys.SurveyResponse> SurveyResponses => Set<Domain.Surveys.SurveyResponse>();
    public DbSet<PrivacySettings> PrivacySettings => Set<PrivacySettings>();
    public DbSet<ConsentPolicy> ConsentPolicies => Set<ConsentPolicy>();
    public DbSet<Domain.Learning.YouthOnboarding> YouthOnboardings => Set<Domain.Learning.YouthOnboarding>();
    public DbSet<Domain.Mentoring.YouthMentor> YouthMentors => Set<Domain.Mentoring.YouthMentor>();
    public DbSet<Domain.Mentoring.CohortMentor> CohortMentors => Set<Domain.Mentoring.CohortMentor>();
    public DbSet<Domain.Curriculum.Track> Tracks => Set<Domain.Curriculum.Track>();
    public DbSet<Domain.Curriculum.CurriculumModule> CurriculumModules => Set<Domain.Curriculum.CurriculumModule>();
    public DbSet<Domain.Curriculum.Lesson> Lessons => Set<Domain.Curriculum.Lesson>();
    public DbSet<Domain.Curriculum.Quiz> Quizzes => Set<Domain.Curriculum.Quiz>();
    public DbSet<Domain.Curriculum.QuizQuestion> QuizQuestions => Set<Domain.Curriculum.QuizQuestion>();
    public DbSet<Domain.Curriculum.Assignment> Assignments => Set<Domain.Curriculum.Assignment>();
    public DbSet<Domain.Curriculum.RubricCriterion> RubricCriteria => Set<Domain.Curriculum.RubricCriterion>();
    public DbSet<Domain.Learning.LessonProgress> LessonProgress => Set<Domain.Learning.LessonProgress>();
    public DbSet<Domain.Curriculum.CodingStep> CodingSteps => Set<Domain.Curriculum.CodingStep>();
    public DbSet<Domain.Learning.CodingWorkspace> CodingWorkspaces => Set<Domain.Learning.CodingWorkspace>();
    public DbSet<Domain.Learning.Reflection> Reflections => Set<Domain.Learning.Reflection>();
    public DbSet<Domain.Learning.ProjectSubmission> ProjectSubmissions => Set<Domain.Learning.ProjectSubmission>();
    public DbSet<Domain.Learning.QuizAttempt> QuizAttempts => Set<Domain.Learning.QuizAttempt>();
    public DbSet<Domain.Learning.AssignmentSubmission> AssignmentSubmissions => Set<Domain.Learning.AssignmentSubmission>();
    public DbSet<Domain.Learning.SubmissionEvent> SubmissionEvents => Set<Domain.Learning.SubmissionEvent>();
    public DbSet<Domain.Mentoring.Competency> Competencies => Set<Domain.Mentoring.Competency>();
    public DbSet<Domain.Mentoring.CompetencyAssessment> CompetencyAssessments => Set<Domain.Mentoring.CompetencyAssessment>();
    public DbSet<Domain.Mentoring.MentorCheckIn> MentorCheckIns => Set<Domain.Mentoring.MentorCheckIn>();
    public DbSet<Domain.Mentoring.AtRiskFlag> AtRiskFlags => Set<Domain.Mentoring.AtRiskFlag>();
    public DbSet<Domain.Mentoring.AssignedWork> AssignedWork => Set<Domain.Mentoring.AssignedWork>();
    public DbSet<Domain.Curriculum.Badge> Badges => Set<Domain.Curriculum.Badge>();
    public DbSet<Domain.Website.ContactMessage> ContactMessages => Set<Domain.Website.ContactMessage>();
    public DbSet<Domain.Website.VolunteerInterest> VolunteerInterests => Set<Domain.Website.VolunteerInterest>();
    public DbSet<Domain.Website.DonationPledge> DonationPledges => Set<Domain.Website.DonationPledge>();
    public DbSet<Domain.Curriculum.BadgeAward> BadgeAwards => Set<Domain.Curriculum.BadgeAward>();
    public DbSet<Domain.Curriculum.ProgressionStage> ProgressionStages => Set<Domain.Curriculum.ProgressionStage>();
    public DbSet<Domain.LearningBond.LearningBondAgreement> LearningBondAgreements => Set<Domain.LearningBond.LearningBondAgreement>();
    public DbSet<Domain.LearningBond.LearningBondAgreementAcceptance> LearningBondAgreementAcceptances => Set<Domain.LearningBond.LearningBondAgreementAcceptance>();
    public DbSet<Domain.LearningBond.LearningBondIntake> LearningBondIntakes => Set<Domain.LearningBond.LearningBondIntake>();
    public DbSet<Domain.LearningBond.LearningBondSignerRequest> LearningBondSignerRequests => Set<Domain.LearningBond.LearningBondSignerRequest>();
    public DbSet<Domain.LearningBond.LearningBondSignerToken> LearningBondSignerTokens => Set<Domain.LearningBond.LearningBondSignerToken>();
    public DbSet<Domain.LearningBond.LearningBondInvitation> LearningBondInvitations => Set<Domain.LearningBond.LearningBondInvitation>();
    public DbSet<Domain.LearningBond.LearningBondCallRequest> LearningBondCallRequests => Set<Domain.LearningBond.LearningBondCallRequest>();
    public DbSet<Domain.LearningBond.LearningBondConsent> LearningBondConsents => Set<Domain.LearningBond.LearningBondConsent>();
    public DbSet<Domain.LearningBond.LearningBondClaim> LearningBondClaims => Set<Domain.LearningBond.LearningBondClaim>();
    public DbSet<Domain.LearningBond.LearningBondApplication> LearningBondApplications => Set<Domain.LearningBond.LearningBondApplication>();
    public DbSet<Domain.LearningBond.LearningBondDocument> LearningBondDocuments => Set<Domain.LearningBond.LearningBondDocument>();
    public DbSet<Domain.LearningBond.LearningBondProviderEvent> LearningBondProviderEvents => Set<Domain.LearningBond.LearningBondProviderEvent>();
    public DbSet<Domain.LearningBond.LearningBondReminder> LearningBondReminders => Set<Domain.LearningBond.LearningBondReminder>();
    public DbSet<Domain.LearningBond.LearningBondReminderChoice> LearningBondChoices => Set<Domain.LearningBond.LearningBondReminderChoice>();
    public DbSet<Domain.LearningBond.LearningBondBenefitsCheck> LearningBondBenefitsChecks => Set<Domain.LearningBond.LearningBondBenefitsCheck>();
    public DbSet<Domain.LearningBond.LearningBondBenefitApplication> LearningBondBenefitApplications => Set<Domain.LearningBond.LearningBondBenefitApplication>();
    public DbSet<Domain.LearningBond.LearningBondSettings> LearningBondSettings => Set<Domain.LearningBond.LearningBondSettings>();
    public DbSet<DataRequest> DataRequests => Set<DataRequest>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();
    public DbSet<Domain.Incidents.IncidentFollowUp> IncidentFollowUps => Set<Domain.Incidents.IncidentFollowUp>();
    public DbSet<GuardianVerification> GuardianVerifications => Set<GuardianVerification>();
    public DbSet<TrustedGuardianDevice> TrustedGuardianDevices => Set<TrustedGuardianDevice>();
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<SignInAttempt> SignInAttempts => Set<SignInAttempt>();
    public DbSet<EndedSession> EndedSessions => Set<EndedSession>();

    // Read by the query filter on every query, so the filter follows the current tenant.
    private Guid CurrentOrganizationId => tenant.OrganizationId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>(e =>
        {
            e.Property(o => o.Name).HasMaxLength(200);
            e.Property(o => o.City).HasMaxLength(200);
            e.Property(o => o.Plan).HasConversion<string>().HasMaxLength(20);
            e.Property(o => o.TimeZone).HasMaxLength(60);
        });
        modelBuilder.Entity<Membership>(e =>
        {
            e.Property(m => m.PersonName).HasMaxLength(200);
            e.Property(m => m.Email).HasMaxLength(320);
            e.Property(m => m.Role).HasConversion<string>().HasMaxLength(40);
            e.Property(m => m.Mobile).HasMaxLength(30);
            e.Property(m => m.RemovedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(m => m.DeactivatedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(m => m.DeactivatedBy).HasMaxLength(200);
            e.Ignore(m => m.IsActive);
        });
        modelBuilder.Entity<Domain.Notifications.NotificationSettings>(e => e.HasIndex(s => s.OrganizationId).IsUnique());
        modelBuilder.Entity<PrivacySettings>(e => e.HasIndex(s => s.OrganizationId).IsUnique());
        modelBuilder.Entity<ConsentPolicy>(e =>
        {
            e.HasIndex(s => s.OrganizationId).IsUnique();
            e.Property(s => s.Wording).HasMaxLength(ConsentPolicy.MaximumWording);
        });
        modelBuilder.Entity<Domain.Learning.YouthOnboarding>(e =>
        {
            e.HasIndex(o => new { o.OrganizationId, o.MembershipId }).IsUnique();
            e.Property(o => o.PreferredName).HasMaxLength(Domain.Learning.YouthOnboarding.MaximumPreferredName);
            e.Property(o => o.Pronouns).HasMaxLength(20);
            e.Property(o => o.StartedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(o => o.CompletedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(o => o.MembershipId);
        });
        modelBuilder.Entity<Domain.Mentoring.YouthMentor>(e =>
        {
            e.HasIndex(y => new { y.OrganizationId, y.ChildId }).IsUnique();
            e.Property(y => y.AssignedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Child>().WithMany().HasForeignKey(y => y.ChildId);
            e.HasOne<Membership>().WithMany().HasForeignKey(y => y.MentorMembershipId);
        });
        modelBuilder.Entity<Domain.Mentoring.CohortMentor>(e =>
        {
            e.HasIndex(t => new { t.ProgramId, t.MentorMembershipId }).IsUnique();
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(t => t.ProgramId);
            e.HasOne<Membership>().WithMany().HasForeignKey(t => t.MentorMembershipId);
        });
        modelBuilder.Entity<Domain.Curriculum.Track>(e =>
        {
            e.HasIndex(t => new { t.OrganizationId, t.Key }).IsUnique();
            e.Property(t => t.Name).HasMaxLength(Domain.Curriculum.Track.MaximumName);
            e.Property(t => t.Key).HasMaxLength(Domain.Curriculum.Track.MaximumKey);
            e.Property(t => t.Description).HasMaxLength(Domain.Curriculum.Track.MaximumDescription);
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(t => t.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Programs.Program>().HasOne<Domain.Curriculum.Track>().WithMany().HasForeignKey(p => p.TrackId);
        modelBuilder.Entity<Domain.Curriculum.CurriculumModule>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(Domain.Curriculum.CurriculumModule.MaximumTitle);
            e.Property(m => m.Description).HasMaxLength(Domain.Curriculum.CurriculumModule.MaximumDescription);
            e.Property(m => m.Anchor).HasMaxLength(Domain.Curriculum.CurriculumModule.MaximumAnchor);
            e.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne<Domain.Curriculum.Track>().WithMany().HasForeignKey(m => m.TrackId);
            e.HasOne<Domain.Curriculum.CurriculumModule>().WithMany().HasForeignKey(m => m.PrerequisiteModuleId);
        });
        modelBuilder.Entity<Domain.Curriculum.Lesson>(e =>
        {
            e.Property(l => l.Title).HasMaxLength(Domain.Curriculum.Lesson.MaximumTitle);
            e.Property(l => l.Reading).HasMaxLength(Domain.Curriculum.Lesson.MaximumReading);
            e.Property(l => l.Body).HasMaxLength(Domain.Curriculum.Lesson.MaximumBody);
            e.Property(l => l.LeaderNotes).HasMaxLength(Domain.Curriculum.Lesson.MaximumNotes);
            e.Property(l => l.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(l => l.DeletedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(l => l.VideoFileName).HasMaxLength(260);
            e.Property(l => l.VideoKey).HasMaxLength(200);
            e.Property(l => l.VideoContentType).HasMaxLength(100);
            e.Property(l => l.VideoUploadedBy).HasMaxLength(200);
            e.Property(l => l.VideoUploadedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Domain.Curriculum.CurriculumModule>().WithMany().HasForeignKey(l => l.ModuleId);
            e.Property(l => l.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(l => l.Passage).HasMaxLength(Domain.Curriculum.Lesson.MaximumPassage);
            e.Property(l => l.StarterCode).HasMaxLength(Domain.Curriculum.Lesson.MaximumCode);
        });
        modelBuilder.Entity<Domain.Curriculum.Quiz>(e =>
        {
            e.Property(q => q.Title).HasMaxLength(Domain.Curriculum.Quiz.MaximumTitle);
            e.Property(q => q.Feedback).HasConversion<string>().HasMaxLength(20);
            e.Property(q => q.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne<Domain.Curriculum.CurriculumModule>().WithMany().HasForeignKey(q => q.ModuleId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(q => q.LessonId);
        });
        modelBuilder.Entity<Domain.Curriculum.QuizQuestion>(e =>
        {
            e.Property(q => q.Text).HasMaxLength(Domain.Curriculum.QuizQuestion.MaximumText);
            e.Property(q => q.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(q => q.Options).HasMaxLength(1300);
            e.Property(q => q.Correct).HasMaxLength(20);
            e.Property(q => q.Answers).HasMaxLength(2100);
            e.HasOne<Domain.Curriculum.Quiz>().WithMany().HasForeignKey(q => q.QuizId);
        });
        modelBuilder.Entity<Domain.Curriculum.Assignment>(e =>
        {
            e.Property(a => a.Title).HasMaxLength(Domain.Curriculum.Quiz.MaximumTitle);
            e.Property(a => a.Brief).HasMaxLength(Domain.Curriculum.Assignment.MaximumBrief);
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne<Domain.Curriculum.CurriculumModule>().WithMany().HasForeignKey(a => a.ModuleId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(a => a.LessonId);
        });
        modelBuilder.Entity<Domain.Curriculum.RubricCriterion>(e =>
        {
            e.Property(c => c.Description).HasMaxLength(Domain.Curriculum.RubricCriterion.MaximumDescription);
            e.HasOne<Domain.Curriculum.Assignment>().WithMany().HasForeignKey(c => c.AssignmentId);
        });
        modelBuilder.Entity<Domain.Curriculum.CodingStep>(e =>
        {
            e.Property(c => c.Title).HasMaxLength(Domain.Curriculum.CodingStep.MaximumTitle);
            e.Property(c => c.Instructions).HasMaxLength(Domain.Curriculum.CodingStep.MaximumInstructions);
            e.Property(c => c.Sample).HasMaxLength(Domain.Curriculum.CodingStep.MaximumSample);
            e.Property(c => c.CheckLabel).HasMaxLength(Domain.Curriculum.CodingStep.MaximumCheckLabel);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(c => c.LessonId);
        });
        modelBuilder.Entity<Domain.Learning.CodingWorkspace>(e =>
        {
            e.HasIndex(w => new { w.MembershipId, w.LessonId }).IsUnique();
            e.Property(w => w.Code).HasMaxLength(Domain.Curriculum.Lesson.MaximumCode);
            e.Property(w => w.CheckedStepIds).HasMaxLength(4000);
            e.Ignore(w => w.Checked);
            e.Property(w => w.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(w => w.MembershipId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(w => w.LessonId);
        });
        modelBuilder.Entity<Domain.Learning.ProjectSubmission>(e =>
        {
            e.HasIndex(p => new { p.MembershipId, p.LessonId }).IsUnique();
            e.Property(p => p.Code).HasMaxLength(Domain.Curriculum.Lesson.MaximumCode);
            e.Property(p => p.Note).HasMaxLength(Domain.Learning.ProjectSubmission.MaximumNote);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.SubmittedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(p => p.MembershipId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(p => p.LessonId);
        });
        modelBuilder.Entity<Domain.Learning.QuizAttempt>(e =>
        {
            e.HasIndex(a => new { a.MembershipId, a.QuizId, a.Number }).IsUnique();
            e.Property(a => a.QuestionOrder).HasMaxLength(2000);
            e.Property(a => a.Answers).HasMaxLength(20000);
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.StartedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.SubmittedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(a => a.ApprovedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(a => a.ApprovedByName).HasMaxLength(200);
            e.Ignore(a => a.Submitted);
            e.HasOne<Membership>().WithMany().HasForeignKey(a => a.MembershipId);
            e.HasOne<Domain.Curriculum.Quiz>().WithMany().HasForeignKey(a => a.QuizId);
        });
        modelBuilder.Entity<Domain.Learning.AssignmentSubmission>(e =>
        {
            e.HasIndex(a => new { a.MembershipId, a.AssignmentId }).IsUnique();
            e.Property(a => a.Text).HasMaxLength(Domain.Learning.AssignmentSubmission.MaximumText);
            e.Property(a => a.Link).HasMaxLength(Domain.Learning.AssignmentSubmission.MaximumLink);
            e.Property(a => a.FileName).HasMaxLength(255);
            e.Property(a => a.FileKind).HasConversion<string>().HasMaxLength(10);
            e.Property(a => a.FileType).HasMaxLength(100);
            e.Property(a => a.FileKey).HasMaxLength(300);
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Feedback).HasMaxLength(Domain.Learning.AssignmentSubmission.MaximumFeedback);
            e.Property(a => a.ReviewerName).HasMaxLength(200);
            e.Property(a => a.Scores).HasMaxLength(2000);
            e.Property(a => a.ReviewComment).HasMaxLength(Domain.Learning.AssignmentSubmission.MaximumFeedback);
            e.Property(a => a.Version).IsConcurrencyToken();
            e.Property(a => a.SubmittedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(a => a.MembershipId);
            e.HasOne<Domain.Curriculum.Assignment>().WithMany().HasForeignKey(a => a.AssignmentId);
        });
        modelBuilder.Entity<Domain.Mentoring.Competency>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.Position });
            e.Property(c => c.Name).HasMaxLength(Domain.Mentoring.Competency.MaximumName);
            e.Property(c => c.Description).HasMaxLength(Domain.Mentoring.Competency.MaximumDescription);
            e.Property(c => c.RemovedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Domain.Curriculum.ProgressionStage>().WithMany().HasForeignKey(c => c.StageId);
        });
        modelBuilder.Entity<Domain.Curriculum.ProgressionStage>(e =>
        {
            e.HasIndex(s => new { s.OrganizationId, s.Position });
            e.Property(s => s.Name).HasMaxLength(Domain.Curriculum.ProgressionStage.MaximumName);
            e.Property(s => s.Description).HasMaxLength(Domain.Curriculum.ProgressionStage.MaximumDescription);
        });
        modelBuilder.Entity<Domain.Mentoring.CompetencyAssessment>(e =>
        {
            e.HasIndex(a => new { a.ChildId, a.CompetencyId });
            e.Property(a => a.Level).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Notes).HasMaxLength(Domain.Mentoring.CompetencyAssessment.MaximumNotes);
            e.Property(a => a.AssessorName).HasMaxLength(200);
            e.Property(a => a.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Households.Child>().WithMany().HasForeignKey(a => a.ChildId);
            e.HasOne<Domain.Mentoring.Competency>().WithMany().HasForeignKey(a => a.CompetencyId);
            e.HasOne<Membership>().WithMany().HasForeignKey(a => a.AssessorMembershipId);
        });
        modelBuilder.Entity<Domain.Mentoring.MentorCheckIn>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.MentorMembershipId, c.ChildId });
            e.Property(c => c.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Engagement).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Topics).HasMaxLength(Domain.Mentoring.MentorCheckIn.MaximumText);
            e.Property(c => c.ActionItems).HasMaxLength(Domain.Mentoring.MentorCheckIn.MaximumText);
            e.Property(c => c.PrivateNotes).HasMaxLength(Domain.Mentoring.MentorCheckIn.MaximumText);
            e.Property(c => c.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Households.Child>().WithMany().HasForeignKey(c => c.ChildId);
            e.HasOne<Membership>().WithMany().HasForeignKey(c => c.MentorMembershipId);
        });
        // Visitor requests from the public website (L2-134, ADR 0075); CreatedAt as ticks so the hourly limit compares in SQL.
        modelBuilder.Entity<Domain.Website.ContactMessage>(e =>
        {
            e.HasIndex(m => new { m.OrganizationId, m.Email, m.CreatedAt });
            e.Property(m => m.Name).HasMaxLength(Domain.Website.ContactMessage.MaximumName);
            e.Property(m => m.Email).HasMaxLength(Domain.Website.ContactMessage.MaximumEmail);
            e.Property(m => m.Topic).HasMaxLength(40);
            e.Property(m => m.Message).HasMaxLength(Domain.Website.ContactMessage.MaximumMessage);
            e.Property(m => m.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // Learning Bond (ADR 0076): the agreement is platform data; acceptances and intakes belong to one organization.
        modelBuilder.Entity<Domain.LearningBond.LearningBondAgreement>(e =>
        {
            e.HasIndex(a => a.Version).IsUnique();
            e.Property(a => a.WhatWeCollect).HasMaxLength(4000);
            e.Property(a => a.WhereItGoes).HasMaxLength(4000);
            e.Property(a => a.WhatYourOrganizationSees).HasMaxLength(4000);
        });
        modelBuilder.Entity<Domain.LearningBond.LearningBondAgreementAcceptance>(e =>
        {
            e.HasIndex(a => new { a.OrganizationId, a.AgreementVersion });
            e.Property(a => a.AcceptedByName).HasMaxLength(200);
            e.Property(a => a.SignerTitle).HasMaxLength(Domain.LearningBond.LearningBondSignerRequest.MaximumText);
            e.Property(a => a.SignerEmail).HasMaxLength(320);
            e.Property(a => a.AcceptedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // A named signer's single-use link is kept only as its hash (L2-137).
        modelBuilder.Entity<Domain.LearningBond.LearningBondSignerRequest>(e =>
        {
            e.HasIndex(r => r.TokenHash).IsUnique();
            e.Property(r => r.Name).HasMaxLength(Domain.LearningBond.LearningBondSignerRequest.MaximumText);
            e.Property(r => r.Title).HasMaxLength(Domain.LearningBond.LearningBondSignerRequest.MaximumText);
            e.Property(r => r.Email).HasMaxLength(320);
            e.Property(r => r.TokenHash).HasMaxLength(64);
            e.Property(r => r.RequestedByName).HasMaxLength(200);
            e.Property(r => r.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.CancelledAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(r => r.UsedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // Every link issued for a signer request, as its hash, so a replaced link still names its organization (L2-137 criterion 9).
        modelBuilder.Entity<Domain.LearningBond.LearningBondSignerToken>(e =>
        {
            e.HasIndex(t => t.TokenHash).IsUnique();
            e.HasIndex(t => t.RequestId);
            e.Property(t => t.TokenHash).HasMaxLength(64);
            e.Property(t => t.IssuedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // One row per household invitation, written with its message, so the 7-day rule never invites twice (L2-140, ADR 0079).
        modelBuilder.Entity<Domain.LearningBond.LearningBondInvitation>(e =>
        {
            e.HasIndex(i => new { i.OrganizationId, i.HouseholdId });
            e.Property(i => i.How).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.DeclinedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // Learning Bond consents and claims, per child, separate from every program consent (L2-145).
        modelBuilder.Entity<Domain.LearningBond.LearningBondConsent>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.HouseholdId, c.ChildId });
            e.Property(c => c.Scope).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.TypedName).HasMaxLength(Domain.LearningBond.LearningBondConsent.MaximumName);
            e.Property(c => c.Language).HasMaxLength(5);
            e.Property(c => c.GivenAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.WithdrawnAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(c => c.ClosedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.LearningBond.LearningBondClaim>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.HouseholdId, c.ChildId });
            e.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.PausedReason).HasConversion<string>().HasMaxLength(30);
            e.Ignore(c => c.ChildSin);
            e.Property(c => c.ChildSinCiphertext).HasMaxLength(200);
            e.Property(c => c.ChildSinLast3).HasMaxLength(3);
            e.Property(c => c.StartedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.PausedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // A child's application: contact details for this application only and the review version Submit quotes (L2-148, L2-149).
        modelBuilder.Entity<Domain.LearningBond.LearningBondApplication>(e =>
        {
            e.HasIndex(a => new { a.OrganizationId, a.ClaimId });
            e.HasIndex(a => a.SubmissionKey).IsUnique();
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Province).HasMaxLength(2);
            e.Property(a => a.Provider).HasMaxLength(100);
            e.Property(a => a.Phone).HasMaxLength(20);
            e.Property(a => a.Email).HasMaxLength(320);
            e.Property(a => a.Address).HasMaxLength(Domain.LearningBond.LearningBondApplication.MaximumAddress);
            e.Property(a => a.ProviderReference).HasMaxLength(100);
            e.Property(a => a.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.SubmittedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(a => a.ReceivedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(a => a.DepositedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // The household's benefits check: Not now and the answers as ciphertext (L2-153, L2-154).
        modelBuilder.Entity<Domain.LearningBond.LearningBondBenefitsCheck>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.HouseholdId }).IsUnique();
            e.Property(c => c.AnswersCiphertext).HasMaxLength(4000);
            e.Property(c => c.OfferDismissedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(c => c.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // One benefit's application, sent on its own (L2-156).
        modelBuilder.Entity<Domain.LearningBond.LearningBondBenefitApplication>(e =>
        {
            e.HasIndex(a => new { a.OrganizationId, a.HouseholdId, a.BenefitKey }).IsUnique();
            e.HasIndex(a => a.SubmissionKey).IsUnique();
            e.Property(a => a.BenefitKey).HasMaxLength(100);
            e.Property(a => a.RuleVersion).HasMaxLength(20);
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.Address).HasMaxLength(Domain.LearningBond.LearningBondApplication.MaximumAddress);
            e.Property(a => a.Phone).HasMaxLength(20);
            e.Property(a => a.Email).HasMaxLength(320);
            e.Property(a => a.Reference).HasMaxLength(100);
            e.Property(a => a.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.SubmittedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // Reminders to pick a paused claim back up, and the guardian's answer (L2-151 criterion 3).
        modelBuilder.Entity<Domain.LearningBond.LearningBondReminder>(e =>
        {
            e.HasIndex(r => new { r.OrganizationId, r.ClaimId });
            e.Property(r => r.DueAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.SentAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(r => r.CancelledAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.LearningBond.LearningBondReminderChoice>(e =>
        {
            e.HasIndex(r => new { r.OrganizationId, r.ClaimId });
            e.Property(r => r.ChosenAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // A provider event applied once by its id (L2-150 criterion 4).
        modelBuilder.Entity<Domain.LearningBond.LearningBondProviderEvent>(e =>
        {
            e.HasIndex(p => new { p.Provider, p.EventId }).IsUnique();
            e.Property(p => p.Provider).HasMaxLength(100);
            e.Property(p => p.EventId).HasMaxLength(100);
            e.Property(p => p.Kind).HasMaxLength(20);
            e.Property(p => p.ReceivedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        // A document the provider asked for: ciphertext in the file store, sent only on the guardian's Send (L2-150 criterion 6).
        modelBuilder.Entity<Domain.LearningBond.LearningBondDocument>(e =>
        {
            e.HasIndex(d => new { d.OrganizationId, d.ApplicationId });
            e.Property(d => d.Name).HasMaxLength(200);
            e.Property(d => d.FileName).HasMaxLength(200);
            e.Property(d => d.ContentType).HasMaxLength(100);
            e.Property(d => d.StorageKey).HasMaxLength(200);
            e.Property(d => d.RequestedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(d => d.UploadedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(d => d.SentAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // A guardian's call request: the number and time they gave, until the call is marked done (L2-142).
        modelBuilder.Entity<Domain.LearningBond.LearningBondCallRequest>(e =>
        {
            e.HasIndex(c => new { c.OrganizationId, c.HouseholdId });
            e.Property(c => c.Guardian).HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(Domain.LearningBond.LearningBondCallRequest.MaximumPhone);
            e.Property(c => c.When).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Outcome).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.DoneBy).HasMaxLength(200);
            e.Property(c => c.RequestedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.DoneAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // One settings row per organization: coverage, status roles and the sender name (L2-138, L2-139).
        modelBuilder.Entity<Domain.LearningBond.LearningBondSettings>(e =>
        {
            e.HasIndex(s => s.OrganizationId).IsUnique();
            e.Ignore(s => s.Programs);
            e.Ignore(s => s.Roles);
            e.Property(s => s.Coverage).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.ProgramIds).HasMaxLength(4000);
            e.Property(s => s.StatusRoles).HasMaxLength(200);
            e.Property(s => s.SenderName).HasMaxLength(30);
            e.Property(s => s.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(s => s.LaunchMode).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.LaunchedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        // The SIN is two columns: the ciphertext under the Learning Bond key and the last three digits (L2-159 criterion 1).
        modelBuilder.Entity<Domain.LearningBond.LearningBondIntake>(e =>
        {
            e.HasIndex(i => new { i.OrganizationId, i.HouseholdId }).IsUnique();
            e.Ignore(i => i.GuardianSin);
            e.Property(i => i.GuardianSinCiphertext).HasMaxLength(200);
            e.Property(i => i.GuardianSinLast3).HasMaxLength(3);
            e.Property(i => i.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.GuardianSinDestroyedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(x => x.TaxFiled).HasConversion<string>().HasMaxLength(10);
        });
        modelBuilder.Entity<Domain.Website.VolunteerInterest>(e =>
        {
            e.HasIndex(v => new { v.OrganizationId, v.Email, v.CreatedAt });
            e.Property(v => v.Name).HasMaxLength(Domain.Website.ContactMessage.MaximumName);
            e.Property(v => v.Email).HasMaxLength(Domain.Website.ContactMessage.MaximumEmail);
            e.Property(v => v.Phone).HasMaxLength(Domain.Website.VolunteerInterest.MaximumPhone);
            e.Property(v => v.Area).HasMaxLength(40);
            e.Property(v => v.About).HasMaxLength(Domain.Website.VolunteerInterest.MaximumAbout);
            e.Property(v => v.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Website.DonationPledge>(e =>
        {
            e.HasIndex(d => new { d.OrganizationId, d.Email, d.CreatedAt });
            e.Property(d => d.Name).HasMaxLength(Domain.Website.ContactMessage.MaximumName);
            e.Property(d => d.Email).HasMaxLength(Domain.Website.ContactMessage.MaximumEmail);
            e.Property(d => d.ProviderReference).HasMaxLength(Domain.Website.DonationPledge.MaximumReference);
            e.Property(d => d.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Mentoring.AtRiskFlag>(e =>
        {
            e.HasIndex(f => new { f.OrganizationId, f.ChildId, f.ResolvedAt });
            e.Property(f => f.Severity).HasConversion<string>().HasMaxLength(20);
            e.Property(f => f.Outcome).HasConversion<string>().HasMaxLength(20);
            e.Property(f => f.Reason).HasMaxLength(Domain.Mentoring.AtRiskFlag.MaximumText);
            e.Property(f => f.ResolutionNote).HasMaxLength(Domain.Mentoring.AtRiskFlag.MaximumText);
            e.Property(f => f.RaisedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(f => f.ResolvedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null,
                v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Ignore(f => f.IsOpen);
            e.HasOne<Domain.Households.Child>().WithMany().HasForeignKey(f => f.ChildId);
            e.HasOne<Membership>().WithMany().HasForeignKey(f => f.RaisedByMembershipId);
            e.HasOne<Membership>().WithMany().HasForeignKey(f => f.ResolvedByMembershipId);
        });
        modelBuilder.Entity<Domain.Mentoring.AssignedWork>(e =>
        {
            e.HasIndex(w => new { w.OrganizationId, w.ChildId, w.Kind, w.ItemId }).IsUnique();
            e.Property(w => w.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(w => w.Message).HasMaxLength(Domain.Mentoring.AssignedWork.MaximumMessage);
            e.Property(w => w.AssignedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Households.Child>().WithMany().HasForeignKey(w => w.ChildId);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(w => w.ProgramId);
            e.HasOne<Membership>().WithMany().HasForeignKey(w => w.AssignedByMembershipId);
        });
        modelBuilder.Entity<Domain.Curriculum.Badge>(e =>
        {
            e.Property(b => b.Name).HasMaxLength(Domain.Curriculum.Badge.MaximumName);
            e.Property(b => b.Icon).HasMaxLength(20);
            e.Property(b => b.Description).HasMaxLength(Domain.Curriculum.Badge.MaximumDescription);
            e.Property(b => b.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(b => b.Rule).HasConversion<string>().HasMaxLength(30);
            e.Property(b => b.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Mentoring.Competency>().WithMany().HasForeignKey(b => b.CompetencyId);
        });
        modelBuilder.Entity<Domain.Curriculum.BadgeAward>(e =>
        {
            e.HasIndex(a => new { a.BadgeId, a.MembershipId }).IsUnique();
            e.Property(a => a.AwardedBy).HasMaxLength(200);
            e.Property(a => a.AwardedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Curriculum.Badge>().WithMany().HasForeignKey(a => a.BadgeId);
            e.HasOne<Membership>().WithMany().HasForeignKey(a => a.MembershipId);
        });
        modelBuilder.Entity<Domain.Learning.SubmissionEvent>(e =>
        {
            e.HasIndex(x => x.SubmissionId);
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ActorName).HasMaxLength(200);
            e.Property(x => x.Note).HasMaxLength(Domain.Learning.AssignmentSubmission.MaximumFeedback);
            e.Property(x => x.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Learning.AssignmentSubmission>().WithMany().HasForeignKey(x => x.SubmissionId);
        });
        modelBuilder.Entity<Domain.Learning.Reflection>(e =>
        {
            e.HasIndex(r => new { r.MembershipId, r.LessonId }).IsUnique();
            e.Property(r => r.Mood).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Text).HasMaxLength(Domain.Learning.Reflection.MaximumText);
            e.Property(r => r.Action).HasMaxLength(Domain.Learning.Reflection.MaximumAction);
            e.Property(r => r.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.SavedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(r => r.MembershipId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(r => r.LessonId);
        });
        modelBuilder.Entity<Domain.Learning.LessonProgress>(e =>
        {
            e.HasIndex(p => new { p.MembershipId, p.LessonId }).IsUnique();
            e.Property(p => p.CompletedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Membership>().WithMany().HasForeignKey(p => p.MembershipId);
            e.HasOne<Domain.Curriculum.Lesson>().WithMany().HasForeignKey(p => p.LessonId);
        });
        modelBuilder.Entity<DataRequest>(e =>
        {
            e.Property(r => r.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Email).HasMaxLength(320);
            e.Property(r => r.FulfilledBy).HasMaxLength(200);
            e.Property(r => r.RequestedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.FulfilledAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Organization>(e =>
        {
            e.Property(o => o.ProfileConfirmedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(o => o.Region).HasMaxLength(100).HasDefaultValue(Organization.DefaultRegion);
            e.Property(o => o.PaymentFailedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(o => o.SuspendedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(o => o.SuspensionReason).HasMaxLength(500);
            e.Property(o => o.WebsiteSlug).HasMaxLength(60);
            e.Property(o => o.ContactEmail).HasMaxLength(320);
            e.Property(o => o.LogoKey).HasMaxLength(300);
            e.Property(o => o.LogoFileName).HasMaxLength(260);
            e.Property(o => o.LogoContentType).HasMaxLength(40);
            e.Property(o => o.LogoUploadedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(o => o.LogoUploadedBy).HasMaxLength(200);
            e.Property(o => o.MentorCheckInDays).HasDefaultValue(Organization.DefaultMentorCheckInDays);
            e.Property(o => o.WebsiteTagline).HasMaxLength(120);
            e.Property(o => o.WebsiteAbout).HasMaxLength(1000);
            e.Property(o => o.WebsiteEmail).HasMaxLength(320);
            e.HasIndex(o => o.WebsiteSlug).IsUnique();
        });
        modelBuilder.Entity<Domain.Surveys.Survey>(e =>
        {
            e.Property(x => x.SentBy).HasMaxLength(200);
            e.Property(x => x.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.ClosesAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Surveys.SurveyResponse>(e =>
        {
            e.Property(x => x.Comment).HasMaxLength(1000);
            e.HasIndex(x => new { x.SurveyId, x.ChildId }).IsUnique();
            e.Property(x => x.AnsweredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Reports.ReportExport>(e =>
        {
            e.Property(x => x.FileName).HasMaxLength(200);
            e.Property(x => x.CreatedBy).HasMaxLength(200);
            e.Property(x => x.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Notifications.NotificationPreference>(e =>
        {
            e.Property(p => p.Kind).HasMaxLength(40);
            e.HasIndex(p => new { p.MembershipId, p.Kind }).IsUnique();
        });
        modelBuilder.Entity<Domain.Notifications.Notification>(e =>
        {
            e.Property(n => n.Kind).HasMaxLength(40);
            e.Property(n => n.Text).HasMaxLength(500);
            e.Property(n => n.Link).HasMaxLength(200);
            e.HasIndex(n => n.MembershipId);
            e.Property(n => n.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(n => n.ReadAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Staff.StaffInvitation>(e =>
        {
            e.Property(i => i.Email).HasMaxLength(320);
            e.Property(i => i.Role).HasConversion<string>().HasMaxLength(40);
            e.Property(i => i.TokenHash).HasMaxLength(64);
            e.HasIndex(i => i.TokenHash).IsUnique();
            e.Property(i => i.InvitedBy).HasMaxLength(200);
            e.Property(i => i.InvitedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.AcceptedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(i => i.WithdrawnAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(i => i.ReplacementRequestedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<ModuleConfiguration>(e =>
        {
            e.Property(c => c.ModulesOn).HasMaxLength(200);
            e.Property(c => c.UpdatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Ignore(c => c.On);
            e.HasIndex(c => c.OrganizationId).IsUnique();
        });
        modelBuilder.Entity<Household>(e =>
        {
            e.Property(h => h.Name).HasMaxLength(200);
            e.Property(h => h.Language).HasMaxLength(40);
            e.Property(h => h.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(h => h.PurgeAfter).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
        });
        modelBuilder.Entity<Guardian>(e =>
        {
            e.Property(g => g.Name).HasMaxLength(200);
            e.Property(g => g.Relationship).HasMaxLength(60);
            e.Property(g => g.Mobile).HasMaxLength(40);
            e.Property(g => g.Email).HasMaxLength(320);
            e.Property(g => g.Language).HasMaxLength(40);
            e.Ignore(g => g.Reachable);
            e.Property(g => g.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Household>().WithMany().HasForeignKey(g => g.HouseholdId);
        });
        modelBuilder.Entity<Child>(e =>
        {
            e.Property(c => c.FirstName).HasMaxLength(100);
            e.Property(c => c.LastName).HasMaxLength(100);
            e.Property(c => c.School).HasMaxLength(200);
            e.Property(c => c.Allergies).HasMaxLength(1000);
            e.Property(c => c.Medication).HasMaxLength(1000);
            e.Property(c => c.Conditions).HasMaxLength(1000);
            e.Property(c => c.Doctor).HasMaxLength(300);
            e.Property(c => c.AlertInstruction).HasMaxLength(500);
            e.Property(c => c.HealthCard).HasMaxLength(60);
            e.Property(c => c.Notes).HasMaxLength(1000);
            e.Property(c => c.MedicalUpdatedBy).HasMaxLength(200);
            e.Ignore(c => c.FullName);
            e.Ignore(c => c.HasMedicalFlag);
            e.Ignore(c => c.Medical);
            e.Property(c => c.MedicalUpdatedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(c => c.DeletedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Household>().WithMany().HasForeignKey(c => c.HouseholdId);
        });
        modelBuilder.Entity<AuditEntry>(e =>
        {
            e.Property(a => a.Action).HasConversion<string>().HasMaxLength(40);
            e.Property(a => a.ActorName).HasMaxLength(200);
            e.Property(a => a.RecordType).HasMaxLength(100);
            e.Property(a => a.Summary).HasMaxLength(500);
            // SQLite cannot order by DateTimeOffset; store UTC ticks.
            e.Property(a => a.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasIndex(a => new { a.OrganizationId, a.OccurredAt });
        });

        modelBuilder.Entity<Domain.Programs.Program>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(120);
            e.Property(p => p.Schedule).HasMaxLength(200);
            e.Property(p => p.Ages).HasMaxLength(40);
            e.Property(p => p.Term).HasMaxLength(40);
            e.Property(p => p.ArchivedBy).HasMaxLength(200);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.ArchivedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
        });
        modelBuilder.Entity<Enrollment>(e =>
        {
            e.Property(x => x.EnrolledAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.EndedAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(x => x.EndReason).HasMaxLength(200);
            e.Ignore(x => x.Active);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(x => x.ProgramId);
            e.HasOne<Child>().WithMany().HasForeignKey(x => x.ChildId);
        });
        modelBuilder.Entity<Event>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Place).HasMaxLength(300);
            e.Property(x => x.StaffNotes).HasMaxLength(2000);
            e.Property(x => x.CancelledBy).HasMaxLength(200);
            e.Property(x => x.CancellationMessage).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.StartsAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.EndsAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(x => x.CancelledAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(x => x.ProgramId);
            e.HasIndex(x => x.SeriesId);
        });
        modelBuilder.Entity<Domain.Events.EventRsvp>(e =>
        {
            e.HasIndex(r => new { r.OrganizationId, r.EventId, r.ChildId }).IsUnique();
            e.Property(r => r.Response).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Note).HasMaxLength(Domain.Events.EventRsvp.MaximumNote);
            e.Property(r => r.AnsweredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Event>().WithMany().HasForeignKey(r => r.EventId);
            e.HasOne<Child>().WithMany().HasForeignKey(r => r.ChildId);
        });
        modelBuilder.Entity<PermissionSlip>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Body).HasMaxLength(PermissionSlip.MaxBodyLength);
            e.Property(x => x.Reminders).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Channel).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ScheduledFor).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Event>().WithMany().HasForeignKey(x => x.EventId);
            e.HasIndex(x => x.EventId).IsUnique();
        });
        modelBuilder.Entity<AttendanceRecord>(e =>
        {
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.UpdatedBy).HasMaxLength(200);
            e.Property(r => r.CheckedInAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.Property(r => r.MarkedAbsentAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null, v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Event>().WithMany().HasForeignKey(r => r.EventId);
            e.HasIndex(r => new { r.EventId, r.ChildId });
        });
        modelBuilder.Entity<AttendanceEvent>(e =>
        {
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<AttendanceRecord>().WithMany().HasForeignKey(x => x.RecordId);
            e.HasIndex(x => new { x.OrganizationId, x.ClientActionId }).IsUnique();
        });
        modelBuilder.Entity<WalkIn>(e =>
        {
            e.Property(w => w.ChildName).HasMaxLength(200);
            e.Property(w => w.Guardian).HasMaxLength(300);
            e.Property(w => w.MedicalNotes).HasMaxLength(1000);
            e.HasOne<Event>().WithMany().HasForeignKey(w => w.EventId);
        });
        modelBuilder.Entity<SessionStaff>(e =>
        {
            e.HasOne<Event>().WithMany().HasForeignKey(s => s.EventId);
            e.HasOne<Membership>().WithMany().HasForeignKey(s => s.MembershipId);
            e.HasIndex(s => new { s.EventId, s.MembershipId }).IsUnique();
        });
        modelBuilder.Entity<Message>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(200);
            // An announcement's guardian copy carries its whole body (L2-105, ADR 0068); composed messages stay within SendMessageHandler.MaxLength.
            e.Property(m => m.Body).HasMaxLength(Announcement.MaximumBody);
            e.Property(m => m.Audience).HasMaxLength(300);
            e.Property(m => m.Language).HasMaxLength(50);
            e.Property(m => m.CreatedBy).HasMaxLength(200);
            e.Property(m => m.Channel).HasConversion<string>().HasMaxLength(30);
            e.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.Source).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<Announcement>(e =>
        {
            e.HasIndex(a => new { a.OrganizationId, a.SendAt });
            e.Property(a => a.Title).HasMaxLength(Announcement.MaximumTitle);
            e.Property(a => a.Body).HasMaxLength(Announcement.MaximumBody);
            e.Property(a => a.CreatedBy).HasMaxLength(200);
            e.Property(a => a.Audience).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.CreatedByRole).HasConversion<string>().HasMaxLength(30);
            e.Property(a => a.SendAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Ignore(a => a.ReachesYouth);
            e.Ignore(a => a.ReachesMentors);
            e.Ignore(a => a.ReachesGuardians);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(a => a.ProgramId);
            e.HasOne<Membership>().WithMany().HasForeignKey(a => a.CreatedByMembershipId);
            e.HasOne<Message>().WithMany().HasForeignKey(a => a.GuardianMessageId);
        });
        modelBuilder.Entity<AnnouncementRead>(e =>
        {
            e.HasIndex(r => new { r.AnnouncementId, r.MembershipId }).IsUnique();
            e.Property(r => r.ReadAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Announcement>().WithMany().HasForeignKey(r => r.AnnouncementId);
            e.HasOne<Membership>().WithMany().HasForeignKey(r => r.MembershipId);
        });
        modelBuilder.Entity<DirectMessage>(e =>
        {
            e.HasIndex(m => new { m.OrganizationId, m.YouthMembershipId, m.SentAt });
            e.Property(m => m.Body).HasMaxLength(DirectMessage.MaximumBody);
            e.Property(m => m.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(m => m.ReadAt).HasConversion(v => v.HasValue ? v.Value.UtcTicks : (long?)null,
                v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : null);
            e.HasOne<Membership>().WithMany().HasForeignKey(m => m.YouthMembershipId);
            e.HasOne<Membership>().WithMany().HasForeignKey(m => m.MentorMembershipId);
            e.HasOne<Membership>().WithMany().HasForeignKey(m => m.SenderMembershipId);
        });
        modelBuilder.Entity<Delivery>(e =>
        {
            e.Property(d => d.Household).HasMaxLength(200);
            e.Property(d => d.Guardian).HasMaxLength(200);
            e.Property(d => d.Language).HasMaxLength(50);
            e.Property(d => d.To).HasMaxLength(320);
            e.Property(d => d.FallbackEmail).HasMaxLength(320);
            e.Property(d => d.Reason).HasMaxLength(200);
            e.Property(d => d.Text).HasMaxLength(1000);
            e.Property(d => d.Channel).HasConversion<string>().HasMaxLength(10);
            e.Property(d => d.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(d => d.DueAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Message>().WithMany().HasForeignKey(d => d.MessageId);
            e.HasIndex(d => new { d.OrganizationId, d.Status });
        });
        modelBuilder.Entity<SlipSignature>(e =>
        {
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.SignedBy).HasMaxLength(200);
            e.Property(s => s.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<PermissionSlip>().WithMany().HasForeignKey(s => s.SlipId);
            e.HasIndex(s => new { s.SlipId, s.ChildId });
            e.Property(s => s.Device).HasMaxLength(300);
            e.Property(s => s.Language).HasMaxLength(50);
            e.Property(s => s.TextHash).HasMaxLength(64);
            e.Property(s => s.Answers).HasMaxLength(500);
            e.Property(s => s.Reason).HasMaxLength(500);
        });
        modelBuilder.Entity<Domain.Enrollment.EnrollmentSession>(e =>
        {
            e.Property(s => s.Contact).HasMaxLength(320);
            e.Property(s => s.CodeHash).HasMaxLength(64);
            e.Property(s => s.TokenHash).HasMaxLength(64);
            e.HasIndex(s => s.TokenHash).IsUnique();
            e.Property(s => s.CodeExpiresAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(s => s.LockedUntil).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.Property(s => s.CodesSince).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(s => s.ProgramId);
        });
        modelBuilder.Entity<Domain.Enrollment.EnrollmentRequest>(e =>
        {
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.SubmittedBy).HasMaxLength(200);
            e.Property(r => r.ReviewedBy).HasMaxLength(200);
            e.Property(r => r.Note).HasMaxLength(500);
            e.Property(r => r.AppliedAs).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.ReferrerName).HasMaxLength(100);
            e.Property(r => r.ReferrerRole).HasMaxLength(100);
            e.Property(r => r.ReferrerOrganization).HasMaxLength(120);
            e.Property(r => r.ReferrerContact).HasMaxLength(320);
            e.Property(r => r.Reason).HasMaxLength(1000);
            e.Ignore(r => r.Open);
            e.HasOne<Domain.Programs.Program>().WithMany().HasForeignKey(r => r.ProgramId);
            e.HasOne<Child>().WithMany().HasForeignKey(r => r.ChildId);
            e.HasIndex(r => new { r.ProgramId, r.Status });
        });
        modelBuilder.Entity<Domain.Enrollment.EnrollmentNote>(e =>
        {
            e.Property(n => n.Author).HasMaxLength(200);
            e.Property(n => n.Text).HasMaxLength(Domain.Enrollment.EnrollmentNote.MaxLength);
            e.Property(n => n.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Enrollment.EnrollmentRequest>().WithMany().HasForeignKey(n => n.EnrollmentRequestId);
            e.HasIndex(n => n.EnrollmentRequestId);
        });
        modelBuilder.Entity<Domain.Incidents.Incident>(e =>
        {
            e.Property(i => i.Category).HasConversion<string>().HasMaxLength(30);
            e.Property(i => i.GuardianContact).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Severity).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Place).HasMaxLength(100);
            e.Property(i => i.WhatHappened).HasMaxLength(4000);
            e.Property(i => i.ActionTaken).HasMaxLength(4000);
            e.Property(i => i.ReportedBy).HasMaxLength(200);
            e.Property(i => i.OccurredAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(i => i.ReportedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Child>().WithMany().HasForeignKey(i => i.ChildId);
            e.HasIndex(i => i.ReporterId);
            e.Property(i => i.Outcome).HasConversion<string>().HasMaxLength(30);
            e.Property(i => i.ReviewNote).HasMaxLength(4000);
            e.Property(i => i.ReviewedBy).HasMaxLength(200);
            e.Property(i => i.ReviewedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<Domain.Attendance.PickupRequest>(e =>
        {
            e.Property(r => r.CollectorName).HasMaxLength(200);
            e.Property(r => r.RequestedBy).HasMaxLength(200);
            e.Property(r => r.DecidedBy).HasMaxLength(200);
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.RequestedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.DecidedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasIndex(r => new { r.EventId, r.ChildId });
        });
        modelBuilder.Entity<Domain.Attendance.ApprovedPickup>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(200);
            e.Property(p => p.Relationship).HasMaxLength(100);
            e.Property(p => p.Mobile).HasMaxLength(30);
            e.Property(p => p.AddedBy).HasMaxLength(200);
            e.Property(p => p.RemovedBy).HasMaxLength(200);
            e.Property(p => p.AddedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(p => p.RemovedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Child>().WithMany().HasForeignKey(p => p.ChildId);
            e.HasIndex(p => p.ChildId);
        });
        modelBuilder.Entity<Domain.Attendance.NoShowAlert>(e =>
        {
            e.Property(a => a.Reply).HasConversion<string>().HasMaxLength(20);
            e.Property(a => a.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(a => a.RepliedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasIndex(a => new { a.EventId, a.ChildId }).IsUnique();
        });
        modelBuilder.Entity<Domain.Incidents.IncidentFollowUp>(e =>
        {
            e.Property(f => f.Text).HasMaxLength(4000);
            e.Property(f => f.WrittenBy).HasMaxLength(200);
            e.Property(f => f.WrittenAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Domain.Incidents.Incident>().WithMany().HasForeignKey(f => f.IncidentId);
        });
        modelBuilder.Entity<Domain.Imports.ImportSession>(e =>
        {
            e.Property(s => s.FileName).HasMaxLength(260);
            e.Property(s => s.CreatedBy).HasMaxLength(200);
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });
        modelBuilder.Entity<SlipReminder>(e =>
        {
            e.Property(r => r.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Slot).HasMaxLength(60);
            e.Property(r => r.SentAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<PermissionSlip>().WithMany().HasForeignKey(r => r.SlipId);
            e.HasIndex(r => new { r.SlipId, r.HouseholdId, r.Slot }).IsUnique();
        });
        modelBuilder.Entity<GuardianLink>(e =>
        {
            e.Property(l => l.TokenHash).HasMaxLength(64);
            e.HasIndex(l => l.TokenHash).IsUnique();
            e.Property(l => l.LockedUntil).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasOne<Household>().WithMany().HasForeignKey(l => l.HouseholdId);
        });
        modelBuilder.Entity<GuardianConsent>(e =>
        {
            e.Property(c => c.SignedBy).HasMaxLength(200);
            e.Property(c => c.Relationship).HasMaxLength(60);
            e.Property(c => c.Wording).HasMaxLength(ConsentPolicy.MaximumWording);
            e.Property(c => c.WordingHash).HasMaxLength(64);
            e.Property(c => c.Language).HasMaxLength(50);
            e.Property(c => c.Device).HasMaxLength(300);
            e.Property(c => c.Reference).HasMaxLength(20);
            e.Property(c => c.WithdrawnBy).HasMaxLength(200);
            e.Property(c => c.SignedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(c => c.WithdrawnAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
            e.HasIndex(c => c.ChildId);
            e.HasOne<Child>().WithMany().HasForeignKey(c => c.ChildId);
            e.HasOne<GuardianLink>().WithMany().HasForeignKey(c => c.LinkId);
        });
        modelBuilder.Entity<GuardianVerification>(e =>
        {
            e.Property(v => v.CodeHash).HasMaxLength(64);
            e.Property(v => v.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<GuardianLink>().WithMany().HasForeignKey(v => v.LinkId);
        });
        modelBuilder.Entity<TrustedGuardianDevice>(e =>
        {
            e.Property(d => d.TokenHash).HasMaxLength(64);
            e.HasIndex(d => d.TokenHash).IsUnique();
            e.Property(d => d.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasOne<Household>().WithMany().HasForeignKey(d => d.HouseholdId);
        });
        modelBuilder.Entity<SmsUsagePeriod>(e =>
        {
            e.Property(p => p.Period).HasMaxLength(7);
            e.Ignore(p => p.Remaining);
            e.HasIndex(p => new { p.OrganizationId, p.Period }).IsUnique();
        });
        modelBuilder.Entity<StaffUser>(e =>
        {
            e.Property(u => u.Email).HasMaxLength(320);
            e.HasIndex(u => u.Email).IsUnique();
            e.Ignore(u => u.RecoveryCodesLeft);
            e.Property(u => u.RecoveryCodes).HasMaxLength(1000);
            e.Property(u => u.Theme).HasMaxLength(16).HasDefaultValue("system");
            e.Property(u => u.TextSize).HasMaxLength(16).HasDefaultValue("default");
        });
        modelBuilder.Entity<PasswordReset>(e =>
        {
            e.Property(r => r.TokenHash).HasMaxLength(64);
            e.HasIndex(r => r.TokenHash).IsUnique();
            e.Property(r => r.CreatedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(r => r.UsedAt).HasConversion(v => v == null ? (long?)null : v.Value.UtcTicks, v => v == null ? null : new DateTimeOffset(v.Value, TimeSpan.Zero));
        });
        modelBuilder.Entity<SignInAttempt>(e =>
        {
            e.Property(a => a.Email).HasMaxLength(320);
            e.Property(a => a.At).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.HasIndex(a => new { a.Email, a.At });
        });
        modelBuilder.Entity<EndedSession>(e =>
        {
            e.Property(s => s.Id).ValueGeneratedNever();
            e.Property(s => s.EndedAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
            e.Property(s => s.ExpiresAt).HasConversion(v => v.UtcTicks, v => new DateTimeOffset(v, TimeSpan.Zero));
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes().Where(t => typeof(ITenantOwned).IsAssignableFrom(t.ClrType)))
        {
            entityType.SetQueryFilter(TenantFilter(entityType.ClrType));
            modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(ITenantOwned.OrganizationId));
            modelBuilder.Entity(entityType.ClrType).HasOne(typeof(Organization)).WithMany().HasForeignKey(nameof(ITenantOwned.OrganizationId));
        }
    }

    /// <summary>OrganizationId equals the tenant; for soft-deletable rows, also DeletedAt is null.</summary>
    private LambdaExpression TenantFilter(Type clrType)
    {
        var entity = Expression.Parameter(clrType, "e");
        var organizationId = Expression.Property(entity, nameof(ITenantOwned.OrganizationId));
        var current = Expression.Property(Expression.Constant(this), nameof(CurrentOrganizationId));
        Expression body = Expression.Equal(organizationId, current);
        if (typeof(ISoftDeletable).IsAssignableFrom(clrType))
        {
            var deletedAt = Expression.Property(entity, nameof(ISoftDeletable.DeletedAt));
            body = Expression.AndAlso(body, Expression.Equal(deletedAt, Expression.Constant(null, typeof(DateTimeOffset?))));
        }
        return Expression.Lambda(body, entity);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        GuardChanges();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        GuardChanges();
        return base.SaveChanges();
    }

    private void GuardChanges()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditEntry && entry.State is EntityState.Modified or EntityState.Deleted)
            {
                throw new AuditImmutableException();
            }

            var changed = entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted;
            if (entry.Entity is ITenantOwned owned && changed && !tenant.IsSystem
                && (!tenant.IsResolved || owned.OrganizationId != tenant.OrganizationId))
            {
                throw new InvalidOperationException($"{entry.Metadata.ClrType.Name} does not belong to the current organization.");
            }
        }
    }
}
