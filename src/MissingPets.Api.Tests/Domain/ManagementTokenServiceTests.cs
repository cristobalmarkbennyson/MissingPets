using MissingPets.Api.Domain;

namespace MissingPets.Api.Tests.Domain;

public sealed class ManagementTokenServiceTests
{
    [Test]
    public void GenerateToken_ReturnsOpaqueHighEntropyToken()
    {
        var service = new ManagementTokenService();

        var token = service.GenerateToken();

        Assert.Multiple(() =>
        {
            Assert.That(token, Has.Length.GreaterThanOrEqualTo(40));
            Assert.That(token, Does.Not.Contain("+"));
            Assert.That(token, Does.Not.Contain("/"));
        });
    }

    [Test]
    public void VerifyToken_MatchesOnlyOriginalToken()
    {
        var service = new ManagementTokenService();
        var token = service.GenerateToken();
        var hash = service.HashToken(token);

        Assert.Multiple(() =>
        {
            Assert.That(service.VerifyToken(token, hash), Is.True);
            Assert.That(service.VerifyToken(token + "x", hash), Is.False);
            Assert.That(hash, Is.Not.EqualTo(token));
        });
    }
}
