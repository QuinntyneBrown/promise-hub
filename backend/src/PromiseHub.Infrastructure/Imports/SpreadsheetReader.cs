using System.IO.Compression;
using System.Text;
using System.Xml.Linq;
using PromiseHub.Application.Imports;

namespace PromiseHub.Infrastructure.Imports;

/// <summary>Reads CSV (UTF-8, comma, semicolon or tab, quoted fields) and XLSX (the first sheet, shared or inline strings) by content, not by file name.</summary>
public sealed class SpreadsheetReader : ISpreadsheetReader
{
    private static readonly XNamespace Main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

    public Spreadsheet? Read(byte[] content)
    {
        if (content.Length > 4 && content[0] == 'P' && content[1] == 'K')
        {
            return ReadXlsx(content);
        }
        if (content.Contains((byte)0))
        {
            return null;
        }
        string text;
        try
        {
            text = new UTF8Encoding(false, throwOnInvalidBytes: true).GetString(content).TrimStart('\uFEFF');
        }
        catch (DecoderFallbackException)
        {
            return null;
        }
        return ReadCsv(text);
    }

    private static Spreadsheet? ReadCsv(string text)
    {
        var firstLine = text.Split('\n')[0];
        var delimiter = new[] { ',', ';', '\t' }.MaxBy(d => firstLine.Count(c => c == d));
        if (!firstLine.Contains(delimiter))
        {
            return null;
        }
        var records = new List<List<string>>();
        var record = new List<string>();
        var field = new StringBuilder();
        var quoted = false;
        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];
            if (quoted)
            {
                if (c == '"' && i + 1 < text.Length && text[i + 1] == '"')
                {
                    field.Append('"');
                    i++;
                }
                else if (c == '"')
                {
                    quoted = false;
                }
                else
                {
                    field.Append(c);
                }
            }
            else if (c == '"')
            {
                quoted = true;
            }
            else if (c == delimiter)
            {
                record.Add(field.ToString());
                field.Clear();
            }
            else if (c == '\n' || c == '\r')
            {
                if (c == '\r' && i + 1 < text.Length && text[i + 1] == '\n')
                {
                    i++;
                }
                record.Add(field.ToString());
                field.Clear();
                records.Add(record);
                record = [];
            }
            else
            {
                field.Append(c);
            }
        }
        if (field.Length > 0 || record.Count > 0)
        {
            record.Add(field.ToString());
            records.Add(record);
        }
        records = [.. records.Where(r => r.Any(f => !string.IsNullOrWhiteSpace(f)))];
        return records.Count == 0 ? null : new Spreadsheet([.. records[0].Select(h => h.Trim())], [.. records.Skip(1).Select(r => (IReadOnlyList<string>)r)]);
    }

    private static Spreadsheet? ReadXlsx(byte[] content)
    {
        try
        {
            using var zip = new ZipArchive(new MemoryStream(content), ZipArchiveMode.Read);
            var sheetEntry = zip.GetEntry("xl/worksheets/sheet1.xml") ?? zip.Entries.FirstOrDefault(e => e.FullName.StartsWith("xl/worksheets/sheet", StringComparison.Ordinal));
            if (sheetEntry is null)
            {
                return null;
            }
            var shared = new List<string>();
            if (zip.GetEntry("xl/sharedStrings.xml") is { } sharedEntry)
            {
                using var s = sharedEntry.Open();
                shared = [.. XDocument.Load(s).Descendants(Main + "si").Select(si => string.Concat(si.Descendants(Main + "t").Select(t => t.Value)))];
            }
            using var stream = sheetEntry.Open();
            var rows = new List<List<string>>();
            foreach (var row in XDocument.Load(stream).Descendants(Main + "row"))
            {
                var cells = new List<string>();
                foreach (var cell in row.Elements(Main + "c"))
                {
                    var column = Column((string?)cell.Attribute("r"));
                    while (column >= 0 && cells.Count < column)
                    {
                        cells.Add(string.Empty);
                    }
                    var type = (string?)cell.Attribute("t");
                    var value = type switch
                    {
                        "inlineStr" => string.Concat(cell.Descendants(Main + "t").Select(t => t.Value)),
                        "s" when int.TryParse(cell.Element(Main + "v")?.Value, out var index) && index < shared.Count => shared[index],
                        _ => cell.Element(Main + "v")?.Value ?? string.Empty,
                    };
                    cells.Add(value);
                }
                rows.Add(cells);
            }
            rows = [.. rows.Where(r => r.Any(f => !string.IsNullOrWhiteSpace(f)))];
            return rows.Count == 0 ? null : new Spreadsheet([.. rows[0].Select(h => h.Trim())], [.. rows.Skip(1).Select(r => (IReadOnlyList<string>)r)]);
        }
        catch (InvalidDataException)
        {
            return null;
        }
        catch (System.Xml.XmlException)
        {
            return null;
        }
    }

    /// <summary>"C7" is column 2.</summary>
    private static int Column(string? reference)
    {
        if (string.IsNullOrEmpty(reference))
        {
            return -1;
        }
        var column = 0;
        foreach (var c in reference.TakeWhile(char.IsLetter))
        {
            column = column * 26 + (char.ToUpperInvariant(c) - 'A' + 1);
        }
        return column - 1;
    }
}
