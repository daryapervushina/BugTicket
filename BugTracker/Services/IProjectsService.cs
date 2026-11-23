using BugTracker.Models.Enums;
using BugTracker.DTOs.Projects;

namespace BugTracker.Services
{
    public interface IProjectsService
    {
        Task<ProjectDetailsResponse> GetByIdAsync(int projectId, int userId, Role role);
        Task<List<ProjectListItemResponse>> GetDeveloperProjectsAsync(int userId);
        Task<ProjectResponse> UpdateAsync(int projectId, int userId, UpdateProjectRequest request);
        Task<ProjectResponse> CreateAsync(int authorId, Guid idempotencyKey, CreateProjectRequest request);
    }
}
