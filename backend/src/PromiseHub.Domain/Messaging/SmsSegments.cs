namespace PromiseHub.Domain.Messaging;

/// <summary>SMS billing units: 160 GSM-7 characters in one segment and 153 per segment above that; 70 and 67 when any character needs UCS-2.</summary>
public static class SmsSegments
{
    private const string Gsm7 =
        "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

    public static bool IsGsm7(string text) => text.All(c => Gsm7.Contains(c));

    public static int Count(string text)
    {
        var gsm = IsGsm7(text);
        var single = gsm ? 160 : 70;
        var multi = gsm ? 153 : 67;
        return text.Length <= single ? 1 : (text.Length + multi - 1) / multi;
    }
}
