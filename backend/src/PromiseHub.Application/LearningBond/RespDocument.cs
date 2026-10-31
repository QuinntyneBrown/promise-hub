namespace PromiseHub.Application.LearningBond;

/// <summary>A document as it goes to the provider (L2-150 criterion 6): decrypted only on the guardian's Send, never logged.</summary>
public sealed record RespDocument(Guid Key, string Provider, string Channel, string? ApplicationReference, string Name, string FileName, string ContentType,
    byte[] Content)
{
    /// <summary>Never the contents, should a document ever be written out.</summary>
    public override string ToString() => $"RespDocument {{ Key = {Key}, Provider = {Provider}, Name = {Name} }}";
}
