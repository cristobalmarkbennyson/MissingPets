using MissingPets.Api.Domain;
using NetTopologySuite.Geometries;

namespace MissingPets.Api.Tests.Domain;

public sealed class PetPostValidatorTests
{
    [Test]
    public void Validate_RequiresMinimumPublishFields()
    {
        var validator = new PetPostValidator();
        var draft = new CreatePetPostDraft(null, "", " ", null, []);

        var errors = validator.Validate(draft);

        Assert.That(errors, Is.EquivalentTo(new[]
        {
            "Pet name is required.",
            "Pet type is required.",
            "Defining features are required.",
            "Last-seen location is required.",
            "At least one pet photo is required."
        }));
    }

    [Test]
    public void Validate_AllowsCompleteDraft()
    {
        var validator = new PetPostValidator();
        var location = new Point(121.0318, 14.5653) { SRID = 4326 };
        var draft = new CreatePetPostDraft("Luna", "Dog", "Cream coat", location, ["upload_1"]);

        var errors = validator.Validate(draft);

        Assert.That(errors, Is.Empty);
    }
}
