using BugTracker.DTOs.Projects;

namespace BugTracker.Services
{
    public interface IProjectsService
    {
        Task<ProjectResponse> CreateAsync(int authorId, Guid idempotencyKey, CreateProjectRequest request);
    }
}
