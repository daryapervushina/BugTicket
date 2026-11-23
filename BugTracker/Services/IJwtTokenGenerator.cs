using BugTracker.Models.Enums;
namespace BugTracker.Services
{
    public interface IJwtTokenGenerator
    {
        string Generate(int userId, Role activeRole, int sessionVersion);
    }
}