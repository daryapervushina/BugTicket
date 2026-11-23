using BugTracker.Common.Exceptions;
using BugTracker.Data;
using BugTracker.DTOs.Auth;
using BugTracker.Models;
using BugTracker.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BugTracker.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenGenerator _tokenGenerator;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthService(AppDbContext db, IJwtTokenGenerator tokenGenerator)
        {
            _db = db;
            _tokenGenerator = tokenGenerator;
        }

        public async Task<UserResponse> RegisterAsync(RegisterRequest request)
        {
            var email = request.Email.Trim();
            if (await _db.Users.AnyAsync(user => user.Email == email))
            {
                throw new ConflictException("Email is already registered.");
            }

            var user = new User
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = email
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            user.Roles.Add(new UserRole { Role = Role.Developer });
            _db.Users.Add(user);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "IX_Users_Email" })
            {
                throw new ConflictException("Email is already registered.");
            }

            return new UserResponse(user.Id, user.FirstName, user.LastName, user.Email);
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var email = request.Email.Trim();
            var user = await _db.Users.AsNoTracking()
                .Include(user => user.Roles)
                .SingleOrDefaultAsync(user => user.Email == email);

            if (user == null || _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password)
                == PasswordVerificationResult.Failed)
            {
                throw new InvalidCredentialsException("Invalid email or password.");
            }

            if (!user.Roles.Any(userRole => userRole.Role == request.Role))
            {
                throw new RoleForbiddenException("Role is not assigned to this user.");
            }

            var assignedRole = user.Roles.Single(role => role.Role == request.Role);
            if (assignedRole.IsBlocked)
            {
                throw new RoleForbiddenException("The selected role is blocked.");
            }

            var token = _tokenGenerator.Generate(user.Id, request.Role, user.SessionVersion);
            return new LoginResponse(token, request.Role.ToString(), user.MustChangePassword);
        }
        public async Task<LoginResponse> SwitchRoleAsync(int userId, SwitchRoleRequest request)
        {
            var user = await _db.Users.AsNoTracking()
                .Include(user => user.Roles)
                .SingleOrDefaultAsync(user => user.Id == userId);

            if (user == null)
            {
                throw new InvalidCredentialsException("User no longer exists.");
            }

            if (user.MustChangePassword)
            {
                throw new ForbiddenException("Change the temporary password before switching roles.");
            }

            if (request.Role != Role.Developer && request.Role != Role.Tester)
            {
                throw new RoleForbiddenException("Only developer and tester roles can be switched.");
            }

            if (!user.Roles.Any(role => role.Role == Role.Developer)
                || !user.Roles.Any(role => role.Role == Role.Tester))
            {
                throw new RoleForbiddenException("Both developer and tester roles are required.");
            }

            var assignedRole = user.Roles.Single(role => role.Role == request.Role);
            if (assignedRole.IsBlocked)
            {
                throw new RoleForbiddenException("The selected role is blocked.");
            }

            var token = _tokenGenerator.Generate(user.Id, request.Role, user.SessionVersion);
            return new LoginResponse(token, request.Role.ToString(), user.MustChangePassword);
        }
        public async Task<LoginResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            var user = await _db.Users.Include(user => user.Roles).SingleOrDefaultAsync(user => user.Id == userId)
                ?? throw new InvalidCredentialsException("User no longer exists.");

            if (user.Roles.Any(role => role.Role == Role.Tester && role.IsBlocked))
            {
                throw new RoleForbiddenException("The tester role is blocked.");
            }
            if (!user.MustChangePassword)
            {
                throw new ConflictException("Temporary password has already been changed.");
            }
            if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.NewPassword)
                != PasswordVerificationResult.Failed)
            {
                throw new ValidationException("The new password must differ from the temporary password.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            user.MustChangePassword = false;
            user.SessionVersion++;
            await _db.SaveChangesAsync();

            return new LoginResponse(
                _tokenGenerator.Generate(user.Id, Role.Tester, user.SessionVersion),
                Role.Tester.ToString(), false);
        }
    }
}
