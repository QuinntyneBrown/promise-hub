namespace PromiseHub.Domain.Households;

/// <summary>Splits a full name into first and last at the first space.</summary>
public static class PersonName
{
    public static (string First, string Last) Split(string fullName)
    {
        var name = fullName.Trim();
        var space = name.IndexOf(' ');
        return space < 0 ? (name, string.Empty) : (name[..space], name[(space + 1)..].Trim());
    }
}
