namespace MissingPets.Api.Tests;

public sealed class ConfigurationScaffoldTests
{
    [Test]
    public void StorageOptions_DefaultsToLocalPhotoContainer()
    {
        var options = new StorageOptions();

        Assert.Multiple(() =>
        {
            Assert.That(options.Provider, Is.EqualTo("Local"));
            Assert.That(options.PhotoContainer, Is.EqualTo("missing-pet-photos"));
        });
    }

    [Test]
    public void ModerationOptions_DefaultsToAnonymousWritePolicy()
    {
        var options = new ModerationOptions();

        Assert.That(options.RateLimitPolicy, Is.EqualTo("AnonymousWriteDefaults"));
    }
}
