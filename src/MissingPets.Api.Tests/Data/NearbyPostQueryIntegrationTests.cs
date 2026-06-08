using Microsoft.EntityFrameworkCore;
using MissingPets.Api.Data;
using MissingPets.Api.Data.Entities;
using MissingPets.Api.Domain;
using NetTopologySuite.Geometries;
using Npgsql;

namespace MissingPets.Api.Tests.Data;

[Category("Integration")]
public sealed class NearbyPostQueryIntegrationTests
{
    private const string TestDatabaseName = "missingpets_phase2_tests";
    private const string AdminConnectionString = "Host=localhost;Port=55432;Database=postgres;Username=postgres";
    private const string TestConnectionString = $"Host=localhost;Port=55432;Database={TestDatabaseName};Username=postgres";

    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using (var terminate = new NpgsqlCommand(
            $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{TestDatabaseName}'",
            connection))
        {
            await terminate.ExecuteNonQueryAsync();
        }

        await using (var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS {TestDatabaseName}", connection))
        {
            await drop.ExecuteNonQueryAsync();
        }

        await using (var create = new NpgsqlCommand($"CREATE DATABASE {TestDatabaseName}", connection))
        {
            await create.ExecuteNonQueryAsync();
        }

        await using var dbContext = CreateDbContext();
        await dbContext.Database.MigrateAsync();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
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

    [SetUp]
    public async Task SetUp()
    {
        await using var dbContext = CreateDbContext();
        dbContext.Posts.RemoveRange(dbContext.Posts);
        await dbContext.SaveChangesAsync();
    }

    [Test]
    public async Task SearchAsync_FiltersByRadiusTypeStatusAndNearestSort()
    {
        await using var dbContext = CreateDbContext();
        var now = DateTimeOffset.UtcNow;
        var viewer = Point(121.0318, 14.5653);

        var nearDog = Post("Luna", "Dog", PetPostStatus.Missing, Point(121.0320, 14.5655), now);
        var nearerCat = Post("Miso", "Cat", PetPostStatus.Missing, Point(121.0319, 14.5654), now.AddMinutes(1));
        var farDog = Post("Bruno", "Dog", PetPostStatus.Missing, Point(121.22, 14.72), now.AddMinutes(2));
        var foundDog = Post("Found pup", "Dog", PetPostStatus.Found, Point(121.0321, 14.5656), now.AddMinutes(3));

        dbContext.Posts.AddRange(nearDog, nearerCat, farDog, foundDog);
        await dbContext.SaveChangesAsync();

        var query = new NearbyPostQuery(dbContext);
        var results = await query.SearchAsync(new NearbyPostSearch(
            viewer,
            RadiusKm: 10,
            PetType: "Dog",
            Status: PetPostStatus.Missing,
            Sort: "Nearest"));

        Assert.Multiple(() =>
        {
            Assert.That(results.Select(result => result.PostId), Is.EqualTo(new[] { nearDog.Id }));
            Assert.That(results.Single().DistanceKm, Is.LessThan(0.1));
        });
    }

    [Test]
    public async Task SearchAsync_NewestSortOrdersByCreatedAt()
    {
        await using var dbContext = CreateDbContext();
        var viewer = Point(121.0318, 14.5653);
        var oldPost = Post("Old", "Dog", PetPostStatus.Missing, Point(121.0320, 14.5655), DateTimeOffset.UtcNow.AddHours(-2));
        var newPost = Post("New", "Dog", PetPostStatus.Missing, Point(121.0330, 14.5660), DateTimeOffset.UtcNow);

        dbContext.Posts.AddRange(oldPost, newPost);
        await dbContext.SaveChangesAsync();

        var query = new NearbyPostQuery(dbContext);
        var results = await query.SearchAsync(new NearbyPostSearch(viewer, RadiusKm: 10, PetType: "Dog", Sort: "Newest"));

        Assert.That(results.Select(result => result.PostId), Is.EqualTo(new[] { newPost.Id, oldPost.Id }));
    }

    private static MissingPetsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<MissingPetsDbContext>()
            .UseNpgsql(TestConnectionString, npgsql => npgsql.UseNetTopologySuite())
            .Options;

        return new MissingPetsDbContext(options);
    }

    private static PetPost Post(string name, string type, string status, Point location, DateTimeOffset createdAt)
    {
        return new PetPost
        {
            Id = Guid.NewGuid(),
            PetName = name,
            PetType = type,
            DefiningFeatures = "Phase 2 integration test post.",
            Status = status,
            LastSeenGeography = location,
            LastSeenHumanReadable = "Makati",
            PublicAreaLabel = "Makati",
            PublicApproximateGeography = location,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            ModerationState = ModerationState.Visible,
            Photos =
            [
                new PostPhoto
                {
                    Id = Guid.NewGuid(),
                    ObjectKey = $"posts/{name}/photo.jpg",
                    DisplayUrl = $"https://example.test/{name}.jpg",
                    CreatedAt = createdAt,
                    SortOrder = 0,
                    ScanState = "NotScanned"
                }
            ],
            ManagementTokens =
            [
                new ManagementToken
                {
                    Id = Guid.NewGuid(),
                    TokenHash = Guid.NewGuid().ToString("N"),
                    CreatedAt = createdAt
                }
            ]
        };
    }

    private static Point Point(double longitude, double latitude)
    {
        return new Point(longitude, latitude) { SRID = 4326 };
    }
}
