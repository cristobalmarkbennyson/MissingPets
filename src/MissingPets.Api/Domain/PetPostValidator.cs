namespace MissingPets.Api.Domain;

public sealed class PetPostValidator
{
    public IReadOnlyList<string> Validate(CreatePetPostDraft draft)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(draft.PetName))
        {
            errors.Add("Pet name is required.");
        }

        if (string.IsNullOrWhiteSpace(draft.PetType))
        {
            errors.Add("Pet type is required.");
        }

        if (string.IsNullOrWhiteSpace(draft.DefiningFeatures))
        {
            errors.Add("Defining features are required.");
        }

        if (draft.LastSeenLocation is null)
        {
            errors.Add("Last-seen location is required.");
        }

        if (draft.PhotoUploadIds.Count == 0 || draft.PhotoUploadIds.All(string.IsNullOrWhiteSpace))
        {
            errors.Add("At least one pet photo is required.");
        }

        return errors;
    }
}
