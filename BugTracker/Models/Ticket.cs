using BugTracker.Models.Enums;

namespace BugTracker.Models
{
    public class Ticket
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;
        public int AuthorId { get; set; }
        public User Author { get; set; } = null!;
        public int? AssigneeId { get; set; }
        public User? Assignee { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Steps { get; set; } = string.Empty;
        public BugStatus BugStatus { get; set; }
        public ReviewStatus ReviewStatus { get; set; }
        public TicketPriority? Priority { get; set; }
        public DateTimeOffset? Deadline { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? ClosedAt { get; set; }
        public string? Release { get; set; }
    }
}