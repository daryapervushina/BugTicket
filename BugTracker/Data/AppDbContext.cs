using BugTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace BugTracker.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Project>()
                .HasIndex(project => new { project.AuthorId, project.CreationRequestId })
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(user => user.Email)
                .IsUnique();

            modelBuilder.Entity<UserRole>()
                .HasKey(userRole => new { userRole.UserId, userRole.Role });

            modelBuilder.Entity<ProjectMember>()
                .HasKey(member => new { member.ProjectId, member.UserId });


            modelBuilder.Entity<Project>()
                .HasOne(project => project.Author)
                .WithMany(user => user.AuthoredProjects)
                .HasForeignKey(project => project.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProjectMember>()
                .HasOne(member => member.User)
                .WithMany(user => user.ProjectMemberships)
                .HasForeignKey(member => member.UserId);
        }
    }
}