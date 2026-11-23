using BugTracker.DTOs.AdminUsers;
namespace BugTracker.Services
{
    public interface IAdminUsersService
    {
        Task<List<TesterResponse>> GetAsync(string? q, string? status);
        Task<TesterCredentialsResponse> CreateAsync(CreateTesterRequest request);
        Task<TesterResponse> UpdateAsync(int id, UpdateTesterRequest request);
        Task<TesterCredentialsResponse> ResetPasswordAsync(int id);
    }
}
