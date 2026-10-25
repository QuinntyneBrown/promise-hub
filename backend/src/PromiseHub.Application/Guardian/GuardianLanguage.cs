namespace PromiseHub.Application.Guardian;

public static class GuardianLanguage
{
    /// <summary>The page language for a household language: "es" for Spanish, "fr" for French, "en" otherwise.</summary>
    public static string Code(string language) => language switch
    {
        "Spanish" => "es",
        "French" => "fr",
        _ => "en",
    };
}
