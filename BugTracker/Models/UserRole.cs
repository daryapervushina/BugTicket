using BugTracker.Models.Enums;

namespace BugTracker.Models
{
    public class UserRole
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public Role Role { get; set; }
        public bool IsBlocked { get; set; }
    }
}
