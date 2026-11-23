using BugTracker.DTOs.Projects;

namespace BugTracker.Services
{
    public interface IProjectsService
    {
        Task<List<ProjectResponse>> GetDeveloperProjectsAsync(int userId);
        Task<ProjectResponse> CreateAsync(int authorId, Guid idempotencyKey, CreateProjectRequest request);
    }
}
