using Microsoft.EntityFrameworkCore;

namespace BugTracker.Models
{
    public class ProjectMember
    {
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
