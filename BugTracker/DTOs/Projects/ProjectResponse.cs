namespace BugTracker.DTOs.Projects
{
    public class ProjectResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RepositoryUrl { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public List<int> DeveloperIds { get; set; } = new();
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? PublishedAt { get; set; }
        public DateTimeOffset? CheckedAt { get; set; }
    }
}
