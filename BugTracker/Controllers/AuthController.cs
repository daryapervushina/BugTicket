using BugTracker.DTOs.Auth;
using BugTracker.Services;
using Microsoft.AspNetCore.Mvc;

namespace BugTracker.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
        {
            var user = await _authService.RegisterAsync(request);
            return StatusCode(StatusCodes.Status201Created, user);
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
    }
}
