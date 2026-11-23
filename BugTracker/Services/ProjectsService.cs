using System.Data;
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
        private readonly ITicketsService _ticketsService;

        public ProjectsService(AppDbContext db, ITicketsService ticketsService)
        {
            _db = db;
            _ticketsService = ticketsService;
        }

        public async Task<ProjectDetailsResponse> GetByIdAsync(int projectId, int userId, Role role)
        {
            var project = await _db.Projects.AsNoTracking()
                .Include(project => project.Members)
                .SingleOrDefaultAsync(project => project.Id == projectId)
                ?? throw new NotFoundException("Project not found.");

            var canRead = project.PublishedAt == null
                ? role == Role.Developer && project.AuthorId == userId
                : role == Role.Tester || (role == Role.Developer
                    && (project.AuthorId == userId || project.Members.Any(member => member.UserId == userId)));

            if (!canRead)
            {
                throw new ForbiddenException("You do not have access to this project.");
            }

            var response = new ProjectDetailsResponse
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

            if (project.PublishedAt != null)
            {
                response.Tickets = await _ticketsService.GetProjectTicketsAsync(project.Id);
            }

            return response;
        }

        public async Task<List<ProjectListItemResponse>> GetDeveloperProjectsAsync(int userId)
        {
            return await _db.Projects.AsNoTracking()
                .Where(project => project.AuthorId == userId
                    || (project.PublishedAt != null
                        && project.Members.Any(member => member.UserId == userId)))
                .OrderBy(project => project.PublishedAt != null)
                .ThenByDescending(project => project.PublishedAt ?? project.CreatedAt)
                .ThenByDescending(project => project.Id)
                .Select(project => new ProjectListItemResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    RepositoryUrl = project.RepositoryUrl,
                    PublishedAt = project.PublishedAt
                })
                .ToListAsync();
        }

        public async Task<List<TesterProjectListItemResponse>> GetTesterProjectsAsync()
        {
            return await _db.Projects.AsNoTracking()
                .Where(project => project.PublishedAt != null)
                .OrderByDescending(project => project.PublishedAt)
                .ThenByDescending(project => project.Id)
                .Select(project => new TesterProjectListItemResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    RepositoryUrl = project.RepositoryUrl,
                    PublishedAt = project.PublishedAt,
                    CheckedAt = project.CheckedAt,
                    OpenTicketsCount = project.Tickets.Count(ticket => ticket.ReviewStatus != ReviewStatus.Fixed)
                })
                .ToListAsync();
        }

        public async Task<ProjectResponse> PublishAsync(int projectId, int userId)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();

            var projects = await _db.Projects
                .FromSqlInterpolated($@"SELECT * FROM ""Projects"" WHERE ""Id"" = {projectId} FOR UPDATE")
                .ToListAsync();
            var project = projects.SingleOrDefault()
                ?? throw new NotFoundException("Project not found.");

            await _db.Entry(project).Collection(project => project.Members).LoadAsync();

            if (project.AuthorId != userId)
            {
                throw new ForbiddenException("You do not have permission to publish this project.");
            }

            if (project.PublishedAt != null)
            {
                throw new ConflictException("Project is already published.");
            }

            project.PublishedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return ToResponse(project);
        }

        public async Task<ProjectResponse> UpdateAsync(int projectId, int userId, Role role, UpdateProjectRequest request)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();

            var projects = await _db.Projects
                .FromSqlInterpolated($@"SELECT * FROM ""Projects"" WHERE ""Id"" = {projectId} FOR UPDATE")
                .ToListAsync();
            var project = projects.SingleOrDefault()
                ?? throw new NotFoundException("Project not found.");

            await _db.Entry(project).Collection(project => project.Members).LoadAsync();

            if (role == Role.Tester)
            {
                if (project.PublishedAt == null)
                {
                    throw new ForbiddenException("Only published projects can be marked as checked.");
                }
                if (request.Name != null || request.DeveloperIds != null)
                {
                    throw new ForbiddenException("Testers cannot change the project name or members.");
                }
            }
            else if (role == Role.Developer)
            {
                if (request.IsChecked != null)
                {
                    throw new ForbiddenException("Only testers can mark projects as checked.");
                }
                if (project.AuthorId != userId
                    && (project.PublishedAt == null || !project.Members.Any(member => member.UserId == userId)))
                {
                    throw new ForbiddenException("You do not have permission to edit this project.");
                }
            }
            else
            {
                throw new ForbiddenException("You do not have permission to edit this project.");
            }

            if (request.IsChecked == true)
            {
                project.CheckedAt = DateTimeOffset.UtcNow;
            }

            if (request.Name != null)
            {
                project.Name = request.Name.Trim();
            }

            if (request.DeveloperIds != null)
            {
                var developerIds = request.DeveloperIds.Append(project.AuthorId).Distinct().ToList();
                var developerCount = await _db.Users.CountAsync(user => developerIds.Contains(user.Id)
                    && user.Roles.Any(role => role.Role == Role.Developer));

                if (developerCount != developerIds.Count)
                {
                    throw new ValidationException("All selected users must have the developer role.");
                }

                var removedMembers = project.Members
                    .Where(member => !developerIds.Contains(member.UserId)).ToList();

                foreach (var member in removedMembers)
                {
                    _db.ProjectMembers.Remove(member);
                    project.Members.Remove(member);
                }

                foreach (var developerId in developerIds)
                {
                    if (!project.Members.Any(member => member.UserId == developerId))
                    {
                        project.Members.Add(new ProjectMember { UserId = developerId });
                    }
                }
            }

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "PK_ProjectMembers" })
            {
                throw new ConflictException("Project members have changed. Refresh the project and retry.");
            }

            await transaction.CommitAsync();
            return ToResponse(project);
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
