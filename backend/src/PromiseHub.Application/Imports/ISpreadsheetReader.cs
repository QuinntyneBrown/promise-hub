namespace PromiseHub.Application.Imports;

/// <summary>Reads a CSV or XLSX file into a header and rows; null when the file is neither.</summary>
public interface ISpreadsheetReader
{
    Spreadsheet? Read(byte[] content);
}
