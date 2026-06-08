using NetTopologySuite.Geometries;

namespace MissingPets.Api.Domain;

public sealed record PublicLocation(Point ApproximateCenter, string PublicAreaLabel);

public sealed class PublicLocationService
{
    public PublicLocation Approximate(Point preciseLocation, string humanReadable)
    {
        var roundedLongitude = Math.Round(preciseLocation.X, 3, MidpointRounding.AwayFromZero);
        var roundedLatitude = Math.Round(preciseLocation.Y, 3, MidpointRounding.AwayFromZero);
        var approximatePoint = new Point(roundedLongitude, roundedLatitude) { SRID = 4326 };

        return new PublicLocation(approximatePoint, humanReadable.Trim());
    }
}
