using MissingPets.Api.Domain;
using NetTopologySuite.Geometries;

namespace MissingPets.Api.Tests.Domain;

public sealed class PublicLocationServiceTests
{
    [Test]
    public void Approximate_RoundsCoordinatesForPublicDisplay()
    {
        var service = new PublicLocationService();
        var precise = new Point(121.0318123, 14.5653456) { SRID = 4326 };

        var result = service.Approximate(precise, "Poblacion, Makati");

        Assert.Multiple(() =>
        {
            Assert.That(result.ApproximateCenter.X, Is.EqualTo(121.032));
            Assert.That(result.ApproximateCenter.Y, Is.EqualTo(14.565));
            Assert.That(result.ApproximateCenter.SRID, Is.EqualTo(4326));
            Assert.That(result.PublicAreaLabel, Is.EqualTo("Poblacion, Makati"));
        });
    }
}
