using BugTracker.Common.Exceptions;
using BugTracker.Data;
using BugTracker.DTOs.AdminUsers;
using BugTracker.Models;
using BugTracker.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Cryptography;
namespace BugTracker.Services
{
    public class AdminUsersService : IAdminUsersService
    {
        private readonly AppDbContext _db;
        private readonly PasswordHasher<User> _hasher = new();

        public AdminUsersService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<TesterResponse>> GetAsync(string? q, string? status)
        {
            var query = _db.Users.AsNoTracking().Where(user => user.Roles.Any(role => role.Role == Role.Tester));
            if (!string.IsNullOrWhiteSpace(q))
            {
                var search = q.Trim().ToLower();
                query = query.Where(user => user.FirstName.ToLower().Contains(search)
                    || user.LastName.ToLower().Contains(search) || user.Email.ToLower().Contains(search));
            }
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(user => user.Roles.Any(role => role.Role == Role.Tester && role.IsBlocked == (status == "blocked")));
            }
            return await query.OrderByDescending(user => user.Id)
                .Select(user => new TesterResponse(user.Id, user.FirstName, user.LastName,
                    user.Email, user.Roles.Any(role => role.Role == Role.Tester && role.IsBlocked) ? "blocked" : "active")).ToListAsync();
        }

        public async Task<TesterCredentialsResponse> CreateAsync(CreateTesterRequest request)
        {
            var email = request.Email.Trim();
            var user = await _db.Users.Include(user => user.Roles)
                .SingleOrDefaultAsync(user => user.Email == email);
            var roleAdded = user != null;
            string? password = null;

            if (user != null)
            {
                if (user.Roles.Any(role => role.Role == Role.Tester))
                {
                    throw new ConflictException("A tester with this email already exists.");
                }
                if (!user.Roles.Any(role => role.Role == Role.Developer))
                {
                    throw new ConflictException("This email belongs to another account.");
                }
            }
            else
            {
                user = new User
                {
                    FirstName = request.FirstName.Trim(),
                    LastName = request.LastName.Trim(),
                    Email = email,
                    MustChangePassword = true
                };
                password = CreatePassword();
                user.PasswordHash = _hasher.HashPassword(user, password);
                _db.Users.Add(user);
            }

            user.Roles.Add(new UserRole { Role = Role.Tester });
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                throw new ConflictException("The account has changed. Refresh the tester list.");
            }

            return new TesterCredentialsResponse(ToResponse(user), password, roleAdded);
        }

        public async Task<TesterResponse> UpdateAsync(int id, UpdateTesterRequest request)
        {
            var user = await GetTesterAsync(id);
            var testerRole = user.Roles.Single(role => role.Role == Role.Tester);
            testerRole.IsBlocked = request.Status == "blocked";
            await _db.SaveChangesAsync();
            return ToResponse(user);
        }

        public async Task<TesterCredentialsResponse> ResetPasswordAsync(int id)
        {
            var user = await GetTesterAsync(id);
            var password = CreatePassword();
            user.PasswordHash = _hasher.HashPassword(user, password);
            user.MustChangePassword = true;
            user.SessionVersion++;
            await _db.SaveChangesAsync();
            return new TesterCredentialsResponse(ToResponse(user), password, false);
        }

        private async Task<User> GetTesterAsync(int id)
        {
            return await _db.Users.Include(user => user.Roles).SingleOrDefaultAsync(user => user.Id == id
                && user.Roles.Any(role => role.Role == Role.Tester))
                ?? throw new NotFoundException("Tester not found.");
        }

        private static string CreatePassword()
        {
            return Convert.ToHexString(RandomNumberGenerator.GetBytes(12)) + "a1!";
        }

        private static TesterResponse ToResponse(User user)
        {
            return new TesterResponse(user.Id, user.FirstName, user.LastName,
                user.Email, user.Roles.Any(role => role.Role == Role.Tester && role.IsBlocked) ? "blocked" : "active");
        }
    }
}
