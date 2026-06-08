namespace MissingPets.Api.Data.Entities;

public sealed class ManagementToken
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public PetPost? Post { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTimeOffset? ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? LastUsedAt { get; set; }
}
