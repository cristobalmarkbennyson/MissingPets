using Microsoft.EntityFrameworkCore;

namespace MissingPets.Api.Data;

public sealed class NearbyPostQuery(MissingPetsDbContext dbContext)
{
    public async Task<IReadOnlyList<NearbyPostResult>> SearchAsync(NearbyPostSearch search, CancellationToken cancellationToken = default)
    {
        var radiusMeters = search.RadiusKm * 1000d;
        var query = dbContext.Posts
            .AsNoTracking()
            .Where(post => post.LastSeenGeography.Distance(search.ViewerLocation) <= radiusMeters);

        if (!string.IsNullOrWhiteSpace(search.Status) && !string.Equals(search.Status, "Any", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(post => post.Status == search.Status);
        }

        if (!string.IsNullOrWhiteSpace(search.PetType) && !string.Equals(search.PetType, "Any", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(post => post.PetType == search.PetType);
        }

        query = string.Equals(search.Sort, "Newest", StringComparison.OrdinalIgnoreCase)
            ? query.OrderByDescending(post => post.CreatedAt)
            : query.OrderBy(post => post.LastSeenGeography.Distance(search.ViewerLocation));

        return await query
            .Select(post => new NearbyPostResult(
                post.Id,
                post.PetName,
                post.LastSeenGeography.Distance(search.ViewerLocation) / 1000d))
            .ToListAsync(cancellationToken);
    }
}
