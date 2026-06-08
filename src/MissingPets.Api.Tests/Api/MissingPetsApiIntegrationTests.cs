using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MissingPets.Api.Api;
using MissingPets.Api.Data;
using MissingPets.Api.Domain;
using Npgsql;

namespace MissingPets.Api.Tests.Api;

[Category("Integration")]
public sealed class MissingPetsApiIntegrationTests
{
    private const string TestDatabaseName = "missingpets_phase3_tests";
    private const string AdminConnectionString = "Host=localhost;Port=55432;Database=postgres;Username=postgres";
    private const string TestConnectionString = $"Host=localhost;Port=55432;Database={TestDatabaseName};Username=postgres";

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        await RecreateDatabase();
        await using var dbContext = CreateDbContext();
        await dbContext.Database.MigrateAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:MissingPetsDb"] = TestConnectionString
                    });
                });
            });
        _client = _factory.CreateClient();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await DropDatabase();
    }

    [SetUp]
    public async Task SetUp()
    {
        await using var dbContext = CreateDbContext();
        dbContext.AbuseReports.RemoveRange(dbContext.AbuseReports);
        dbContext.Posts.RemoveRange(dbContext.Posts);
        await dbContext.SaveChangesAsync();
    }

    [Test]
    public async Task PostLifecycle_ImplementsPhaseThreeContracts()
    {
        var upload = await CreateUpload();
        var createResponse = await _client.PostAsJsonAsync("/api/posts", new CreatePostRequest(
            "Luna",
            "Dog",
            "Pink collar",
            "Cream Shih Tzu with small limp.",
            new LastSeenRequest(14.5653, 121.0318, "Poblacion, Makati"),
            [upload.UploadId],
            new ContactPreferenceRequest(true)));

        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = await createResponse.Content.ReadFromJsonAsync<CreatePostResponse>();
        Assert.That(created, Is.Not.Null);

        var feed = await _client.GetFromJsonAsync<FeedResponse>("/api/posts?lat=14.5653&lng=121.0318&radiusKm=10&type=Dog&status=Missing&sort=Nearest");
        Assert.That(feed!.Items.Select(item => item.Id), Does.Contain(created!.PostId));
        Assert.That(feed.Items.Single(item => item.Id == created.PostId).PrimaryPhotoUrl, Is.EqualTo($"/local-photos/{upload.UploadId}"));

        var detail = await _client.GetFromJsonAsync<PostDetailResponse>($"/api/posts/{created.PostId}?viewerLat=14.5653&viewerLng=121.0318");
        Assert.Multiple(() =>
        {
            Assert.That(detail!.PetName, Is.EqualTo("Luna"));
            Assert.That(detail.ApproximateMap.Lat, Is.EqualTo(14.565));
            Assert.That(detail.ApproximateMap.Lng, Is.EqualTo(121.032));
            Assert.That(detail.DistanceKm, Is.Not.Null);
        });

        var commentResponse = await _client.PostAsJsonAsync($"/api/posts/{created.PostId}/comments", new CreateCommentRequest("Possible sighting near the mall.", null));
        Assert.That(commentResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var comments = await _client.GetFromJsonAsync<IReadOnlyList<CommentDto>>($"/api/posts/{created.PostId}/comments");
        Assert.That(comments, Has.Count.EqualTo(1));

        var messageResponse = await _client.PostAsJsonAsync($"/api/posts/{created.PostId}/messages", new CreateMessageRequest("I may have seen Luna.", "helper@example.test"));
        Assert.That(messageResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var message = await messageResponse.Content.ReadFromJsonAsync<CreateMessageResponse>();
        Assert.That(message!.MessageId, Is.Not.EqualTo(Guid.Empty));

        var management = await _client.GetFromJsonAsync<ManagementResponse>($"/api/posts/{created.PostId}/management?token={Uri.EscapeDataString(created.ManagementToken)}");
        Assert.That(management!.Status, Is.EqualTo(PetPostStatus.Missing));
        var patchResponse = await _client.PatchAsJsonAsync($"/api/posts/{created.PostId}/management?token={Uri.EscapeDataString(created.ManagementToken)}", new ManagementPatchRequest(PetPostStatus.Found));
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var reportResponse = await _client.PostAsJsonAsync("/api/reports", new AbuseReportRequest("Post", created.PostId, "Spam or fake post", "Looks suspicious."));
        Assert.That(reportResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
    }

    [Test]
    public async Task CreatePhotoUpload_RejectsInvalidMetadata()
    {
        var response = await _client.PostAsJsonAsync("/api/photo-uploads", new PhotoUploadRequest("luna.gif", "image/gif", 100));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Management_RejectsInvalidToken()
    {
        var upload = await CreateUpload();
        var createResponse = await _client.PostAsJsonAsync("/api/posts", new CreatePostRequest(
            "Miso",
            "Cat",
            null,
            "Gray tabby.",
            new LastSeenRequest(14.5653, 121.0318, "Makati"),
            [upload.UploadId],
            null));
        var created = await createResponse.Content.ReadFromJsonAsync<CreatePostResponse>();

        var response = await _client.GetAsync($"/api/posts/{created!.PostId}/management?token=wrong-token");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    private async Task<PhotoUploadResponse> CreateUpload()
    {
        var uploadResponse = await _client.PostAsJsonAsync("/api/photo-uploads", new PhotoUploadRequest("luna.jpg", "image/jpeg", 1024));
        Assert.That(uploadResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        return (await uploadResponse.Content.ReadFromJsonAsync<PhotoUploadResponse>())!;
    }

    private static MissingPetsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<MissingPetsDbContext>()
            .UseNpgsql(TestConnectionString, npgsql => npgsql.UseNetTopologySuite())
            .Options;

        return new MissingPetsDbContext(options);
    }

    private static async Task RecreateDatabase()
    {
        await DropDatabase();
        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using var create = new NpgsqlCommand($"CREATE DATABASE {TestDatabaseName}", connection);
        await create.ExecuteNonQueryAsync();
    }

    private static async Task DropDatabase()
    {
        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using (var terminate = new NpgsqlCommand(
            $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{TestDatabaseName}'",
            connection))
        {
            await terminate.ExecuteNonQueryAsync();
        }

        await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS {TestDatabaseName}", connection);
        await drop.ExecuteNonQueryAsync();
    }
}
