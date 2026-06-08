using MissingPets.Api.Data.Entities;
using MissingPets.Api.Domain;
using NetTopologySuite.Geometries;

namespace MissingPets.Api.Data;

public sealed record NearbyPostSearch(
    Point ViewerLocation,
    double RadiusKm,
    string? PetType = null,
    string Status = PetPostStatus.Missing,
    string Sort = "Nearest");

public sealed record NearbyPostResult(Guid PostId, string PetName, double DistanceKm);
