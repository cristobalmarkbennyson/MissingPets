using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MissingPets.Api.Data;

public sealed class MissingPetsDbContextFactory : IDesignTimeDbContextFactory<MissingPetsDbContext>
{
    public MissingPetsDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__MissingPetsDb")
            ?? "Host=localhost;Port=55432;Database=missingpets;Username=postgres";

        var options = new DbContextOptionsBuilder<MissingPetsDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.UseNetTopologySuite())
            .Options;

        return new MissingPetsDbContext(options);
    }
}
