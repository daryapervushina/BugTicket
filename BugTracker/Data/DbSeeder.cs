using BugTracker.Models;
using BugTracker.Models.Enums;
using BugTracker.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BugTracker.Data
{
    public class DbSeeder : IDbSeeder
    {
        private readonly AppDbContext _db;
        private readonly SeedOptions _options;

        public DbSeeder(AppDbContext db, IOptions<SeedOptions> options)
        {
            _db = db;
            _options = options.Value;
        }

        public async Task EnsureAdminAsync()
        {
            if (string.IsNullOrWhiteSpace(_options.Email))
            {
                return;
            }

            var email = _options.Email.Trim();
            var user = await _db.Users
                .Include(user => user.Roles)
                .SingleOrDefaultAsync(user => user.Email == email);

            if (user == null)
            {
                if (string.IsNullOrWhiteSpace(_options.Password))
                {
                    throw new InvalidOperationException("admin need password");
                }

                user = new User
                {
                    FirstName = _options.FirstName,
                    LastName = _options.LastName,
                    Email = email
                };

                user.PasswordHash = new PasswordHasher<User>().HashPassword(user, _options.Password);
                _db.Users.Add(user);
            }
            else if (user.Roles.Any(role => role.Role == Role.Admin))
            {
                return;
            }

            user.Roles.Add(new UserRole { Role = Role.Admin });
            await _db.SaveChangesAsync();
        }
    }
}
