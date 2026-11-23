using BugTracker.DTOs.AdminUsers;
using BugTracker.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
namespace BugTracker.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/admin/testers")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUsersService _service;

        public AdminUsersController(IAdminUsersService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<TesterResponse>>> Get(
            [FromQuery] string? q,
            [FromQuery, RegularExpression("^(active|blocked)$")] string? status)
        {
            return Ok(await _service.GetAsync(q, status));
        }

        [HttpPost]
        public async Task<ActionResult<TesterCredentialsResponse>> Create(CreateTesterRequest request)
        {
            var response = await _service.CreateAsync(request);
            return StatusCode(response.RoleAdded ? 200 : 201, response);
        }

        [HttpPatch("{id:int}")]
        public async Task<ActionResult<TesterResponse>> Update(int id, UpdateTesterRequest request)
        {
            return Ok(await _service.UpdateAsync(id, request));
        }

        [HttpPost("{id:int}/reset-password")]
        public async Task<ActionResult<TesterCredentialsResponse>> ResetPassword(int id)
        {
            return Ok(await _service.ResetPasswordAsync(id));
        }
    }
}
