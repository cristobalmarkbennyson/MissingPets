namespace MissingPets.Api.Storage;

public sealed record PhotoUploadDescriptor(string FileName, string ContentType, long SizeBytes);

public sealed record PhotoUploadTicket(string UploadId, string ObjectKey, string DisplayUrl);

public interface IPhotoStorageService
{
    PhotoUploadTicket CreateUpload(PhotoUploadDescriptor descriptor);
    Task<PhotoUploadTicket> StoreUploadAsync(PhotoUploadDescriptor descriptor, Stream content, CancellationToken cancellationToken);
    bool TryGetStoredPhoto(string uploadId, out string filePath, out string contentType);
}

public sealed class LocalPhotoStorageService : IPhotoStorageService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif"
    };

    private const long MaxFileSizeBytes = 8 * 1024 * 1024;
    private readonly string _storageRoot = Path.Combine(AppContext.BaseDirectory, "local-photos");

    public PhotoUploadTicket CreateUpload(PhotoUploadDescriptor descriptor)
    {
        Validate(descriptor);
        return CreateTicket(descriptor);
    }

    public async Task<PhotoUploadTicket> StoreUploadAsync(PhotoUploadDescriptor descriptor, Stream content, CancellationToken cancellationToken)
    {
        Validate(descriptor);
        var ticket = CreateTicket(descriptor);
        var uploadDirectory = Path.Combine(_storageRoot, ticket.UploadId);
        Directory.CreateDirectory(uploadDirectory);

        var filePath = Path.Combine(uploadDirectory, Path.GetFileName(descriptor.FileName));
        await using var file = File.Create(filePath);
        await content.CopyToAsync(file, cancellationToken);

        return ticket;
    }

    public bool TryGetStoredPhoto(string uploadId, out string filePath, out string contentType)
    {
        filePath = string.Empty;
        contentType = string.Empty;

        if (string.IsNullOrWhiteSpace(uploadId))
        {
            return false;
        }

        var uploadDirectory = Path.Combine(_storageRoot, Path.GetFileName(uploadId));
        if (!Directory.Exists(uploadDirectory))
        {
            return false;
        }

        var storedFile = Directory.EnumerateFiles(uploadDirectory).FirstOrDefault();
        if (storedFile is null)
        {
            return false;
        }

        filePath = storedFile;
        contentType = ContentTypeFromExtension(Path.GetExtension(storedFile));
        return true;
    }

    private static void Validate(PhotoUploadDescriptor descriptor)
    {
        if (string.IsNullOrWhiteSpace(descriptor.FileName))
        {
            throw new PhotoUploadValidationException("File name is required.");
        }

        if (!AllowedContentTypes.Contains(descriptor.ContentType))
        {
            throw new PhotoUploadValidationException("Photo content type must be image/jpeg, image/png, image/webp, image/gif, image/heic, or image/heif.");
        }

        if (descriptor.SizeBytes <= 0 || descriptor.SizeBytes > MaxFileSizeBytes)
        {
            throw new PhotoUploadValidationException("Photo size must be between 1 byte and 8 MB.");
        }
    }

    private static PhotoUploadTicket CreateTicket(PhotoUploadDescriptor descriptor)
    {
        var uploadId = $"upload_{Guid.NewGuid():N}";
        var safeFileName = Path.GetFileName(descriptor.FileName);
        var objectKey = $"local-uploads/{uploadId}/{safeFileName}";

        return new PhotoUploadTicket(uploadId, objectKey, $"/local-photos/{uploadId}/{safeFileName}");
    }

    private static string ContentTypeFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".heic" => "image/heic",
            ".heif" => "image/heif",
            _ => "application/octet-stream"
        };
    }
}

public sealed class PhotoUploadValidationException(string message) : Exception(message);
