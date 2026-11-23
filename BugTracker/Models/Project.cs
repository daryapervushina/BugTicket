namespace BugTracker.Models
{
    public class Project
    {
        public int Id { get; set; }
        public Guid? CreationRequestId { get; set; }
        public string? CreationRequestHash { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RepositoryUrl { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public User Author { get; set; } = null!;
        public DateTimeOffset? PublishedAt { get; set; }
        public DateTimeOffset? CheckedAt { get; set; }
        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    }
}
