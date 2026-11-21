using BugTracker.DTOs.Auth;

namespace BugTracker.Services
{
    public interface IAuthService
    {
        Task<LoginResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
        Task<UserResponse> RegisterAsync(RegisterRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<LoginResponse> SwitchRoleAsync(int userId, SwitchRoleRequest request);
    }
}
