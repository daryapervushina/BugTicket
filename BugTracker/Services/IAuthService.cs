using BugTracker.DTOs.Auth;

namespace BugTracker.Services
{
    public interface IAuthService
    {
        Task<UserResponse> RegisterAsync(RegisterRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
    }
}
