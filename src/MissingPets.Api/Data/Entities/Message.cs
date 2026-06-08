using MissingPets.Api.Domain;

namespace MissingPets.Api.Data.Entities;

public sealed class Message
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public PetPost? Post { get; set; }

    public string Body { get; set; } = string.Empty;

    public string? SenderContact { get; set; }

    public string ModerationState { get; set; } = Domain.ModerationState.Visible;

    public DateTimeOffset CreatedAt { get; set; }
}
