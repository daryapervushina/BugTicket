using BugTracker.Common.Exceptions;
using BugTracker.Models.Enums;
using BugTracker.Common;
using BugTracker.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace BugTracker.Authentication
{
    public class JwtAuthenticationEvents : JwtBearerEvents
    {
        private readonly AppDbContext _db;

        public JwtAuthenticationEvents(AppDbContext db)
        {
            _db = db;
        }

        public override async Task TokenValidated(TokenValidatedContext context)
        {

            if (!int.TryParse(context.Principal?.FindFirst("sub")?.Value, out var userId)
                || !int.TryParse(context.Principal?.FindFirst("session_version")?.Value, out var version)
                || !Enum.TryParse<Role>(
                    context.Principal?.FindFirst("role")?.Value, out var role))
            {
                context.Fail("Invalid token.");
                return;
            }
            var user = await _db.Users.AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => new
                {
                    user.SessionVersion,
                    user.MustChangePassword,
                    HasRole = user.Roles.Any(assigned => assigned.Role == role
                        && !assigned.IsBlocked)
                })
                .SingleOrDefaultAsync();
            if (user == null || user.SessionVersion != version || !user.HasRole)
            {
                context.Fail("Session is no longer valid.");
                return;
            }
            if (user.MustChangePassword
                && context.HttpContext.GetEndpoint()?.Metadata
                    .GetMetadata<AllowTemporaryPasswordAttribute>() == null)
            {
                throw new ForbiddenException(
                    "Change your temporary password first.");
            }
        }
    }
}
