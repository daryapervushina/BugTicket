namespace BugTracker.DTOs.Projects
{
    public class ProjectListItemResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RepositoryUrl { get; set; } = string.Empty;
        public DateTimeOffset? PublishedAt { get; set; }
    }
}