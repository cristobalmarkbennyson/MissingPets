using System.Security.Cryptography;
using System.Text;

namespace MissingPets.Api.Domain;

public sealed class ManagementTokenService
{
    private const int TokenByteLength = 32;

    public string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(TokenByteLength))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    public string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);
        return Convert.ToHexString(hashBytes);
    }

    public bool VerifyToken(string token, string expectedHash)
    {
        var actualHash = HashToken(token);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(actualHash),
            Encoding.UTF8.GetBytes(expectedHash));
    }
}
