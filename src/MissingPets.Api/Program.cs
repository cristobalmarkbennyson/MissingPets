using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using MissingPets.Api.Api;
using MissingPets.Api.Data;
using MissingPets.Api.Domain;
using MissingPets.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddOptions<MissingPetsOptions>()
    .Bind(builder.Configuration.GetSection(MissingPetsOptions.SectionName))
    .ValidateDataAnnotations();
builder.Services.AddOptions<GoogleMapsOptions>()
    .Bind(builder.Configuration.GetSection(GoogleMapsOptions.SectionName));
builder.Services.AddOptions<StorageOptions>()
    .Bind(builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.AddOptions<CorsOptions>()
    .Bind(builder.Configuration.GetSection(CorsOptions.SectionName));
builder.Services.AddOptions<ModerationOptions>()
    .Bind(builder.Configuration.GetSection(ModerationOptions.SectionName));
builder.Services.AddDbContext<MissingPetsDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("MissingPetsDb"),
        npgsql => npgsql.UseNetTopologySuite()));
builder.Services.AddScoped<NearbyPostQuery>();
builder.Services.AddSingleton<PetPostValidator>();
builder.Services.AddSingleton<ManagementTokenService>();
builder.Services.AddSingleton<PublicLocationService>();
builder.Services.AddSingleton<IPhotoStorageService, LocalPhotoStorageService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapGet("/health", (
    IOptions<MissingPetsOptions> appOptions,
    IOptions<GoogleMapsOptions> mapsOptions,
    IOptions<StorageOptions> storageOptions,
    IOptions<CorsOptions> corsOptions,
    IOptions<ModerationOptions> moderationOptions) =>
{
    var config = new
    {
        appOptions.Value.DatabaseConfigured,
        mapsOptions.Value.BrowserApiKeyConfigured,
        storageOptions.Value.Provider,
        storageOptions.Value.PhotoContainer,
        corsOptions.Value.AllowedOrigins,
        moderationOptions.Value.RateLimitPolicy
    };

    return Results.Ok(new
    {
        status = "ok",
        service = "MissingPets.Api",
        config
    });
})
.WithName("Health")
.WithOpenApi();
app.MapGet("/local-photos/{uploadId}", (string uploadId, IPhotoStorageService storage) =>
{
    if (storage.TryGetStoredPhoto(uploadId, out var filePath, out var contentType))
    {
        return Results.File(filePath, contentType);
    }

    return LocalPhotoPlaceholder(uploadId);
});
app.MapGet("/local-photos/{uploadId}/{fileName}", (string uploadId, string fileName, IPhotoStorageService storage) =>
{
    if (storage.TryGetStoredPhoto(uploadId, out var filePath, out var contentType))
    {
        return Results.File(filePath, contentType);
    }

    return LocalPhotoPlaceholder(uploadId);
});
app.MapMissingPetsApi();

static IResult LocalPhotoPlaceholder(string uploadId)
{
    var safeLabel = System.Net.WebUtility.HtmlEncode(uploadId.Length > 8 ? uploadId[..8] : uploadId);
    var svg = $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="Uploaded pet photo {{safeLabel}}">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#0f766e"/>
              <stop offset="1" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
          <rect width="640" height="420" fill="url(#g)"/>
          <circle cx="250" cy="170" r="68" fill="rgba(255,255,255,.76)"/>
          <circle cx="392" cy="170" r="68" fill="rgba(255,255,255,.62)"/>
          <ellipse cx="320" cy="262" rx="118" ry="80" fill="rgba(24,32,44,.28)"/>
          <text x="320" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="white">Pet photo</text>
        </svg>
        """;

    return Results.Text(svg, "image/svg+xml");
}

app.Run();

public partial class Program;

public sealed class MissingPetsOptions
{
    public const string SectionName = "MissingPets";

    public string? DatabaseProvider { get; init; }

    public bool DatabaseConfigured => !string.IsNullOrWhiteSpace(DatabaseProvider);
}

public sealed class GoogleMapsOptions
{
    public const string SectionName = "GoogleMaps";

    public string? BrowserApiKey { get; init; }

    public bool BrowserApiKeyConfigured => !string.IsNullOrWhiteSpace(BrowserApiKey);
}

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string Provider { get; init; } = "Local";

    public string? ConnectionString { get; init; }

    public string PhotoContainer { get; init; } = "missing-pet-photos";
}

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; init; } = [];
}

public sealed class ModerationOptions
{
    public const string SectionName = "Moderation";

    public string RateLimitPolicy { get; init; } = "AnonymousWriteDefaults";
}
