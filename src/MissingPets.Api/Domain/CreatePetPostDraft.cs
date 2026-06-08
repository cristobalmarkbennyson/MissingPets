using NetTopologySuite.Geometries;

namespace MissingPets.Api.Domain;

public sealed record CreatePetPostDraft(
    string? PetName,
    string? PetType,
    string? DefiningFeatures,
    Point? LastSeenLocation,
    IReadOnlyCollection<string> PhotoUploadIds);
