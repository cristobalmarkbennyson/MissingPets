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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
app.MapMissingPetsApi();

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
