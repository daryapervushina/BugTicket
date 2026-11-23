using BugTracker.Models.Enums;
using System.ComponentModel.DataAnnotations;
using BugTracker.DTOs.Projects;
using BugTracker.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BugTracker.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/projects")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectsService _service;

        public ProjectsController(IProjectsService service)
        {
            _service = service;
        }

        [Authorize(Roles = "Developer,Tester")]
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProjectDetailsResponse>> GetById(int id)
        {
            var userId = int.Parse(User.FindFirst("sub")!.Value);
            var role = Enum.Parse<Role>(User.FindFirst("role")!.Value);
            return Ok(await _service.GetByIdAsync(id, userId, role));
        }

        [Authorize(Roles = "Developer")]
        [HttpGet]
        public async Task<ActionResult<List<ProjectListItemResponse>>> GetDeveloperProjects()
        {
            var userId = int.Parse(User.FindFirst("sub")!.Value);
            return Ok(await _service.GetDeveloperProjectsAsync(userId));
        }

        [Authorize(Roles = "Developer")]
        [HttpPost]
        public async Task<ActionResult<ProjectResponse>> Create(
            [FromHeader(Name = "Idempotency-Key"), Required] Guid? idempotencyKey,
            [FromBody] CreateProjectRequest request)
        {
            var userId = int.Parse(User.FindFirst("sub")!.Value);

            var response = await _service.CreateAsync(userId, idempotencyKey!.Value, request);
            return StatusCode(StatusCodes.Status201Created, response);
        }
    }
}
