using System.Globalization;
using System.Text;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A one-page PDF of a pre-filled form for a program the guardian sends themselves (L2-156 criterion 2): a title and lines of Helvetica text,
/// written without a library. Never carries a full SIN; the boxes are left for the guardian.
/// </summary>
public static class LearningBondFormPdf
{
    public static byte[] Render(string title, IReadOnlyList<string> lines)
    {
        var text = new StringBuilder();
        text.Append("BT /F1 18 Tf 50 742 Td (").Append(Escape(title)).Append(") Tj ET\n");
        text.Append("BT /F1 11 Tf 50 712 Td 16 TL\n");
        foreach (var line in lines)
        {
            text.Append('(').Append(Escape(line)).Append(") Tj T*\n");
        }
        text.Append("ET\n");
        var stream = Encoding.Latin1.GetBytes(text.ToString());
        var objects = new List<byte[]>
        {
            Encoding.Latin1.GetBytes("<< /Type /Catalog /Pages 2 0 R >>"),
            Encoding.Latin1.GetBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
            Encoding.Latin1.GetBytes("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"),
            Join(Encoding.Latin1.GetBytes($"<< /Length {stream.Length} >>\nstream\n"), stream, Encoding.Latin1.GetBytes("endstream")),
            Encoding.Latin1.GetBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
        };
        using var pdf = new MemoryStream();
        void Write(string s) => pdf.Write(Encoding.Latin1.GetBytes(s));
        Write("%PDF-1.4\n");
        var offsets = new List<long>();
        for (var i = 0; i < objects.Count; i++)
        {
            offsets.Add(pdf.Position);
            Write($"{i + 1} 0 obj\n");
            pdf.Write(objects[i]);
            Write("\nendobj\n");
        }
        var xref = pdf.Position;
        Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets)
        {
            Write($"{offset.ToString("D10", CultureInfo.InvariantCulture)} 00000 n \n");
        }
        Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n");
        return pdf.ToArray();
    }

    private static byte[] Join(params byte[][] parts) => [.. parts.SelectMany(p => p)];

    // WinAnsi text: typographic quotes become plain ones, anything else outside Latin-1 becomes "?", and PDF's delimiters are escaped.
    private static string Escape(string value)
    {
        var plain = value.Replace('’', '\'').Replace('‘', '\'').Replace('“', '"').Replace('”', '"').Replace('–', '-').Replace('—', '-').Replace('·', '-');
        var latin = new string([.. plain.Select(c => c > 255 ? '?' : c)]);
        return latin.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("(", "\\(", StringComparison.Ordinal).Replace(")", "\\)", StringComparison.Ordinal);
    }
}
