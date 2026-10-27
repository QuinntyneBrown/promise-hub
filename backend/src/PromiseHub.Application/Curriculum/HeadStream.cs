namespace PromiseHub.Application.Curriculum;

/// <summary>A read-only stream that replays the bytes already read to check a file's signature, then the rest of the upload.</summary>
public sealed class HeadStream(ReadOnlyMemory<byte> head, Stream rest) : Stream
{
    private int _offset;

    public override bool CanRead => true;
    public override bool CanSeek => false;
    public override bool CanWrite => false;
    public override long Length => throw new NotSupportedException();
    public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }

    public override int Read(byte[] buffer, int offset, int count) => Read(buffer.AsSpan(offset, count));

    public override int Read(Span<byte> buffer)
    {
        if (_offset < head.Length)
        {
            var n = Math.Min(buffer.Length, head.Length - _offset);
            head.Span.Slice(_offset, n).CopyTo(buffer);
            _offset += n;
            return n;
        }
        return rest.Read(buffer);
    }

    public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
    {
        if (_offset < head.Length)
        {
            var n = Math.Min(buffer.Length, head.Length - _offset);
            head.Slice(_offset, n).CopyTo(buffer);
            _offset += n;
            return n;
        }
        return await rest.ReadAsync(buffer, cancellationToken);
    }

    public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
        ReadAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();

    public override void Flush()
    {
    }

    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

    public override void SetLength(long value) => throw new NotSupportedException();

    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
}
