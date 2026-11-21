namespace BugTracker.DTOs.AdminUsers
{
    public record TesterCredentialsResponse(TesterResponse User, string? TemporaryPassword, bool RoleAdded);
}
