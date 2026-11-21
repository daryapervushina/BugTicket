namespace BugTracker.Models
{
    public class User
    {
        public int Id { get; set; }
        public int SessionVersion { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool MustChangePassword { get; set; } = false;
        public ICollection<UserRole> Roles { get; set; } = new List<UserRole>();
        public ICollection<Project> AuthoredProjects { get; set; } = new List<Project>();
        public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    }
}
