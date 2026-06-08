namespace MissingPets.Api.Data.Entities;

public sealed class PostPhoto
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public PetPost? Post { get; set; }

    public string ObjectKey { get; set; } = string.Empty;

    public string DisplayUrl { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string ScanState { get; set; } = "NotScanned";
}
