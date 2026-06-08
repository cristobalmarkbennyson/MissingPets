namespace MissingPets.Api.Data.Entities;

public sealed class AbuseReport
{
    public Guid Id { get; set; }

    public string TargetType { get; set; } = string.Empty;

    public Guid TargetId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string? Details { get; set; }

    public string? RequesterIpHash { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string ReviewState { get; set; } = "Unreviewed";
}
