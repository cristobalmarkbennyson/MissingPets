using MissingPets.Api.Domain;
using NetTopologySuite.Geometries;

namespace MissingPets.Api.Data.Entities;

public sealed class PetPost
{
    public Guid Id { get; set; }

    public string PetName { get; set; } = string.Empty;

    public string PetType { get; set; } = string.Empty;

    public string? Accessories { get; set; }

    public string DefiningFeatures { get; set; } = string.Empty;

    public string Status { get; set; } = PetPostStatus.Missing;

    public Point LastSeenGeography { get; set; } = Point.Empty;

    public string LastSeenHumanReadable { get; set; } = string.Empty;

    public string PublicAreaLabel { get; set; } = string.Empty;

    public Point PublicApproximateGeography { get; set; } = Point.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public string ModerationState { get; set; } = Domain.ModerationState.Visible;

    public ICollection<PostPhoto> Photos { get; set; } = new List<PostPhoto>();

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public ICollection<Message> Messages { get; set; } = new List<Message>();

    public ICollection<ManagementToken> ManagementTokens { get; set; } = new List<ManagementToken>();
}
