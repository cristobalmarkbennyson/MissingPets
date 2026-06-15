using Microsoft.EntityFrameworkCore;
using MissingPets.Api.Data;
using MissingPets.Api.Data.Entities;
using MissingPets.Api.Domain;
using MissingPets.Api.Storage;
using NetTopologySuite.Geometries;

namespace MissingPets.Api.Api;

public static class MissingPetsEndpoints
{
    public static RouteGroupBuilder MapMissingPetsApi(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api");

        group.MapGet("/posts", GetPosts);
        group.MapPost("/photo-uploads", CreatePhotoUpload);
        group.MapPost("/posts", CreatePost);
        group.MapGet("/posts/{postId:guid}", GetPostDetail);
        group.MapGet("/posts/{postId:guid}/comments", GetComments);
        group.MapPost("/posts/{postId:guid}/comments", CreateComment);
        group.MapPost("/posts/{postId:guid}/messages", CreateMessage);
        group.MapGet("/posts/{postId:guid}/management", GetManagement);
        group.MapPatch("/posts/{postId:guid}/management", PatchManagement);
        group.MapPost("/reports", CreateReport);

        return group;
    }

    private static async Task<IResult> GetPosts(
        MissingPetsDbContext dbContext,
        double lat,
        double lng,
        double radiusKm = 10,
        string? type = null,
        string status = PetPostStatus.Missing,
        string sort = "Nearest",
        CancellationToken cancellationToken = default)
    {
        if (radiusKm <= 0 || radiusKm > 100)
        {
            return Results.BadRequest(new { error = "radiusKm must be between 0 and 100." });
        }

        var viewer = Point(lng, lat);
        var radiusMeters = radiusKm * 1000d;
        var query = dbContext.Posts
            .AsNoTracking()
            .Include(post => post.Photos.OrderBy(photo => photo.SortOrder))
            .Where(post => post.LastSeenGeography.Distance(viewer) <= radiusMeters);

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "Any", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(post => post.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "Any", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(post => post.PetType == type);
        }

        query = string.Equals(sort, "Newest", StringComparison.OrdinalIgnoreCase)
            ? query.OrderByDescending(post => post.CreatedAt)
            : query.OrderBy(post => post.LastSeenGeography.Distance(viewer));

        var items = await query
            .Select(post => new FeedPostDto(
                post.Id,
                post.PetName,
                post.PetType,
                post.Status,
                post.PublicAreaLabel,
                post.LastSeenGeography.Distance(viewer) / 1000d,
                post.CreatedAt,
                post.Photos.OrderBy(photo => photo.SortOrder).Select(photo => photo.DisplayUrl).FirstOrDefault(),
                post.DefiningFeatures.Length <= 140 ? post.DefiningFeatures : post.DefiningFeatures.Substring(0, 140)))
            .ToListAsync(cancellationToken);

        return Results.Ok(new FeedResponse(items));
    }

    private static async Task<IResult> CreatePhotoUpload(HttpRequest request, IPhotoStorageService storage, CancellationToken cancellationToken)
    {
        try
        {
            PhotoUploadTicket ticket;
            if (request.HasFormContentType)
            {
                var form = await request.ReadFormAsync(cancellationToken);
                var file = form.Files.GetFile("file");
                if (file is null)
                {
                    return Results.BadRequest(new { error = "Photo file is required." });
                }

                await using var stream = file.OpenReadStream();
                ticket = await storage.StoreUploadAsync(
                    new PhotoUploadDescriptor(file.FileName, file.ContentType, file.Length),
                    stream,
                    cancellationToken);
            }
            else
            {
                var uploadRequest = await request.ReadFromJsonAsync<PhotoUploadRequest>(cancellationToken);
                if (uploadRequest is null)
                {
                    return Results.BadRequest(new { error = "Photo upload metadata is required." });
                }

                ticket = storage.CreateUpload(new PhotoUploadDescriptor(uploadRequest.FileName, uploadRequest.ContentType, uploadRequest.SizeBytes));
            }

            return Results.Ok(new PhotoUploadResponse(ticket.UploadId, ticket.ObjectKey, ticket.DisplayUrl));
        }
        catch (PhotoUploadValidationException ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> CreatePost(
        CreatePostRequest request,
        MissingPetsDbContext dbContext,
        PetPostValidator validator,
        PublicLocationService locationService,
        ManagementTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var preciseLocation = Point(request.LastSeen.Lng, request.LastSeen.Lat);
        var errors = validator.Validate(new CreatePetPostDraft(
            request.PetName,
            request.PetType,
            request.DefiningFeatures,
            preciseLocation,
            request.PhotoUploadIds));

        if (errors.Count > 0)
        {
            return Results.BadRequest(new { errors });
        }

        if (request.PhotoUploadIds.Count > 6)
        {
            return Results.BadRequest(new { error = "A post can include at most 6 photos." });
        }

        var now = DateTimeOffset.UtcNow;
        var publicLocation = locationService.Approximate(preciseLocation, request.LastSeen.HumanReadable);
        var postId = Guid.NewGuid();
        var token = tokenService.GenerateToken();

        var post = new PetPost
        {
            Id = postId,
            PetName = request.PetName!.Trim(),
            PetType = request.PetType!.Trim(),
            Accessories = string.IsNullOrWhiteSpace(request.Accessories) ? null : request.Accessories.Trim(),
            DefiningFeatures = request.DefiningFeatures!.Trim(),
            Status = PetPostStatus.Missing,
            LastSeenGeography = preciseLocation,
            LastSeenHumanReadable = request.LastSeen.HumanReadable.Trim(),
            PublicAreaLabel = publicLocation.PublicAreaLabel,
            PublicApproximateGeography = publicLocation.ApproximateCenter,
            CreatedAt = now,
            UpdatedAt = now,
            Photos = request.PhotoUploadIds.Select((uploadId, index) => new PostPhoto
            {
                Id = Guid.NewGuid(),
                ObjectKey = $"uploads/{uploadId}",
                DisplayUrl = $"/local-photos/{uploadId}",
                SortOrder = index,
                CreatedAt = now
            }).ToList(),
            ManagementTokens =
            [
                new ManagementToken
                {
                    Id = Guid.NewGuid(),
                    TokenHash = tokenService.HashToken(token),
                    CreatedAt = now
                }
            ]
        };

        dbContext.Posts.Add(post);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/posts/{postId}", new CreatePostResponse(
            postId,
            token,
            $"/posts/{postId}/manage?token={Uri.EscapeDataString(token)}"));
    }

    private static async Task<IResult> GetPostDetail(
        Guid postId,
        MissingPetsDbContext dbContext,
        double? viewerLat = null,
        double? viewerLng = null,
        CancellationToken cancellationToken = default)
    {
        var post = await dbContext.Posts
            .AsNoTracking()
            .Include(item => item.Photos)
            .SingleOrDefaultAsync(item => item.Id == postId, cancellationToken);

        if (post is null)
        {
            return Results.NotFound();
        }

        double? distanceKm = null;
        if (viewerLat.HasValue && viewerLng.HasValue)
        {
            distanceKm = post.LastSeenGeography.Distance(Point(viewerLng.Value, viewerLat.Value)) / 1000d;
        }

        return Results.Ok(new PostDetailResponse(
            post.Id,
            post.PetName,
            post.PetType,
            post.Accessories,
            post.DefiningFeatures,
            post.Status,
            post.PublicAreaLabel,
            new MapAreaDto(post.PublicApproximateGeography.Y, post.PublicApproximateGeography.X),
            distanceKm,
            post.CreatedAt,
            post.Photos.OrderBy(photo => photo.SortOrder).Select(photo => new PhotoDto(photo.Id, photo.DisplayUrl, photo.SortOrder)).ToList()));
    }

    private static async Task<IResult> GetComments(Guid postId, MissingPetsDbContext dbContext, CancellationToken cancellationToken)
    {
        var comments = await dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.PostId == postId)
            .OrderBy(comment => comment.CreatedAt)
            .Select(comment => new CommentDto(comment.Id, comment.Body, comment.AnonymousDisplayName, comment.CreatedAt))
            .ToListAsync(cancellationToken);

        return Results.Ok(comments);
    }

    private static async Task<IResult> CreateComment(Guid postId, CreateCommentRequest request, MissingPetsDbContext dbContext, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return Results.BadRequest(new { error = "Comment body is required." });
        }

        if (!await dbContext.Posts.AnyAsync(post => post.Id == postId, cancellationToken))
        {
            return Results.NotFound();
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            Body = request.Body.Trim(),
            AnonymousDisplayName = string.IsNullOrWhiteSpace(request.AnonymousDisplayName) ? "Anonymous helper" : request.AnonymousDisplayName.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Comments.Add(comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/posts/{postId}/comments", new CommentDto(comment.Id, comment.Body, comment.AnonymousDisplayName, comment.CreatedAt));
    }

    private static async Task<IResult> CreateMessage(Guid postId, CreateMessageRequest request, MissingPetsDbContext dbContext, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return Results.BadRequest(new { error = "Message body is required." });
        }

        if (!await dbContext.Posts.AnyAsync(post => post.Id == postId, cancellationToken))
        {
            return Results.NotFound();
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            Body = request.Body.Trim(),
            SenderContact = string.IsNullOrWhiteSpace(request.SenderContact) ? null : request.SenderContact.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Messages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/posts/{postId}/messages/{message.Id}", new CreateMessageResponse(message.Id));
    }

    private static async Task<IResult> GetManagement(Guid postId, string token, MissingPetsDbContext dbContext, ManagementTokenService tokenService, CancellationToken cancellationToken)
    {
        var post = await LoadManagedPost(postId, token, dbContext, tokenService, cancellationToken);
        return post is null ? Results.Unauthorized() : Results.Ok(new ManagementResponse(post.Id, post.PetName, post.Status));
    }

    private static async Task<IResult> PatchManagement(Guid postId, string token, ManagementPatchRequest request, MissingPetsDbContext dbContext, ManagementTokenService tokenService, CancellationToken cancellationToken)
    {
        if (request.Status is not (PetPostStatus.Missing or PetPostStatus.Found))
        {
            return Results.BadRequest(new { error = "Status must be Missing or Found." });
        }

        var post = await LoadManagedPost(postId, token, dbContext, tokenService, cancellationToken);
        if (post is null)
        {
            return Results.Unauthorized();
        }

        post.Status = request.Status;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new ManagementResponse(post.Id, post.PetName, post.Status));
    }

    private static async Task<IResult> CreateReport(AbuseReportRequest request, MissingPetsDbContext dbContext, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TargetType) || string.IsNullOrWhiteSpace(request.Reason))
        {
            return Results.BadRequest(new { error = "Target type and reason are required." });
        }

        if (request.TargetType is not ("Post" or "Comment" or "Message"))
        {
            return Results.BadRequest(new { error = "Target type must be Post, Comment, or Message." });
        }

        var report = new AbuseReport
        {
            Id = Guid.NewGuid(),
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            Reason = request.Reason.Trim(),
            Details = string.IsNullOrWhiteSpace(request.Details) ? null : request.Details.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.AbuseReports.Add(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/reports/{report.Id}", new AbuseReportResponse(report.Id));
    }

    private static async Task<PetPost?> LoadManagedPost(Guid postId, string token, MissingPetsDbContext dbContext, ManagementTokenService tokenService, CancellationToken cancellationToken)
    {
        var post = await dbContext.Posts
            .Include(item => item.ManagementTokens)
            .SingleOrDefaultAsync(item => item.Id == postId, cancellationToken);

        if (post is null || !post.ManagementTokens.Any(item => tokenService.VerifyToken(token, item.TokenHash)))
        {
            return null;
        }

        return post;
    }

    private static Point Point(double longitude, double latitude)
    {
        return new Point(longitude, latitude) { SRID = 4326 };
    }
}
