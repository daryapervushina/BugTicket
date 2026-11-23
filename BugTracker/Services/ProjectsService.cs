using BugTracker.Common.Exceptions;
using BugTracker.Data;
using BugTracker.DTOs.Projects;
using BugTracker.Models;
using BugTracker.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BugTracker.Services
{
    public class ProjectsService : IProjectsService
    {
        private readonly AppDbContext _db;

        public ProjectsService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<ProjectResponse>> GetDeveloperProjectsAsync(int userId)
        {
            return await _db.Projects.AsNoTracking()
                .Where(project => project.AuthorId == userId
                    || (project.PublishedAt != null
                        && project.Members.Any(member => member.UserId == userId)))
                .OrderBy(project => project.PublishedAt != null)
                .ThenByDescending(project => project.CreatedAt)
                .ThenByDescending(project => project.Id)
                .Select(project => new ProjectResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    RepositoryUrl = project.RepositoryUrl,
                    AuthorId = project.AuthorId,
                    DeveloperIds = project.Members.Select(member => member.UserId)
                        .OrderBy(id => id).ToList(),
                    CreatedAt = project.CreatedAt,
                    PublishedAt = project.PublishedAt,
                    CheckedAt = project.CheckedAt
                })
                .ToListAsync();
        }

        public async Task<ProjectResponse> CreateAsync(int authorId, Guid idempotencyKey, CreateProjectRequest request)
        {
            if (idempotencyKey == Guid.Empty)
            {
                throw new ValidationException("Idempotency-Key must not be empty.");
            }

            var developerIds = request.DeveloperIds.Append(authorId).Distinct().OrderBy(id => id).ToList();
            var requestJson = JsonSerializer.Serialize(new
            {
                Name = request.Name.Trim(),
                RepositoryUrl = request.RepositoryUrl.Trim(),
                DeveloperIds = developerIds
            });
            var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));
            var existing = await FindCreatedProjectAsync(authorId, idempotencyKey);
            if (existing != null)
            {
                return GetExistingResponse(existing, requestHash);
            }
            var developerCount = await _db.Users.CountAsync(user => developerIds.Contains(user.Id)
                && user.Roles.Any(role => role.Role == Role.Developer && !role.IsBlocked));

            if (developerCount != developerIds.Count)
            {
                throw new ValidationException("All project members must be existing users with an active developer role.");
            }

            var project = new Project
            {
                Name = request.Name.Trim(),
                RepositoryUrl = request.RepositoryUrl.Trim(),
                AuthorId = authorId,
                CreatedAt = DateTimeOffset.UtcNow,
                CreationRequestId = idempotencyKey,
                CreationRequestHash = requestHash,
                Members = developerIds.Select(userId => new ProjectMember
                {
                    UserId = userId
                }).ToList()
            };

            _db.Projects.Add(project);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "IX_Projects_AuthorId_CreationRequestId" })
            {
                foreach (var member in project.Members)
                {
                    _db.Entry(member).State = EntityState.Detached;
                }
                _db.Entry(project).State = EntityState.Detached;

                existing = await FindCreatedProjectAsync(authorId, idempotencyKey);
                if (existing == null)
                {
                    throw;
                }
                return GetExistingResponse(existing, requestHash);
            }

            return ToResponse(project);
        }

        private Task<Project?> FindCreatedProjectAsync(int authorId, Guid idempotencyKey)
        {
            return _db.Projects.AsNoTracking().Include(project => project.Members)
                .SingleOrDefaultAsync(project => project.AuthorId == authorId
                    && project.CreationRequestId == idempotencyKey);
        }

        private static ProjectResponse GetExistingResponse(Project project, string requestHash)
        {
            if (project.CreationRequestHash != requestHash)
            {
                throw new ConflictException("Idempotency-Key has already been used with different project data.");
            }
            return ToResponse(project);
        }

        private static ProjectResponse ToResponse(Project project)
        {

            return new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                RepositoryUrl = project.RepositoryUrl,
                AuthorId = project.AuthorId,
                DeveloperIds = project.Members.Select(member => member.UserId).OrderBy(id => id).ToList(),
                CreatedAt = project.CreatedAt,
                PublishedAt = project.PublishedAt,
                CheckedAt = project.CheckedAt
            };
        }
    }
}
