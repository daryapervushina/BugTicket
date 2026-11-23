namespace BugTracker.DTOs.Projects
{
    public class TesterProjectListItemResponse : ProjectListItemResponse
    {
        public DateTimeOffset? CheckedAt { get; set; }
        public int OpenTicketsCount { get; set; }
    }
}