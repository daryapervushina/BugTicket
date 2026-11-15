namespace BugTracker.DTOs.Auth
{
    public record LoginResponse(string Token, string Role, bool MustChangePassword);
}
