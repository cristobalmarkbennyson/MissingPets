namespace MissingPets.Api.Storage;

public sealed record PhotoUploadDescriptor(string FileName, string ContentType, long SizeBytes);

public sealed record PhotoUploadTicket(string UploadId, string ObjectKey, string DisplayUrl);

public interface IPhotoStorageService
{
    PhotoUploadTicket CreateUpload(PhotoUploadDescriptor descriptor);
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

    public PhotoUploadTicket CreateUpload(PhotoUploadDescriptor descriptor)
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

        var uploadId = $"upload_{Guid.NewGuid():N}";
        var safeFileName = Path.GetFileName(descriptor.FileName);
        var objectKey = $"local-uploads/{uploadId}/{safeFileName}";

        return new PhotoUploadTicket(uploadId, objectKey, $"/local-photos/{uploadId}/{safeFileName}");
    }
}

public sealed class PhotoUploadValidationException(string message) : Exception(message);
