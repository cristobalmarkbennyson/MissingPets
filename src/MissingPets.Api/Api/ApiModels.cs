namespace MissingPets.Api.Api;

public sealed record FeedResponse(IReadOnlyList<FeedPostDto> Items);

public sealed record FeedPostDto(
    Guid Id,
    string PetName,
    string PetType,
    string Status,
    string ApproximateArea,
    double DistanceKm,
    DateTimeOffset CreatedAt,
    string? PrimaryPhotoUrl,
    string DefiningFeatureSummary);

public sealed record PhotoUploadRequest(string FileName, string ContentType, long SizeBytes);

public sealed record PhotoUploadResponse(string UploadId, string ObjectKey, string DisplayUrl);

public sealed record CreatePostRequest(
    string? PetName,
    string? PetType,
    string? Accessories,
    string? DefiningFeatures,
    LastSeenRequest LastSeen,
    IReadOnlyList<string> PhotoUploadIds,
    ContactPreferenceRequest? ContactPreference);

public sealed record LastSeenRequest(double Lat, double Lng, string HumanReadable);

public sealed record ContactPreferenceRequest(bool AllowMessages);

public sealed record CreatePostResponse(Guid PostId, string ManagementToken, string ManagementUrl);

public sealed record PostDetailResponse(
    Guid Id,
    string PetName,
    string PetType,
    string? Accessories,
    string DefiningFeatures,
    string Status,
    string ApproximateArea,
    MapAreaDto ApproximateMap,
    double? DistanceKm,
    DateTimeOffset CreatedAt,
    IReadOnlyList<PhotoDto> Photos);

public sealed record MapAreaDto(double Lat, double Lng);

public sealed record PhotoDto(Guid Id, string DisplayUrl, int SortOrder);

public sealed record CommentDto(Guid Id, string Body, string AnonymousDisplayName, DateTimeOffset CreatedAt);

public sealed record CreateCommentRequest(string? Body, string? AnonymousDisplayName);

public sealed record CreateMessageRequest(string? Body, string? SenderContact);

public sealed record CreateMessageResponse(Guid MessageId);

public sealed record ManagementResponse(Guid PostId, string PetName, string Status);

public sealed record ManagementPatchRequest(string? Status);

public sealed record AbuseReportRequest(string? TargetType, Guid TargetId, string? Reason, string? Details);

public sealed record AbuseReportResponse(Guid ReportId);
