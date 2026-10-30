namespace PromiseHub.Application.LearningBond;

/// <summary>The invitation in one language the organization's households use (L2-139 criterion 1): the text and the email, filled with samples.</summary>
public sealed record LearningBondInvitationLanguageDto(
    string Code,
    string Name,
    string Sms,
    int SmsCharacters,
    int SmsSegments,
    string EmailTitle,
    string EmailText,
    string EmailAction,
    string EmailFooter);
